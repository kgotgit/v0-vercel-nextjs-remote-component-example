'use server'

import { revalidateTag } from 'next/cache'

/**
 * Server Action to revalidate all products cache
 * Uses the 'max' cacheLife profile for SWR behavior
 */
export async function revalidateAllProducts() {
  console.log('[v0] revalidateAllProducts called - invalidating tag: products')
  revalidateTag('products', 'max')
  console.log('[v0] revalidateTag completed for products')
  return { success: true, message: 'All products cache invalidated' }
}

/**
 * Server Action to revalidate a specific product
 */
export async function revalidateProduct(productId: string) {
  console.log(`[v0] revalidateProduct called - invalidating tag: product-${productId}`)
  revalidateTag(`product-${productId}`, 'max')
  console.log(`[v0] revalidateTag completed for product-${productId}`)
  return { success: true, message: `Product ${productId} cache invalidated` }
}

/**
 * Server Action to revalidate a category
 */
export async function revalidateCategory(category: string) {
  console.log(`[v0] revalidateCategory called - invalidating tag: category-${category}`)
  revalidateTag(`category-${category}`, 'max')
  console.log(`[v0] revalidateTag completed for category-${category}`)
  return { success: true, message: `Category ${category} cache invalidated` }
}

/**
 * Server Action to revalidate product statistics
 */
export async function revalidateStats() {
  console.log('[v0] revalidateStats called - invalidating tag: products-stats')
  revalidateTag('products-stats', 'max')
  console.log('[v0] revalidateTag completed for products-stats')
  return { success: true, message: 'Product stats cache invalidated' }
}

/**
 * Server Action to revalidate everything
 */
export async function revalidateEverything() {
  console.log('[v0] revalidateEverything called - invalidating tags: products, products-stats')
  revalidateTag('products', 'max')
  revalidateTag('products-stats', 'max')
  console.log('[v0] revalidateTag completed for all tags')
  return { success: true, message: 'All caches invalidated' }
}
