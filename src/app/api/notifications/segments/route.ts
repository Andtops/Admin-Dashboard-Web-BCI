import { NextRequest, NextResponse } from 'next/server';
import { UserSegment } from '../users/route';

// GET /api/notifications/segments - List user segments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUserCount = searchParams.get('includeUserCount') === 'true';

    // Mock segments data - in real implementation, query from database
    const mockSegments: UserSegment[] = [
      {
        id: 'all_users',
        name: 'All Users',
        description: 'All registered users with notification tokens',
        criteria: {},
        userCount: 8934,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'active_users',
        name: 'Active Users',
        description: 'Users who have been active in the last 30 days',
        criteria: {
          lastActiveAfter: new Date(Date.now() - 2592000000).toISOString()
        },
        userCount: 6251,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'new_users',
        name: 'New Users',
        description: 'Users who registered in the last 7 days',
        criteria: {
          registeredAfter: new Date(Date.now() - 604800000).toISOString()
        },
        userCount: 1283,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'premium_users',
        name: 'Premium Users',
        description: 'Users with premium subscriptions',
        criteria: {
          customAttributes: {
            isPremium: true
          }
        },
        userCount: 2847,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'inactive_users',
        name: 'Inactive Users',
        description: 'Users who haven\'t been active in the last 30 days',
        criteria: {
          lastActiveAfter: new Date(Date.now() - 5184000000).toISOString() // 60 days ago
        },
        userCount: 1456,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'high_engagement',
        name: 'High Engagement Users',
        description: 'Users with high notification engagement rates',
        criteria: {
          engagement: {
            minOpenRate: 40,
            minClickRate: 15
          }
        },
        userCount: 892,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ios_users',
        name: 'iOS Users',
        description: 'Users on iOS devices',
        criteria: {
          platform: 'ios'
        },
        userCount: 3567,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'android_users',
        name: 'Android Users',
        description: 'Users on Android devices',
        criteria: {
          platform: 'android'
        },
        userCount: 5367,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'frequent_buyers',
        name: 'Frequent Buyers',
        description: 'Users with 5 or more orders',
        criteria: {
          customAttributes: {
            minOrders: 5
          }
        },
        userCount: 1234,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'us_users',
        name: 'US Users',
        description: 'Users located in the United States',
        criteria: {
          location: {
            countries: ['US']
          }
        },
        userCount: 4521,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // If includeUserCount is false, remove userCount to improve performance
    const segments = includeUserCount 
      ? mockSegments 
      : mockSegments.map(({ userCount, ...segment }) => segment);

    return NextResponse.json({
      success: true,
      data: {
        segments,
        totalSegments: mockSegments.length
      }
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch segments' 
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications/segments - Create new segment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, criteria } = body;

    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
        { status: 400 }
      );
    }

    if (!criteria || typeof criteria !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Valid criteria object is required' },
        { status: 400 }
      );
    }

    // Calculate user count based on criteria (mock implementation)
    const userCount = await calculateSegmentSize(criteria);

    const segment: UserSegment = {
      id: `segment_${Date.now()}`,
      name,
      description,
      criteria,
      userCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, save to database
    console.log('Segment created:', segment);

    return NextResponse.json({
      success: true,
      data: segment,
      message: 'Segment created successfully'
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create segment' 
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate segment size
async function calculateSegmentSize(criteria: any): Promise<number> {
  // Mock implementation - in real app, query database with criteria
  let baseCount = 8934; // Total users
  
  if (criteria.platform === 'ios') {
    baseCount = Math.floor(baseCount * 0.4); // 40% iOS users
  } else if (criteria.platform === 'android') {
    baseCount = Math.floor(baseCount * 0.6); // 60% Android users
  }
  
  if (criteria.lastActiveAfter) {
    const daysAgo = Math.floor((Date.now() - new Date(criteria.lastActiveAfter).getTime()) / 86400000);
    if (daysAgo <= 7) {
      baseCount = Math.floor(baseCount * 0.8); // 80% active in last week
    } else if (daysAgo <= 30) {
      baseCount = Math.floor(baseCount * 0.7); // 70% active in last month
    } else {
      baseCount = Math.floor(baseCount * 0.3); // 30% active beyond month
    }
  }
  
  if (criteria.registeredAfter) {
    const daysAgo = Math.floor((Date.now() - new Date(criteria.registeredAfter).getTime()) / 86400000);
    if (daysAgo <= 7) {
      baseCount = Math.floor(baseCount * 0.15); // 15% registered in last week
    } else if (daysAgo <= 30) {
      baseCount = Math.floor(baseCount * 0.25); // 25% registered in last month
    }
  }
  
  if (criteria.customAttributes?.isPremium) {
    baseCount = Math.floor(baseCount * 0.32); // 32% premium users
  }
  
  if (criteria.engagement?.minOpenRate) {
    const rate = criteria.engagement.minOpenRate;
    if (rate >= 40) {
      baseCount = Math.floor(baseCount * 0.1); // 10% high engagement
    } else if (rate >= 20) {
      baseCount = Math.floor(baseCount * 0.3); // 30% medium engagement
    }
  }
  
  if (criteria.location?.countries?.includes('US')) {
    baseCount = Math.floor(baseCount * 0.5); // 50% US users
  }
  
  return Math.max(1, baseCount); // Ensure at least 1 user
}
