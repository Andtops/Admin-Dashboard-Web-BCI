import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';
import { NextRequest, NextResponse } from 'next/server';

// Create the GraphQL schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server instance
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
  // Security: Limit query complexity and depth (Apollo best practice)
  plugins: [
    // Add query complexity analysis in production
    ...(process.env.NODE_ENV === 'production' ? [] : []),
  ],
});

// Create the Next.js handler with better error handling
const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => {
    try {
      // Extract authentication from request headers or cookies
      // This follows Apollo's recommendation for putting user info in context
      const authHeader = req.headers.get('authorization');
      const sessionCookie = req.cookies.get('session')?.value;

      return {
        req,
        // Add user context for authorization in resolvers
        authHeader,
        sessionCookie,
      };
    } catch (error) {
      console.error('GraphQL context creation error:', error);
      return {
        req,
        authHeader: null,
        sessionCookie: null,
      };
    }
  },
});

// Handle CORS for Apollo Studio
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Wrap handlers with error handling
async function handleGET(request: NextRequest) {
  try {
    // Check if this is a browser request for GraphQL Playground
    const userAgent = request.headers.get('user-agent') || '';
    const acceptHeader = request.headers.get('accept') || '';

    // If it's a browser request and not a GraphQL query, show Apollo Studio redirect
    if (userAgent.includes('Mozilla') && acceptHeader.includes('text/html')) {
      const apolloStudioUrl = `https://studio.apollographql.com/dev?endpoint=${encodeURIComponent(
        `${request.nextUrl.origin}/api/graphql`
      )}`;

      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>GraphQL API</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 600px; margin: 0 auto; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 10px 0;
            }
            .button:hover { background: #1565c0; }
            .endpoint {
              background: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 GraphQL API</h1>
            <p>Your GraphQL API is running successfully!</p>

            <h3>Endpoint:</h3>
            <div class="endpoint">${request.nextUrl.origin}/api/graphql</div>

            <h3>Test your API:</h3>
            <a href="${apolloStudioUrl}" class="button" target="_blank">
              Open in Apollo Studio
            </a>

            <h3>Available Operations:</h3>
            <ul>
              <li><strong>Queries:</strong> getApiKeys, getApiKeyById, getApiKeyStats, validateApiKey</li>
              <li><strong>Mutations:</strong> createApiKey, updateApiKey, revokeApiKey, deleteApiKey</li>
            </ul>

            <p><em>Introspection is enabled in development mode.</em></p>
          </div>
        </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    return await handler(request);
  } catch (error) {
    console.error('GraphQL GET error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'GraphQL server error',
        message: process.env.NODE_ENV !== 'production' ? String(error) : 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('GraphQL POST error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'GraphQL server error',
        message: process.env.NODE_ENV !== 'production' ? String(error) : 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export { handleGET as GET, handlePOST as POST };
