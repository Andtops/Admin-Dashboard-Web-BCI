import { NextRequest, NextResponse } from 'next/server';

export interface NotificationUser {
  id: string;
  userId: string;
  tokens: Array<{
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
    osVersion: string;
    isActive: boolean;
    lastSeen: string;
    registeredAt: string;
  }>;
  preferences: {
    categories: {
      [category: string]: {
        enabled: boolean;
        sound: string;
        vibration: boolean;
        priority: 'high' | 'normal' | 'low';
      };
    };
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
      timezone: string;
    };
    doNotDisturb: boolean;
    globallyEnabled: boolean;
  };
  segments: string[];
  metadata: {
    lastActiveAt: string;
    registrationDate: string;
    totalOrders: number;
    isPremium: boolean;
    location?: {
      country: string;
      region: string;
      city: string;
    };
    engagement: {
      totalNotificationsReceived: number;
      totalOpened: number;
      totalClicked: number;
      openRate: number;
      clickRate: number;
      lastEngagement: string;
    };
  };
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    platform?: 'ios' | 'android';
    lastActiveAfter?: string;
    registeredAfter?: string;
    hasOrders?: boolean;
    isPremium?: boolean;
    location?: {
      countries?: string[];
      regions?: string[];
      cities?: string[];
    };
    engagement?: {
      minOpenRate?: number;
      minClickRate?: number;
      lastEngagementAfter?: string;
    };
    customAttributes?: Record<string, any>;
  };
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// GET /api/notifications/users - List notification users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const platform = searchParams.get('platform');
    const segment = searchParams.get('segment');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Mock users data - in real implementation, query from database
    const mockUsers: NotificationUser[] = [
      {
        id: '1',
        userId: 'user_123',
        tokens: [
          {
            token: 'dGqvvGViT_6hAjr9qB8iGG:APA91bF5EHsh1k0vHzdHcS7Y-IUveTwXXRtqahYAmxO9OqaYZWa87JFt4XSDNkAhYjb-E1h1eAGROUpvt-110eQIZenuwRWjullZ0tQNa7nBCukE85C9xYA',
            platform: 'android',
            deviceId: 'device_123',
            appVersion: '1.0.0',
            osVersion: '13.0',
            isActive: true,
            lastSeen: new Date().toISOString(),
            registeredAt: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        preferences: {
          categories: {
            order: {
              enabled: true,
              sound: 'order_notification.mp3',
              vibration: true,
              priority: 'high'
            },
            promotion: {
              enabled: false,
              sound: 'promotion_notification.mp3',
              vibration: true,
              priority: 'normal'
            },
            system: {
              enabled: true,
              sound: 'system_alert.mp3',
              vibration: true,
              priority: 'high'
            }
          },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            timezone: 'America/New_York'
          },
          doNotDisturb: false,
          globallyEnabled: true
        },
        segments: ['active_users', 'premium_users'],
        metadata: {
          lastActiveAt: new Date().toISOString(),
          registrationDate: new Date(Date.now() - 2592000000).toISOString(),
          totalOrders: 15,
          isPremium: true,
          location: {
            country: 'US',
            region: 'NY',
            city: 'New York'
          },
          engagement: {
            totalNotificationsReceived: 45,
            totalOpened: 23,
            totalClicked: 8,
            openRate: 51.1,
            clickRate: 34.8,
            lastEngagement: new Date(Date.now() - 3600000).toISOString()
          }
        }
      }
    ];

    // Apply filters
    let filteredUsers = mockUsers;
    
    if (platform) {
      filteredUsers = filteredUsers.filter(user => 
        user.tokens.some(token => token.platform === platform)
      );
    }
    
    if (segment) {
      filteredUsers = filteredUsers.filter(user => 
        user.segments.includes(segment)
      );
    }
    
    if (activeOnly) {
      filteredUsers = filteredUsers.filter(user => 
        user.tokens.some(token => token.isActive)
      );
    }
    
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.userId.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit)
        },
        summary: {
          totalUsers: mockUsers.length,
          activeUsers: mockUsers.filter(u => u.tokens.some(t => t.isActive)).length,
          iosUsers: mockUsers.filter(u => u.tokens.some(t => t.platform === 'ios')).length,
          androidUsers: mockUsers.filter(u => u.tokens.some(t => t.platform === 'android')).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications/users - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, platform, deviceId, appVersion, osVersion, preferences, metadata } = body;

    if (!userId || !token || !platform) {
      return NextResponse.json(
        { success: false, error: 'userId, token, and platform are required' },
        { status: 400 }
      );
    }

    // In a real implementation, create or update user in database
    const user: NotificationUser = {
      id: `notification_user_${Date.now()}`,
      userId,
      tokens: [
        {
          token,
          platform,
          deviceId: deviceId || `device_${Date.now()}`,
          appVersion: appVersion || '1.0.0',
          osVersion: osVersion || 'unknown',
          isActive: true,
          lastSeen: new Date().toISOString(),
          registeredAt: new Date().toISOString()
        }
      ],
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
      segments: ['new_users'],
      metadata: {
        lastActiveAt: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
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

    console.log('User created/updated:', user);

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create/update user' 
      },
      { status: 500 }
    );
  }
}
