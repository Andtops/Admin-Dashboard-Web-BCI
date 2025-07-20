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
    const csrfHeaders = getCSRFHeaders();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Only add CSRF token if it exists
    if (csrfHeaders['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = csrfHeaders['X-CSRF-Token'];
    }

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
