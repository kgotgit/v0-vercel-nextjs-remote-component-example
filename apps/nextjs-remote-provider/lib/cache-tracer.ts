/**
 * Request-Scoped Cache Tracer
 * 
 * Simple module-level trace that collects cache operations during a request.
 * Since "use cache" functions only execute on cache MISS, any operation
 * recorded here represents fresh data being fetched.
 * 
 * Flow:
 * 1. resetCacheTrace() is called at the start of page render
 * 2. Each "use cache" function calls traceCacheOperation() when executing
 * 3. getCacheTrace() returns all operations that ran during this render
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
  startTime: number
  operations: CacheOperation[]
}

// Module-level trace storage
// In serverless, each request gets a fresh module instance
let currentTrace: CacheTrace | null = null

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Reset/start a new cache trace for this request
 * Call this at the beginning of page render
 */
export function resetCacheTrace(): CacheTrace {
  currentTrace = {
    requestId: generateRequestId(),
    startTime: Date.now(),
    operations: [],
  }
  console.log('[v0] Cache trace started:', currentTrace.requestId)
  return currentTrace
}

/**
 * Record a cache operation in the current trace
 * Call this inside each "use cache" function
 * Note: This only runs on cache MISS (when the function actually executes)
 */
export function traceCacheOperation(
  tag: string,
  fetchId: string,
  startTime: number,
  dataSize: number
): void {
  if (!currentTrace) {
    // Auto-initialize if not started
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
  console.log('[v0] Cache operation traced:', tag, fetchId, `${operation.duration}ms`)
}

/**
 * Get the current cache trace
 */
export function getCacheTrace(): CacheTrace | null {
  return currentTrace
}

/**
 * Format trace as JSON for debugging
 */
export function formatTraceAsJson(trace: CacheTrace | null): object | null {
  if (!trace) return null
  return {
    requestId: trace.requestId,
    totalDuration: Date.now() - trace.startTime,
    operationCount: trace.operations.length,
    operations: trace.operations.map(op => ({
      tag: op.tag,
      fetchId: op.fetchId,
      duration: `${op.duration}ms`,
      size: `${op.size} bytes`,
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
 * Higher-order function to wrap cached functions with tracing
 * 
 * Usage:
 * ```ts
 * async function _getProducts() {
 *   "use cache"
 *   cacheTag('products')
 *   // ... fetch logic
 * }
 * export const getProducts = withCacheTracing('products', _getProducts)
 * ```
 */
export function withCacheTracing<T extends (...args: any[]) => Promise<any>>(
  tag: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now()
    const fetchId = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const result = await fn(...args)
    
    // Calculate size of result
    const size = new Blob([JSON.stringify(result)]).size
    
    // Record in trace
    traceCacheOperation(tag, fetchId, startTime, size)
    
    // Attach metadata to result if it's an object
    if (result && typeof result === 'object') {
      return { ...result, _trace: { tag, fetchId, duration: Date.now() - startTime } }
    }
    
    return result
  }) as T
}
