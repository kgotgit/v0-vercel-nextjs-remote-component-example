import { Suspense } from 'react'
import { ProductList } from './components/product-list'
import { ProductStats } from './components/product-stats'
import { CategoryProducts } from './components/category-products'
import { DynamicUserInfo } from './components/dynamic-user-info'
import { RevalidateButtons } from './components/revalidate-buttons'
import {
  ProductListSkeleton,
  ProductStatsSkeleton,
  DynamicUserSkeleton,
  CategoryProductsSkeleton,
} from './components/loading-skeleton'

/**
 * Cache Demo Page - Demonstrating PPR and Cache Components
 * 
 * This page demonstrates Next.js 16's caching features:
 * 
 * CACHE COMPONENTS ("use cache" directive):
 * - Individual components like ProductList, ProductStats have "use cache" 
 * - Data fetching functions in lib/products.ts have "use cache" with cacheTag()
 * - Each cached unit has its own independent cache entry
 * 
 * PPR (Partial Prerendering):
 * - The page shell renders immediately
 * - Async components wrapped in <Suspense> stream in as they resolve
 * - DynamicUserInfo accesses headers() so it renders at request time
 * 
 * CACHE INVALIDATION:
 * - Use revalidateTag('tag-name', 'max') in Server Actions
 * - 'max' is a cacheLife profile that enables SWR behavior
 * - Tags assigned via cacheTag() in cached functions
 */
export default function CacheDemoPage() {
  console.log('[v0] CacheDemoPage rendering')
  return (
    <div className="space-y-8">
      {/* Explanation Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-3">How This Demo Works</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-medium mb-2">1. Cache Components</h3>
            <p className="text-gray-300">
              Components with <code className="bg-white/20 px-1 rounded">&quot;use cache&quot;</code> directive 
              are cached independently. Each has its own cache key.
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-medium mb-2">2. PPR (Partial Prerendering)</h3>
            <p className="text-gray-300">
              Page shell loads instantly. Dynamic content inside 
              <code className="bg-white/20 px-1 rounded">Suspense</code> streams in.
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-medium mb-2">3. Tag Invalidation</h3>
            <p className="text-gray-300">
              Use <code className="bg-white/20 px-1 rounded">revalidateTag()</code> in Server Actions 
              to invalidate specific cache entries.
            </p>
          </div>
        </div>
      </section>

      {/* Revalidation Controls */}
      <section>
        <RevalidateButtons />
      </section>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product List - Cached Component */}
        <div className="lg:col-span-2">
          <Suspense fallback={<ProductListSkeleton />}>
            <ProductList />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Stats - Cached Component */}
          <Suspense fallback={<ProductStatsSkeleton />}>
            <ProductStats />
          </Suspense>

          {/* Dynamic User Info - NOT cached, streams via PPR */}
          <Suspense fallback={<DynamicUserSkeleton />}>
            <DynamicUserInfo />
          </Suspense>
        </div>
      </div>

      {/* Category Sections - Each cached independently */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-4">Products by Category (Cached per Category)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Suspense fallback={<CategoryProductsSkeleton />}>
            <CategoryProducts category="electronics" />
          </Suspense>
          <Suspense fallback={<CategoryProductsSkeleton />}>
            <CategoryProducts category="sports" />
          </Suspense>
          <Suspense fallback={<CategoryProductsSkeleton />}>
            <CategoryProducts category="home" />
          </Suspense>
        </div>
      </section>

      {/* Code Examples Section */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Code Examples</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Cache Component Example */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">1. Cache Component (use cache directive)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`"use cache"

import { unstable_cacheTag as cacheTag } from 'next/cache'

export async function getProducts() {
  cacheTag('products')  // Tag for invalidation
  
  const products = await db.products.findMany()
  return products
}`}</code>
            </pre>
          </div>

          {/* Revalidation Example */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">2. Cache Invalidation (Server Action)</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateProducts() {
  // 'max' is the cacheLife profile for SWR behavior
  revalidateTag('products', 'max')
  return { success: true }
}`}</code>
            </pre>
          </div>

          {/* PPR Example */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">3. PPR with Suspense</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`// next.config.ts
const nextConfig = {
  cacheComponents: true,
  experimental: { ppr: true },
}

// page.tsx
"use cache"

export default function Page() {
  return (
    <div>
      {/* Cached shell loads instantly */}
      <Header />
      
      {/* Dynamic content streams in */}
      <Suspense fallback={<Loading />}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Page Render Time */}
      <div className="text-center text-xs text-gray-500">
        Page component rendered at: {new Date().toISOString()} (cached)
      </div>
    </div>
  )
}
