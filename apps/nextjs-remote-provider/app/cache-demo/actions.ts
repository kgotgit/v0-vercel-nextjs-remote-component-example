'use server'

import { revalidateTag } from 'next/cache'

/**
 * Server Action to revalidate all products cache
 * Uses the 'max' cacheLife profile for SWR behavior
 */
export async function revalidateAllProducts() {
  console.log('[Action] Revalidating all products...')
  revalidateTag('products', 'max')
  return { success: true, message: 'All products cache invalidated', timestamp: new Date().toISOString() }
}

/**
 * Server Action to revalidate a specific product
 */
export async function revalidateProduct(productId: string) {
  console.log(`[Action] Revalidating product ${productId}...`)
  revalidateTag(`product-${productId}`, 'max')
  return { success: true, message: `Product ${productId} cache invalidated`, timestamp: new Date().toISOString() }
}

/**
 * Server Action to revalidate a category
 */
export async function revalidateCategory(category: string) {
  console.log(`[Action] Revalidating category ${category}...`)
  revalidateTag(`category-${category}`, 'max')
  return { success: true, message: `Category ${category} cache invalidated`, timestamp: new Date().toISOString() }
}

/**
 * Server Action to revalidate product statistics
 */
export async function revalidateStats() {
  console.log('[Action] Revalidating product stats...')
  revalidateTag('products-stats', 'max')
  return { success: true, message: 'Product stats cache invalidated', timestamp: new Date().toISOString() }
}

/**
 * Server Action to revalidate everything
 */
export async function revalidateEverything() {
  console.log('[Action] Revalidating everything...')
  revalidateTag('products', 'max')
  revalidateTag('products-stats', 'max')
  return { success: true, message: 'All caches invalidated', timestamp: new Date().toISOString() }
}
