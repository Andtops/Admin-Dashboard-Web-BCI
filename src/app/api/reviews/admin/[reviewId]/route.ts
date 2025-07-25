import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { adminEmail } = await request.json();
    const { reviewId } = params;

    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email is required" },
        { status: 400 }
      );
    }

    // Get or create admin
    const adminId = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: adminEmail,
    });

    // Delete review
    await convex.mutation(api.reviews.deleteReview, {
      reviewId: reviewId,
      adminEmail: adminEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}