import { NextRequest, NextResponse } from 'next/server';

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  category: 'order' | 'promotion' | 'system' | 'general';
  targetAudience: 'all_users' | 'active_users' | 'new_users' | 'premium_users' | 'inactive_users' | 'custom';
  customAudience?: {
    userIds?: string[];
    segments?: string[];
    filters?: {
      platform?: 'ios' | 'android';
      lastActiveAfter?: string;
      registeredAfter?: string;
      hasOrders?: boolean;
      location?: string;
    };
  };
  scheduling: {
    type: 'immediate' | 'scheduled' | 'recurring';
    scheduledFor?: string;
    timezone?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: string;
    };
  };
  content: {
    title: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    actionButtons?: Array<{
      id: string;
      title: string;
      action: string;
    }>;
    customData?: Record<string, any>;
  };
  settings: {
    priority: 'high' | 'normal' | 'low';
    sound?: string;
    vibrationPattern?: number[];
    ttl?: number;
    collapseKey?: string;
    respectQuietHours: boolean;
    respectDoNotDisturb: boolean;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  sentAt?: string;
}

// GET /api/notifications/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // In a real implementation, this would query the database
    // For now, return mock data
    const mockCampaigns: NotificationCampaign[] = [
      {
        id: '1',
        title: 'New Product Launch',
        message: 'Check out our latest chemical products!',
        category: 'promotion',
        targetAudience: 'all_users',
        scheduling: {
          type: 'immediate'
        },
        content: {
          title: 'New Product Launch',
          body: 'Check out our latest chemical products!',
          imageUrl: 'https://example.com/product-image.jpg',
          actionUrl: 'https://app.benzochem.com/products/new'
        },
        settings: {
          priority: 'normal',
          respectQuietHours: true,
          respectDoNotDisturb: true
        },
        status: 'sent',
        analytics: {
          sent: 2847,
          delivered: 2784,
          opened: 698,
          clicked: 89,
          converted: 12,
          failed: 63,
          deliveryRate: 97.8,
          openRate: 25.1,
          clickRate: 12.7,
          conversionRate: 1.7
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin_123',
        sentAt: new Date().toISOString()
      }
    ];

    // Apply filters
    let filteredCampaigns = mockCampaigns;
    
    if (status) {
      filteredCampaigns = filteredCampaigns.filter(c => c.status === status);
    }
    
    if (category) {
      filteredCampaigns = filteredCampaigns.filter(c => c.category === category);
    }
    
    if (search) {
      filteredCampaigns = filteredCampaigns.filter(c => 
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: paginatedCampaigns,
        pagination: {
          page,
          limit,
          total: filteredCampaigns.length,
          totalPages: Math.ceil(filteredCampaigns.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch campaigns' 
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      message,
      category,
      targetAudience,
      customAudience,
      scheduling,
      content,
      settings
    } = body;

    // Validation
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    if (!category || !['order', 'promotion', 'system', 'general'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Valid category is required' },
        { status: 400 }
      );
    }

    if (!targetAudience) {
      return NextResponse.json(
        { success: false, error: 'Target audience is required' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign: NotificationCampaign = {
      id: `campaign_${Date.now()}`,
      title,
      message,
      category,
      targetAudience,
      customAudience,
      scheduling: scheduling || { type: 'immediate' },
      content: content || { title, body: message },
      settings: {
        priority: 'normal',
        respectQuietHours: true,
        respectDoNotDisturb: true,
        ...settings
      },
      status: scheduling?.type === 'scheduled' ? 'scheduled' : 'draft',
      analytics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        failed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin_123' // In real app, get from auth
    };

    // In a real implementation, save to database
    console.log('Campaign created:', campaign);

    return NextResponse.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create campaign' 
      },
      { status: 500 }
    );
  }
}
