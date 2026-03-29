"use cache"

import { getProductStats } from '@/lib/products'

/**
 * ProductStats - A Cache Component with separate cache tag
 * 
 * This component is cached independently from ProductList.
 * It has its own cache tag (products-stats), allowing granular invalidation.
 * You can invalidate just the stats without affecting the product list cache.
 */
export async function ProductStats() {
  const stats = await getProductStats()
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
      <h3 className="font-semibold text-blue-900 mb-4">Product Statistics (Cached)</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
          <p className="text-sm text-gray-500">Total Stock</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">${stats.avgPrice}</p>
          <p className="text-sm text-gray-500">Avg Price</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{stats.categories.length}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          Cache Tag: <code className="bg-blue-100 px-1 rounded">products-stats</code>
        </p>
        <p className="text-xs text-blue-500 mt-1">
          Last computed: {stats.lastUpdated}
        </p>
      </div>
    </div>
  )
}
