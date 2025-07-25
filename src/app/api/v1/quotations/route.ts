import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';
import { sendNewQuotationNotificationEmail, Quotation } from '@/lib/quotation-email-service';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/quotations
 * Retrieve quotations with API key authentication
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const userId = url.searchParams.get('userId') || undefined;
      const status = url.searchParams.get('status') || undefined;

      // Validate limit
      if (limit > 100) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Limit cannot exceed 100 items per request',
            code: 'INVALID_LIMIT'
          },
          { status: 400 }
        );
      }

      let quotations: any[] = [];

      if (userId) {
        try {
          // Get quotations for specific user
          const result = await convex.query(api.quotations.getQuotationsByUserId, {
            userId,
            limit,
            offset,
          });
          quotations = result.quotations;
        } catch (error) {
          console.error('Error fetching user quotations:', error);
          // Return empty array if there's an error or no quotations found
          quotations = [];
        }
      } else {
        // Get all quotations (admin view)
        quotations = await convex.query(api.quotations.getAllQuotations, {
          limit,
          offset,
          status: status as any,
        });
      }

      // Transform quotations for API response
      const apiQuotations = quotations.map(quotation => ({
        id: quotation._id,
        userId: quotation.userId,
        userEmail: quotation.userEmail,
        userName: quotation.userName,
        userPhone: quotation.userPhone,
        businessName: quotation.businessName,
        products: quotation.products,
        lineItems: quotation.lineItems,
        additionalRequirements: quotation.additionalRequirements,
        deliveryLocation: quotation.deliveryLocation,
        deliveryTerms: quotation.deliveryTerms,
        urgency: quotation.urgency,
        status: quotation.status,
        adminResponse: quotation.adminResponse,
        createdAt: quotation.createdAt,
        updatedAt: quotation.updatedAt,
      }));

      return NextResponse.json({
        success: true,
        data: apiQuotations,
        pagination: {
          limit,
          offset,
          total: apiQuotations.length,
          hasMore: apiQuotations.length === limit
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Quotations API error:', error);
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
 * POST /api/v1/quotations
 * Create a new quotation (requires write permission)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ['userId', 'userEmail', 'userName', 'products'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Missing required field: ${field}`,
              code: 'MISSING_FIELD'
            },
            { status: 400 }
          );
        }
      }

      // Validate products array
      if (!Array.isArray(body.products) || body.products.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Products array is required and must not be empty',
            code: 'INVALID_PRODUCTS'
          },
          { status: 400 }
        );
      }

      // Create quotation via Convex
      const quotationId = await convex.mutation(api.quotations.createQuotation, {
        userId: body.userId,
        userEmail: body.userEmail,
        userName: body.userName,
        userPhone: body.userPhone,
        businessName: body.businessName,
        products: body.products,
        additionalRequirements: body.additionalRequirements,
        deliveryLocation: body.deliveryLocation,
        urgency: body.urgency || 'standard',
      });

      // Send admin notification email (non-blocking)
      try {
        const quotationData = {
          _id: quotationId.quotationNumber,
          userId: body.userId,
          userEmail: body.userEmail,
          userName: body.userName,
          userPhone: body.userPhone,
          businessName: body.businessName,
          products: body.products.map((product: any) => ({
            productId: product.productId,
            productName: product.productName,
            quantity: Number(product.quantity) || 1,
            unit: product.unit || 'pcs',
            specifications: product.specifications
          })),
          lineItems: body.products.map((product: any, index: number) => ({
            itemId: `item_${index + 1}`,
            productId: product.productId,
            productName: product.productName,
            quantity: Number(product.quantity) || 1,
            unit: product.unit || 'pcs',
            unitPrice: Number(product.unitPrice) || 0,
            taxRate: Number(product.taxRate) || 18,
            lineTotal: Number(product.lineTotal) || 0,
            specifications: product.specifications
          })),
          additionalRequirements: body.additionalRequirements,
          deliveryLocation: body.deliveryLocation,
          urgency: body.urgency || 'standard',
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as Quotation;

        await sendNewQuotationNotificationEmail({
          quotation: quotationData,
          adminEmail: process.env.ADMIN_EMAIL || 'admin@benzochem.com',
          adminName: 'Benzochem Admin'
        });
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          id: quotationId,
          message: 'Quotation created successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create quotation',
          code: 'CREATE_FAILED'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
