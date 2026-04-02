'use client'

import { useState } from 'react'

type CacheOperation = {
  tag: string
  fetchId: string
  startedAt: number    // ms from request start
  completedAt: number  // ms from request start
  duration: number     // how long the fetch took
  size: number         // bytes
}

type CacheTraceData = {
  requestId: string
  route: string
  totalDuration: number
  operationCount: number
  allCached: boolean
  operations: CacheOperation[]
}

/**
 * Client component that visualizes the cache trace timeline
 */
export function CacheTraceViewer({ traceData }: { traceData: CacheTraceData | null }) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!traceData) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
        <p className="text-gray-400 text-sm">No cache trace data available</p>
      </div>
    )
  }

  const { requestId, route, totalDuration, operationCount, allCached, operations } = traceData
  
  // Calculate timeline scale
  const maxTime = operations.length > 0 
    ? Math.max(...operations.map(op => op.completedAt))
    : totalDuration
  
  // Calculate summary stats
  const totalFetchTime = operations.reduce((sum, op) => sum + op.duration, 0)
  const totalSize = operations.reduce((sum, op) => sum + op.size, 0)
  const parallelSavings = totalFetchTime - maxTime

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${allCached ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-white font-mono text-sm">{requestId}</span>
          <span className="text-gray-500 text-xs">{route}</span>
          {allCached && (
            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-400 text-xs rounded-full">
              100% CACHED
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs">
            {operationCount} cache miss{operationCount !== 1 ? 'es' : ''} | {totalDuration}ms
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
      {isExpanded && (
        <div className="border-t border-gray-700">
          {/* All Cached Message */}
          {allCached && (
            <div className="p-4 bg-emerald-900/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-emerald-400 font-medium">All data served from cache</p>
                  <p className="text-emerald-600 text-sm">
                    No &quot;use cache&quot; functions executed - all data was cached.
                    Click &quot;Revalidate All&quot; and refresh to see cache misses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline visualization */}
          {!allCached && (
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs text-gray-500 uppercase tracking-wide">Request Timeline</h4>
                <span className="text-xs text-gray-600">
                  0ms {'-'.repeat(20)} {maxTime}ms
                </span>
              </div>
              
              <div className="space-y-2">
                {operations.map((op, index) => {
                  const leftPercent = (op.startedAt / maxTime) * 100
                  const widthPercent = (op.duration / maxTime) * 100
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      {/* Tag name */}
                      <div className="w-32 text-right shrink-0">
                        <span className="text-xs font-mono text-amber-400">{op.tag}</span>
                      </div>
                      
                      {/* Timeline bar */}
                      <div className="flex-1 h-7 bg-gray-800 rounded relative overflow-hidden">
                        {/* The actual operation bar */}
                        <div
                          className="absolute inset-y-0 bg-gradient-to-r from-amber-600 to-amber-400 rounded flex items-center justify-end px-2"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 5)}%`,
                          }}
                        >
                          <span className="text-xs font-mono text-white whitespace-nowrap">
                            {op.duration}ms
                          </span>
                        </div>
                      </div>
                      
                      {/* Fetch ID and size */}
                      <div className="w-24 text-right shrink-0">
                        <span className="text-xs font-mono text-gray-500">{op.fetchId}</span>
                        <span className="text-xs text-gray-600 ml-2">{formatBytes(op.size)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Parallel execution note */}
              {parallelSavings > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs text-blue-400">
                    Parallel execution saved ~{parallelSavings}ms vs sequential
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {!allCached && (
            <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-800">
              <div>
                <p className="text-xs text-gray-500 uppercase">Cache Misses</p>
                <p className="text-lg font-mono text-amber-400">{operationCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Fetch Time</p>
                <p className="text-lg font-mono text-white">{totalFetchTime}ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Wall Clock Time</p>
                <p className="text-lg font-mono text-white">{maxTime}ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Size</p>
                <p className="text-lg font-mono text-white">{formatBytes(totalSize)}</p>
              </div>
            </div>
          )}

          {/* Tags list */}
          {!allCached && (
            <div className="p-4 border-b border-gray-800">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Cache Tags Fetched</h4>
              <div className="flex flex-wrap gap-2">
                {operations.map((op, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-800 rounded text-xs font-mono text-amber-400"
                  >
                    {op.tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw trace data */}
          <details className="border-t border-gray-800">
            <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              View Raw JSON
            </summary>
            <pre className="px-4 pb-4 text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(traceData, null, 2)}
            </pre>
          </details>
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
