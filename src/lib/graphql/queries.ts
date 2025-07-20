import { gql } from '@apollo/client';

// Fragment for API Key fields
export const API_KEY_FRAGMENT = gql`
  fragment ApiKeyFields on ApiKey {
    id
    name
    key
    keyId
    environment
    permissions
    isActive
    expiresAt
    lastUsedAt
    usageCount
    rateLimit {
      requestsPerMinute
      requestsPerHour
      requestsPerDay
      burstLimit
    }
    revokedAt
    revokedBy
    revocationReason
    rotatedAt
    rotatedBy
    rotationReason
    createdBy
    createdAt
    updatedAt
  }
`;

// Query to get all API keys
export const GET_API_KEYS = gql`
  query GetApiKeys($input: GetApiKeysInput) {
    getApiKeys(input: $input) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Query to get API key by ID
export const GET_API_KEY_BY_ID = gql`
  query GetApiKeyById($id: ID!) {
    getApiKeyById(id: $id) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Query to get full API key by ID (for authenticated access)
export const GET_FULL_API_KEY_BY_ID = gql`
  query GetFullApiKeyById($id: ID!) {
    getFullApiKeyById(id: $id) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Query to get API key statistics
export const GET_API_KEY_STATS = gql`
  query GetApiKeyStats {
    getApiKeyStats {
      total
      active
      inactive
      expired
      recentlyUsed
      totalUsage
    }
  }
`;

// Query to validate API key
export const VALIDATE_API_KEY = gql`
  query ValidateApiKey($key: String!) {
    validateApiKey(key: $key) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;
