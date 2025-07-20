import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/users
 * Retrieve users with API key authentication
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const email = url.searchParams.get('email') || undefined;

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

      let users;

      if (email) {
        // Get specific user by email
        const user = await convex.query(api.users.getUserByEmail, { email });
        users = user ? [user] : [];
      } else {
        // Get users with filters
        users = await convex.query(api.users.getUsers, {
          limit,
          offset,
          search,
          status: status as any,
        });
      }

      // Transform users for API response (remove sensitive fields)
      const apiUsers = users.map(user => ({
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        businessName: user.businessName,
        gstNumber: user.gstNumber,
        isGstVerified: user.isGstVerified,
        status: user.status,
        role: user.role,
        legalNameOfBusiness: user.legalNameOfBusiness,
        tradeName: user.tradeName,
        constitutionOfBusiness: user.constitutionOfBusiness,
        taxpayerType: user.taxpayerType,
        principalPlaceOfBusiness: user.principalPlaceOfBusiness,
        gstStatus: user.gstStatus,
        agreedToEmailMarketing: user.agreedToEmailMarketing,
        agreedToSmsMarketing: user.agreedToSmsMarketing,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      }));

      return NextResponse.json({
        success: true,
        data: email ? (apiUsers[0] || null) : apiUsers,
        pagination: email ? undefined : {
          limit,
          offset,
          total: apiUsers.length,
          hasMore: apiUsers.length === limit
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Users API error:', error);
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
    requiredPermission: 'users:read'
  }
);

/**
 * POST /api/v1/users
 * Create a new user (requires write permission)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ['userId', 'email', 'firstName', 'lastName'];
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

      // Create/update user via Convex
      const userId = await convex.mutation(api.users.upsertUser, {
        userId: body.userId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        businessName: body.businessName,
        gstNumber: body.gstNumber,
        isGstVerified: body.isGstVerified || false,
        legalNameOfBusiness: body.legalNameOfBusiness,
        tradeName: body.tradeName,
        constitutionOfBusiness: body.constitutionOfBusiness,
        taxpayerType: body.taxpayerType,
        principalPlaceOfBusiness: body.principalPlaceOfBusiness,
        gstStatus: body.gstStatus,
        agreedToEmailMarketing: body.agreedToEmailMarketing,
        agreedToSmsMarketing: body.agreedToSmsMarketing,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: userId,
          message: 'User created/updated successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create user API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create user',
          code: 'CREATE_FAILED'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'users:write'
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
