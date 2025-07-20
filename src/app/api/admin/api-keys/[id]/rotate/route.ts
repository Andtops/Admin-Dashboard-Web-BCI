import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { getSessionFromRequest } from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/admin/api-keys/[id]/rotate
 * Rotate an API key (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Verify admin session
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    // Validate API key ID format
    if (!resolvedParams.id || !resolvedParams.id.startsWith('j')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid API key ID format',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Rotate the API key
    const rotationResult = await convex.mutation(api.apiKeys.rotateApiKey, {
      apiKeyId: resolvedParams.id as any,
      rotatedBy: session.adminId as any,
      reason: reason || 'Manual rotation via admin panel'
    });

    return NextResponse.json({
      success: true,
      data: {
        ...rotationResult,
        message: 'API key rotated successfully. Please update your applications with the new key.'
      },
      warning: 'The old API key is now invalid. Make sure to update all applications using this key.',
      meta: {
        rotatedBy: session.adminId,
        rotatedAt: Date.now(),
        reason: reason || 'Manual rotation via admin panel'
      }
    });

  } catch (error) {
    console.error('API key rotation error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'API key not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('inactive')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot rotate inactive API key',
            code: 'INVALID_STATE'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to rotate API key',
        code: 'ROTATION_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
