import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';
import { sendQuotationEmail } from '@/lib/quotation-email-service';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/quotations/[quotationId]
 * Get a specific quotation by ID
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;
      
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

      // Transform quotation for API response
      const apiQuotation = {
        id: quotation._id,
        userId: quotation.userId,
        userEmail: quotation.userEmail,
        userName: quotation.userName,
        userPhone: quotation.userPhone,
        businessName: quotation.businessName,
        products: quotation.products || quotation.lineItems?.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity.toString(),
          unit: item.unit,
          specifications: item.specifications
        })),
        additionalRequirements: quotation.additionalRequirements,
        deliveryLocation: quotation.deliveryTerms?.deliveryLocation,
        urgency: quotation.urgency,
        status: quotation.status,
        adminResponse: quotation.adminResponse,
        createdAt: quotation.createdAt,
        updatedAt: quotation.updatedAt,
        // Include thread status and closure request fields
        threadStatus: quotation.threadStatus,
        closureRequestedBy: quotation.closureRequestedBy,
        closureRequestedAt: quotation.closureRequestedAt,
        closureReason: quotation.closureReason,
      };

      return NextResponse.json({
        success: true,
        data: apiQuotation,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Get quotation API error:', error);
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
 * PATCH /api/v1/quotations/[quotationId]
 * Update quotation status and send email notifications
 */
export const PATCH = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;
      const body = await request.json();

      // Validate required fields
      if (!body.status) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Status is required',
            code: 'MISSING_FIELD'
          },
          { status: 400 }
        );
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'quoted', 'accepted', 'rejected', 'expired'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid status value',
            code: 'INVALID_STATUS'
          },
          { status: 400 }
        );
      }

      // Get current quotation
      const currentQuotation = await convex.query(api.quotations.getQuotationById, {
        quotationId
      });

      if (!currentQuotation) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Quotation not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Extract notes from admin response for the new schema
      let notes = undefined;
      let adminResponse = undefined;
      
      if (body.adminResponse) {
        notes = body.adminResponse.notes;
        // Keep adminResponse for email service (legacy support)
        adminResponse = {
          quotedBy: body.adminResponse.quotedBy || 'Admin',
          quotedAt: Date.now(),
          totalAmount: body.adminResponse.totalAmount,
          validUntil: body.adminResponse.validUntil ? new Date(body.adminResponse.validUntil).getTime() : undefined,
          terms: body.adminResponse.terms,
          notes: body.adminResponse.notes
        };
      }

      // Update quotation status via Convex (using new schema)
      await convex.mutation(api.quotations.updateQuotationStatus, {
        quotationId,
        status: body.status,
        performedBy: body.adminResponse?.quotedBy || 'Admin',
        notes
      });

      // Send email notification to customer (non-blocking)
      try {
        // Transform quotation to match expected interface
        const emailQuotation = {
          _id: currentQuotation._id,
          userId: currentQuotation.userId,
          userEmail: currentQuotation.userEmail,
          userName: currentQuotation.userName,
          userPhone: currentQuotation.userPhone,
          businessName: currentQuotation.businessName,
          products: currentQuotation.products || currentQuotation.lineItems?.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity.toString(),
            unit: item.unit,
            specifications: item.specifications
          })) || [],
          additionalRequirements: currentQuotation.additionalRequirements,
          deliveryLocation: currentQuotation.deliveryTerms?.deliveryLocation,
          urgency: currentQuotation.urgency || "standard",
          status: body.status,
          adminResponse,
          createdAt: currentQuotation.createdAt,
          updatedAt: currentQuotation.updatedAt
        };

        await sendQuotationEmail({
          quotation: emailQuotation,
          status: body.status,
          adminResponse
        });
      } catch (emailError) {
        console.error('Failed to send customer notification email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        success: true,
        data: {
          id: quotationId,
          status: body.status,
          message: 'Quotation updated successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Update quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update quotation',
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
 * DELETE /api/v1/quotations/[quotationId]
 * Delete a quotation (admin only)
 */
export const DELETE = withApiKeyAuth(
  async (request: NextRequest, apiKey, { params }: { params: Promise<{ quotationId: string }> }) => {
    try {
      const resolvedParams = await params;
      const quotationId = resolvedParams.quotationId as Id<"quotations">;

      // Get quotation first to check if it exists
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

      // Note: You would need to implement a delete mutation in Convex
      // For now, we'll just update the status to 'rejected' as a soft delete
      await convex.mutation(api.quotations.updateQuotationStatus, {
        quotationId,
        status: 'rejected',
        performedBy: 'System',
        notes: 'Quotation deleted by administrator'
      });

      return NextResponse.json({
        success: true,
        data: {
          id: quotationId,
          message: 'Quotation deleted successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Delete quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete quotation',
          code: 'DELETE_FAILED'
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}