import { NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../../convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'
import { withApiKeyAuth } from '@/lib/apiKeyAuth'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      preferences, 
      consentMethod, 
      ipAddress, 
      userAgent 
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !preferences) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate preferences structure
    if (typeof preferences !== 'object' || 
        typeof preferences.essential !== 'boolean' ||
        typeof preferences.analytics !== 'boolean' ||
        typeof preferences.marketing !== 'boolean' ||
        typeof preferences.functional !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences format' },
        { status: 400 }
      )
    }

    // Save consent to database
    const result = await convex.mutation(api.cookieConsents.saveConsent, {
      firstName,
      lastName,
      email,
      preferences: {
        essential: true, // Always true
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing),
        functional: Boolean(preferences.functional),
      },
      consentMethod: consentMethod || 'banner_custom',
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    })

    return NextResponse.json({
      success: true,
      consentId: result.consentId,
      preferences: result.preferences,
      timestamp: result.timestamp,
      expiresAt: result.expiresAt,
      meta: {
        apiKeyId: apiKey.keyId,
        environment: apiKey.environment,
        timestamp: Date.now()
      }
    })
  } catch (error) {
    console.error('Cookie consent save error:', error)
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