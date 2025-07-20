import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # API Key Types
  type ApiKey {
    id: ID!
    name: String!
    key: String!
    keyId: String!
    environment: Environment!
    permissions: [String!]!
    isActive: Boolean!
    expiresAt: Float
    lastUsedAt: Float
    usageCount: Int!
    rateLimit: RateLimit!
    revokedAt: Float
    revokedBy: ID
    revocationReason: String
    rotatedAt: Float
    rotatedBy: ID
    rotationReason: String
    createdBy: ID!
    createdAt: Float!
    updatedAt: Float!
  }

  type RateLimit {
    requestsPerMinute: Int!
    requestsPerHour: Int!
    requestsPerDay: Int!
    burstLimit: Int
  }

  type ApiKeyStats {
    total: Int!
    active: Int!
    inactive: Int!
    expired: Int!
    recentlyUsed: Int!
    totalUsage: Int!
  }

  enum Environment {
    live
  }

  # Input Types
  input RateLimitInput {
    requestsPerMinute: Int!
    requestsPerHour: Int!
    requestsPerDay: Int!
    burstLimit: Int
  }

  input CreateApiKeyInput {
    name: String!
    permissions: [String!]!
    adminId: ID!
    environment: Environment = live
    expiresAt: Float
    rateLimit: RateLimitInput
  }

  input UpdateApiKeyInput {
    apiKeyId: ID!
    name: String
    permissions: [String!]
    isActive: Boolean
    expiresAt: Float
    rateLimit: RateLimitInput
    updatedBy: ID!
  }

  input RevokeApiKeyInput {
    apiKeyId: ID!
    revokedBy: ID!
    reason: String
  }

  input DeleteApiKeyInput {
    apiKeyId: ID!
    deletedBy: ID!
    reason: String
  }

  input GetApiKeysInput {
    search: String
    isActive: Boolean
    createdBy: ID
    limit: Int
    offset: Int
  }

  # Queries
  type Query {
    getApiKeys(input: GetApiKeysInput): [ApiKey!]!
    getApiKeyById(id: ID!): ApiKey
    getFullApiKeyById(id: ID!): ApiKey
    getApiKeyStats: ApiKeyStats!
    validateApiKey(key: String!): ApiKey
  }

  # Mutations
  type Mutation {
    createApiKey(input: CreateApiKeyInput!): ApiKey!
    updateApiKey(input: UpdateApiKeyInput!): ApiKey!
    revokeApiKey(input: RevokeApiKeyInput!): ApiKey!
    deleteApiKey(input: DeleteApiKeyInput!): Boolean!
  }
`;
