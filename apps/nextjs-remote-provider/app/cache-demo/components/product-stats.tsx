import { getProductStats } from '@/lib/products'

/**
 * ProductStats - Server Component that displays product statistics
 * 
 * The data fetching (getProductStats) is cached via "use cache" + cacheTag()
 * in lib/products.ts with tag 'products-stats'.
 * This allows granular invalidation separate from the product list.
 */
export async function ProductStats() {
  const stats = await getProductStats()
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-blue-900">Product Statistics (Cached)</h3>
          <p className="text-xs text-blue-600">
            Tag: <code className="bg-blue-100 px-1 rounded">{stats.tag}</code>
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
            ID: {stats.fetchId}
          </span>
          <p className="text-xs text-blue-400 mt-1">Same ID = cached</p>
        </div>
      </div>
      
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
    </div>
  )
}
