import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/docs
 * Interactive API documentation
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    if (format === 'openapi' || format === 'swagger') {
      // Return OpenAPI/Swagger specification
      const openApiSpec = {
        openapi: '3.0.0',
        info: {
          title: 'Benzochem Industries API',
          version: '1.0.0',
          description: 'Professional API for chemical products and collections management',
          contact: {
            name: 'API Support',
            email: 'api-support@benzochem.com',
            url: 'https://docs.benzochem.com'
          },
          license: {
            name: 'Proprietary',
            url: 'https://benzochem.com/terms'
          }
        },
        servers: [
          {
            url: 'https://admin.benzochem.com/api/v1',
            description: 'Production server'
          },
          {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
          }
        ],
        security: [
          {
            BearerAuth: []
          },
          {
            ApiKeyAuth: []
          }
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'API Key',
              description: 'Use your Benzochem API key as a bearer token'
            },
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
              description: 'Use your Benzochem API key in the X-API-Key header'
            }
          },
          schemas: {
            Product: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'prod_123' },
                title: { type: 'string', example: 'Sodium Chloride' },
                description: { type: 'string', example: 'High purity sodium chloride' },
                casNumber: { type: 'string', example: '7647-14-5' },
                purity: { type: 'string', example: '99.9%' },
                priceRange: {
                  type: 'object',
                  properties: {
                    minVariantPrice: {
                      type: 'object',
                      properties: {
                        amount: { type: 'string', example: '25.00' },
                        currencyCode: { type: 'string', example: 'USD' }
                      }
                    }
                  }
                }
              }
            },
            Collection: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'coll_123' },
                title: { type: 'string', example: 'Laboratory Chemicals' },
                description: { type: 'string', example: 'High-grade chemicals for laboratory use' },
                handle: { type: 'string', example: 'laboratory-chemicals' },
                status: { type: 'string', enum: ['active', 'inactive'] },
                isVisible: { type: 'boolean', example: true }
              }
            },
            Error: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Error message' },
                code: { type: 'string', example: 'ERROR_CODE' }
              }
            }
          }
        },
        paths: {
          '/products': {
            get: {
              summary: 'List products',
              description: 'Retrieve a list of chemical products with optional filtering',
              security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  description: 'Number of products to return (max 100)',
                  schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
                },
                {
                  name: 'offset',
                  in: 'query',
                  description: 'Number of products to skip',
                  schema: { type: 'integer', minimum: 0, default: 0 }
                },
                {
                  name: 'search',
                  in: 'query',
                  description: 'Search term for product title or description',
                  schema: { type: 'string' }
                },
                {
                  name: 'status',
                  in: 'query',
                  description: 'Filter by product status',
                  schema: { type: 'string', enum: ['active', 'inactive', 'discontinued'] }
                },
                {
                  name: 'featured',
                  in: 'query',
                  description: 'Filter by featured status',
                  schema: { type: 'boolean' }
                }
              ],
              responses: {
                '200': {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', example: true },
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Product' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              limit: { type: 'integer' },
                              offset: { type: 'integer' },
                              hasMore: { type: 'boolean' }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                '401': {
                  description: 'Unauthorized',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' }
                    }
                  }
                },
                '429': {
                  description: 'Rate limit exceeded',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/Error' }
                    }
                  }
                }
              }
            },
            post: {
              summary: 'Create product',
              description: 'Create a new chemical product',
              security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      required: ['title', 'description', 'priceRange'],
                      properties: {
                        title: { type: 'string', example: 'Sodium Chloride' },
                        description: { type: 'string', example: 'High purity sodium chloride' },
                        casNumber: { type: 'string', example: '7647-14-5' },
                        purity: { type: 'string', example: '99.9%' },
                        priceRange: {
                          type: 'object',
                          properties: {
                            minVariantPrice: {
                              type: 'object',
                              properties: {
                                amount: { type: 'string', example: '25.00' },
                                currencyCode: { type: 'string', example: 'USD' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Product created successfully',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', example: true },
                          data: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', example: 'prod_123' },
                              message: { type: 'string', example: 'Product created successfully' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/collections': {
            get: {
              summary: 'List collections',
              description: 'Retrieve a list of product collections',
              security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
              responses: {
                '200': {
                  description: 'Successful response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', example: true },
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Collection' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '/status': {
            get: {
              summary: 'API status',
              description: 'Get API status and information (no authentication required)',
              responses: {
                '200': {
                  description: 'API status information',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean', example: true },
                          data: {
                            type: 'object',
                            properties: {
                              status: { type: 'string', example: 'operational' },
                              version: { type: 'string', example: '1.0.0' },
                              timestamp: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      return NextResponse.json(openApiSpec);
    }

    // Default JSON documentation
    const documentation = {
      success: true,
      data: {
        title: 'Benzochem Industries API Documentation',
        version: '1.0.0',
        description: 'Professional API for chemical products and collections management',
        baseUrl: {
          production: 'https://admin.benzochem.com/api/v1',
          development: 'http://localhost:3000/api/v1'
        },
        authentication: {
          type: 'API Key',
          formats: [
            'Authorization: Bearer <api_key>',
            'X-API-Key: <api_key>'
          ],
          keyFormat: 'bzk_[environment]_[32_chars][4_checksum]',
          environments: ['live']
        },
        endpoints: {
          '/status': {
            method: 'GET',
            description: 'Get API status (no auth required)',
            authentication: false
          },
          '/products': {
            methods: ['GET', 'POST'],
            description: 'Manage chemical products',
            permissions: ['products:read', 'products:write']
          },
          '/collections': {
            methods: ['GET', 'POST'],
            description: 'Manage product collections',
            permissions: ['collections:read', 'collections:write']
          },
          '/analytics/overview': {
            method: 'GET',
            description: 'Get analytics overview',
            permissions: ['analytics:read']
          },
          '/webhooks': {
            methods: ['GET', 'POST'],
            description: 'Manage webhooks',
            permissions: ['webhooks:read', 'webhooks:write']
          }
        },
        rateLimits: {
          standard: { perMinute: 100, perHour: 5000, perDay: 50000 },
          premium: { perMinute: 500, perHour: 25000, perDay: 250000 },
          enterprise: { perMinute: 2000, perHour: 100000, perDay: 1000000 }
        },
        examples: {
          curl: 'curl -H "Authorization: Bearer <your_api_key>" https://admin.benzochem.com/api/v1/products',
          javascript: 'fetch("/api/v1/products", { headers: { "Authorization": "Bearer <your_api_key>" } })',
          python: 'requests.get("/api/v1/products", headers={"Authorization": "Bearer <your_api_key>"})'
        },
        links: {
          fullDocumentation: '/API_DOCUMENTATION.md',
          openApiSpec: '/api/v1/docs?format=openapi',
          support: 'api-support@benzochem.com'
        }
      }
    };

    return NextResponse.json(documentation);

  } catch (error) {
    console.error('Documentation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load documentation',
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
