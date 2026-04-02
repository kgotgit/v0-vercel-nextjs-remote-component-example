'use client'

import { useState, useEffect } from 'react'

type TraceOperation = {
  tag: string
  fetchId: string
  startedAt: number
  completedAt: number
  duration: number
  size: number
}

type StoredTrace = {
  requestId: string
  route: string
  startTime: number
  totalDuration: number
  operations: TraceOperation[]
  summary: {
    totalOps: number
    totalFetchTime: number
    parallelEfficiency: number
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function StoredTracesViewer() {
  const [trace, setTrace] = useState<StoredTrace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrace = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/traces?route=/cache-demo')
      const data = await res.json()
      if (data.trace) {
        setTrace(data.trace)
      } else {
        setTrace(null)
      }
    } catch (e) {
      setError('Failed to fetch trace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrace()
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full animate-spin" />
          <span className="text-slate-400">Loading stored trace...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-xl border border-red-800 p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchTrace}
          className="mt-2 text-sm text-red-300 underline hover:text-red-200"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!trace) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
        <div className="text-center">
          <p className="text-slate-400">No stored trace found for this route.</p>
          <p className="text-slate-500 text-sm mt-1">
            Traces are stored after the response is sent via after().
            Refresh the page to generate and store a trace.
          </p>
          <button
            onClick={fetchTrace}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    )
  }

  const maxDuration = Math.max(...trace.operations.map(op => op.completedAt), trace.totalDuration)

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-white font-mono text-sm">
            Stored Trace: {trace.requestId}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-xs">
            {trace.summary.totalOps} ops | {formatTime(trace.totalDuration)} total
          </span>
          <button
            onClick={fetchTrace}
            className="text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Route Info */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/50">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Route:</span>
            <span className="text-white ml-2 font-mono">{trace.route}</span>
          </div>
          <div>
            <span className="text-slate-500">Stored:</span>
            <span className="text-slate-300 ml-2">
              {new Date(trace.startTime).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Parallel Efficiency:</span>
            <span className="text-emerald-400 ml-2">
              {trace.summary.parallelEfficiency.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {trace.operations.length > 0 ? (
        <div className="p-5">
          <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-4">
            Execution Timeline (Parallel)
          </h4>
          
          <div className="space-y-3">
            {trace.operations.map((op, index) => {
              const startPercent = (op.startedAt / maxDuration) * 100
              const widthPercent = (op.duration / maxDuration) * 100
              
              return (
                <div key={index} className="relative">
                  {/* Label */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm font-mono">{op.tag}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-amber-400 font-medium">MISS</span>
                      <span className="text-slate-500">{formatTime(op.duration)}</span>
                      <span className="text-slate-600">{formatBytes(op.size)}</span>
                    </div>
                  </div>
                  
                  {/* Timeline bar */}
                  <div className="h-6 bg-slate-800 rounded relative overflow-hidden">
                    <div
                      className="absolute h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded flex items-center justify-end pr-2"
                      style={{
                        left: `${startPercent}%`,
                        width: `${Math.max(widthPercent, 5)}%`,
                      }}
                    >
                      <span className="text-xs text-amber-100 font-mono">
                        {op.fetchId}
                      </span>
                    </div>
                  </div>
                  
                  {/* Time markers */}
                  <div className="flex justify-between mt-1 text-xs text-slate-600">
                    <span>{op.startedAt}ms</span>
                    <span>{op.completedAt}ms</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{trace.summary.totalOps}</p>
                <p className="text-xs text-slate-500">Cache Misses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatTime(trace.summary.totalFetchTime)}</p>
                <p className="text-xs text-slate-500">Total Fetch Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{formatTime(trace.totalDuration)}</p>
                <p className="text-xs text-slate-500">Actual Duration</p>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-3">
              Parallel execution saved {formatTime(trace.summary.totalFetchTime - trace.totalDuration)} vs sequential
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 rounded-full">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-400 font-medium">100% Cache Hit</span>
          </div>
          <p className="text-slate-500 text-sm mt-3">
            All data was served from cache. No fetch operations ran.
          </p>
        </div>
      )}
    </div>
  )
}
