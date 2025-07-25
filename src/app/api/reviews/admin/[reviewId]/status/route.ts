import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: NextRequest,
  params: any
) {
  try {
    const { status, moderationReason, moderatedBy } = await request.json();
    const { reviewId } = params.params;

    if (!status || !moderatedBy) {
      return NextResponse.json(
        { error: "Status and moderatedBy are required" },
        { status: 400 }
      );
    }

    // Get or create admin
    const adminId = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: moderatedBy,
    });

    // Update review status
    await convex.mutation(api.reviews.updateReviewStatus, {
      reviewId: reviewId,
      status: status,
      moderatedBy: moderatedBy,
      moderationReason,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating review status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update review status" },
      { status: 500 }
    );
  }
}