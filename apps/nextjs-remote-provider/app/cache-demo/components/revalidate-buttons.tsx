'use client'

import { useState, useTransition } from 'react'
import { 
  revalidateAllProducts, 
  revalidateProduct, 
  revalidateCategory, 
  revalidateStats,
  revalidateEverything 
} from '../actions'

/**
 * RevalidateButtons - Client Component for cache invalidation
 * 
 * These buttons trigger Server Actions that call revalidateTag()
 * to invalidate specific parts of the cache.
 */
export function RevalidateButtons() {
  const [isPending, startTransition] = useTransition()
  const [lastAction, setLastAction] = useState<string | null>(null)

  const handleRevalidate = (action: () => Promise<{ message: string }>, label: string) => {
    startTransition(async () => {
      const result = await action()
      setLastAction(`${label}: ${result.message}`)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-2">Cache Invalidation Controls</h3>
      <p className="text-sm text-gray-500 mb-4">
        Click buttons to invalidate specific cache tags using <code className="bg-gray-100 px-1 rounded">revalidateTag()</code>
      </p>
      
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Tag-based Invalidation:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRevalidate(revalidateAllProducts, 'Products')}
              disabled={isPending}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Revalidate Products
            </button>
            <button
              onClick={() => handleRevalidate(revalidateStats, 'Stats')}
              disabled={isPending}
              className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Revalidate Stats
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Category Invalidation:</h4>
          <div className="flex flex-wrap gap-2">
            {['electronics', 'sports', 'home'].map((category) => (
              <button
                key={category}
                onClick={() => handleRevalidate(() => revalidateCategory(category), `Category ${category}`)}
                disabled={isPending}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors capitalize"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Single Product Invalidation:</h4>
          <div className="flex flex-wrap gap-2">
            {['1', '2', '3'].map((id) => (
              <button
                key={id}
                onClick={() => handleRevalidate(() => revalidateProduct(id), `Product ${id}`)}
                disabled={isPending}
                className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                Product #{id}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={() => handleRevalidate(revalidateEverything, 'All')}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Revalidate Everything
          </button>
        </div>
      </div>
      
      {lastAction && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{lastAction}</p>
        </div>
      )}
      
      {isPending && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Revalidating...</p>
        </div>
      )}
    </div>
  )
}
