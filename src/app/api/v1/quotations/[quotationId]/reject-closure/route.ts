import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { Id } from '../../../../../../../convex/_generated/dataModel';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/quotations/[quotationId]/reject-closure
 * Reject permission for thread closure
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;
      const body = await request.json();
      const { userId, userName, reason } = body;

      // Validate required fields
      if (!userId || !userName) {
        return NextResponse.json(
          {
            success: false,
            error: 'User ID and user name are required',
            code: 'MISSING_FIELDS'
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

      // Verify user owns the quotation
      if (quotation.userId !== userId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized: User does not own this quotation',
            code: 'UNAUTHORIZED'
          },
          { status: 403 }
        );
      }

      // Check if thread is in correct state
      if (quotation.threadStatus !== 'awaiting_user_permission') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Thread is not awaiting user permission',
            code: 'INVALID_THREAD_STATE'
          },
          { status: 400 }
        );
      }

      // Reject closure permission
      await convex.mutation(api.quotationMessages.rejectClosureRequest, {
        quotationId,
        userId,
        userName,
        reason: reason || undefined,
      });



      return NextResponse.json({
        success: true,
        data: {
          message: 'Thread closure permission rejected successfully'
        },
        meta: {
          quotationId,
          userId,
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Reject closure permission API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to reject closure permission',
          code: 'REJECT_PERMISSION_FAILED'
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