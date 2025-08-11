import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const {
      reviewId,
      reportedBy,
      reporterEmail,
      reason,
      description,
      ipAddress,
    } = await request.json();

    // Validate required fields
    if (!reviewId || !reportedBy || !reporterEmail || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      "spam",
      "inappropriate_content",
      "fake_review",
      "offensive_language",
      "irrelevant",
      "personal_information",
      "other"
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 }
      );
    }

    // Submit report to Convex
    const result = await convex.mutation(api.reviews.reportReview, {
      reviewId: reviewId as any,
      reportedBy,
      reporterEmail,
      reason,
      description,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Error reporting review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to report review" },
      { status: 500 }
    );
  }
}, { requiredPermission: "reviews:write" });