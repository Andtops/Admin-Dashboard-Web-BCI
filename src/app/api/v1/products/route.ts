import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/products
 * Retrieve products with API key authentication
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const featured = url.searchParams.get('featured') === 'true' ? true : undefined;
      const collection = url.searchParams.get('collection') || undefined;

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

      // Get products from Convex
      const products = await convex.query(api.products.getProducts, {
        limit,
        offset,
        search,
        status: status as any,
        featured,
        collection,
      });

      // Get all collections to map IDs to titles
      const allCollections = await convex.query(api.collections.getCollections, {
        limit: 1000, // Get all collections
        offset: 0,
      });

      // Create a map of collection ID to title
      const collectionMap = new Map();
      allCollections.forEach(collection => {
        collectionMap.set(collection.collectionId, collection.title);
      });

      // Transform products for API response (remove internal fields)
      const apiProducts = products.map(product => ({
        id: product.productId,
        title: product.title,
        description: product.description,
        tags: product.tags,
        quantity: product.quantity, // Include available quantity for sale
        collections: product.collections.map(collectionId => 
          collectionMap.get(collectionId) || collectionId
        ),
        images: product.images,
        priceRange: product.priceRange,
        // Chemical-specific fields
        purity: product.purity,
        packaging: product.packaging,
        casNumber: product.casNumber,
        hsnNumber: product.hsnNumber,
        molecularFormula: product.molecularFormula,
        molecularWeight: product.molecularWeight,
        appearance: product.appearance,
        solubility: product.solubility,
        phValue: product.phValue,
        chemicalName: product.chemicalName,
        features: product.features,
        applications: product.applications,
        applicationDetails: product.applicationDetails,
        status: product.status,
        featured: product.featured,
        totalInventory: product.totalInventory,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      const responseData = {
        success: true,
        data: apiProducts,
        pagination: {
          limit,
          offset,
          total: apiProducts.length,
          hasMore: apiProducts.length === limit
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      };

      
      return NextResponse.json(responseData);

    } catch (error) {
      console.error('Products API error:', error);
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
    requiredPermission: 'products:read'
  }
);

/**
 * POST /api/v1/products
 * Create a new product (requires write permission)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ['title', 'description', 'priceRange'];
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

      // Create product via Convex
      const productId = await convex.mutation(api.products.createProduct, {
        ...body,
        createdBy: apiKey.id, // Use API key ID as creator
      });

      return NextResponse.json({
        success: true,
        data: {
          id: productId,
          message: 'Product created successfully'
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create product API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create product',
          code: 'CREATE_FAILED'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'products:write'
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
