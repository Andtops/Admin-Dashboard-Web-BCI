import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

/**
 * GET /api/v1/webhooks
 * List webhook configurations
 */
export const GET = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      // For now, return a placeholder response
      // In a real implementation, you would fetch webhook configurations from the database
      const webhooks = [
        {
          id: 'webhook_1',
          url: 'https://example.com/webhook',
          events: ['product.created', 'product.updated', 'product.deleted'],
          isActive: true,
          secret: 'whsec_****',
          createdAt: Date.now() - 86400000,
          lastTriggered: Date.now() - 3600000
        }
      ];

      return NextResponse.json({
        success: true,
        data: webhooks,
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Webhooks list API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to retrieve webhooks',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'webhooks:read'
  }
);

/**
 * POST /api/v1/webhooks
 * Create a new webhook
 */
export const POST = withApiKeyAuth(
  async (request: NextRequest, apiKey) => {
    try {
      const body = await request.json();
      
      // Validate required fields
      const requiredFields = ['url', 'events'];
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

      // Validate URL format
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid URL format',
            code: 'INVALID_URL'
          },
          { status: 400 }
        );
      }

      // Validate events
      const validEvents = [
        'product.created', 'product.updated', 'product.deleted',
        'collection.created', 'collection.updated', 'collection.deleted',
        'user.created', 'user.updated', 'user.approved', 'user.rejected'
      ];

      if (!Array.isArray(body.events) || body.events.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Events must be a non-empty array',
            code: 'INVALID_EVENTS'
          },
          { status: 400 }
        );
      }

      const invalidEvents = body.events.filter((event: string) => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid events: ${invalidEvents.join(', ')}`,
            code: 'INVALID_EVENTS',
            validEvents
          },
          { status: 400 }
        );
      }

      // Generate webhook secret
      const secret = `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      // Create webhook (placeholder implementation)
      const webhook = {
        id: `webhook_${Date.now()}`,
        url: body.url,
        events: body.events,
        isActive: body.isActive !== false, // Default to true
        secret: secret,
        createdAt: Date.now(),
        createdBy: apiKey.id
      };

      // In a real implementation, you would save this to the database
      console.log('Creating webhook:', webhook);

      return NextResponse.json({
        success: true,
        data: {
          ...webhook,
          secret: secret // Return secret only once during creation
        },
        meta: {
          apiKeyId: apiKey.keyId,
          environment: apiKey.environment,
          timestamp: Date.now()
        }
      }, { status: 201 });

    } catch (error) {
      console.error('Create webhook API error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create webhook',
          code: 'CREATE_FAILED'
        },
        { status: 500 }
      );
    }
  },
  { 
    requiredPermission: 'webhooks:write'
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
