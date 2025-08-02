import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/quotations/current
 * Get current draft quotation for a user
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');

      if (!userId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User ID is required',
            code: 'MISSING_USER_ID'
          },
          { status: 400 }
        );
      }

      // Get current draft quotation for user
      const draftQuotation = await convex.query(api.quotations.getCurrentDraftQuotation, {
        userId,
      });

      if (!draftQuotation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No current draft quotation found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Transform to frontend format
      const currentQuotation = {
        id: draftQuotation._id,
        items: (draftQuotation.lineItems || []).map(item => ({
          id: item.itemId,
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          specifications: item.specifications || '',
          notes: item.notes || '',
          category: 'Product',
          image: item.productImage || '',
          price: item.unitPrice || 0
        })),
        status: 'draft' as const,
        notes: draftQuotation.additionalRequirements || '',
        urgency: draftQuotation.urgency || 'standard',
      };

      return NextResponse.json({
        success: true,
        data: currentQuotation,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Get current quotation API error:', error);
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
 * DELETE /api/v1/quotations/current
 * Clear current draft quotation for a user
 */
export const DELETE = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User ID is required',
            code: 'MISSING_USER_ID'
          },
          { status: 400 }
        );
      }

      // Get current draft quotation for user
      const quotations = await convex.query(api.quotations.getQuotationsByUserId, {
        userId,
        limit: 10,
      });

      // Find and delete draft quotations
      const draftQuotations = quotations.quotations.filter(q => q.status === 'draft');

      for (const draft of draftQuotations) {
        await convex.mutation(api.quotations.updateQuotationStatus, {
          quotationId: draft._id,
          status: 'rejected',
          performedBy: 'System',
          notes: 'Draft quotation cleared by user'
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          message: `${draftQuotations.length} draft quotation(s) cleared`
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Clear current quotation API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}