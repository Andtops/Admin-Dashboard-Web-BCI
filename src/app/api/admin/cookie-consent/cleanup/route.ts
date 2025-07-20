import { NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../../convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// POST - Cleanup old cookie consent records
export async function POST(request: NextRequest) {
  try {
    const { dryRun = true, keepPerUser = 3 } = await request.json()

    console.log('🧹 Starting cookie consent cleanup:', { dryRun, keepPerUser })

    // Run cleanup
    const result = await convex.mutation(api.cookieConsents.cleanupOldConsents, {
      dryRun: Boolean(dryRun),
      keepPerUser: Number(keepPerUser),
    })

    console.log('🧹 Cleanup completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('❌ Cookie consent cleanup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get cleanup preview (dry run)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keepPerUser = parseInt(searchParams.get('keepPerUser') || '3')

    console.log('🧹 Getting cleanup preview:', { keepPerUser })

    // Run dry run to see what would be deleted
    const result = await convex.mutation(api.cookieConsents.cleanupOldConsents, {
      dryRun: true,
      keepPerUser: keepPerUser,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('❌ Cookie consent cleanup preview error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}