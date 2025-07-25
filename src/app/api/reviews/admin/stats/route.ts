import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Fetch review statistics from Convex
    const stats = await convex.query(api.reviews.getReviewStats);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching review stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch review statistics" },
      { status: 500 }
    );
  }
}