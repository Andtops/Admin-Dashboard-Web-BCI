import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/v1/products/[id]
 * Retrieve a single product by ID with API key authentication
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey, context: { params: Promise<{ id: string }> }) => {
    try {
      const params = await context.params;
      const { id } = params;

      if (!id) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Product ID is required',
            code: 'MISSING_ID'
          },
          { status: 400 }
        );
      }

      // Get product from Convex by productId
      const product = await convex.query(api.products.getProductByProductId, {
        productId: id,
      });

      if (!product) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Product not found',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }

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

      // Transform product for API response
      const apiProduct = {
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
      };

      const responseData = {
        success: true,
        data: apiProduct,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      };

      
      return NextResponse.json(responseData);

    } catch (error) {
      console.error('Product by ID API error:', error);
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