"use client"

import { useEffect, useState } from 'react'

interface TraceData {
  requestId: string
  route: string
  totalDuration: number
  operationCount: number
  operations: Array<{
    tag: string
    fetchId: string
    duration: number
    size: number
    startedAt: number
    completedAt: number
  }>
}

/**
 * Client component that polls for the stored trace after the page loads.
 * 
 * Since the trace is stored via after() AFTER the response streams,
 * we poll the API to fetch the most recent trace for this route.
 */
export function TraceSummary() {
  const [trace, setTrace] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Small delay to allow after() to complete and store the trace
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/traces?route=/cache-demo')
        if (!res.ok) throw new Error('Failed to fetch trace')
        const data = await res.json()
        setTrace(data.trace || null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }, 500) // Wait 500ms for after() to complete

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-slate-400 font-mono text-sm">Loading trace from Runtime Cache...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6">
        <p className="text-red-400">Error loading trace: {error}</p>
      </div>
    )
  }

  if (!trace || trace.operationCount === 0) {
    return (
      <div className="bg-emerald-950 border border-emerald-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <div>
            <p className="text-emerald-400 font-medium">100% Cache HIT</p>
            <p className="text-emerald-600 text-sm">
              All data was served from cache. No &quot;use cache&quot; functions executed.
              Click &quot;Revalidate All&quot; and refresh to see cache misses.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate timeline
  const maxCompletedAt = Math.max(...trace.operations.map(op => op.completedAt))
  const totalFetchTime = trace.operations.reduce((sum, op) => sum + op.duration, 0)
  const parallelEfficiency = maxCompletedAt > 0 
    ? Math.round((1 - maxCompletedAt / totalFetchTime) * 100) 
    : 0

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-white font-mono text-sm">
            {trace.requestId}
          </span>
          <span className="px-2 py-0.5 bg-amber-900/50 text-amber-400 text-xs rounded-full">
            {trace.operationCount} CACHE MISS{trace.operationCount !== 1 ? 'ES' : ''}
          </span>
        </div>
        <span className="text-slate-400 text-sm">
          {trace.totalDuration}ms total
        </span>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-4">Execution Timeline</h4>
        <div className="space-y-3">
          {trace.operations.map((op, i) => {
            const leftPercent = maxCompletedAt > 0 ? (op.startedAt / maxCompletedAt) * 100 : 0
            const widthPercent = maxCompletedAt > 0 ? (op.duration / maxCompletedAt) * 100 : 100
            
            return (
              <div key={i} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-sm font-mono">{op.tag}</span>
                  <span className="text-slate-500 text-xs">{op.duration}ms</span>
                </div>
                <div className="h-6 bg-slate-800 rounded relative overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-end pr-2"
                    style={{ 
                      left: `${leftPercent}%`, 
                      width: `${Math.max(widthPercent, 5)}%` 
                    }}
                  >
                    <span className="text-[10px] text-white font-mono">{op.fetchId}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{trace.operationCount}</p>
            <p className="text-xs text-slate-500">Cache Ops</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{maxCompletedAt}ms</p>
            <p className="text-xs text-slate-500">Wall Time</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{parallelEfficiency}%</p>
            <p className="text-xs text-slate-500">Parallel Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  )
}
