import { getCurrentTrace } from '@/lib/cache-tracer'
import { CacheTraceViewer } from './cache-trace-viewer'

/**
 * Server component that displays the current request's cache trace.
 * 
 * The trace is built during render as each "use cache" function executes.
 * This component reads the current trace state and passes it to the viewer.
 * 
 * Note: The trace only captures cache MISSES. If all data is cached,
 * the trace will show 0 operations.
 */
export function RequestTraceSection() {
  // Get the current trace that was built during this request
  const trace = getCurrentTrace()
  
  // Format for the viewer
  const traceData = trace ? {
    requestId: trace.requestId,
    route: trace.route,
    totalDuration: Date.now() - trace.startTime,
    operationCount: trace.operations.length,
    allCached: trace.operations.length === 0,
    operations: trace.operations.map(op => ({
      tag: op.tag,
      fetchId: op.fetchId,
      startedAt: op.startedAt,
      completedAt: op.completedAt,
      duration: op.duration,
      size: op.size,
    })),
  } : null
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Request Cache Trace</h2>
        <p className="text-sm text-gray-500">
          Real-time trace of cache operations during this request. 
          Only shows cache MISSES (when &quot;use cache&quot; functions actually execute).
          If empty, all data was served from cache.
        </p>
      </div>
      <CacheTraceViewer traceData={traceData} />
    </div>
  )
}
