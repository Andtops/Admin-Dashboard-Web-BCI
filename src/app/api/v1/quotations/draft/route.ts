import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/quotations/draft
 * Create a new draft quotation for a user
 */
export const POST = withApiKeyAuth(
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

      // Get user details from database
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

      // Create new draft quotation
      const result = await convex.mutation(api.quotations.createDraftQuotation, {
        userId,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        businessName: user.businessName,
      });

      // Transform to frontend format
      const newQuotation = {
        id: result.quotationId,
        items: [],
        status: 'draft' as const,
        notes: '',
      };

      return NextResponse.json({
        success: true,
        data: newQuotation,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create draft quotation API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create draft quotation',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}