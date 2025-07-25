import { useAuth } from '@/contexts/auth-context';

export function useCSRF() {
  const { csrfToken } = useAuth();

  const getCSRFHeaders = (): Record<string, string> => {
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
      ...csrfHeaders,
    };

    // Add any additional headers from options
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
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
