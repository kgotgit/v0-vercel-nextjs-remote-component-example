'use server'

import { revalidateTag } from 'next/cache'
import { clearCacheEntry } from '@/lib/cache-registry'

/**
 * Server Action to revalidate all products cache
 * Uses the 'max' cacheLife profile for SWR behavior
 */
export async function revalidateAllProducts() {
  revalidateTag('products', 'max')
  // Clear shadow cache registry (Next.js cache will re-populate on next request)
  clearCacheEntry('products')
  clearCacheEntry('category-electronics')
  clearCacheEntry('category-sports')
  clearCacheEntry('category-home')
  return { success: true, message: 'All products cache invalidated' }
}

/**
 * Server Action to revalidate a specific product
 */
export async function revalidateProduct(productId: string) {
  revalidateTag(`product-${productId}`, 'max')
  clearCacheEntry(`product-${productId}`)
  return { success: true, message: `Product ${productId} cache invalidated` }
}

/**
 * Server Action to revalidate a category
 */
export async function revalidateCategory(category: string) {
  revalidateTag(`category-${category}`, 'max')
  clearCacheEntry(`category-${category}`)
  return { success: true, message: `Category ${category} cache invalidated` }
}

/**
 * Server Action to revalidate product statistics
 */
export async function revalidateStats() {
  revalidateTag('products-stats', 'max')
  clearCacheEntry('products-stats')
  return { success: true, message: 'Product stats cache invalidated' }
}

/**
 * Server Action to revalidate everything
 */
export async function revalidateEverything() {
  revalidateTag('products', 'max')
  revalidateTag('products-stats', 'max')
  // Clear all shadow cache entries
  clearCacheEntry('products')
  clearCacheEntry('products-stats')
  clearCacheEntry('category-electronics')
  clearCacheEntry('category-sports')
  clearCacheEntry('category-home')
  return { success: true, message: 'All caches invalidated' }
}
