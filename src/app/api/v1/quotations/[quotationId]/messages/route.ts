import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { Id } from '../../../../../../../convex/_generated/dataModel';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/quotations/[quotationId]/messages
 * Get messages for a quotation thread
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;

      // Verify quotation exists
      const quotation = await convex.query(api.quotations.getQuotationById, {
        quotationId
      });

      if (!quotation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Quotation not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Get messages for the quotation
      const messages = await convex.query(api.quotationMessages.getQuotationMessages, {
        quotationId
      });

      // Transform messages for API response
      const apiMessages = messages.map(message => ({
        id: message._id,
        quotationId: message.quotationId,
        authorId: message.authorId,
        authorName: message.authorName,
        authorRole: message.authorRole,
        content: message.content,
        messageType: message.messageType,
        isReadByUser: message.isReadByUser,
        isReadByAdmin: message.isReadByAdmin,
        readByUserAt: message.readByUserAt,
        readByAdminAt: message.readByAdminAt,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        isDeleted: message.isDeleted,
        deletedAt: message.deletedAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }));

      return NextResponse.json({
        success: true,
        data: apiMessages,
        meta: {
          quotationId,
          threadStatus: quotation.threadStatus,
          totalMessages: apiMessages.length,
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Get quotation messages API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'quotations:read'
  }
);

/**
 * POST /api/v1/quotations/[quotationId]/messages
 * Send a message in quotation thread
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;
      const body = await request.json();

      // Validate required fields
      if (!body.content || !body.authorId || !body.authorName || !body.authorRole) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Content, authorId, authorName, and authorRole are required',
            code: 'MISSING_FIELDS'
          },
          { status: 400 }
        );
      }

      // Verify quotation exists and thread is active
      const quotation = await convex.query(api.quotations.getQuotationById, {
        quotationId
      });

      if (!quotation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Quotation not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }

      if (quotation.threadStatus === 'closed') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot send message to closed thread',
            code: 'THREAD_CLOSED'
          },
          { status: 400 }
        );
      }

      // Create message
      const messageId = await convex.mutation(api.quotationMessages.createQuotationMessage, {
        quotationId,
        authorId: body.authorId,
        authorName: body.authorName,
        authorRole: body.authorRole,
        content: body.content,
        messageType: body.messageType || 'message',
      });

      return NextResponse.json({
        success: true,
        data: {
          messageId,
          message: 'Message sent successfully'
        },
        meta: {
          quotationId,
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Send quotation message API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send message',
          code: 'SEND_MESSAGE_FAILED'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'quotations:write'
  }
);

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}