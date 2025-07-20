import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/analytics/live-visitors
 * Get live visitor data for analytics dashboard
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {

    // Get live visitors data
    const liveVisitors = await convex.query(api.analytics.getLiveVisitors);
    const visitorLocations = await convex.query(api.analytics.getVisitorLocations);

    return NextResponse.json({
        success: true,
        data: {
          liveVisitors: {
            count: liveVisitors?.count || 0,
            visitors: liveVisitors?.visitors || [],
          },
          locations: visitorLocations || [],
          summary: {
            totalOnline: liveVisitors?.count || 0,
            activeLocations: visitorLocations?.length || 0,
            countries: new Set(visitorLocations?.map(l => l.country)).size || 0,
          }
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: new Date().toISOString(),
          refreshRate: "30s",
          dataSource: "real-time",
        }
      });

    } catch (error) {
      console.error("Live visitors API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve live visitor data",
          code: "INTERNAL_ERROR"
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
 * OPTIONS /api/v1/analytics/live-visitors
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}