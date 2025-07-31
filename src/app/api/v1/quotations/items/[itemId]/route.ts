import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * PATCH /api/v1/quotations/items/[itemId]
 * Update item in current draft quotation
 */
export const PATCH = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ itemId: string }> }) => {
    try {
      const resolvedParams = await params;
      const itemId = resolvedParams.itemId;
      const body = await request.json();
      const { userId, updates } = body;

      console.log(`Admin API: Updating item ${itemId} for user ${userId} with updates:`, updates);

      if (!userId || !updates) {
        return NextResponse.json(
          {
            success: false,
            error: 'User ID and updates are required',
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

      console.log(`Found ${quotations.quotations.length} quotations for user ${userId}`);

      const draftQuotation = quotations.quotations.find(q => q.status === 'draft');

      if (!draftQuotation) {
        console.log('No draft quotation found, checking all quotations:', quotations.quotations.map(q => ({ id: q._id, status: q.status })));
        return NextResponse.json(
          {
            success: false,
            error: 'No draft quotation found',
            code: 'DRAFT_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      console.log(`Found draft quotation: ${draftQuotation._id}, has lineItems: ${!!draftQuotation.lineItems}, has products: ${!!draftQuotation.products}`);

      // Find and update the item
      let existingItems = draftQuotation.lineItems || [];
      let itemIndex = existingItems.findIndex(item => item.itemId === itemId);

      console.log(`Looking for item ${itemId} in lineItems (${existingItems.length} items)`);

      // If not found in lineItems, check if this is a legacy quotation with products
      if (itemIndex === -1 && draftQuotation.products && draftQuotation.products.length > 0) {
        console.log(`Converting ${draftQuotation.products.length} legacy products to lineItems`);
        // Convert legacy products to lineItems format
        existingItems = draftQuotation.products.map((product: any, index: number) => ({
          itemId: product.productId || `item_${index}`,
          productId: product.productId,
          productName: product.productName,
          description: product.description || undefined,
          specifications: product.specifications || undefined,
          quantity: Number(product.quantity || 1),
          unit: product.unit || 'piece',
          unitPrice: Number(product.unitPrice || 0),
          discount: undefined,
          taxRate: 18,
          lineTotal: Number(product.unitPrice || 0) * Number(product.quantity || 1),
          notes: product.notes || undefined,
          productImage: product.productImage || undefined
        }));

        console.log(`Converted items:`, existingItems.map(item => ({ itemId: item.itemId, productId: item.productId })));

        // Try to find the item again using productId as itemId
        itemIndex = existingItems.findIndex(item => item.itemId === itemId || item.productId === itemId);
        console.log(`Item index after conversion: ${itemIndex}`);
      }

      if (itemIndex === -1) {
        console.log(`Item ${itemId} not found in quotation. Available items:`, existingItems.map(item => ({ itemId: item.itemId, productId: item.productId })));
        return NextResponse.json(
          {
            success: false,
            error: 'Item not found in quotation',
            code: 'ITEM_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Update the item
      const currentItem = existingItems[itemIndex];

      // Ensure numeric values
      const newUnitPrice = Number(updates.unitPrice ?? currentItem.unitPrice ?? 0);
      const newQuantity = Number(updates.quantity ?? currentItem.quantity ?? 0);
      const taxRate = Number(currentItem.taxRate ?? 18); // Default GST rate if not set

      // Create a properly typed line item
      const updatedItem = {
        itemId: currentItem.itemId,
        productId: currentItem.productId,
        productName: currentItem.productName,
        description: updates.description ?? currentItem.description,
        specifications: updates.specifications ?? currentItem.specifications,
        quantity: newQuantity,
        unit: currentItem.unit,
        unitPrice: newUnitPrice,
        discount: updates.discount ?? currentItem.discount,
        taxRate,
        lineTotal: newUnitPrice * newQuantity,
        notes: updates.notes ?? currentItem.notes,
        productImage: updates.productImage ?? currentItem.productImage
      };

      // Ensure all items in the array are properly typed
      const typedItems = existingItems.map((item, idx) => {
        if (idx === itemIndex) {
          return updatedItem;
        }
        return {
          itemId: item.itemId,
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          specifications: item.specifications,
          quantity: Number(item.quantity ?? 0),
          unit: item.unit,
          unitPrice: Number(item.unitPrice ?? 0),
          discount: item.discount,
          taxRate: Number(item.taxRate ?? 18),
          lineTotal: Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
          notes: item.notes,
          productImage: item.productImage
        };
      });

      // Update quotation with modified items
      await convex.mutation(api.quotations.updateProfessionalQuotation, {
        quotationId: draftQuotation._id,
        lineItems: typedItems,
        performedBy: userId,
      });

      return NextResponse.json({
        success: true,
        data: {
          itemId,
          message: 'Item updated successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Update quotation item API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update quotation item',
          code: 'UPDATE_ITEM_FAILED'
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
 * DELETE /api/v1/quotations/items/[itemId]
 * Remove item from current draft quotation
 */
export const DELETE = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ itemId: string }> }) => {
    try {
      const resolvedParams = await params;
      const itemId = resolvedParams.itemId;
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

      const draftQuotation = quotations.quotations.find(q => q.status === 'draft');

      if (!draftQuotation) {
        return NextResponse.json(
          {
            success: false,
            error: 'No draft quotation found',
            code: 'DRAFT_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Remove the item
      let existingItems = draftQuotation.lineItems || [];

      // If no lineItems, check if this is a legacy quotation with products
      if (existingItems.length === 0 && draftQuotation.products && draftQuotation.products.length > 0) {
        // Convert legacy products to lineItems format
        existingItems = draftQuotation.products.map((product: any, index: number) => ({
          itemId: product.productId || `item_${index}`,
          productId: product.productId,
          productName: product.productName,
          description: product.description || undefined,
          specifications: product.specifications || undefined,
          quantity: Number(product.quantity || 1),
          unit: product.unit || 'piece',
          unitPrice: Number(product.unitPrice || 0),
          discount: undefined,
          taxRate: 18,
          lineTotal: Number(product.unitPrice || 0) * Number(product.quantity || 1),
          notes: product.notes || undefined,
          productImage: product.productImage || undefined
        }));
      }

      const filteredItems = existingItems.filter(item => item.itemId !== itemId && item.productId !== itemId);

      if (existingItems.length === filteredItems.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'Item not found in quotation',
            code: 'ITEM_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Ensure all remaining items have proper types
      const typedItems = filteredItems.map(item => ({
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

      // Update quotation with remaining items
      await convex.mutation(api.quotations.updateProfessionalQuotation, {
        quotationId: draftQuotation._id,
        lineItems: typedItems,
        performedBy: userId,
      });

      return NextResponse.json({
        success: true,
        data: {
          itemId,
          message: 'Item removed successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Remove quotation item API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove quotation item',
          code: 'REMOVE_ITEM_FAILED'
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
      'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}