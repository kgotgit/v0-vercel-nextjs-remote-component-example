import { headers } from 'next/headers'

/**
 * DynamicUserInfo - A Dynamic Component (NOT cached)
 * 
 * This component does NOT use "use cache" and accesses request-time data (headers).
 * With PPR (Partial Prerendering), this will be rendered dynamically at request time
 * while the rest of the page shell is served from cache.
 * 
 * Wrap this in <Suspense> to enable PPR streaming.
 */
export async function DynamicUserInfo() {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  const timestamp = new Date().toISOString()
  
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Parse user agent for display
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' : 'Other'
  
  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
      <h3 className="font-semibold text-amber-900 mb-3">
        Dynamic Request Info (PPR Streaming)
      </h3>
      <p className="text-sm text-amber-800 mb-4">
        This component is NOT cached - it renders fresh on every request.
        With PPR, the page shell loads instantly while this streams in.
      </p>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-amber-700">Browser:</span>
          <span className="font-medium text-amber-900">{browser}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-700">Request Time:</span>
          <span className="font-mono text-xs text-amber-900">{timestamp}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-amber-200">
        <p className="text-xs text-amber-600">
          No cache directive - rendered at request time
        </p>
      </div>
    </div>
  )
}
