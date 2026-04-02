'use client'

import { useState, useEffect, useCallback } from 'react'

type CacheEntryDisplay = {
  tag: string
  fetchId: string
  cachedAt: number
  cachedAgo: string
  dataSize: number
  dataSizeFormatted: string
  dataPreview: string
}

type CacheStats = {
  totalEntries: number
  totalSize: number
  totalSizeFormatted: string
  tags: string[]
}

type CacheInspectorResponse = {
  stats: CacheStats
  entries: CacheEntryDisplay[]
  timestamp: number
}

export function CacheInspectorDashboard() {
  const [data, setData] = useState<CacheInspectorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTag, setExpandedTag] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchCacheData = useCallback(async () => {
    try {
      const response = await fetch('/api/cache-inspector')
      if (!response.ok) throw new Error('Failed to fetch cache data')
      const json = await response.json()
      setData(json)
      setError(null)
    } catch {
      setError('Could not load cache data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCacheData()
  }, [fetchCacheData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchCacheData, 2000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchCacheData])

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48" />
          <div className="h-24 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 rounded-xl border border-red-800 p-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchCacheData}
          className="mt-2 text-sm text-red-300 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cache Inspector
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Shadow cache registry - see what data is cached by tag
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchCacheData}
            className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {data?.stats && (
        <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{data.stats.totalEntries}</span>
            <span className="text-xs text-gray-400">entries</span>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{data.stats.totalSizeFormatted}</span>
            <span className="text-xs text-gray-400">total size</span>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="flex items-center gap-2 flex-wrap">
            {data.stats.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="divide-y divide-gray-800">
        {data?.entries.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No cache entries yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Load the page components to populate the cache
            </p>
          </div>
        ) : (
          data?.entries.map((entry) => (
            <div key={entry.tag} className="px-6 py-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedTag(expandedTag === entry.tag ? null : entry.tag)}
              >
                <div className="flex items-center gap-4">
                  <code className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-sm font-mono">
                    {entry.tag}
                  </code>
                  <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs font-mono">
                    ID: {entry.fetchId}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{entry.dataSizeFormatted}</span>
                  <span>{entry.cachedAgo}</span>
                  <span className="text-gray-600">{expandedTag === entry.tag ? '▼' : '▶'}</span>
                </div>
              </div>
              
              {/* Expanded Data Preview */}
              {expandedTag === entry.tag && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Data Preview:</p>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                    {entry.dataPreview}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-800/30 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
          {' | '}
          <span className="text-gray-600">
            Note: In-memory registry resets on server restart. Use Redis for production.
          </span>
        </p>
      </div>
    </div>
  )
}
