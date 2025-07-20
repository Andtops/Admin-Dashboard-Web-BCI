import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/collections/init
 * Initialize basic collections (powder, liquid, etc.)
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      // Check if collections already exist
      const existingCollections = await convex.query(api.collections.getCollections, {
        limit: 100,
        offset: 0,
      });

      if (existingCollections.length > 0) {
        return NextResponse.json({
          success: true,
          message: `Collections already exist (${existingCollections.length} found)`,
          data: existingCollections.map(c => ({ id: c.collectionId, title: c.title }))
        });
      }

      // Create basic collections
      const basicCollections = [
        {
          collectionId: "powder",
          title: "Powder",
          description: "Powder chemical products for various industrial applications",
          handle: "powder",
          status: "active" as const,
          sortOrder: 1,
          isVisible: true,
        },
        {
          collectionId: "liquid",
          title: "Liquid",
          description: "Liquid chemical solutions and compounds",
          handle: "liquid",
          status: "active" as const,
          sortOrder: 2,
          isVisible: true,
        },
        {
          collectionId: "organic-chemicals",
          title: "Organic Chemicals",
          description: "Organic compounds and derivatives",
          handle: "organic-chemicals",
          status: "active" as const,
          sortOrder: 3,
          isVisible: true,
        },
        {
          collectionId: "inorganic-chemicals",
          title: "Inorganic Chemicals",
          description: "Inorganic compounds, salts, and minerals",
          handle: "inorganic-chemicals",
          status: "active" as const,
          sortOrder: 4,
          isVisible: true,
        },
        {
          collectionId: "pharmaceutical-intermediates",
          title: "Pharmaceutical Intermediates",
          description: "Chemical intermediates for pharmaceutical synthesis",
          handle: "pharmaceutical-intermediates",
          status: "active" as const,
          sortOrder: 5,
          isVisible: true,
        },
      ];

      const createdCollections = [];

      for (const collection of basicCollections) {
        try {
          const collectionId = await convex.mutation(api.collections.createCollection, {
            ...collection,
            adminId: apiKey.id as any, // Use API key ID as admin ID
          });
          createdCollections.push({ id: collection.collectionId, title: collection.title, dbId: collectionId });
        } catch (error) {
          console.error(`Failed to create collection ${collection.collectionId}:`, error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdCollections.length} collections`,
        data: createdCollections
      });

    } catch (error) {
      console.error('Initialize collections error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to initialize collections',
          details: error instanceof Error ? error.message : 'Unknown error'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}