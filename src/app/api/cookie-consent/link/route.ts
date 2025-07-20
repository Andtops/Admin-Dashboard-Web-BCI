import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId, userId, userEmail, firstName, lastName } = body;

    // Validate required fields
    if (!anonymousId || !userId || !userEmail || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Link anonymous consent to user account
    const result = await convex.mutation(api.cookieConsents.linkAnonymousConsent, {
      anonymousId,
      userId,
      userEmail,
      firstName,
      lastName,
    });

    if (result.success) {
      console.log(`🍪 Successfully linked anonymous consent to user: ${userEmail}`);
      
      // Set cookie to indicate successful linking
      const response = NextResponse.json({
        success: true,
        action: result.action,
        message: result.action === "converted_to_user" 
          ? "Anonymous consent converted to user account"
          : "Anonymous consent linked to existing user consent"
      });

      // Clear the anonymous ID cookie since it's now linked
      response.cookies.set("anonymous_consent_id", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0, // Expire immediately
        path: "/",
      });

      return response;
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to link consent" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error linking anonymous consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}