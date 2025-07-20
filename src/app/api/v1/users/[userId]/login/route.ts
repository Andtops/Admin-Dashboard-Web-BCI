import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * PATCH /api/v1/users/[userId]/login
 * Update user's last login timestamp
 */
export const PATCH = withApiKeyAuth(
  async (request: NextRequest, apiKey, context: { params: Promise<{ userId: string }> }) => {
    try {
      const params = await context.params;
      const { userId } = params;

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

      // Get user by userId first
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

      // Update last login timestamp
      await convex.mutation(api.users.updateLastLogin, { userId: user._id });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Login timestamp updated successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Update login API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update login timestamp',
          code: 'UPDATE_FAILED'
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}