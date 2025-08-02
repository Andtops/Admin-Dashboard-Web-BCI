import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * PATCH /api/v1/quotations/draft/metadata
 * Update draft quotation metadata (notes, urgency, etc.)
 */
export const PATCH = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      const { userId, updates } = body;

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

      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Updates object is required',
            code: 'MISSING_UPDATES'
          },
          { status: 400 }
        );
      }

      // Validate urgency value if provided
      if (updates.urgency && !['standard', 'urgent', 'asap'].includes(updates.urgency)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid urgency value. Must be one of: standard, urgent, asap',
            code: 'INVALID_URGENCY'
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

      // Prepare update data
      const updateData: any = {};
      
      if (updates.notes !== undefined) {
        updateData.additionalRequirements = updates.notes;
      }
      
      if (updates.urgency !== undefined) {
        updateData.urgency = updates.urgency;
      }

      // Update the quotation
      await convex.mutation(api.quotations.updateQuotation, {
        quotationId: draftQuotation._id,
        updates: updateData,
        updatedBy: userId,
      });

      // Get updated quotation
      const updatedDraftQuotation = await convex.query(api.quotations.getCurrentDraftQuotation, {
        userId,
      });

      if (!updatedDraftQuotation) {
        throw new Error('Failed to retrieve updated quotation');
      }

      // Transform to frontend format
      const updatedQuotation = {
        id: updatedDraftQuotation._id,
        items: (updatedDraftQuotation.lineItems || []).map(item => ({
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
        notes: updatedDraftQuotation.additionalRequirements || '',
        urgency: updatedDraftQuotation.urgency || 'standard',
      };

      return NextResponse.json({
        success: true,
        data: updatedQuotation,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now(),
          updatedFields: Object.keys(updateData)
        }
      });

    } catch (error) {
      console.error('Update draft quotation metadata API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update draft quotation metadata',
          code: 'UPDATE_FAILED'
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}