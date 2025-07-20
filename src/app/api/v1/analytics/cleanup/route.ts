import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/analytics/cleanup
 * Clean up old visitor sessions (admin only)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      // Run cleanup
      const result = await convex.mutation(api.analytics.cleanupOldSessions);

      return NextResponse.json({
        success: true,
        data: {
          deletedSessions: result.deletedSessions,
          cleanupTime: new Date().toISOString(),
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: new Date().toISOString(),
          operation: "cleanup_old_sessions",
        }
      });

    } catch (error) {
      console.error("Analytics cleanup API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cleanup old sessions",
          code: "INTERNAL_ERROR"
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'analytics:write'
  }
);

/**
 * GET /api/v1/analytics/cleanup
 * Get cleanup status and information
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      return NextResponse.json({
        success: true,
        data: {
          cleanupPolicy: {
            retentionPeriod: "24 hours",
            cleanupFrequency: "Manual or scheduled",
            description: "Visitor sessions older than 24 hours are automatically removed",
          },
          endpoint: "/api/v1/analytics/cleanup",
          methods: ["GET", "POST"],
          permissions: {
            read: "analytics:read",
            cleanup: "analytics:write",
          }
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: new Date().toISOString(),
        }
      });

    } catch (error) {
      console.error("Analytics cleanup info API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get cleanup information",
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
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}