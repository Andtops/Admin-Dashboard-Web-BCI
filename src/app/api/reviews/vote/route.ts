import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const {
      reviewId,
      userId,
      userEmail,
      voteType,
      ipAddress,
    } = await request.json();

    // Validate required fields
    if (!reviewId || !userId || !userEmail || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate vote type
    if (!["helpful", "unhelpful"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Submit vote to Convex
    const result = await convex.mutation(api.reviews.voteOnReview, {
      reviewId: reviewId as any,
      userId,
      userEmail,
      voteType,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Error voting on review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to vote on review" },
      { status: 500 }
    );
  }
}, { requiredPermission: "reviews:write" });