import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all active FCM tokens
    const fcmTokens = await convex.query(api.notifications.getAllActiveFCMTokens);
    
    // Get all users
    const users = await convex.query(api.users.getUsers, {
      limit: 1000, // Get more users to match with tokens
      offset: 0
    });

    // Create a map of users by ID for quick lookup
    const userMap = new Map();
    users.forEach((user: any) => {
      userMap.set(user._id, user);
    });

    // Group tokens by user and create notification users
    const notificationUsers: any[] = [];
    const tokensByUser = new Map();

    fcmTokens.forEach((token: any) => {
      if (!token.userId) return; // Skip tokens without user association
      
      if (!tokensByUser.has(token.userId)) {
        tokensByUser.set(token.userId, []);
      }
      tokensByUser.get(token.userId).push(token);
    });

    // Create notification user objects
    tokensByUser.forEach((tokens, userId) => {
      const user = userMap.get(userId);
      if (!user) return;

      const notificationUser = {
        id: userId,
        userId: userId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        businessName: user.businessName,
        tokens: tokens.map((token: any) => ({
          token: token.token,
          platform: token.platform,
          deviceId: token.token.substring(0, 20) + '...',
          appVersion: token.deviceInfo?.appVersion || '1.0.0',
          osVersion: token.deviceInfo?.version || 'unknown',
          isActive: token.isActive,
          lastSeen: new Date(token.lastUpdated).toISOString(),
          registeredAt: new Date(token.registeredAt).toISOString(),
        })),
        preferences: {
          categories: {
            order: { enabled: true, sound: 'default', vibration: true, priority: 'high' },
            promotion: { enabled: true, sound: 'default', vibration: true, priority: 'normal' },
            system: { enabled: true, sound: 'default', vibration: true, priority: 'high' },
            general: { enabled: true, sound: 'default', vibration: true, priority: 'normal' }
          },
          quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
          doNotDisturb: false,
          globallyEnabled: true
        },
        segments: ['all_users', `${tokens[0]?.platform}_users`],
        metadata: {
          lastActiveAt: new Date(Math.max(...tokens.map((t: any) => t.lastUpdated))).toISOString(),
          registrationDate: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
          totalOrders: 0,
          isPremium: false,
          location: {
            country: 'India',
            region: 'Unknown',
            city: 'Unknown'
          },
          engagement: {
            totalNotificationsReceived: 0,
            totalOpened: 0,
            totalClicked: 0,
            openRate: 0,
            clickRate: 0,
            lastEngagement: new Date().toISOString()
          }
        }
      };

      notificationUsers.push(notificationUser);
    });

    // Apply filters
    let filteredUsers = notificationUsers;

    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.businessName && user.businessName.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (platform) {
      filteredUsers = filteredUsers.filter(user =>
        user.tokens.some((token: any) => token.platform === platform)
      );
    }

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: filteredUsers.length,
        limit,
        offset,
        hasMore: offset + limit < filteredUsers.length
      }
    });
  } catch (error) {
    console.error('Error fetching notification users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notification users'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, title, body: messageBody, data, imageUrl, clickAction, category = 'general' } = body;

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get FCM tokens for the specified users
    const fcmTokens = await convex.query(api.notifications.getFCMTokensForUsers, {
      userIds
    });

    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active FCM tokens found for the specified users' },
        { status: 400 }
      );
    }

    // Extract just the token strings
    const tokens = fcmTokens.map((tokenRecord: any) => tokenRecord.token);

    // Send notifications using the existing send-push endpoint logic
    const response = await fetch(`${request.nextUrl.origin}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        title,
        body: messageBody,
        data: {
          category,
          ...data
        },
        imageUrl,
        clickAction
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: result.success,
      message: `Notification sent to ${userIds.length} users (${tokens.length} devices)`,
      data: {
        userCount: userIds.length,
        deviceCount: tokens.length,
        result: result.result,
        logId: result.logId
      }
    });
  } catch (error) {
    console.error('Error sending notification to users:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification to users'
      },
      { status: 500 }
    );
  }
}