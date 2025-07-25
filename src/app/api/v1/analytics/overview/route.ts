import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/analytics/overview
 * Get overview analytics data
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      // Convert date strings to timestamps if provided
      const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
      const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;

      // Validate dates
      if (startDate && isNaN(startTimestamp!)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid start_date format. Use ISO 8601 format (YYYY-MM-DD)',
            code: 'INVALID_DATE'
          },
          { status: 400 }
        );
      }

      if (endDate && isNaN(endTimestamp!)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid end_date format. Use ISO 8601 format (YYYY-MM-DD)',
            code: 'INVALID_DATE'
          },
          { status: 400 }
        );
      }

      // Get analytics data from multiple sources
      const [
        productStats,
        collectionStats,
        userStats,
        apiKeyStats,
        activityStats
      ] = await Promise.all([
        convex.query(api.products.getProductStats, {}),
        convex.query(api.collections.getCollectionStats, {}),
        convex.query(api.users.getUserStats, {}),
        convex.query(api.apiKeys.getApiKeyStats, {}),
        convex.query(api.apiKeys.getActivityLogStats, {
          startDate: startTimestamp,
          endDate: endTimestamp
        })
      ]);

      const analyticsData = {
        overview: {
          products: {
            total: productStats.total,
            active: productStats.active,
            featured: productStats.featured,
            recentlyAdded: productStats.recentlyAdded
          },
          collections: {
            total: collectionStats.total,
            active: collectionStats.active,
            visible: collectionStats.visible,
            totalProducts: collectionStats.totalProducts
          },
          users: {
            total: userStats.total,
            approved: userStats.approved,
            pending: userStats.pending,
            recentRegistrations: userStats.recentRegistrations
          },
          apiKeys: {
            total: apiKeyStats.total,
            active: apiKeyStats.active,
            totalUsage: apiKeyStats.totalUsage,
            recentlyUsed: apiKeyStats.recentlyUsed
          },
          activity: {
            total: activityStats.total,
            recent: activityStats.recentActivity,
            byEntityType: activityStats.byEntityType,
            byPerformerType: activityStats.byPerformerType
          }
        },
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          startTimestamp: startTimestamp || null,
          endTimestamp: endTimestamp || null
        },
        generatedAt: Date.now()
      };

      return NextResponse.json({
        success: true,
        data: analyticsData,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Analytics overview API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to retrieve analytics data',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'analytics:read'
  }
);

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
