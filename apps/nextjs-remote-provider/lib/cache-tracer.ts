/**
 * Request-Scoped Cache Tracer with Runtime Cache persistence
 * 
 * Architecture:
 * 1. Request arrives → resetTrace('/route') initializes trace
 * 2. Suspense components render concurrently
 * 3. Each "use cache" function calls recordCacheOp() on cache MISS
 * 4. Response streams to client (all Suspense boundaries resolve)
 * 5. after() runs → finalizeAndStoreTrace() persists to Runtime Cache
 * 6. API route queries stored traces for visualization
 * 
 * Key insight: Only cache MISSES are traced because "use cache" 
 * functions don't execute their body when serving from cache.
 * 
 * PPR / AsyncLocalStorage note:
 * With cacheComponents: true (PPR), the synchronous page shell is prerendered
 * at build time while dynamic Suspense children stream per-request.
 * AsyncLocalStorage scopes the currentTrace to the per-request async context
 * so prerender and runtime don't bleed into each other.
 */

import { AsyncLocalStorage } from 'async_hooks'

// Try to import getCache - only available on Vercel infrastructure
let getCache: (() => ReturnType<typeof import('@vercel/functions').getCache>) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vercelFunctions = require('@vercel/functions')
  getCache = vercelFunctions.getCache
} catch {
  // @vercel/functions not available or getCache not accessible locally
}

// ============================================================================
// Types
// ============================================================================

export type CacheOperation = {
  tag: string
  fetchId: string
  startedAt: number      // Relative to request start (ms)
  completedAt: number    // Relative to request start (ms)
  duration: number       // How long the fetch took (ms)
  size: number           // Response size in bytes
}

export type CacheTrace = {
  requestId: string
  route: string
  startTime: number      // Absolute timestamp
  operations: CacheOperation[]
}

export type StoredTrace = CacheTrace & {
  endTime: number
  totalDuration: number
  /** The deployment that produced this trace (VERCEL_DEPLOYMENT_ID or a local process ID). */
  deploymentId: string
  summary: {
    totalOps: number
    totalFetchTime: number
    totalSize: number
    tags: string[]
    parallelSavings: number  // Time saved by parallel execution
  }
}

// ============================================================================
// Per-request storage via AsyncLocalStorage
// Falls back to module-level state for non-async contexts (e.g., dev mode SSR)
// ============================================================================

type TraceContext = {
  trace: CacheTrace | null
  pendingRoute: string | null
}

const traceStorage = new AsyncLocalStorage<TraceContext>()

// Module-level fallback for plain SSR (non-PPR) dev mode
let fallbackTrace: CacheTrace | null = null
let fallbackPendingRoute: string | null = null

// ============================================================================
// Deployment identity
// ============================================================================

/**
 * A stable ID that is unique per deployment.
 *
 * - On Vercel: VERCEL_DEPLOYMENT_ID is injected at build time and is unique
 *   for every deploy, so traces from different deploys never collide in the
 *   shared Runtime Cache.
 *
 * - Locally / non-Vercel: we generate a random ID once when the module is
 *   first imported (i.e. when the Node process starts). Restarting the dev
 *   server produces a new ID, which mirrors the "new deployment" boundary.
 */
const DEPLOYMENT_ID: string =
  process.env.VERCEL_DEPLOYMENT_ID ??
  `local_${Math.random().toString(36).substring(2, 10)}`

export function getDeploymentId(): string {
  return DEPLOYMENT_ID
}

/** Build a namespaced cache key that is scoped to this deployment. */
function traceKey(suffix: string): string {
  return `trace:${DEPLOYMENT_ID}:${suffix}`
}

// ============================================================================
// In-memory fallback store when Vercel Runtime Cache is not available (local dev)
// ============================================================================
const localTraceByRouteLatest = new Map<string, StoredTrace>()
const localTraceById = new Map<string, StoredTrace>()
const localRecentIds = new Map<string, string[]>()

function getContext(): TraceContext {
  const ctx = traceStorage.getStore()
  if (ctx) return ctx
  // Fallback: use module-level vars (works in plain SSR / dev)
  return { trace: fallbackTrace, pendingRoute: fallbackPendingRoute }
}

function setTrace(trace: CacheTrace | null): void {
  const ctx = traceStorage.getStore()
  if (ctx) {
    ctx.trace = trace
  } else {
    fallbackTrace = trace
  }
}

function setPendingRoute(route: string): void {
  const ctx = traceStorage.getStore()
  if (ctx) {
    ctx.pendingRoute = route
  } else {
    fallbackPendingRoute = route
  }
}

function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 10)}`
}

// ============================================================================
// Trace Collection API (called during render)
// ============================================================================

/**
 * Mark the route for tracing.
 * Wrap your page in runWithTraceContext() for proper per-request isolation.
 * Falls back to module-level state in plain SSR / dev mode.
 */
export function resetTrace(route: string): void {
  console.log('[CacheTracer] resetTrace:', route)
  setPendingRoute(route)
  setTrace(null)
}

/**
 * Run an async function with a fresh per-request trace context.
 * Use this in middleware or a layout to initialize AsyncLocalStorage.
 * 
 * @example
 * // In a server layout or middleware:
 * export default async function Layout({ children }) {
 *   return runWithTraceContext('/your-route', async () => {
 *     return children
 *   })
 * }
 */
export function runWithTraceContext<T>(route: string, fn: () => T): T {
  const ctx: TraceContext = { trace: null, pendingRoute: route }
  return traceStorage.run(ctx, fn)
}

/**
 * Initialize trace lazily (called from recordCacheOp)
 */
function ensureTraceInitialized(timestamp: number): CacheTrace {
  const ctx = getContext()
  if (!ctx.trace) {
    const newTrace: CacheTrace = {
      requestId: generateRequestId(),
      route: ctx.pendingRoute || '/unknown',
      startTime: timestamp,
      operations: [],
    }
    setTrace(newTrace)
    console.log('[CacheTracer] Trace initialized:', newTrace.requestId, 'route:', newTrace.route)
    return newTrace
  }
  return ctx.trace
}

/**
 * Record a cache operation (called inside "use cache" functions on cache MISS).
 */
export function recordCacheOp(
  tag: string,
  fetchId: string,
  opStartTime: number,
  size: number
): void {
  const trace = ensureTraceInitialized(opStartTime)
  const now = Date.now()
  const operation: CacheOperation = {
    tag,
    fetchId,
    startedAt: opStartTime - trace.startTime,
    completedAt: now - trace.startTime,
    duration: now - opStartTime,
    size,
  }
  trace.operations.push(operation)
  console.log('[CacheTracer] recordCacheOp:', tag, 'duration:', operation.duration, 'ms')
}

/**
 * Get current trace for the request context.
 * NOTE: In PPR, this will be null/empty when called from the static shell
 * because async Suspense children haven't executed yet.
 * Use StoredTracesViewer (reads from after() → API) for reliable trace data.
 */
export function getCurrentTrace(): CacheTrace | null {
  const ctx = getContext()
  console.log('[CacheTracer] getCurrentTrace:', ctx.trace ? `${ctx.trace.operations.length} ops` : 'null')
  return ctx.trace
}

// ============================================================================
// Trace Storage API (called in after())
// ============================================================================

/**
 * Finalize the trace and store it to Runtime Cache (Vercel) or in-memory Map (local).
 * Call this inside after() to persist post-response.
 */
export async function finalizeAndStoreTrace(): Promise<StoredTrace | null> {
  const currentTrace = getContext().trace
  if (!currentTrace) {
    console.log('[CacheTracer] finalizeAndStoreTrace: no trace to store')
    return null
  }

  const endTime = Date.now()
  const totalDuration = endTime - currentTrace.startTime

  // Calculate summary
  const ops = currentTrace.operations
  const totalFetchTime = ops.reduce((sum, op) => sum + op.duration, 0)
  const totalSize = ops.reduce((sum, op) => sum + op.size, 0)
  const tags = [...new Set(ops.map(op => op.tag))]

  // Calculate time saved by parallel execution
  const maxCompletedAt = ops.length > 0 ? Math.max(...ops.map(op => op.completedAt)) : 0
  const parallelSavings = totalFetchTime - maxCompletedAt

  const storedTrace: StoredTrace = {
    ...currentTrace,
    endTime,
    totalDuration,
    deploymentId: DEPLOYMENT_ID,
    summary: {
      totalOps: ops.length,
      totalFetchTime,
      totalSize,
      tags,
      parallelSavings: Math.max(0, parallelSavings),
    },
  }

  const routeKey = currentTrace.route

  // Try Vercel Runtime Cache first; fall back to in-memory Map for local dev
  let usedVercelCache = false
  if (getCache) {
    try {
      const cache = getCache()
      // All keys are scoped to the current deployment ID so a redeploy never
      // serves stale traces from a previous version.
      await cache.set(traceKey(`${routeKey}:latest`), storedTrace, {
        ttl: 3600,
        tags: ['cache-traces', traceKey(routeKey)],
      })
      await cache.set(traceKey(`id:${currentTrace.requestId}`), storedTrace, {
        ttl: 3600,
        tags: ['cache-traces'],
      })
      const recentCacheKey = traceKey(`recent:${routeKey}`)
      const existing = (await cache.get(recentCacheKey)) as string[] | null
      const recent = existing || []
      recent.unshift(currentTrace.requestId)
      await cache.set(recentCacheKey, recent.slice(0, 20), {
        ttl: 3600,
        tags: ['cache-traces'],
      })
      usedVercelCache = true
    } catch (error) {
      console.warn('[CacheTracer] Vercel Runtime Cache unavailable, using in-memory fallback:', String(error))
    }
  }

  if (!usedVercelCache) {
    // In-memory fallback (local dev / non-Vercel environments).
    // Keys are plain strings because the in-memory Map is already process-scoped
    // (a new process = new deployment = fresh Map), so no prefix is needed.
    localTraceByRouteLatest.set(routeKey, storedTrace)
    localTraceById.set(currentTrace.requestId, storedTrace)
    const recent = localRecentIds.get(routeKey) || []
    recent.unshift(currentTrace.requestId)
    localRecentIds.set(routeKey, recent.slice(0, 20))
    console.log('[CacheTracer] Stored trace in-memory (deploymentId:', DEPLOYMENT_ID, ') route:', routeKey, '| ops:', ops.length)
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
 * Format trace for JSON response
 */
export function formatTraceForApi(trace: StoredTrace | null) {
  if (!trace) return null
  
  return {
    requestId: trace.requestId,
    route: trace.route,
    deploymentId: trace.deploymentId,
    totalDuration: formatDuration(trace.totalDuration),
    allCached: trace.operations.length === 0,
    operations: trace.operations.map(op => ({
      tag: op.tag,
      fetchId: op.fetchId,
      timeline: `${op.startedAt}ms → ${op.completedAt}ms`,
      duration: formatDuration(op.duration),
      size: formatBytes(op.size),
    })),
    summary: {
      ...trace.summary,
      totalFetchTime: formatDuration(trace.summary.totalFetchTime),
      totalSize: formatBytes(trace.summary.totalSize),
      parallelSavings: formatDuration(trace.summary.parallelSavings),
    },
  }
}
