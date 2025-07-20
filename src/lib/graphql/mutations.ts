import { gql } from '@apollo/client';
import { API_KEY_FRAGMENT } from './queries';

// Mutation to create a new API key
export const CREATE_API_KEY = gql`
  mutation CreateApiKey($input: CreateApiKeyInput!) {
    createApiKey(input: $input) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Mutation to update an API key
export const UPDATE_API_KEY = gql`
  mutation UpdateApiKey($input: UpdateApiKeyInput!) {
    updateApiKey(input: $input) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Mutation to revoke an API key
export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($input: RevokeApiKeyInput!) {
    revokeApiKey(input: $input) {
      ...ApiKeyFields
    }
  }
  ${API_KEY_FRAGMENT}
`;

// Mutation to delete an API key
export const DELETE_API_KEY = gql`
  mutation DeleteApiKey($input: DeleteApiKeyInput!) {
    deleteApiKey(input: $input)
  }
`;
