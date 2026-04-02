import { NextRequest, NextResponse } from 'next/server'
import { 
  getLatestTraceForRoute, 
  getTraceById, 
  getRecentTraceIds,
  formatTraceForApi 
} from '@/lib/cache-tracer'

/**
 * GET /api/traces
 * 
 * Query parameters:
 * - route: Get latest trace for a specific route (e.g., /cache-demo)
 * - id: Get a specific trace by requestId
 * - recent: Get list of recent trace IDs for a route
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const route = searchParams.get('route')
  const id = searchParams.get('id')
  const recent = searchParams.get('recent')
  
  try {
    // Get trace by ID
    if (id) {
      const trace = await getTraceById(id)
      if (!trace) {
        return NextResponse.json(
          { error: 'Trace not found', id },
          { status: 404 }
        )
      }
      return NextResponse.json({
        trace: formatTraceForApi(trace),
        raw: trace,
      })
    }
    
    // Get recent trace IDs for a route
    if (recent && route) {
      const ids = await getRecentTraceIds(route)
      return NextResponse.json({
        route,
        recentTraceIds: ids,
        count: ids.length,
      })
    }
    
    // Get latest trace for a route
    if (route) {
      const trace = await getLatestTraceForRoute(route)
      if (!trace) {
        return NextResponse.json({
          route,
          message: 'No trace found for this route. Visit the route first to generate a trace.',
          trace: null,
        })
      }
      return NextResponse.json({
        trace: formatTraceForApi(trace),
        raw: trace,
      })
    }
    
    // No parameters - return usage info
    return NextResponse.json({
      usage: {
        'GET /api/traces?route=/cache-demo': 'Get latest trace for route',
        'GET /api/traces?id=req_xxx': 'Get trace by request ID',
        'GET /api/traces?recent=true&route=/cache-demo': 'Get recent trace IDs',
      },
      example: '/api/traces?route=/cache-demo',
    })
    
  } catch (error) {
    console.error('[Traces API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trace', details: String(error) },
      { status: 500 }
    )
  }
}
