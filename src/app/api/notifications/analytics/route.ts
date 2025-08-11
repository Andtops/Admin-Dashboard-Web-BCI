import { NextRequest, NextResponse } from 'next/server';

export interface NotificationAnalytics {
  overview: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenueGenerated: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
  campaigns: {
    total: number;
    active: number;
    completed: number;
    scheduled: number;
    draft: number;
  };
  topPerforming: Array<{
    campaignId: string;
    title: string;
    category: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenue: number;
  }>;
  audienceInsights: {
    totalSubscribers: number;
    activeUsers: number;
    newUsers: number;
    platformBreakdown: {
      ios: number;
      android: number;
    };
    engagementByPlatform: {
      ios: {
        openRate: number;
        clickRate: number;
      };
      android: {
        openRate: number;
        clickRate: number;
      };
    };
  };
  timeSeriesData: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  }>;
  deviceMetrics: {
    deliveryFailures: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
  };
}

// GET /api/notifications/analytics - Get notification analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const campaignId = searchParams.get('campaignId');
    const category = searchParams.get('category');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Mock analytics data - in real implementation, query from database
    const analytics: NotificationAnalytics = {
      overview: {
        totalSent: 15420,
        totalDelivered: 15089,
        totalOpened: 3785,
        totalClicked: 567,
        totalConverted: 89,
        deliveryRate: 97.9,
        openRate: 25.1,
        clickRate: 15.0,
        conversionRate: 15.7,
        revenueGenerated: 45230
      },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      campaigns: {
        total: 24,
        active: 3,
        completed: 18,
        scheduled: 2,
        draft: 1
      },
      topPerforming: [
        {
          campaignId: '1',
          title: 'Flash Sale Alert',
          category: 'promotion',
          sent: 2847,
          opened: 805,
          clicked: 176,
          openRate: 28.3,
          clickRate: 21.9,
          conversionRate: 12.5,
          revenue: 15420
        },
        {
          campaignId: '2',
          title: 'Order Confirmation',
          category: 'order',
          sent: 1523,
          opened: 687,
          clicked: 45,
          openRate: 45.1,
          clickRate: 6.5,
          conversionRate: 8.9,
          revenue: 8950
        },
        {
          campaignId: '3',
          title: 'New Product Launch',
          category: 'promotion',
          sent: 3421,
          opened: 1089,
          clicked: 234,
          openRate: 31.8,
          clickRate: 21.5,
          conversionRate: 15.2,
          revenue: 20860
        }
      ],
      categoryPerformance: [
        {
          category: 'order',
          sent: 5420,
          delivered: 5298,
          opened: 2449,
          clicked: 156,
          converted: 89,
          deliveryRate: 97.7,
          openRate: 46.2,
          clickRate: 6.4,
          conversionRate: 57.1,
          revenue: 12450
        },
        {
          category: 'promotion',
          sent: 6847,
          delivered: 6689,
          opened: 1936,
          clicked: 387,
          converted: 45,
          deliveryRate: 97.7,
          openRate: 28.9,
          clickRate: 20.0,
          conversionRate: 11.6,
          revenue: 28750
        },
        {
          category: 'system',
          sent: 2153,
          delivered: 2102,
          opened: 400,
          clicked: 24,
          converted: 2,
          deliveryRate: 97.6,
          openRate: 19.0,
          clickRate: 6.0,
          conversionRate: 8.3,
          revenue: 4030
        },
        {
          category: 'general',
          sent: 1000,
          delivered: 980,
          opened: 245,
          clicked: 18,
          converted: 1,
          deliveryRate: 98.0,
          openRate: 25.0,
          clickRate: 7.3,
          conversionRate: 5.6,
          revenue: 890
        }
      ],
      audienceInsights: {
        totalSubscribers: 8934,
        activeUsers: 6251,
        newUsers: 1283,
        platformBreakdown: {
          ios: 3567,
          android: 5367
        },
        engagementByPlatform: {
          ios: {
            openRate: 28.5,
            clickRate: 16.2
          },
          android: {
            openRate: 22.8,
            clickRate: 14.1
          }
        }
      },
      timeSeriesData: generateTimeSeriesData(startDate, endDate),
      deviceMetrics: {
        deliveryFailures: [
          { reason: 'Invalid token', count: 156, percentage: 47.3 },
          { reason: 'App uninstalled', count: 89, percentage: 27.0 },
          { reason: 'Network error', count: 45, percentage: 13.6 },
          { reason: 'Rate limited', count: 23, percentage: 7.0 },
          { reason: 'Other', count: 17, percentage: 5.1 }
        ],
        responseTime: {
          average: 245,
          p95: 890,
          p99: 1450
        }
      }
    };

    // Apply filters if specified
    if (campaignId) {
      // Filter analytics for specific campaign
      const campaign = analytics.topPerforming.find(c => c.campaignId === campaignId);
      if (campaign) {
        analytics.overview = {
          totalSent: campaign.sent,
          totalDelivered: Math.floor(campaign.sent * 0.98),
          totalOpened: campaign.opened,
          totalClicked: campaign.clicked,
          totalConverted: Math.floor(campaign.clicked * 0.15),
          deliveryRate: 98.0,
          openRate: campaign.openRate,
          clickRate: campaign.clickRate,
          conversionRate: campaign.conversionRate,
          revenueGenerated: campaign.revenue
        };
      }
    }

    if (category) {
      // Filter analytics for specific category
      const categoryData = analytics.categoryPerformance.find(c => c.category === category);
      if (categoryData) {
        analytics.overview = {
          totalSent: categoryData.sent,
          totalDelivered: categoryData.delivered,
          totalOpened: categoryData.opened,
          totalClicked: categoryData.clicked,
          totalConverted: categoryData.converted,
          deliveryRate: categoryData.deliveryRate,
          openRate: categoryData.openRate,
          clickRate: categoryData.clickRate,
          conversionRate: categoryData.conversionRate,
          revenueGenerated: categoryData.revenue
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch analytics' 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate time series data
function generateTimeSeriesData(startDate: Date, endDate: Date) {
  const data = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const sent = Math.floor(Math.random() * 1000) + 500;
    const delivered = Math.floor(sent * (0.95 + Math.random() * 0.05));
    const opened = Math.floor(delivered * (0.2 + Math.random() * 0.15));
    const clicked = Math.floor(opened * (0.1 + Math.random() * 0.1));
    const converted = Math.floor(clicked * (0.1 + Math.random() * 0.1));
    const revenue = converted * (50 + Math.random() * 200);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      sent,
      delivered,
      opened,
      clicked,
      converted,
      revenue: Math.floor(revenue)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
}
