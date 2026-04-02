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
 */

import { getCache } from '@vercel/functions'

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
  summary: {
    totalOps: number
    totalFetchTime: number
    totalSize: number
    tags: string[]
    parallelSavings: number  // Time saved by parallel execution
  }
}

// ============================================================================
// Module-level state for current request
// ============================================================================

let currentTrace: CacheTrace | null = null
let pendingRoute: string | null = null

function generateRequestId(): string {
  // Use random only - timestamp will be set when first op records
  return `req_${Math.random().toString(36).substring(2, 10)}`
}

// ============================================================================
// Trace Collection API (called during render)
// ============================================================================

/**
 * Mark the route for tracing
 * The actual trace is initialized lazily when first cache op runs
 * This avoids Date.now() during static render
 */
export function resetTrace(route: string): void {
  pendingRoute = route
  currentTrace = null
}

/**
 * Initialize trace lazily (called from recordCacheOp)
 * Uses the timestamp from the first cache operation
 */
function ensureTraceInitialized(timestamp: number): CacheTrace {
  if (!currentTrace) {
    currentTrace = {
      requestId: generateRequestId(),
      route: pendingRoute || '/unknown',
      startTime: timestamp,
      operations: [],
    }
  }
  return currentTrace
}

/**
 * Record a cache operation (called inside "use cache" functions)
 * Only executes on cache MISS when the function body runs
 * 
 * Lazily initializes the trace using the first operation's timestamp
 */
export function recordCacheOp(
  tag: string,
  fetchId: string,
  opStartTime: number,
  size: number
): void {
  // Lazily initialize trace with first operation's start time
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
}

/**
 * Get current trace (for passing to components if needed)
 */
export function getCurrentTrace(): CacheTrace | null {
  return currentTrace
}

// ============================================================================
// Trace Storage API (called in after())
// ============================================================================

/**
 * Finalize the trace and store it to Runtime Cache
 * Call this inside after() to persist post-response
 */
export async function finalizeAndStoreTrace(): Promise<StoredTrace | null> {
  if (!currentTrace) {
    console.log('[v0] finalizeAndStoreTrace: no trace to store')
    return null
  }
  
  console.log('[v0] finalizeAndStoreTrace: storing trace', currentTrace.requestId, 'with', currentTrace.operations.length, 'ops')
  
  const endTime = Date.now()
  const totalDuration = endTime - currentTrace.startTime
  
  // Calculate summary
  const ops = currentTrace.operations
  const totalFetchTime = ops.reduce((sum, op) => sum + op.duration, 0)
  const totalSize = ops.reduce((sum, op) => sum + op.size, 0)
  const tags = [...new Set(ops.map(op => op.tag))]
  
  // Calculate time saved by parallel execution
  // If sequential: totalFetchTime, if parallel: max(completedAt)
  const maxCompletedAt = ops.length > 0 
    ? Math.max(...ops.map(op => op.completedAt)) 
    : 0
  const parallelSavings = totalFetchTime - maxCompletedAt
  
  const storedTrace: StoredTrace = {
    ...currentTrace,
    endTime,
    totalDuration,
    summary: {
      totalOps: ops.length,
      totalFetchTime,
      totalSize,
      tags,
      parallelSavings: Math.max(0, parallelSavings),
    },
  }
  
  // Store to Runtime Cache
  try {
    const cache = getCache()
    console.log('[v0] Runtime Cache acquired, storing trace')
    
    // Store the trace with route-based key
    await cache.set(`trace:${currentTrace.route}:latest`, storedTrace, {
      ttl: 3600, // 1 hour
      tags: ['cache-traces', `trace:${currentTrace.route}`],
    })
    console.log('[v0] Trace stored to Runtime Cache:', `trace:${currentTrace.route}:latest`)
    
    // Also store by requestId for direct lookup
    await cache.set(`trace:id:${currentTrace.requestId}`, storedTrace, {
      ttl: 3600,
      tags: ['cache-traces'],
    })
    
    // Update list of recent trace IDs for this route
    const recentKey = `traces:recent:${currentTrace.route}`
    const existing = await cache.get(recentKey) as string[] | null
    const recentIds = existing || []
    recentIds.unshift(currentTrace.requestId)
    await cache.set(recentKey, recentIds.slice(0, 20), {
      ttl: 3600,
      tags: ['cache-traces'],
    })
    
  } catch (error) {
    // Runtime Cache might not be available in all environments
    console.error('[v0] Failed to store trace:', error)
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
  try {
    const cache = getCache()
    return await cache.get(`trace:${route}:latest`) as StoredTrace | null
  } catch {
    return null
  }
}

/**
 * Get a trace by requestId
 */
export async function getTraceById(requestId: string): Promise<StoredTrace | null> {
  try {
    const cache = getCache()
    return await cache.get(`trace:id:${requestId}`) as StoredTrace | null
  } catch {
    return null
  }
}

/**
 * Get recent trace IDs for a route
 */
export async function getRecentTraceIds(route: string): Promise<string[]> {
  try {
    const cache = getCache()
    const ids = await cache.get(`traces:recent:${route}`) as string[] | null
    return ids || []
  } catch {
    return []
  }
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
