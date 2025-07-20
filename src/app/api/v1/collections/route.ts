import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/collections
 * Retrieve collections with API key authentication
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const isVisible = url.searchParams.get('visible') === 'true' ? true : 
                       url.searchParams.get('visible') === 'false' ? false : undefined;

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

      // Get collections from Convex
      const collections = await convex.query(api.collections.getCollections, {
        limit,
        offset,
        search,
        status: status as any,
        isVisible,
      });

      // Transform collections for API response
      const apiCollections = collections.map(collection => ({
        id: collection.collectionId,
        title: collection.title,
        description: collection.description,
        handle: collection.handle,
        image: collection.image,
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
        status: collection.status,
        sortOrder: collection.sortOrder,
        isVisible: collection.isVisible,
        productCount: collection.productCount,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      }));

      return NextResponse.json({
        success: true,
        data: apiCollections,
        pagination: {
          limit,
          offset,
          total: apiCollections.length,
          hasMore: apiCollections.length === limit
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Collections API error:', error);
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
    requiredPermission: 'collections:read'
  }
);

/**
 * POST /api/v1/collections
 * Create a new collection (requires write permission)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ['title', 'handle'];
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

      // Create collection via Convex
      const collectionId = await convex.mutation(api.collections.createCollection, {
        ...body,
        createdBy: apiKey.id, // Use API key ID as creator
      });

      return NextResponse.json({
        success: true,
        data: {
          id: collectionId,
          message: 'Collection created successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create collection API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create collection',
          code: 'CREATE_FAILED'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'collections:write'
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
