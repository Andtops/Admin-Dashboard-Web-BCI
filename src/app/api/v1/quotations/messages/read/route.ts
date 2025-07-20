import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// POST /api/v1/quotations/messages/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotationId, readerRole, messageIds } = body;

    if (!quotationId || !readerRole) {
      return NextResponse.json({
        success: false,
        error: "quotationId and readerRole are required"
      }, { status: 400 });
    }

    if (!['user', 'admin'].includes(readerRole)) {
      return NextResponse.json({
        success: false,
        error: "Invalid reader role"
      }, { status: 400 });
    }

    const markedCount = await convex.mutation(api.quotationMessages.markMessagesAsRead, {
      quotationId: quotationId as Id<"quotations">,
      readerRole,
      messageIds: messageIds ? messageIds.map((id: string) => id as Id<"quotationMessages">) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: { markedCount }
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark messages as read"
    }, { status: 500 });
  }
}