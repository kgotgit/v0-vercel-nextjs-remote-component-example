/**
 * Cache Demo Layout
 * 
 * This layout provides the shell for the cache demo pages.
 * The layout itself doesn't use "use cache" because we want to demonstrate
 * caching at the component and function level instead.
 */
export default function CacheDemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cache Components Demo</h1>
              <p className="text-sm text-gray-500">PPR + Cache Components + Tag Invalidation</p>
            </div>
            <a 
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
      
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-xs text-gray-500">
            Next.js 16 Cache Components Demo
          </p>
        </div>
      </footer>
    </div>
  )
}
