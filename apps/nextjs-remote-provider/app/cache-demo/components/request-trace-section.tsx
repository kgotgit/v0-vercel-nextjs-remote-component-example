import { getCacheTrace, formatTraceAsJson } from '@/lib/cache-tracer'
import { CacheTraceViewer } from './cache-trace-viewer'

/**
 * Server component that collects the current request's cache trace
 * and passes it to the client viewer
 */
export function RequestTraceSection() {
  // Get the trace that was built during this request
  const trace = getCacheTrace()
  
  // Format for the viewer
  const traceData = trace ? formatTraceAsJson(trace) : undefined
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Request Cache Trace</h2>
        <p className="text-sm text-gray-500">
          Real-time trace of cache operations during this request. 
          Only shows operations that actually ran (cache misses).
        </p>
      </div>
      <CacheTraceViewer traceData={traceData as any} />
    </div>
  )
}
