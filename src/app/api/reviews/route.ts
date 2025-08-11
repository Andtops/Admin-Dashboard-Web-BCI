import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const {
      productId,
      userId,
      userEmail,
      userName,
      rating,
      title,
      content,
      isVerifiedPurchase,
      orderReference,
      ipAddress,
      userAgent,
    } = await request.json();

    // Validate required fields
    if (!productId || !userId || !userEmail || !userName || !rating || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create review using Convex (auto-approved)
    const review = await convex.mutation(api.reviews.createReview, {
      productId,
      userId,
      userEmail,
      userName,
      rating: Number(rating),
      title,
      content,
      isVerifiedPurchase: Boolean(isVerifiedPurchase),
      orderReference,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create review" },
      { status: 500 }
    );
  }
}, { requiredPermission: "reviews:write" });