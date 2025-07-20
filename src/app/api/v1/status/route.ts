import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/status
 * Public endpoint to check API status and get information
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: Date.now(),
        uptime: process.uptime(),
      },
      api: {
        name: 'Benzochem Industries API',
        description: 'Professional API for chemical products and collections management',
        documentation: '/api/v1/docs',
        authentication: {
          type: 'API Key',
          methods: [
            'Authorization: Bearer <api_key>',
            'X-API-Key: <api_key>',
            'Query parameter: ?api_key=<api_key> (not recommended for production)'
          ]
        },
        endpoints: {
          products: {
            list: 'GET /api/v1/products',
            create: 'POST /api/v1/products',
            get: 'GET /api/v1/products/{id}',
            update: 'PUT /api/v1/products/{id}',
            delete: 'DELETE /api/v1/products/{id}'
          },
          collections: {
            list: 'GET /api/v1/collections',
            create: 'POST /api/v1/collections',
            get: 'GET /api/v1/collections/{id}',
            update: 'PUT /api/v1/collections/{id}',
            delete: 'DELETE /api/v1/collections/{id}'
          },
          analytics: {
            overview: 'GET /api/v1/analytics/overview',
            products: 'GET /api/v1/analytics/products',
            usage: 'GET /api/v1/analytics/usage'
          }
        },
        permissions: {
          'products:read': 'Read product information',
          'products:write': 'Create and update products',
          'products:delete': 'Delete products',
          'collections:read': 'Read collection information',
          'collections:write': 'Create and update collections',
          'collections:delete': 'Delete collections',
          'analytics:read': 'Read analytics data',
          'webhooks:read': 'Read webhook configurations',
          'webhooks:write': 'Create and update webhooks'
        },
        rateLimits: {
          standard: {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150
          },
          premium: {
            requestsPerMinute: 500,
            requestsPerHour: 25000,
            requestsPerDay: 250000,
            burstLimit: 750
          },
          enterprise: {
            requestsPerMinute: 2000,
            requestsPerHour: 100000,
            requestsPerDay: 1000000,
            burstLimit: 3000
          }
        },
        errorCodes: {
          'UNAUTHORIZED': 'API key is missing or invalid',
          'FORBIDDEN': 'API key lacks required permissions',
          'RATE_LIMITED': 'Rate limit exceeded',
          'INVALID_LIMIT': 'Request limit parameter is invalid',
          'MISSING_FIELD': 'Required field is missing from request',
          'CREATE_FAILED': 'Failed to create resource',
          'UPDATE_FAILED': 'Failed to update resource',
          'DELETE_FAILED': 'Failed to delete resource',
          'NOT_FOUND': 'Resource not found',
          'INTERNAL_ERROR': 'Internal server error'
        }
      },
      support: {
        documentation: 'https://docs.benzochem.com/api',
        contact: 'api-support@benzochem.com',
        status: 'https://status.benzochem.com'
      }
    });

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get API status',
        code: 'INTERNAL_ERROR'
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
