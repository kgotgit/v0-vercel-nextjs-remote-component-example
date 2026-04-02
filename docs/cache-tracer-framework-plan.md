# Cache Tracer — Framework Extraction Plan

> Status: **Draft** — picked up from session on 2026-04-02  
> Goal: Extract the per-request cache tracer from the `cache-demo` page into a
> reusable, publishable package (`next-cache-tracer`).

---

## Background

The current implementation in `apps/nextjs-remote-provider/lib/cache-tracer.ts`
works as a demo but has three issues that block framework-level use:

1. **Concurrency unsafety** — module-level `fallbackTrace` is a single global
   variable. Concurrent requests on the same warm server instance race and
   produce corrupted traces.
2. **Manual boilerplate** — every page must add `<TraceSetup>`, and every
   `"use cache"` function must manually call `recordCacheOp()`.
3. **Storage is hard-coded** — Vercel Runtime Cache or in-memory `Map`. No
   pluggable adapter for Redis, Upstash, Vercel KV, etc.

---

## Hard Constraints (Next.js internals — cannot change these)

| Constraint | Why |
|---|---|
| `AsyncLocalStorage` is broken inside `"use cache"` bodies | Next.js intentionally resets the async context before executing a cached function body to prevent request-scoped data (headers, cookies) from leaking into cached outputs. |
| Arguments to `"use cache"` functions become cache keys | Passing a `requestId` as an arg defeats caching — every request gets its own uncached copy. |
| The synchronous page shell runs at **build time** under PPR | Any `resetTrace()` / `after()` call in a sync component only fires during the static prerender, never per-request. They must live in an async component inside `<Suspense>`. |
| No hook for cache **hits** | Next.js does not expose a lifecycle hook when a `"use cache"` result is served from cache. Only misses (function body executes) are observable. This is a documented gap. |
| Edge runtime has no `async_hooks` | `AsyncLocalStorage` is Node.js only. Edge-compatible code must use a different strategy. |

---

## Chosen Architecture: Approach A — "Best-Effort" Tracer

Accept that trace-to-request correlation is approximate under high concurrency.  
Document this clearly. Correct for:
- Development tooling
- Low-concurrency staging environments
- Single-tenant Vercel deployments (one warm function instance)

**Future path**: migrate to OpenTelemetry spans (Approach B below) when
Next.js stabilises its `instrumentation.ts` OTEL support. The public API
should be designed so the storage/emit layer is swappable without user-facing
changes.

---

## Concurrency Safety: Ring Buffer

The single most impactful change before publishing. Replace the single
`fallbackTrace` global with a **time-windowed ring buffer** of recent ops.
`finalizeAndStoreTrace()` claims ops that fall within the request's time window.

```
t=0ms   Request A arrives → resetTrace (requestStartA = 0)
t=1ms   Request B arrives → resetTrace (requestStartB = 1)
t=300ms  "use cache" miss for A: recordCacheOp → push { wallTime: 300, ... }
t=301ms  "use cache" miss for B: recordCacheOp → push { wallTime: 301, ... }
t=1600ms Request A's after() fires → claims ops where wallTime ∈ [0, 1600)
t=1601ms Request B's after() fires → claims ops where wallTime ∈ [1, 1601)
```

Light overlap is still possible but the window approach is dramatically safer
than "last writer wins".

```ts
// lib/cache-tracer.ts — target shape
const opRingBuffer: Array<CacheOperation & { wallTime: number }> = []
const MAX_BUFFER = 500  // circular, evict oldest

export function recordCacheOp(tag, fetchId, opStartTime, size) {
  if (opRingBuffer.length >= MAX_BUFFER) opRingBuffer.shift()
  opRingBuffer.push({ tag, fetchId, opStartTime, size, wallTime: Date.now() })
}

export async function finalizeAndStoreTrace(requestStartTime: number) {
  const endTime = Date.now()
  // Claim ops that started after this request started and before it ended
  const ops = opRingBuffer.filter(
    op => op.wallTime >= requestStartTime && op.wallTime <= endTime
  )
  // ... build StoredTrace from ops ...
}
```

`requestStartTime` is captured inside `TraceSetup` (async, per-request):

```tsx
async function TraceSetup({ route }) {
  await connection()
  const requestStartTime = Date.now()   // ← per-request timestamp
  after(async () => {
    await finalizeAndStoreTrace(requestStartTime, route)
  })
  return null
}
```

### Tasks
- [ ] Replace `fallbackTrace` / `fallbackPendingRoute` globals with ring buffer
- [ ] Update `finalizeAndStoreTrace` signature to accept `requestStartTime`
- [ ] Update `TraceSetup` to capture and pass `requestStartTime`
- [ ] Add ring buffer size config option
- [ ] Add unit tests for concurrent claim logic

---

## Zero-Boilerplate: `withCacheTracing()` Wrapper

Users currently call `recordCacheOp()` manually inside every `"use cache"` 
function. Replace with a timing wrapper:

```ts
// packages/next-cache-tracer/src/index.ts
export function withCacheTracing<T>(
  tag: string,
  fn: () => Promise<T>
): () => Promise<T> {
  return async function traced() {
    "use cache"                     // ← propagated to the wrapper
    cacheTag(tag)
    const startTime = Date.now()
    const result = await fn()
    const size = new Blob([JSON.stringify(result)]).size
    recordCacheOp(tag, generateFetchId(), startTime, size)
    return result
  }
}
```

Usage:

```ts
// lib/products.ts — before
export async function getProducts() {
  "use cache"
  cacheTag('products')
  const startTime = Date.now()
  await new Promise(r => setTimeout(r, 1500))
  const fetchId = generateFetchId()
  recordCacheOp('products', fetchId, startTime, size)
  return { products: PRODUCTS_DB, fetchId, tag: 'products' }
}

// lib/products.ts — after
export const getProducts = withCacheTracing('products', async () => {
  await new Promise(r => setTimeout(r, 1500))
  return { products: PRODUCTS_DB, tag: 'products' }
})
```

> **Open question**: `"use cache"` is a compiler directive, not a runtime call.
> The Next.js compiler (SWC transform) scans function bodies for the string
> literal at build time. Whether it propagates through a wrapper correctly
> needs validation. If not, users keep the directive in their function and
> only use `withCacheTracing` for timing — the wrapper calls `fn()` which
> already has `"use cache"` on it.

### Tasks
- [ ] Prototype `withCacheTracing` and verify `"use cache"` compiler behaviour
- [ ] If directive propagation doesn't work, document the hybrid pattern
- [ ] Add `generateFetchId` as part of the public API so users get it for free

---

## Pluggable Storage Interface

```ts
// packages/next-cache-tracer/src/storage.ts

export interface TraceStore {
  setLatest(route: string, trace: StoredTrace): Promise<void>
  getLatest(route: string): Promise<StoredTrace | null>
  setById(requestId: string, trace: StoredTrace): Promise<void>
  getById(requestId: string): Promise<StoredTrace | null>
  pushRecentId(route: string, requestId: string, maxLen: number): Promise<void>
  getRecentIds(route: string): Promise<string[]>
}

// Built-in adapters shipped with the package
export class MemoryStore implements TraceStore { ... }
export class VercelRuntimeCacheStore implements TraceStore { ... }

// Separate optional packages
// @next-cache-tracer/redis  → RedisStore (ioredis)
// @next-cache-tracer/upstash → UpstashStore
```

Config:

```ts
// next-cache-tracer.config.ts (user's project root)
import { MemoryStore } from 'next-cache-tracer'

export default {
  store: new MemoryStore({ maxTraces: 100 }),
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  ttl: 3600,
}
```

### Tasks
- [ ] Define `TraceStore` interface
- [ ] Implement `MemoryStore` (ring buffer backed, max N traces per route)
- [ ] Implement `VercelRuntimeCacheStore` (wraps `getCache()` from `@vercel/functions`)
- [ ] Wire config file loading in the package entry point

---

## Package Structure

```
packages/
  next-cache-tracer/
    package.json
    src/
      index.ts              ← public API exports
      tracer.ts             ← ring buffer, recordCacheOp, finalizeAndStoreTrace
      storage.ts            ← TraceStore interface + MemoryStore
      vercel-store.ts       ← VercelRuntimeCacheStore
      deployment.ts         ← DEPLOYMENT_ID logic
      types.ts              ← CacheOperation, CacheTrace, StoredTrace
    ui/
      index.ts              ← exports CacheTracePanel, StoredTracesViewer, TraceSetup
      TraceSetup.tsx        ← async server component (connection + after)
      CacheTracePanel.tsx   ← combined client UI
      StoredTracesViewer.tsx
      CacheTraceViewer.tsx
    api/
      traces-handler.ts     ← drop-in Next.js route handler
      cache-inspector-handler.ts
    README.md
```

Consumer setup:

```ts
// app/api/traces/route.ts — user just re-exports the handler
export { GET } from 'next-cache-tracer/api'
```

```tsx
// app/cache-demo/page.tsx — user adds one component
import { TraceSetup, StoredTracesViewer } from 'next-cache-tracer/ui'

export default function Page() {
  return (
    <>
      <Suspense fallback={null}><TraceSetup route="/cache-demo" /></Suspense>
      {/* ... page content ... */}
      <StoredTracesViewer route="/cache-demo" />
    </>
  )
}
```

### Tasks
- [ ] Scaffold `packages/next-cache-tracer` in the monorepo
- [ ] Move `lib/cache-tracer.ts` → `packages/next-cache-tracer/src/tracer.ts`
- [ ] Move UI components → `packages/next-cache-tracer/ui/`
- [ ] Move API route handlers → `packages/next-cache-tracer/api/`
- [ ] Add `package.json` with proper `exports` map (`"."`, `"./ui"`, `"./api"`)
- [ ] Update `apps/nextjs-remote-provider` to consume from the package

---

## Edge Runtime Compatibility

Replace `AsyncLocalStorage` (Node only) with a request-ID header strategy:

```ts
// middleware.ts — stamp every request with a unique ID
import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export function middleware(req) {
  const res = NextResponse.next()
  res.headers.set('x-request-id', nanoid())
  return res
}
```

Inside `TraceSetup` (async server component):
```ts
import { headers } from 'next/headers'
const requestId = (await headers()).get('x-request-id') ?? crypto.randomUUID()
```

This ID is readable in both Node and Edge runtimes, can be passed down through
props/context, and doesn't rely on `async_hooks`.

> **Trade-off**: Still doesn't solve `AsyncLocalStorage` inside `"use cache"` 
> bodies (which remains impossible). The ring buffer + time-window approach
> handles that regardless of runtime.

### Tasks
- [ ] Add optional middleware export to the package
- [ ] Replace `async_hooks` import with header-based request ID
- [ ] Test on Vercel Edge Functions

---

## Future: OpenTelemetry Bridge (Approach B)

When `next/instrumentation` stabilises, the correct long-term approach:

```ts
// instrumentation.ts
export function register() {
  const { NodeSDK } = require('@opentelemetry/sdk-node')
  const sdk = new NodeSDK({ ... })
  sdk.start()
}
```

- Cache misses emit OTEL spans with `cache.tag`, `cache.fetchId`, `cache.duration` attributes
- OTEL collector correlates spans to traces by `traceId` (propagated automatically)
- No concurrency issues — OTEL context propagation is built on `AsyncLocalStorage` at the C++ level, bypassing the Next.js context isolation
- Works with Datadog, Honeycomb, Grafana Tempo out of the box

This is a separate work stream and doesn't block Approach A.

### Tasks (future)
- [ ] Research whether Next.js 16 instrumentation hook fires inside `"use cache"` bodies
- [ ] Prototype OTEL span emission from `recordCacheOp`
- [ ] Design migration path from Approach A stores to OTEL exporters

---

## Migration Path for Current Demo

Once the package exists, the demo app migration is:

1. `pnpm add next-cache-tracer` (workspace dep)
2. Delete `lib/cache-tracer.ts`, `lib/cache-registry.ts`
3. Delete `app/api/traces/route.ts`, `app/api/cache-inspector/route.ts`
4. Replace with single-line re-exports from the package
5. Replace `TraceSetup` inline component with `import { TraceSetup } from 'next-cache-tracer/ui'`

---

## Open Questions to Resolve Before Publishing

| # | Question | Notes |
|---|---|---|
| 1 | Does `withCacheTracing` wrapper work with the SWC `"use cache"` transform? | Needs a prototype test |
| 2 | What's the right default TTL for trace storage? | 1h feels right for dev; prod may want shorter |
| 3 | Should the UI be opt-in dev-only (`process.env.NODE_ENV === 'development'`)? | Security concern: traces expose internal timing and fetch IDs |
| 4 | Do we ship a `CacheHitRecorder` using Next.js's future `onCacheHit` hook? | API doesn't exist yet; worth watching the RFC |
| 5 | npm package name — `next-cache-tracer` is available as of 2026-04-02 | Verify before publishing |
