import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET /api/v1/quotations/messages - Get messages for a quotation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('quotationId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!quotationId) {
      return NextResponse.json({
        success: false,
        error: "quotationId is required"
      }, { status: 400 });
    }

    const messages = await convex.query(api.quotationMessages.getQuotationMessages, {
      quotationId: quotationId as Id<"quotations">,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error("Error fetching quotation messages:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch messages"
    }, { status: 500 });
  }
}

// POST /api/v1/quotations/messages - Create a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quotationId, authorId, authorName, authorRole, content, messageType } = body;

    if (!quotationId || !authorId || !authorName || !authorRole || !content) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 });
    }

    if (!['user', 'admin'].includes(authorRole)) {
      return NextResponse.json({
        success: false,
        error: "Invalid author role"
      }, { status: 400 });
    }

    const messageId = await convex.mutation(api.quotationMessages.createQuotationMessage, {
      quotationId: quotationId as Id<"quotations">,
      authorId,
      authorName,
      authorRole,
      content,
      messageType: messageType || "message",
    });

    return NextResponse.json({
      success: true,
      data: { messageId }
    });

  } catch (error) {
    console.error("Error creating quotation message:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create message"
    }, { status: 500 });
  }
}