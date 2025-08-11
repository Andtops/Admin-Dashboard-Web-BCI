import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { withApiKeyAuth } from "@/lib/apiKeyAuth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const GET = withApiKeyAuth(async (request: NextRequest, apiKey) => {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Fetch review summary from Convex
    const summary = await convex.query(api.reviews.getProductReviewSummary, {
      productId,
    });

    return NextResponse.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Error fetching review summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch review summary" },
      { status: 500 }
    );
  }
}, { requiredPermission: "reviews:read" });