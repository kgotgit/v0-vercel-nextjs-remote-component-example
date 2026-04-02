import { getProducts, getProductStats, getProductsByCategory } from '@/lib/products'
import { CacheVisualizer } from './cache-visualizer'

/**
 * Server Component that collects cache entries from all data fetches
 * and passes them to the client-side CacheVisualizer
 */
export async function CacheStatusSection() {
  // Fetch all the data to collect cache status
  // These calls will either hit cache or fetch fresh data
  const [productsData, statsData, electronicsData, sportsData, homeData] = await Promise.all([
    getProducts(),
    getProductStats(),
    getProductsByCategory('electronics'),
    getProductsByCategory('sports'),
    getProductsByCategory('home'),
  ])

  const entries = [
    { tag: productsData.tag, fetchId: productsData.fetchId },
    { tag: statsData.tag, fetchId: statsData.fetchId },
    { tag: electronicsData.tag, fetchId: electronicsData.fetchId },
    { tag: sportsData.tag, fetchId: sportsData.fetchId },
    { tag: homeData.tag, fetchId: homeData.fetchId },
  ]

  return <CacheVisualizer entries={entries} />
}
