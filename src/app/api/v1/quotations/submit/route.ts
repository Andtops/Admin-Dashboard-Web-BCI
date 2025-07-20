import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';
import { sendNewQuotationNotificationEmail } from '@/lib/quotation-email-service';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/quotations/submit
 * Submit current draft quotation
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      const { userId, notes, urgency } = body;

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
            error: 'No draft quotation found to submit',
            code: 'DRAFT_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      if (!draftQuotation.lineItems || draftQuotation.lineItems.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot submit empty quotation',
            code: 'EMPTY_QUOTATION'
          },
          { status: 400 }
        );
      }

      // Update quotation status to pending and add notes
      await convex.mutation(api.quotations.updateQuotationStatus, {
        quotationId: draftQuotation._id,
        status: 'pending',
        performedBy: userId,
        notes: notes || 'Quotation submitted by customer'
      });

      // Update additional requirements and urgency if provided
      if (notes || urgency) {
        const updatedLineItems = draftQuotation.lineItems || [];
        await convex.mutation(api.quotations.updateProfessionalQuotation, {
          quotationId: draftQuotation._id,
          lineItems: updatedLineItems,
          performedBy: userId,
          adminNotes: notes
        });
      }

      // Update urgency if provided and different from current
      if (urgency && urgency !== draftQuotation.urgency) {
        await convex.mutation(api.quotations.updateQuotationUrgency, {
          quotationId: draftQuotation._id,
          urgency: urgency,
          performedBy: userId
        });
      }

      // Send admin notification email (non-blocking)
      try {
        const quotationData = {
          _id: draftQuotation._id,
          userId: draftQuotation.userId,
          userEmail: draftQuotation.userEmail,
          userName: draftQuotation.userName,
          userPhone: draftQuotation.userPhone,
          businessName: draftQuotation.businessName,
          products: (draftQuotation.lineItems || []).map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity.toString(),
            unit: item.unit,
            specifications: item.specifications || ''
          })),
          additionalRequirements: notes || draftQuotation.additionalRequirements,
          deliveryLocation: draftQuotation.deliveryTerms?.deliveryLocation,
          urgency: urgency || draftQuotation.urgency || 'standard' as const,
          status: 'pending' as const,
          createdAt: draftQuotation.createdAt,
          updatedAt: Date.now()
        };

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
          quotationId: draftQuotation._id,
          quotationNumber: draftQuotation.quotationNumber,
          message: 'Quotation submitted successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Submit quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to submit quotation',
          code: 'SUBMIT_FAILED'
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