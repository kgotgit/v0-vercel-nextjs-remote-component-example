'use client'

import { useState, useEffect } from 'react'

type CacheTraceData = {
  requestId: string
  totalDuration: number
  operationCount: number
  operations: Array<{
    tag: string
    fetchId: string
    duration: string
    size: string
    source: string
  }>
  summary: {
    tags: string[]
    totalSize: number
    totalFetchTime: number
  }
}

/**
 * Client component that displays the cache trace for the current request
 * The trace data is passed from the server via a script tag or API
 */
export function CacheTraceViewer({ traceData }: { traceData?: CacheTraceData }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [traces, setTraces] = useState<CacheTraceData[]>([])

  useEffect(() => {
    if (traceData) {
      setTraces(prev => [traceData, ...prev].slice(0, 10)) // Keep last 10 traces
    }
  }, [traceData])

  if (!traceData && traces.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <p className="text-gray-400 text-sm">No cache trace data available</p>
      </div>
    )
  }

  const currentTrace = traceData || traces[0]
  const isAllCached = currentTrace?.operationCount === 0

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isAllCached ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-white font-mono text-sm">
            Request Trace: {currentTrace?.requestId}
          </span>
          {isAllCached && (
            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs rounded-full">
              100% CACHED
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs">
            {currentTrace?.operationCount} cache ops | {currentTrace?.totalDuration}ms
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && currentTrace && (
        <div className="border-t border-gray-700">
          {/* All Cached Message */}
          {isAllCached && (
            <div className="p-4 border-b border-gray-800 bg-emerald-900/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-emerald-400 font-medium">All data served from cache</p>
                  <p className="text-emerald-600 text-sm">
                    No cache operations ran - all data was cached. Click &quot;Revalidate All&quot; and refresh to see the trace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline visualization */}
          {!isAllCached && (
          <div className="p-4 border-b border-gray-800">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Request Timeline</h4>
            <div className="space-y-2">
              {currentTrace.operations.map((op, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-24 text-right">
                    <span className="text-xs font-mono text-gray-400">{op.tag}</span>
                  </div>
                  <div className="flex-1 h-6 bg-gray-800 rounded relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded"
                      style={{
                        width: `${Math.min(100, (parseInt(op.duration) / (currentTrace.totalDuration || 1)) * 100)}%`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-mono text-white">
                        {op.fetchId} - {op.duration}
                      </span>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-xs text-gray-500">{op.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Summary */}
          <div className="p-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Fetch Time</p>
              <p className="text-lg font-mono text-white">{currentTrace.summary.totalFetchTime}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total Size</p>
              <p className="text-lg font-mono text-white">{formatBytes(currentTrace.summary.totalSize)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Tags Accessed</p>
              <p className="text-lg font-mono text-white">{currentTrace.summary.tags.length}</p>
            </div>
          </div>

          {/* Raw trace data */}
          <details className="border-t border-gray-800">
            <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              View Raw JSON
            </summary>
            <pre className="px-4 pb-4 text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(currentTrace, null, 2)}
            </pre>
          </details>

          {/* Previous traces */}
          {traces.length > 1 && (
            <div className="border-t border-gray-800 p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Previous Requests</h4>
              <div className="space-y-1">
                {traces.slice(1).map((trace, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-400">{trace.requestId}</span>
                    <span className="text-gray-500">{trace.operationCount} ops | {trace.totalDuration}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
