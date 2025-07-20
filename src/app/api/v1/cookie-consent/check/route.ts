import { NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../../convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'
import { withApiKeyAuth } from '@/lib/apiKeyAuth'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // First, expire any old consents
    await convex.mutation(api.cookieConsents.expireOldConsents, {
      email: email
    })

    // Get active consent from database
    const consent = await convex.query(api.cookieConsents.getActiveConsent, {
      email: email
    })

    if (consent) {
      return NextResponse.json({
        success: true,
        consent: {
          preferences: consent.preferences,
          timestamp: consent.timestamp,
          consentMethod: consent.consentMethod,
          expiresAt: consent.expiresAt,
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No active consent found',
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      })
    }
  } catch (error) {
    console.error('Cookie consent check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
  },
  { 
    requiredPermission: 'cookie-consent:read'
  }
)