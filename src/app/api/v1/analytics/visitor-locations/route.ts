import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface Visitor {
  country: string;
  city: string;
  lastSeen: number;
}

interface LocationData {
  lat: number;
  lng: number;
  count: number;
  country: string;
  city: string;
  visitors: Visitor[];
}

/**
 * GET /api/v1/analytics/visitor-locations
 * Get visitor location data for the globe visualization
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {

    // Get visitor locations
    const visitorLocations = await convex.query(api.analytics.getVisitorLocations);

    // Transform data for globe visualization
    const globeData = visitorLocations?.map((location: LocationData) => ({
      lat: location.lat,
      lng: location.lng,
      count: location.count,
      country: location.country,
      city: location.city,
      visitors: location.visitors.map((visitor: Visitor) => ({
        country: visitor.country,
        city: visitor.city,
        lastSeen: visitor.lastSeen,
        timeAgo: formatTimeAgo(visitor.lastSeen),
      })),
      // Calculate activity level based on most recent visitor
      activityLevel: getActivityLevel(Math.max(...location.visitors.map(v => v.lastSeen))),
      size: Math.max(0.1, Math.min(1, location.count * 0.3)),
      color: getPointColor(Math.max(...location.visitors.map(v => v.lastSeen))),
    })) || [];

    return NextResponse.json({
        success: true,
        data: {
          locations: globeData,
          summary: {
            totalLocations: globeData.length,
            totalVisitors: globeData.reduce((sum, loc) => sum + loc.count, 0),
            countries: new Set(globeData.map(loc => loc.country)).size,
            mostActiveLocation: globeData.sort((a, b) => b.count - a.count)[0] || null,
          }
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: new Date().toISOString(),
          dataSource: "real-time",
          updateFrequency: "30s",
        }
      });

    } catch (error) {
      console.error("Visitor locations API error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve visitor location data",
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

// Helper function to format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return "1d+ ago";
}

// Helper function to get activity level
function getActivityLevel(lastSeen: number): string {
  const now = Date.now();
  const diff = now - lastSeen;
  const minutes = diff / (1000 * 60);
  
  if (minutes < 5) return "very_recent";
  if (minutes < 15) return "recent";
  if (minutes < 60) return "somewhat_recent";
  return "older";
}

// Helper function to get point color based on recency
function getPointColor(lastSeen: number): string {
  const now = Date.now();
  const diff = now - lastSeen;
  const minutes = diff / (1000 * 60);
  
  if (minutes < 5) return "#22c55e"; // Green - very recent
  if (minutes < 15) return "#eab308"; // Yellow - recent
  if (minutes < 60) return "#f97316"; // Orange - somewhat recent
  return "#ef4444"; // Red - older
}

/**
 * OPTIONS /api/v1/analytics/visitor-locations
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