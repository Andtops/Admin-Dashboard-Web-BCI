import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../../convex/_generated/api';
import { Id } from '../../../../../../../../convex/_generated/dataModel';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/quotations/[quotationId]/messages/read
 * Mark messages as read for a quotation thread
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;
      const body = await request.json();

      // Validate required fields
      if (!body.readerRole) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Reader role is required',
            code: 'MISSING_READER_ROLE'
          },
          { status: 400 }
        );
      }

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

      // Mark messages as read
      await convex.mutation(api.quotationMessages.markMessagesAsRead, {
        quotationId,
        readerRole: body.readerRole,
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Messages marked as read successfully'
        },
        meta: {
          quotationId,
          readerRole: body.readerRole,
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Mark messages as read API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to mark messages as read',
          code: 'MARK_READ_FAILED'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}