import { NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../../convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'
import { withApiKeyAuth } from '@/lib/apiKeyAuth'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const { email, reason } = await request.json()

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email is required' },
          { status: 400 }
        )
      }

      // Clear consent from database
      const result = await convex.mutation(api.cookieConsents.clearConsent, {
        email,
        reason: reason || 'user_requested'
      })

      return NextResponse.json({
        success: result.success,
        message: result.success ? 'Consent cleared successfully' : result.error,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Cookie consent clear error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  },
  { 
    requiredPermission: 'cookie-consent:write'
  }
)