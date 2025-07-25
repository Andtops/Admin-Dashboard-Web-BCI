import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { content, isPublic, respondedBy } = await request.json();
    const { reviewId } = params;

    if (!content || !respondedBy) {
      return NextResponse.json(
        { error: "Content and respondedBy are required" },
        { status: 400 }
      );
    }

    // Get or create admin
    const adminId = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: respondedBy,
    });

    // Add admin response
    await convex.mutation(api.reviews.addAdminResponse, {
      reviewId: reviewId,
      content,
      respondedBy: respondedBy,
      isPublic: isPublic ?? true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error adding admin response:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add admin response" },
      { status: 500 }
    );
  }
}

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

    // Delete admin response
    await convex.mutation(api.reviews.deleteAdminResponse, {
      reviewId: reviewId,
      adminEmail: adminEmail,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting admin response:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admin response" },
      { status: 500 }
    );
  }
}