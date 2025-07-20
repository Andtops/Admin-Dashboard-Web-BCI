import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_API_KEYS,
  GET_API_KEY_BY_ID,
  GET_FULL_API_KEY_BY_ID,
  GET_API_KEY_STATS,
  VALIDATE_API_KEY,
} from '@/lib/graphql/queries';
import {
  CREATE_API_KEY,
  UPDATE_API_KEY,
  REVOKE_API_KEY,
  DELETE_API_KEY,
} from '@/lib/graphql/mutations';

// Types for inputs
interface GetApiKeysInput {
  search?: string;
  isActive?: boolean;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

interface CreateApiKeyInput {
  name: string;
  permissions: string[];
  adminId: string;
  environment?: 'live';
  expiresAt?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit?: number;
  };
}

interface UpdateApiKeyInput {
  apiKeyId: string;
  name?: string;
  permissions?: string[];
  isActive?: boolean;
  expiresAt?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit?: number;
  };
  updatedBy: string;
}

interface RevokeApiKeyInput {
  apiKeyId: string;
  revokedBy: string;
  reason?: string;
}

interface DeleteApiKeyInput {
  apiKeyId: string;
  deletedBy: string;
  reason?: string;
}

// Custom hooks
export function useApiKeys(input?: GetApiKeysInput) {
  const { data, loading, error, refetch } = useQuery(GET_API_KEYS, {
    variables: { input },
    errorPolicy: 'all',
  });

  return {
    data: data?.getApiKeys || [],
    loading,
    error,
    refetch,
  };
}

export function useApiKeyById(id: string) {
  const { data, loading, error } = useQuery(GET_API_KEY_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });

  return {
    data: data?.getApiKeyById,
    loading,
    error,
  };
}

export function useFullApiKeyById(id: string) {
  const { data, loading, error } = useQuery(GET_FULL_API_KEY_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });

  return {
    data: data?.getFullApiKeyById,
    loading,
    error,
  };
}

export function useApiKeyStats() {
  const { data, loading, error, refetch } = useQuery(GET_API_KEY_STATS, {
    errorPolicy: 'all',
  });

  return {
    data: data?.getApiKeyStats,
    loading,
    error,
    refetch,
  };
}

export function useValidateApiKey(key: string) {
  const { data, loading, error } = useQuery(VALIDATE_API_KEY, {
    variables: { key },
    skip: !key,
    errorPolicy: 'all',
  });

  return {
    data: data?.validateApiKey,
    loading,
    error,
  };
}

// Mutation hooks
export function useCreateApiKey() {
  const client = useApolloClient();
  const [createApiKeyMutation, { loading, error }] = useMutation(CREATE_API_KEY, {
    onCompleted: () => {
      // Refetch API keys list after creation
      client.refetchQueries({
        include: [GET_API_KEYS, GET_API_KEY_STATS],
      });
    },
  });

  const createApiKey = async (input: CreateApiKeyInput) => {
    const result = await createApiKeyMutation({
      variables: { input },
    });
    return result.data?.createApiKey;
  };

  return {
    createApiKey,
    loading,
    error,
  };
}

export function useUpdateApiKey() {
  const client = useApolloClient();
  const [updateApiKeyMutation, { loading, error }] = useMutation(UPDATE_API_KEY, {
    onCompleted: () => {
      // Refetch API keys list after update
      client.refetchQueries({
        include: [GET_API_KEYS, GET_API_KEY_STATS],
      });
    },
  });

  const updateApiKey = async (input: UpdateApiKeyInput) => {
    const result = await updateApiKeyMutation({
      variables: { input },
    });
    return result.data?.updateApiKey;
  };

  return {
    updateApiKey,
    loading,
    error,
  };
}

export function useRevokeApiKey() {
  const client = useApolloClient();
  const [revokeApiKeyMutation, { loading, error }] = useMutation(REVOKE_API_KEY, {
    onCompleted: () => {
      // Refetch API keys list after revocation
      client.refetchQueries({
        include: [GET_API_KEYS, GET_API_KEY_STATS],
      });
    },
  });

  const revokeApiKey = async (input: RevokeApiKeyInput) => {
    const result = await revokeApiKeyMutation({
      variables: { input },
    });
    return result.data?.revokeApiKey;
  };

  return {
    revokeApiKey,
    loading,
    error,
  };
}

export function useDeleteApiKey() {
  const client = useApolloClient();
  const [deleteApiKeyMutation, { loading, error }] = useMutation(DELETE_API_KEY, {
    onCompleted: () => {
      // Refetch API keys list after deletion
      client.refetchQueries({
        include: [GET_API_KEYS, GET_API_KEY_STATS],
      });
    },
  });

  const deleteApiKey = async (input: DeleteApiKeyInput) => {
    const result = await deleteApiKeyMutation({
      variables: { input },
    });
    return result.data?.deleteApiKey;
  };

  return {
    deleteApiKey,
    loading,
    error,
  };
}
