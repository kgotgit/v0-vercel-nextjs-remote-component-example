/**
 * Loading Skeletons for Suspense fallbacks
 * Used with PPR to show immediate UI while dynamic content streams in
 */

export function ProductListSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="h-3 bg-gray-200 rounded w-64 mt-2" />
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-20 mt-2" />
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-12 mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductStatsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 animate-pulse">
      <div className="h-5 bg-blue-200 rounded w-40 mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="h-6 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DynamicUserSkeleton() {
  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 animate-pulse">
      <div className="h-5 bg-amber-200 rounded w-48 mb-3" />
      <div className="h-4 bg-amber-100 rounded w-full mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-amber-100 rounded w-32" />
        <div className="h-4 bg-amber-100 rounded w-48" />
      </div>
    </div>
  )
}

export function CategoryProductsSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-16 mt-1" />
      </div>
      <div className="divide-y divide-gray-100">
        {[1, 2].map((i) => (
          <div key={i} className="px-4 py-3 flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
