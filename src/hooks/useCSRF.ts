import { useAuth } from '@/contexts/auth-context';

export function useCSRF() {
  const { csrfToken } = useAuth();

  const getCSRFHeaders = () => {
    if (!csrfToken) return {};
    
    return {
      'X-CSRF-Token': csrfToken,
    };
  };

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = {
      'Content-Type': 'application/json',
      ...getCSRFHeaders(),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  return {
    csrfToken,
    getCSRFHeaders,
    makeAuthenticatedRequest,
  };
}
