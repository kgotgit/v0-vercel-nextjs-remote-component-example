import { AsyncLocalStorage } from 'async_hooks'

/**
 * Request-Scoped Cache Tracer
 * 
 * Uses AsyncLocalStorage to trace cache operations within a single request.
 * Each request gets its own trace context that collects all cache hits/fetches.
 * 
 * Flow:
 * 1. Middleware/layout calls startCacheTrace() at request start
 * 2. Each "use cache" function calls traceCacheOperation() when executing
 * 3. Before response, call getCacheTrace() to get all operations
 * 4. Optionally inject trace into response headers for debugging
 */

export type CacheOperation = {
  tag: string
  fetchId: string
  timestamp: number
  duration: number
  size: number
  source: 'cache-miss' | 'cache-hit-stale' | 'unknown'
}

export type CacheTrace = {
  requestId: string
  startTime: number
  operations: CacheOperation[]
}

// AsyncLocalStorage provides request-scoped context
const cacheTraceStorage = new AsyncLocalStorage<CacheTrace>()

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Start a new cache trace for this request
 * Call this at the beginning of request handling (middleware/layout)
 */
export function startCacheTrace(): CacheTrace {
  const trace: CacheTrace = {
    requestId: generateRequestId(),
    startTime: Date.now(),
    operations: [],
  }
  return trace
}

/**
 * Run a function within a cache trace context
 */
export function runWithCacheTrace<T>(fn: () => T): { result: T; trace: CacheTrace } {
  const trace = startCacheTrace()
  const result = cacheTraceStorage.run(trace, fn)
  return { result, trace }
}

/**
 * Run an async function within a cache trace context
 */
export async function runWithCacheTraceAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; trace: CacheTrace }> {
  const trace = startCacheTrace()
  const result = await cacheTraceStorage.run(trace, fn)
  return { result, trace }
}

/**
 * Record a cache operation in the current trace
 * Call this inside each "use cache" function
 */
export function traceCacheOperation(
  tag: string,
  fetchId: string,
  startTime: number,
  dataSize: number
): void {
  const trace = cacheTraceStorage.getStore()
  if (!trace) {
    // No active trace context - running outside of traced request
    console.warn(`[CacheTracer] No trace context for tag: ${tag}`)
    return
  }

  const operation: CacheOperation = {
    tag,
    fetchId,
    timestamp: startTime,
    duration: Date.now() - startTime,
    size: dataSize,
    // We can't know if it was a hit or miss from inside "use cache"
    // The function only runs on cache miss
    source: 'cache-miss',
  }

  trace.operations.push(operation)
}

/**
 * Get the current cache trace
 */
export function getCacheTrace(): CacheTrace | undefined {
  return cacheTraceStorage.getStore()
}

/**
 * Format trace for logging or headers
 */
export function formatTraceForHeader(trace: CacheTrace): string {
  const ops = trace.operations.map(op => 
    `${op.tag}:${op.fetchId}:${op.duration}ms`
  ).join(',')
  return `${trace.requestId};ops=${ops};total=${trace.operations.length}`
}

/**
 * Format trace as JSON for debugging
 */
export function formatTraceAsJson(trace: CacheTrace): object {
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
