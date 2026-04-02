import { getCurrentTrace } from '@/lib/cache-tracer'
import { CacheTraceViewer } from './cache-trace-viewer'

/**
 * Server component that displays the current request's cache trace.
 *
 * IMPORTANT: This component is async and wrapped in <Suspense> so it runs
 * in the dynamic streaming portion of the page (not the static prerendered shell).
 *
 * Even so, because React concurrent rendering starts all Suspense boundaries
 * simultaneously, this component may resolve before sibling async components
 * (like ProductList with its 1500 ms simulated delay) have called recordCacheOp().
 *
 * Result:
 * - 0 ops  → all data was served from cache (most requests after first)
 * - N ops  → N cache MISSes happened BEFORE this component resolved
 *
 * For the complete ordered trace of a full cache-miss request, see the
 * "Stored Trace" section below — it is written by after() once all
 * Suspense boundaries have resolved.
 */
export async function RequestTraceSection() {
  // Being async ensures we're not part of the static prerender shell.
  // Give concurrent siblings a chance to record their ops first.
  await new Promise<void>((resolve) => setTimeout(resolve, 0))

  const trace = getCurrentTrace()

  const traceData = trace
    ? {
        requestId: trace.requestId,
        route: trace.route,
        totalDuration: Date.now() - trace.startTime,
        operationCount: trace.operations.length,
        allCached: trace.operations.length === 0,
        operations: trace.operations.map((op) => ({
          tag: op.tag,
          fetchId: op.fetchId,
          startedAt: op.startedAt,
          completedAt: op.completedAt,
          duration: op.duration,
          size: op.size,
        })),
      }
    : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Request Cache Trace</h2>
        <p className="text-sm text-gray-500">
          Real-time trace of cache operations during this request.
          Shows cache <strong>MISSes</strong> only — 0 ops means everything was served from
          cache (or sibling components are still resolving). For the full picture, see the
          Stored Trace below.
        </p>
      </div>
      <CacheTraceViewer traceData={traceData} />
    </div>
  )
}
