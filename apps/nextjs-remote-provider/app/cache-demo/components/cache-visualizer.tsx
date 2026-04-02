'use client'

import { useState, useEffect } from 'react'

interface CacheEntry {
  tag: string
  fetchId: string
  timestamp: number
  isNew: boolean
}

interface CacheVisualizerProps {
  entries: Array<{ tag: string; fetchId: string }>
}

/**
 * Client-side Cache Visualizer
 * 
 * Tracks fetch IDs across page loads to show:
 * - Which data was served from cache (same fetchId)
 * - Which data was freshly fetched (new fetchId)
 * - History of cache invalidations
 */
export function CacheVisualizer({ entries }: CacheVisualizerProps) {
  const [history, setHistory] = useState<CacheEntry[]>([])
  const [previousIds, setPreviousIds] = useState<Record<string, string>>({})
  
  useEffect(() => {
    // Load previous IDs from sessionStorage
    const stored = sessionStorage.getItem('cache-demo-ids')
    const prevIds: Record<string, string> = stored ? JSON.parse(stored) : {}
    setPreviousIds(prevIds)
    
    console.log('[v0] CacheVisualizer - Previous IDs from session:', prevIds)
    console.log('[v0] CacheVisualizer - Current entries:', entries)
    
    // Check each entry against previous values
    const now = Date.now()
    const newHistory: CacheEntry[] = entries.map(entry => {
      const isNew = prevIds[entry.tag] !== entry.fetchId
      console.log(`[v0] ${entry.tag}: prev=${prevIds[entry.tag]} current=${entry.fetchId} isNew=${isNew}`)
      return {
        tag: entry.tag,
        fetchId: entry.fetchId,
        timestamp: now,
        isNew
      }
    })
    
    setHistory(newHistory)
    
    // Save current IDs
    const currentIds: Record<string, string> = {}
    entries.forEach(e => { currentIds[e.tag] = e.fetchId })
    sessionStorage.setItem('cache-demo-ids', JSON.stringify(currentIds))
    console.log('[v0] CacheVisualizer - Saved to session:', currentIds)
  }, [entries])
  
  const allCached = history.every(h => !h.isNew)
  const allFresh = history.every(h => h.isNew)
  
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-mono text-sm font-semibold text-gray-100">Cache Status Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          {allCached && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              ALL CACHED
            </span>
          )}
          {allFresh && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ALL FRESH
            </span>
          )}
          {!allCached && !allFresh && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PARTIAL
            </span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-2">
          {history.map((entry, i) => (
            <div 
              key={entry.tag}
              className={`flex items-center justify-between p-3 rounded-lg font-mono text-sm transition-all ${
                entry.isNew 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-green-500/10 border border-green-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${entry.isNew ? 'bg-amber-500' : 'bg-green-500'}`} />
                <code className="text-gray-300">{entry.tag}</code>
              </div>
              <div className="flex items-center gap-3">
                <code className={entry.isNew ? 'text-amber-400' : 'text-green-400'}>
                  {entry.fetchId}
                </code>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  entry.isNew 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  {entry.isNew ? 'MISS' : 'HIT'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>HIT = Served from cache</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>MISS = Fresh fetch (after revalidation or first load)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
