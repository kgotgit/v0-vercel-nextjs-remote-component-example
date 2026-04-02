import { getRecentOpsSnapshot } from '@/lib/cache-tracer'
import { CacheTraceViewer } from './cache-trace-viewer'

/**
 * Shows cache ops recorded in the last 30 seconds — best-effort in-request view.
 *
 * Because "use cache" bodies cannot propagate AsyncLocalStorage, this component
 * displays a time-windowed snapshot from the ring buffer rather than ops scoped
 * to exactly this request. It is useful for seeing WHAT fired but NOT a reliable
 * per-request view. Use the Stored Trace section below for the authoritative data
 * (written by after() once all Suspense boundaries have resolved).
 *
 * 0 ops here means either:
 *   a) All data was served from cache (most common after first load), or
 *   b) The "use cache" siblings are still resolving concurrently
 */
export async function RequestTraceSection() {
  // Being async ensures we are not part of the static prerender shell.
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  const ops = getRecentOpsSnapshot()

  const traceData = ops
    ? {
        requestId: 'recent-snapshot',
        route: '/cache-demo',
        totalDuration: ops.length > 0 ? ops[ops.length - 1].completedAt : 0,
        operationCount: ops.length,
        allCached: ops.length === 0,
        operations: ops,
      }
    : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Recent Cache Ops (Ring Buffer Snapshot)</h2>
        <p className="text-sm text-gray-500">
          Best-effort view — shows ops recorded in the last 30 seconds across all concurrent
          requests. <strong>0 ops = all data served from cache.</strong> For the authoritative
          per-request trace see the Stored Trace section below.
        </p>
      </div>
      <CacheTraceViewer traceData={traceData} />
    </div>
  )
}
