/**
 * Shadow Cache Registry
 * 
 * This mirrors what Next.js caches, allowing inspection of cached data by tag.
 * 
 * STORAGE OPTIONS:
 * 
 * 1. In-Memory (current) - Demo only
 *    - Fast but ephemeral
 *    - Lost on server restart
 *    - Inconsistent across serverless instances
 * 
 * 2. Vercel Data Cache (VDC) - NOT suitable for registry
 *    - VDC is for caching function outputs via "use cache"
 *    - No key-value API, no list/scan operations
 *    - Can't update cached values, only invalidate
 *    - The actual cached data IS in VDC, but we can't inspect it
 * 
 * 3. Upstash Redis (RECOMMENDED for production)
 *    - Persistent across restarts and deployments
 *    - Shared across all serverless instances
 *    - Has list/scan operations
 *    - Built-in Vercel integration
 *    - Example: await redis.hset('cache:registry', tag, JSON.stringify(entry))
 * 
 * 4. Vercel KV - Similar to Upstash, also works well
 * 
 * Note: Next.js/VDC doesn't expose an API to inspect cached data - this registry
 * is a workaround that mirrors cache operations for observability.
 */

export type CacheEntry = {
  tag: string
  data: unknown
  fetchId: string
  cachedAt: number
  dataSize: number
  dataPreview: string
}

// In-memory registry (use Redis in production for persistence across instances)
// This Map lives in the server process - resets on restart
const cacheRegistry = new Map<string, CacheEntry>()

/**
 * Register a cache entry when data is fetched
 * Call this inside your "use cache" functions after fetching data
 */
export function registerCacheEntry(
  tag: string,
  data: unknown,
  fetchId: string
): void {
  const serialized = JSON.stringify(data)
  const entry: CacheEntry = {
    tag,
    data,
    fetchId,
    cachedAt: Date.now(),
    dataSize: new Blob([serialized]).size,
    dataPreview: serialized.slice(0, 200) + (serialized.length > 200 ? '...' : ''),
  }
  
  cacheRegistry.set(tag, entry)
  console.log(`[CacheRegistry] Registered: ${tag} (fetchId: ${fetchId}, size: ${entry.dataSize} bytes)`)
}

/**
 * Clear a cache entry when revalidated
 * Call this in your revalidation server actions
 */
export function clearCacheEntry(tag: string): void {
  if (cacheRegistry.has(tag)) {
    cacheRegistry.delete(tag)
    console.log(`[CacheRegistry] Cleared: ${tag}`)
  }
}

/**
 * Get a specific cache entry by tag
 */
export function getCacheEntry(tag: string): CacheEntry | null {
  return cacheRegistry.get(tag) || null
}

/**
 * Get all cached entries
 */
export function getAllCacheEntries(): CacheEntry[] {
  return Array.from(cacheRegistry.values()).sort((a, b) => b.cachedAt - a.cachedAt)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const entries = getAllCacheEntries()
  const totalSize = entries.reduce((sum, e) => sum + e.dataSize, 0)
  
  return {
    totalEntries: entries.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    oldestEntry: entries.length > 0 ? entries[entries.length - 1] : null,
    newestEntry: entries.length > 0 ? entries[0] : null,
    tags: entries.map(e => e.tag),
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * PRODUCTION IMPLEMENTATION WITH UPSTASH REDIS
 * 
 * To use Upstash Redis instead of in-memory storage:
 * 
 * 1. Add Upstash integration in Vercel dashboard
 * 2. Install: pnpm add @upstash/redis
 * 3. Replace the Map-based functions with:
 * 
 * ```ts
 * import { Redis } from '@upstash/redis'
 * 
 * const redis = Redis.fromEnv()
 * 
 * export async function registerCacheEntry(tag: string, data: unknown, fetchId: string) {
 *   const entry = { tag, data, fetchId, cachedAt: Date.now(), ... }
 *   await redis.hset('cache:registry', { [tag]: JSON.stringify(entry) })
 * }
 * 
 * export async function getCacheEntry(tag: string) {
 *   const entry = await redis.hget('cache:registry', tag)
 *   return entry ? JSON.parse(entry) : null
 * }
 * 
 * export async function getAllCacheEntries() {
 *   const all = await redis.hgetall('cache:registry')
 *   return Object.values(all || {}).map(v => JSON.parse(v))
 * }
 * 
 * export async function clearCacheEntry(tag: string) {
 *   await redis.hdel('cache:registry', tag)
 * }
 * ```
 */
