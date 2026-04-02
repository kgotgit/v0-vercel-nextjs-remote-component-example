/**
 * Request-Scoped Cache Tracer — Ring Buffer Architecture
 *
 * WHY a ring buffer instead of per-request state:
 *
 * `"use cache"` function bodies run in an isolated async context — Next.js
 * intentionally breaks AsyncLocalStorage propagation into them so that
 * request-scoped data (headers, cookies, etc.) cannot leak into cached outputs.
 * This means we can never correlate a "use cache" execution to a specific
 * request through async context. Module-level (process-global) state is the
 * only thing readable from inside a "use cache" body.
 *
 * The previous approach used a single global `fallbackTrace` and called
 * `resetTrace()` on each request — but `resetTrace()` would null out the
 * global while a concurrent request's "use cache" ops were still mid-flight,
 * causing `finalizeAndStoreTrace()` to find an empty trace.
 *
 * Ring buffer solution:
 * - `recordCacheOp()` always appends to a circular buffer (no reset needed)
 * - `TraceSetup` (async server component) captures `requestStartTime = Date.now()`
 *   at request time, BEFORE any "use cache" bodies execute
 * - `finalizeAndStoreTrace(requestStartTime, route)` is called in `after()` and
 *   claims all ops whose `opStartTime >= requestStartTime - JITTER_BUFFER_MS`
 *   and `opStartTime <= endTime`
 * - Because "use cache" bodies are triggered by React rendering this request's
 *   Suspense tree, their `opStartTime` will always be >= the request's start time
 *
 * Concurrency safety:
 * - No global is ever nulled out between recordCacheOp and finalizeAndStoreTrace
 * - Concurrent requests claim non-overlapping time windows
 *   (op durations are 1200–2000ms; requests are much further apart in practice)
 * - JITTER_BUFFER_MS handles microtask scheduling variance between TraceSetup
 *   and sibling Suspense children starting their "use cache" functions
 */

// Try to import getCache - only available on Vercel infrastructure
let getCache: (() => ReturnType<typeof import('@vercel/functions').getCache>) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vercelFunctions = require('@vercel/functions')
  getCache = vercelFunctions.getCache
} catch {
  // @vercel/functions not available locally
}

// ============================================================================
// Types
// ============================================================================

export type CacheOperation = {
  tag: string
  fetchId: string
  startedAt: number    // ms relative to request start
  completedAt: number  // ms relative to request start
  duration: number     // ms the "use cache" body took
  size: number         // bytes
}

export type CacheTrace = {
  requestId: string
  route: string
  startTime: number    // absolute ms timestamp
  operations: CacheOperation[]
}

export type StoredTrace = CacheTrace & {
  endTime: number
  totalDuration: number
  deploymentId: string
  summary: {
    totalOps: number
    totalFetchTime: number
    totalSize: number
    tags: string[]
    parallelSavings: number
  }
}

// ============================================================================
// Internal ring buffer entry
// ============================================================================

type BufferedOp = {
  tag: string
  fetchId: string
  opStartTime: number  // absolute ms — when the "use cache" body started
  wallTime: number     // absolute ms — when recordCacheOp was called (body end)
  duration: number     // wallTime - opStartTime
  size: number
}

// ============================================================================
// Deployment identity
// ============================================================================

const DEPLOYMENT_ID: string =
  process.env.VERCEL_DEPLOYMENT_ID ??
  `local_${Math.random().toString(36).substring(2, 10)}`

export function getDeploymentId(): string {
  return DEPLOYMENT_ID
}

function traceKey(suffix: string): string {
  return `trace:${DEPLOYMENT_ID}:${suffix}`
}

// ============================================================================
// Ring buffer (process-global — safe to read from "use cache" bodies)
// ============================================================================

const MAX_BUFFER = 500

/**
 * Time window (ms) subtracted from requestStartTime when claiming ops.
 * Handles the edge case where a sibling Suspense boundary starts its
 * "use cache" function body a few microseconds before TraceSetup's
 * `requestStartTime = Date.now()` executes.
 */
const JITTER_BUFFER_MS = 100

const opRingBuffer: BufferedOp[] = []

// ============================================================================
// In-memory fallback store (local dev / non-Vercel)
// ============================================================================

const localTraceByRouteLatest = new Map<string, StoredTrace>()
const localTraceById = new Map<string, StoredTrace>()
const localRecentIds = new Map<string, string[]>()

function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 10)}`
}

// ============================================================================
// Trace Collection API
// ============================================================================

/**
 * Record a cache miss operation.
 * Called inside "use cache" function bodies — only executes on cache MISS.
 *
 * @param tag        The cacheTag() value for this operation
 * @param fetchId    A random ID generated per execution (same ID = cached)
 * @param opStartTime  Date.now() captured at the START of the "use cache" body
 * @param size       Byte size of the returned value
 */
export function recordCacheOp(
  tag: string,
  fetchId: string,
  opStartTime: number,
  size: number
): void {
  const wallTime = Date.now()
  if (opRingBuffer.length >= MAX_BUFFER) opRingBuffer.shift()
  opRingBuffer.push({ tag, fetchId, opStartTime, wallTime, duration: wallTime - opStartTime, size })
  console.log('[CacheTracer] recordCacheOp:', tag, 'duration:', wallTime - opStartTime, 'ms | buffer:', opRingBuffer.length)
}

/**
 * Returns a snapshot of recent ops for the "current request" viewer.
 * Best-effort only — shows ops recorded in the last 30 seconds.
 * For reliable data use the Stored Trace section (written by after()).
 */
export function getRecentOpsSnapshot(): CacheOperation[] | null {
  const cutoff = Date.now() - 30_000
  const recent = opRingBuffer.filter(op => op.wallTime >= cutoff)
  if (recent.length === 0) return null
  const base = Math.min(...recent.map(op => op.opStartTime))
  return recent.map(op => ({
    tag: op.tag,
    fetchId: op.fetchId,
    startedAt: op.opStartTime - base,
    completedAt: op.wallTime - base,
    duration: op.duration,
    size: op.size,
  }))
}

// ============================================================================
// Trace Storage API — call finalizeAndStoreTrace inside after()
// ============================================================================

/**
 * Claim ops that belong to this request and persist the trace.
 *
 * @param requestStartTime  Date.now() captured in TraceSetup BEFORE any
 *                          "use cache" bodies execute for this request.
 * @param route             The page route (e.g. '/cache-demo')
 */
export async function finalizeAndStoreTrace(
  requestStartTime: number,
  route: string,
): Promise<StoredTrace | null> {
  const endTime = Date.now()

  // Claim ops whose body started within this request's time window.
  // JITTER_BUFFER_MS handles microtask scheduling variance.
  const claimFrom = requestStartTime - JITTER_BUFFER_MS
  const myOps = opRingBuffer.filter(
    op => op.opStartTime >= claimFrom && op.opStartTime <= endTime
  )

  console.log(
    `[CacheTracer] finalizeAndStoreTrace: route=${route} ` +
    `window=[${claimFrom}–${endTime}] claimed=${myOps.length} buffered=${opRingBuffer.length}`
  )

  const operations: CacheOperation[] = myOps.map(op => ({
    tag: op.tag,
    fetchId: op.fetchId,
    startedAt: op.opStartTime - requestStartTime,
    completedAt: op.wallTime - requestStartTime,
    duration: op.duration,
    size: op.size,
  }))

  const totalFetchTime = operations.reduce((s, op) => s + op.duration, 0)
  const totalSize = operations.reduce((s, op) => s + op.size, 0)
  const tags = [...new Set(operations.map(op => op.tag))]
  const maxCompletedAt = operations.length > 0 ? Math.max(...operations.map(op => op.completedAt)) : 0

  const storedTrace: StoredTrace = {
    requestId: generateRequestId(),
    route,
    startTime: requestStartTime,
    endTime,
    totalDuration: endTime - requestStartTime,
    deploymentId: DEPLOYMENT_ID,
    operations,
    summary: {
      totalOps: operations.length,
      totalFetchTime,
      totalSize,
      tags,
      parallelSavings: Math.max(0, totalFetchTime - maxCompletedAt),
    },
  }

  // Try Vercel Runtime Cache; fall back to in-memory Map for local dev
  let usedVercelCache = false
  if (getCache) {
    try {
      const cache = getCache()
      await cache.set(traceKey(`${route}:latest`), storedTrace, {
        ttl: 3600,
        tags: ['cache-traces', traceKey(route)],
      })
      await cache.set(traceKey(`id:${storedTrace.requestId}`), storedTrace, {
        ttl: 3600,
        tags: ['cache-traces'],
      })
      const recentCacheKey = traceKey(`recent:${route}`)
      const existing = (await cache.get(recentCacheKey)) as string[] | null
      const recent = existing || []
      recent.unshift(storedTrace.requestId)
      await cache.set(recentCacheKey, recent.slice(0, 20), { ttl: 3600, tags: ['cache-traces'] })
      usedVercelCache = true
    } catch (error) {
      console.warn('[CacheTracer] Vercel Runtime Cache unavailable, using in-memory fallback:', String(error))
    }
  }

  if (!usedVercelCache) {
    localTraceByRouteLatest.set(route, storedTrace)
    localTraceById.set(storedTrace.requestId, storedTrace)
    const recent = localRecentIds.get(route) || []
    recent.unshift(storedTrace.requestId)
    localRecentIds.set(route, recent.slice(0, 20))
    console.log(
      `[CacheTracer] Stored in-memory | deploy:${DEPLOYMENT_ID} | route:${route} | ops:${operations.length}`
    )
  }

  return storedTrace
}

// ============================================================================
// Trace Query API (called from API routes or components)
// ============================================================================

/**
 * Get the latest trace for a route
 */
export async function getLatestTraceForRoute(route: string): Promise<StoredTrace | null> {
  if (getCache) {
    try {
      const cache = getCache()
      // Read with the current deployment's key — stale keys from old deploys
      // will simply not exist, so this naturally returns null for them.
      const result = await cache.get(traceKey(`${route}:latest`)) as StoredTrace | null
      if (result) return result
    } catch {
      // fall through to local store
    }
  }
  return localTraceByRouteLatest.get(route) || null
}

/**
 * Get a trace by requestId
 */
export async function getTraceById(requestId: string): Promise<StoredTrace | null> {
  if (getCache) {
    try {
      const cache = getCache()
      const result = await cache.get(traceKey(`id:${requestId}`)) as StoredTrace | null
      if (result) return result
    } catch {
      // fall through to local store
    }
  }
  return localTraceById.get(requestId) || null
}

/**
 * Get recent trace IDs for a route
 */
export async function getRecentTraceIds(route: string): Promise<string[]> {
  if (getCache) {
    try {
      const cache = getCache()
      const ids = await cache.get(traceKey(`recent:${route}`)) as string[] | null
      if (ids) return ids
    } catch {
      // fall through to local store
    }
  }
  return localRecentIds.get(route) || []
}

// ============================================================================
// Formatting utilities
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format trace for JSON API response.
 * Returns raw numbers so the client can format them itself.
 * Pre-formatted strings (e.g. "2.00s") cannot be consumed by client-side
 * formatTime() / formatBytes() functions.
 */
export function formatTraceForApi(trace: StoredTrace | null) {
  if (!trace) return null

  return {
    requestId: trace.requestId,
    route: trace.route,
    deploymentId: trace.deploymentId,
    startTime: trace.startTime,
    endTime: trace.endTime,
    totalDuration: trace.totalDuration,
    allCached: trace.operations.length === 0,
    operations: trace.operations.map(op => ({
      tag: op.tag,
      fetchId: op.fetchId,
      startedAt: op.startedAt,
      completedAt: op.completedAt,
      duration: op.duration,
      size: op.size,
    })),
    summary: {
      totalOps: trace.summary.totalOps,
      totalFetchTime: trace.summary.totalFetchTime,
      totalSize: trace.summary.totalSize,
      tags: trace.summary.tags,
      parallelSavings: trace.summary.parallelSavings,
    },
  }
}
