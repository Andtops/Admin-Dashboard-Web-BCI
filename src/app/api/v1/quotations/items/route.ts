import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/quotations/items
 * Add item to current draft quotation
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      const { userId, item } = body;

      if (!userId || !item) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User ID and item are required',
            code: 'MISSING_FIELDS'
          },
          { status: 400 }
        );
      }

      // Get current draft quotation for user
      const quotations = await convex.query(api.quotations.getQuotationsByUserId, {
        userId,
        limit: 10,
      });

      let draftQuotation = quotations.quotations.find(q => q.status === 'draft');

      // Create draft if none exists
      if (!draftQuotation) {
        const user = await convex.query(api.users.getUserByUserId, { userId });
        
        if (!user) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'User not found',
              code: 'USER_NOT_FOUND'
            },
            { status: 404 }
          );
        }

        const result = await convex.mutation(api.quotations.createDraftQuotation, {
          userId,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          userPhone: user.phone,
          businessName: user.businessName,
        });

        // Get the newly created quotation
        draftQuotation = await convex.query(api.quotations.getQuotationById, {
          quotationId: result.quotationId
        });
      }

      if (!draftQuotation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create or find draft quotation',
            code: 'DRAFT_ERROR'
          },
          { status: 500 }
        );
      }

      // Add item to line items
      const existingItems = draftQuotation.lineItems || [];
      const newItemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newLineItem = {
        itemId: newItemId,
        productId: item.productId,
        productName: item.name,
        description: item.description || '',
        specifications: item.specifications || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'piece',
        unitPrice: 0,
        taxRate: 18,
        lineTotal: 0,
        notes: item.notes || '',
        productImage: item.image || '', // Store product image
      };

      const updatedLineItems = [...existingItems, newLineItem];

      // Update quotation with new item
      await convex.mutation(api.quotations.updateProfessionalQuotation, {
        quotationId: draftQuotation._id,
        lineItems: updatedLineItems,
        performedBy: userId,
      });

      return NextResponse.json({
        success: true,
        data: {
          itemId: newItemId,
          message: 'Item added to quotation successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Add item to quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add item to quotation',
          code: 'ADD_ITEM_FAILED'
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