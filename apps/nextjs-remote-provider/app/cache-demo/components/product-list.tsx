import { getProducts } from '@/lib/products'

/**
 * ProductList - Server Component that displays products
 * 
 * The data fetching (getProducts) is cached via "use cache" + cacheTag()
 * in lib/products.ts. This means:
 * - The fetch is cached independently
 * - Can be invalidated via revalidateTag('products', 'max')
 * - Multiple components can share the same cached data
 */
export async function ProductList() {
  const { products, fetchId, tag } = await getProducts()
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Product List (Cached)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Tag: <code className="bg-gray-200 px-1 rounded">{tag}</code>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
              ID: {fetchId}
            </span>
            <p className="text-xs text-gray-400 mt-1">Same ID = cached</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {products.map((product) => (
          <div key={product.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{product.name}</span>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gray-900">${product.price}</span>
              <p className="text-xs text-gray-500">Stock: {product.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
