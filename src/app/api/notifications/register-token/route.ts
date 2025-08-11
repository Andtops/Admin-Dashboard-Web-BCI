import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const body = await request.json();
    const {
      token,
      platform,
      deviceInfo,
      userId,
      appVersion,
      osVersion,
      preferences,
      metadata
    } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required' },
        { status: 400 }
      );
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Valid platform (ios/android) is required' },
        { status: 400 }
      );
    }

    // Enhanced token registration with user management
    const tokenData = {
      token,
      userId: userId || `anonymous_${Date.now()}`,
      platform,
      deviceInfo: deviceInfo || {},
      appVersion: appVersion || '1.0.0',
      osVersion: osVersion || 'unknown',
      isActive: true,
      lastSeen: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
      preferences: preferences || {
        categories: {
          order: { enabled: true, sound: 'order_notification.mp3', vibration: true, priority: 'high' },
          promotion: { enabled: true, sound: 'promotion_notification.mp3', vibration: true, priority: 'normal' },
          system: { enabled: true, sound: 'system_alert.mp3', vibration: true, priority: 'high' },
          general: { enabled: true, sound: 'default_notification.mp3', vibration: true, priority: 'normal' }
        },
        quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
        doNotDisturb: false,
        globallyEnabled: true
      },
      metadata: {
        registrationDate: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalOrders: 0,
        isPremium: false,
        engagement: {
          totalNotificationsReceived: 0,
          totalOpened: 0,
          totalClicked: 0,
          openRate: 0,
          clickRate: 0,
          lastEngagement: new Date().toISOString()
        },
        ...metadata
      }
    };

    // Save FCM token to Convex database
    const mutationArgs: any = {
      token,
      platform,
      deviceInfo: {
        platform: platform,
        version: deviceInfo?.version || osVersion || null,
        model: deviceInfo?.model || null,
        appVersion: appVersion || null,
      },
      registeredAt: Date.now(),
    };

    // Only include userId if it's provided
    if (userId) {
      mutationArgs.userId = userId;
    }

    const tokenId = await convex.mutation(api.notifications.registerFCMToken, mutationArgs);

    // Determine user segments
    const segments = determineUserSegments(tokenData);

    console.log('✅ FCM token registered in Convex:', {
      tokenId,
      token: token.substring(0, 20) + '...',
      platform,
      userId: tokenData.userId,
      segments
    });

    return NextResponse.json({
      success: true,
      message: 'FCM token registered successfully',
      data: {
        tokenId,
        userId: tokenData.userId,
        platform: tokenData.platform,
        preferences: tokenData.preferences,
        segments,
        registeredAt: tokenData.registeredAt
      }
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register FCM token'
      },
      { status: 500 }
    );
  }
}, { requiredPermission: 'notifications:register' });

// PUT /api/notifications/register-token - Update token or preferences
export const PUT = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const body = await request.json();
    const { token, userId, preferences, metadata } = body;

    if (!token && !userId) {
      return NextResponse.json(
        { success: false, error: 'Token or userId is required for updates' },
        { status: 400 }
      );
    }

    // Update token data
    const updateData = {
      lastSeen: new Date().toISOString(),
      ...(preferences && { preferences }),
      ...(metadata && { metadata: { ...metadata, lastActiveAt: new Date().toISOString() } })
    };

    console.log('Updating FCM token/user data:', { token, userId, updateData });

    return NextResponse.json({
      success: true,
      message: 'Token/preferences updated successfully',
      data: {
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update FCM token'
      },
      { status: 500 }
    );
  }
}, { requiredPermission: 'notifications:update' });

export const DELETE = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token && !userId) {
      return NextResponse.json(
        { success: false, error: 'Token or userId is required' },
        { status: 400 }
      );
    }

    // Remove FCM token from Convex database
    if (token) {
      await convex.mutation(api.notifications.unregisterFCMToken, { token });
    }

    console.log('✅ FCM token unregistered from Convex:', {
      token,
      userId,
      unregisteredAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'FCM token unregistered successfully',
    });
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unregister FCM token'
      },
      { status: 500 }
    );
  }
}, { requiredPermission: 'notifications:delete' });

// Helper function to determine user segments
function determineUserSegments(tokenData: any): string[] {
  const segments = ['all_users'];

  // Add platform-specific segment
  segments.push(`${tokenData.platform}_users`);

  // Add new user segment if recently registered
  const registrationAge = Date.now() - new Date(tokenData.registeredAt).getTime();
  if (registrationAge < 7 * 24 * 60 * 60 * 1000) { // 7 days
    segments.push('new_users');
  }

  // Add premium segment if applicable
  if (tokenData.metadata?.isPremium) {
    segments.push('premium_users');
  }

  // Add engagement-based segments
  if (tokenData.metadata?.engagement?.openRate > 40) {
    segments.push('high_engagement');
  }

  return segments;
}
