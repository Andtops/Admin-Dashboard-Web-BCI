import { NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// GET - Check cookie consent (supports both email and anonymous ID)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const anonymousId = searchParams.get('anonymousId')

    if (!email && !anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Email or anonymousId parameter is required' },
        { status: 400 }
      )
    }

    // First, expire any old consents
    await convex.mutation(api.cookieConsents.expireOldConsents, {
      email: email || undefined,
      anonymousId: anonymousId || undefined,
    })

    // Get active consent from database
    const consent = await convex.query(api.cookieConsents.getActiveConsent, {
      email: email || undefined,
      anonymousId: anonymousId || undefined,
    })

    if (consent) {
      return NextResponse.json({
        success: true,
        consent: {
          preferences: consent.preferences,
          timestamp: consent.timestamp,
          consentMethod: consent.consentMethod,
          expiresAt: consent.expiresAt,
          isAnonymous: consent.isAnonymous,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No active consent found',
      })
    }
  } catch (error) {
    console.error('Cookie consent check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save cookie consent (supports anonymous users)
export async function POST(request: NextRequest) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      preferences, 
      consentMethod, 
      ipAddress, 
      userAgent,
      anonymousId
    } = await request.json()

    console.log('🍪 Admin API: Received cookie consent save request:', {
      firstName,
      lastName,
      email,
      preferences,
      consentMethod,
      anonymousId: anonymousId ? anonymousId.substring(0, 8) + '...' : undefined
    })

    // Validate required fields
    if (!firstName || !lastName || !email || !preferences) {
      console.error('❌ Admin API: Missing required fields:', { firstName, lastName, email, preferences })
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
      console.error('❌ Admin API: Invalid preferences format:', preferences)
      return NextResponse.json(
        { success: false, error: 'Invalid preferences format' },
        { status: 400 }
      )
    }

    // Save consent to database
    console.log('🍪 Admin API: Saving to Convex database...')
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
      anonymousId: anonymousId || undefined,
    })

    console.log('✅ Admin API: Cookie consent saved successfully:', {
      consentId: result.consentId,
      isAnonymous: result.isAnonymous,
      email: email
    })

    return NextResponse.json({
      success: true,
      consentId: result.consentId,
      preferences: result.preferences,
      timestamp: result.timestamp,
      expiresAt: result.expiresAt,
      isAnonymous: result.isAnonymous,
    })
  } catch (error) {
    console.error('❌ Admin API: Cookie consent save error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Clear cookie consent (supports anonymous users)
export async function DELETE(request: NextRequest) {
  try {
    const { email, anonymousId, reason } = await request.json()

    if (!email && !anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Email or anonymousId is required' },
        { status: 400 }
      )
    }

    // Clear consent from database
    const result = await convex.mutation(api.cookieConsents.clearConsent, {
      email: email || undefined,
      anonymousId: anonymousId || undefined,
      reason: reason || 'user_requested',
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Consent cleared successfully' : result.error,
    })
  } catch (error) {
    console.error('Cookie consent clear error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Link anonymous consent to user account (when user registers/logs in)
export async function PUT(request: NextRequest) {
  try {
    const { anonymousId, userId, userEmail, firstName, lastName } = await request.json()

    if (!anonymousId || !userId || !userEmail || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for linking' },
        { status: 400 }
      )
    }

    // Link anonymous consent to user account
    const result = await convex.mutation(api.cookieConsents.linkAnonymousConsent, {
      anonymousId,
      userId,
      userEmail,
      firstName,
      lastName,
    })

    return NextResponse.json({
      success: result.success,
      action: result.action,
      message: result.success ? 'Anonymous consent linked successfully' : result.error,
    })
  } catch (error) {
    console.error('Cookie consent linking error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}