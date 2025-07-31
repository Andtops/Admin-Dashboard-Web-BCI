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
        const newDraftQuotation = await convex.query(api.quotations.getQuotationById, {
          quotationId: result.quotationId
        });
        
        if (!newDraftQuotation) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to retrieve created draft quotation',
              code: 'DRAFT_RETRIEVAL_ERROR'
            },
            { status: 500 }
          );
        }
        
        draftQuotation = newDraftQuotation;
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
      
      // Create a properly typed line item
      const newLineItem = {
        itemId: newItemId,
        productId: item.productId,
        productName: item.name,
        description: item.description || undefined,
        specifications: item.specifications || undefined,
        quantity: Number(item.quantity || 1),
        unit: item.unit || 'piece',
        unitPrice: 0,
        discount: undefined,
        taxRate: 18,
        lineTotal: 0,
        notes: item.notes || undefined,
        productImage: item.image || undefined
      } as const;

      // Ensure all items in the array are properly typed
      const typedItems = existingItems.map(item => ({
        itemId: item.itemId,
        productId: item.productId,
        productName: item.productName,
        description: item.description ?? undefined,
        specifications: item.specifications ?? undefined,
        quantity: Number(item.quantity ?? 0),
        unit: item.unit,
        unitPrice: Number(item.unitPrice ?? 0),
        discount: item.discount ?? undefined,
        taxRate: Number(item.taxRate ?? 18),
        lineTotal: Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
        notes: item.notes ?? undefined,
        productImage: item.productImage ?? undefined
      }));

      const updatedLineItems = [...typedItems, newLineItem];

      // Always optimize data to prevent size issues - remove large productImage data
      const optimizedItems = updatedLineItems.map(item => ({
        itemId: item.itemId,
        productId: item.productId,
        productName: item.productName.substring(0, 200), // Reasonable limit
        description: item.description ? item.description.substring(0, 500) : undefined,
        specifications: item.specifications ? item.specifications.substring(0, 1000) : undefined,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
        lineTotal: item.lineTotal,
        notes: item.notes ? item.notes.substring(0, 500) : undefined,
        // Remove productImage to prevent size issues - images should be stored separately
        productImage: undefined
      }));

      // Check final payload size
      const payloadSize = JSON.stringify({
        quotationId: draftQuotation._id,
        lineItems: optimizedItems,
        performedBy: userId,
      }).length;
      
      console.log(`ADD item payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MiB`);
      
      if (payloadSize > 900 * 1024) { // 900KB threshold for safety
        console.error('Payload still too large after optimization:', payloadSize);
        return NextResponse.json(
          {
            success: false,
            error: 'Quotation data too large. Please reduce the amount of text in descriptions and specifications.',
            code: 'PAYLOAD_TOO_LARGE'
          },
          { status: 413 }
        );
      }

      await convex.mutation(api.quotations.updateProfessionalQuotation, {
        quotationId: draftQuotation._id,
        lineItems: optimizedItems,
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