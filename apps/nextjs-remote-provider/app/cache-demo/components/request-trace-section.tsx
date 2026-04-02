import { getCacheTrace, formatTraceAsJson } from '@/lib/cache-tracer'
import { CacheTraceViewer } from './cache-trace-viewer'

/**
 * Server component that collects the current request's cache trace
 * and passes it to the client viewer.
 * 
 * This component should be rendered AFTER all cached components
 * so the trace includes all operations from this request.
 */
export function RequestTraceSection() {
  // Get the trace that was built during this request
  // This includes all cache operations that ran (cache misses only)
  const trace = getCacheTrace()
  const traceData = formatTraceAsJson(trace)
  
  console.log('[v0] RequestTraceSection - trace:', trace ? `${trace.operations.length} ops` : 'null')
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Request Cache Trace</h2>
        <p className="text-sm text-gray-500">
          Real-time trace of cache operations during this request. 
          Only shows operations that actually ran (cache misses).
          If empty, all data was served from cache.
        </p>
      </div>
      <CacheTraceViewer traceData={traceData as any} />
    </div>
  )
}
