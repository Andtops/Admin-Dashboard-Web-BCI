import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../../convex/_generated/api';
import { getSessionFromRequest } from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * DELETE /api/admin/api-keys/[id]/delete
 * Permanently delete an API key (admin only)
 */
export async function DELETE(
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

    // Delete the API key permanently
    const result = await convex.mutation(api.apiKeys.deleteApiKey, {
      apiKeyId: resolvedParams.id as any,
      deletedBy: session.adminId as any,
      reason: reason || 'Manual deletion via admin panel'
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        deletedBy: session.adminId,
        deletedAt: Date.now(),
        reason: reason || 'Manual deletion via admin panel'
      }
    });

  } catch (error) {
    console.error('API key deletion error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'API key not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete API key',
        code: 'DELETION_FAILED'
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
