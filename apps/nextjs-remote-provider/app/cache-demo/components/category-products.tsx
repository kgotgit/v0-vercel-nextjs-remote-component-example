import { getProductsByCategory } from '@/lib/products'

interface CategoryProductsProps {
  category: string
}

/**
 * CategoryProducts - Server Component filtered by category
 * 
 * Each call to getProductsByCategory(category) is cached independently
 * via "use cache" + cacheTag() with tags 'products' and 'category-{category}'.
 * This means each category has its own cache entry.
 */
export async function CategoryProducts({ category }: CategoryProductsProps) {
  const { products, fetchId, tag } = await getProductsByCategory(category)
  
  if (products.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No products found in {category}</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
            <p className="text-xs text-gray-500">
              {products.length} products | Tag: <code className="bg-gray-200 px-1 rounded">{tag}</code>
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800">
            {fetchId}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {products.map((product) => (
          <div key={product.id} className="px-4 py-3 flex justify-between">
            <span className="text-sm text-gray-900">{product.name}</span>
            <span className="text-sm font-medium text-gray-700">${product.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
