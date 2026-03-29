import { getProducts } from '@/lib/products'
import { RenderedAt } from './rendered-at'

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
  const products = await getProducts()
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-900">Product List (Cached Component)</h2>
        <p className="text-xs text-gray-500 mt-1">
          This component uses &quot;use cache&quot; directive - cached until invalidated
        </p>
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
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Rendered at: <RenderedAt />
        </p>
      </div>
    </div>
  )
}
