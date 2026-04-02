/**
 * Request-Scoped Cache Tracer with after() persistence
 * 
 * Architecture:
 * 1. Request arrives → Page.tsx calls resetCacheTrace()
 * 2. Each "use cache" function calls traceCacheOperation() on cache MISS
 * 3. After response sent → after() stores trace to persistent store
 * 4. API route can query stored traces for visualization
 * 
 * The trace only captures cache MISSES because "use cache" functions
 * don't execute their body when serving from cache.
 */

export type CacheOperation = {
  tag: string
  fetchId: string
  timestamp: number
  duration: number
  size: number
  source: 'cache-miss'
}

export type CacheTrace = {
  requestId: string
  route: string
  startTime: number
  endTime?: number
  operations: CacheOperation[]
}

export type StoredTrace = CacheTrace & {
  storedAt: number
}

// Module-level trace for current request
let currentTrace: CacheTrace | null = null

// In-memory store for traces (for demo - use Redis/KV in production)
// This persists across requests in the same serverless instance
const traceStore = new Map<string, StoredTrace>()
const MAX_STORED_TRACES = 50

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Reset/start a new cache trace for this request
 * Call at the beginning of page render
 */
export function resetCacheTrace(route: string = '/unknown'): CacheTrace {
  currentTrace = {
    requestId: generateRequestId(),
    route,
    startTime: Date.now(),
    operations: [],
  }
  return currentTrace
}

/**
 * Record a cache operation in the current trace
 * Call inside each "use cache" function (only runs on cache MISS)
 */
export function traceCacheOperation(
  tag: string,
  fetchId: string,
  startTime: number,
  dataSize: number
): void {
  if (!currentTrace) {
    resetCacheTrace()
  }

  const operation: CacheOperation = {
    tag,
    fetchId,
    timestamp: startTime,
    duration: Date.now() - startTime,
    size: dataSize,
    source: 'cache-miss',
  }

  currentTrace!.operations.push(operation)
}

/**
 * Get the current trace (for reading during render)
 */
export function getCacheTrace(): CacheTrace | null {
  return currentTrace
}

/**
 * Finalize and store the trace
 * Call this inside after() to persist the trace post-response
 */
export function storeCurrentTrace(): StoredTrace | null {
  if (!currentTrace) return null
  
  const storedTrace: StoredTrace = {
    ...currentTrace,
    endTime: Date.now(),
    storedAt: Date.now(),
  }
  
  // Store with requestId as key
  traceStore.set(currentTrace.requestId, storedTrace)
  
  // Prune old traces if over limit
  if (traceStore.size > MAX_STORED_TRACES) {
    const oldest = [...traceStore.entries()]
      .sort((a, b) => a[1].storedAt - b[1].storedAt)[0]
    if (oldest) traceStore.delete(oldest[0])
  }
  
  return storedTrace
}

/**
 * Get a stored trace by requestId
 */
export function getStoredTrace(requestId: string): StoredTrace | undefined {
  return traceStore.get(requestId)
}

/**
 * Get all stored traces (most recent first)
 */
export function getAllStoredTraces(): StoredTrace[] {
  return [...traceStore.values()].sort((a, b) => b.storedAt - a.storedAt)
}

/**
 * Get recent traces for a specific route
 */
export function getTracesByRoute(route: string, limit: number = 10): StoredTrace[] {
  return getAllStoredTraces()
    .filter(t => t.route === route)
    .slice(0, limit)
}

/**
 * Clear all stored traces
 */
export function clearAllTraces(): void {
  traceStore.clear()
}

/**
 * Format trace for display
 */
export function formatTraceAsJson(trace: CacheTrace | null): object | null {
  if (!trace) return null
  
  const totalDuration = (trace.endTime || Date.now()) - trace.startTime
  
  return {
    requestId: trace.requestId,
    route: trace.route,
    totalDuration,
    operationCount: trace.operations.length,
    allCached: trace.operations.length === 0,
    operations: trace.operations.map(op => ({
      tag: op.tag,
      fetchId: op.fetchId,
      duration: op.duration,
      size: op.size,
      source: op.source,
    })),
    summary: {
      tags: [...new Set(trace.operations.map(op => op.tag))],
      totalSize: trace.operations.reduce((sum, op) => sum + op.size, 0),
      totalFetchTime: trace.operations.reduce((sum, op) => sum + op.duration, 0),
    },
  }
}

/**
 * Get trace store stats
 */
export function getTraceStoreStats() {
  const traces = getAllStoredTraces()
  const totalOps = traces.reduce((sum, t) => sum + t.operations.length, 0)
  const cachedRequests = traces.filter(t => t.operations.length === 0).length
  
  return {
    totalTraces: traces.length,
    totalOperations: totalOps,
    cachedRequests,
    cacheHitRate: traces.length > 0 
      ? `${((cachedRequests / traces.length) * 100).toFixed(1)}%` 
      : '0%',
    routes: [...new Set(traces.map(t => t.route))],
  }
}
