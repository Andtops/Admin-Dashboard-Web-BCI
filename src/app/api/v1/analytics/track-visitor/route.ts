import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/analytics/track-visitor
 * Track visitor activity for analytics (public endpoint - no API key required)
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📊 Analytics tracking request received");
    
    const body = await request.json();
    console.log("📊 Request body:", body);
    
    // Get IP address from request
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
    console.log("📊 IP address:", ip);
    
    // Get user agent
    const userAgent = request.headers.get("user-agent") || undefined;
    
    // Validate required fields
    if (!body.sessionId || !body.page) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: sessionId and page are required",
          code: "VALIDATION_ERROR"
        },
        { status: 400 }
      );
    }

    // Get location data if not provided
    let locationData = {
      country: body.country || "Unknown",
      city: body.city || "Unknown",
      latitude: body.latitude || null,
      longitude: body.longitude || null,
    };

    // If no location data provided, try to get it from IP
    if (locationData.country === "Unknown" && ip !== "unknown") {
      try {
        console.log("🌍 Getting location from IP:", ip);
        // Use ipapi.co for IP geolocation
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          locationData = {
            country: geoData.country_name || "Unknown",
            city: geoData.city || "Unknown",
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
          };
          console.log("🌍 Location data from IP:", locationData);
        }
      } catch (error) {
        console.warn("Failed to get IP geolocation:", error);
      }
    }

    console.log("📊 Tracking visitor with Convex...");
    console.log("📊 Convex URL:", process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Track the visitor using Convex
    const trackingData: any = {
      sessionId: body.sessionId,
      ipAddress: ip,
      userAgent: userAgent,
      country: locationData.country,
      city: locationData.city,
      page: body.page,
      referrer: body.referrer,
    };

    // Only include latitude/longitude if they are valid numbers
    if (typeof locationData.latitude === 'number' && !isNaN(locationData.latitude)) {
      trackingData.latitude = locationData.latitude;
    }
    if (typeof locationData.longitude === 'number' && !isNaN(locationData.longitude)) {
      trackingData.longitude = locationData.longitude;
    }

    console.log("📊 Final tracking data:", trackingData);

    const result = await convex.mutation(api.analytics.trackVisitor, trackingData);

    console.log("✅ Visitor tracked successfully:", result);

    const response = NextResponse.json({
      success: true,
      data: {
        sessionId: body.sessionId,
        tracked: true,
        location: locationData,
        convexResult: result,
      },
      meta: {
        timestamp: new Date().toISOString(),
        ip: ip,
        source: "user-frontend",
      }
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error("��� Visitor tracking API error:", error);
    const err = error as Error;
    console.error("❌ Error details:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to track visitor",
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/v1/analytics/track-visitor
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET /api/v1/analytics/track-visitor
 * Get tracking information (for testing)
 */
export async function GET() {
  const response = NextResponse.json({
    success: true,
    data: {
      endpoint: "/api/v1/analytics/track-visitor",
      method: "POST",
      description: "Track visitor activity for analytics",
      requiredFields: ["sessionId", "page"],
      optionalFields: ["country", "city", "latitude", "longitude", "referrer"],
    },
    meta: {
      timestamp: new Date().toISOString(),
    }
  });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}