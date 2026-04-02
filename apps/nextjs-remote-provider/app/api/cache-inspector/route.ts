import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllCacheEntries, 
  getCacheEntry, 
  getCacheStats,
  type CacheEntry 
} from '@/lib/cache-registry'

/**
 * Cache Inspector API
 * 
 * GET /api/cache-inspector - Get all cached entries and stats
 * GET /api/cache-inspector?tag=products - Get specific cache entry
 * GET /api/cache-inspector?stats=true - Get cache statistics only
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const statsOnly = searchParams.get('stats') === 'true'
  
  // Get specific tag
  if (tag) {
    const entry = getCacheEntry(tag)
    if (!entry) {
      return NextResponse.json(
        { error: `No cache entry found for tag: ${tag}` },
        { status: 404 }
      )
    }
    return NextResponse.json({ entry })
  }
  
  // Get stats only
  if (statsOnly) {
    const stats = getCacheStats()
    return NextResponse.json({ stats })
  }
  
  // Get all entries with stats
  const entries = getAllCacheEntries()
  const stats = getCacheStats()
  
  // Format for display
  const formattedEntries = entries.map((entry: CacheEntry) => ({
    tag: entry.tag,
    fetchId: entry.fetchId,
    cachedAt: entry.cachedAt,
    cachedAgo: formatTimeAgo(entry.cachedAt),
    dataSize: entry.dataSize,
    dataSizeFormatted: formatBytes(entry.dataSize),
    dataPreview: entry.dataPreview,
  }))
  
  return NextResponse.json({
    stats,
    entries: formattedEntries,
    timestamp: Date.now(),
  })
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
