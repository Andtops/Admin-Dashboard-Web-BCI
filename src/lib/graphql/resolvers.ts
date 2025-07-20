// GraphQL resolvers that use Convex backend
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';

// Initialize Convex client for GraphQL resolvers
// Note: Using ConvexHttpClient for server-side usage in GraphQL resolvers
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify Convex URL is available
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  throw new Error('Convex URL is required for GraphQL resolvers');
}

export const resolvers = {
  Query: {
    getApiKeys: async (_: any, { input }: { input?: any }) => {
      try {
        console.log('GraphQL getApiKeys called with input:', input);
        const result = await convex.query(api.apiKeys.getApiKeys, {
          search: input?.search,
          isActive: input?.isActive,
          createdBy: input?.createdBy,
          limit: input?.limit,
          offset: input?.offset,
        });

        console.log('GraphQL getApiKeys result:', result ? `${result.length} items` : 'null');
        return result.map((apiKey: any) => ({
          ...apiKey,
          id: apiKey._id,
          rateLimit: apiKey.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        }));
      } catch (error) {
        console.error('GraphQL getApiKeys error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(`Failed to fetch API keys: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    getApiKeyById: async (_: any, { id }: { id: string }) => {
      try {
        const result = await convex.query(api.apiKeys.getApiKeyById, { id: id as any });
        if (!result) {
          return null;
        }
        return {
          ...result,
          id: result._id,
          rateLimit: result.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        };
      } catch (error) {
        console.error('GraphQL getApiKeyById error:', error);
        throw new Error('Failed to fetch API key');
      }
    },

    getFullApiKeyById: async (_: any, { id }: { id: string }) => {
      try {
        const result = await convex.query(api.apiKeys.getFullApiKeyById, { id: id as any });
        if (!result) {
          return null;
        }
        return {
          ...result,
          id: result._id,
          rateLimit: result.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        };
      } catch (error) {
        console.error('GraphQL getFullApiKeyById error:', error);
        throw new Error('Failed to fetch full API key');
      }
    },

    getApiKeyStats: async () => {
      try {
        const result = await convex.query(api.apiKeys.getApiKeyStats, {});
        return result;
      } catch (error) {
        console.error('GraphQL getApiKeyStats error:', error);
        throw new Error('Failed to fetch API key statistics');
      }
    },

    validateApiKey: async (_: any, { key }: { key: string }) => {
      try {
        const result = await convex.query(api.apiKeys.validateApiKey, { key });
        if (!result) {
          return null;
        }
        // validateApiKey already returns an object with 'id', not '_id'
        return result;
      } catch (error) {
        console.error('GraphQL validateApiKey error:', error);
        throw new Error('Failed to validate API key');
      }
    },
  },

  Mutation: {
    createApiKey: async (_: any, { input }: { input: any }) => {
      try {
        const result = await convex.mutation(api.apiKeys.createApiKey, {
          name: input.name,
          permissions: input.permissions,
          adminId: input.adminId as any,
          environment: input.environment,
          expiresAt: input.expiresAt,
          rateLimit: input.rateLimit,
        });

        // Fetch the complete API key data to match the GraphQL schema
        const fullApiKey = await convex.query(api.apiKeys.getFullApiKeyById, { id: result.id as any });
        if (!fullApiKey) {
          throw new Error('Failed to retrieve created API key');
        }

        // Return the full API key with the plain text key from creation
        return {
          ...fullApiKey,
          id: fullApiKey._id,
          key: result.key, // Use the plain text key from creation
          rateLimit: fullApiKey.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        };
      } catch (error) {
        console.error('GraphQL createApiKey error:', error);
        throw new Error('Failed to create API key');
      }
    },

    updateApiKey: async (_: any, { input }: { input: any }) => {
      try {
        await convex.mutation(api.apiKeys.updateApiKey, {
          apiKeyId: input.apiKeyId as any,
          name: input.name,
          permissions: input.permissions,
          isActive: input.isActive,
          expiresAt: input.expiresAt,
          rateLimit: input.rateLimit,
          updatedBy: input.updatedBy as any,
        });

        // Fetch the updated API key
        const result = await convex.query(api.apiKeys.getApiKeyById, { id: input.apiKeyId as any });
        if (!result) {
          throw new Error('API key not found after update');
        }

        return {
          ...result,
          id: result._id,
          rateLimit: result.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        };
      } catch (error) {
        console.error('GraphQL updateApiKey error:', error);
        throw new Error('Failed to update API key');
      }
    },

    revokeApiKey: async (_: any, { input }: { input: any }) => {
      try {
        await convex.mutation(api.apiKeys.revokeApiKey, {
          apiKeyId: input.apiKeyId as any,
          revokedBy: input.revokedBy as any,
          reason: input.reason,
        });

        // Fetch the updated API key
        const result = await convex.query(api.apiKeys.getApiKeyById, { id: input.apiKeyId as any });
        if (!result) {
          throw new Error('API key not found after revocation');
        }

        return {
          ...result,
          id: result._id,
          rateLimit: result.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          },
        };
      } catch (error) {
        console.error('GraphQL revokeApiKey error:', error);
        throw new Error('Failed to revoke API key');
      }
    },

    deleteApiKey: async (_: any, { input }: { input: any }) => {
      try {
        await convex.mutation(api.apiKeys.deleteApiKey, {
          apiKeyId: input.apiKeyId as any,
          deletedBy: input.deletedBy as any,
          reason: input.reason,
        });
        return true;
      } catch (error) {
        console.error('GraphQL deleteApiKey error:', error);
        throw new Error('Failed to delete API key');
      }
    },
  },
};
