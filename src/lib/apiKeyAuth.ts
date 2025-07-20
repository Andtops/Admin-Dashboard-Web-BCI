import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: {
    id: string;
    keyId: string;
    environment: "live";
    name: string;
    permissions: string[];
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
      burstLimit?: number;
    };
    rateLimitCounts?: {
      minute: number;
      hour: number;
      day: number;
      burst: number;
    };
    rateLimitResets?: {
      minute: number;
      hour: number;
      day: number;
    };
  };
  error?: string;
  statusCode?: number;
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (less secure, but sometimes needed)
  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get('api_key');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
}

/**
 * Validate API key and return validation result
 */
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    if (!apiKey) {
      return {
        isValid: false,
        error: 'API key is required',
        statusCode: 401
      };
    }

    // Validate with Convex
    const validationResult = await convex.query(api.apiKeys.validateApiKey, {
      key: apiKey
    });

    if (!validationResult) {
      return {
        isValid: false,
        error: 'Invalid or expired API key',
        statusCode: 401
      };
    }

    return {
      isValid: true,
      apiKey: validationResult
    };

  } catch (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      error: 'Internal server error during API key validation',
      statusCode: 500
    };
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(apiKey: ApiKeyValidationResult['apiKey'], requiredPermission: string): boolean {
  if (!apiKey) return false;

  // Check for wildcard permission (admin access)
  if (apiKey.permissions.includes('*')) return true;

  // Check for specific permission (exact match)
  if (apiKey.permissions.includes(requiredPermission)) return true;

  // Handle format differences: convert dots to colons and vice versa
  const normalizedRequired = requiredPermission.replace(/[:.]/g, ':');
  const alternativeRequired = requiredPermission.replace(/[:.]/g, '.');

  // Check for permission with alternative format
  if (apiKey.permissions.includes(alternativeRequired)) return true;

  // Check for permission category wildcards (e.g., 'products:*' allows 'products:read')
  const [category] = normalizedRequired.split(':');
  if (apiKey.permissions.includes(`${category}:*`) || apiKey.permissions.includes(`${category}.*`)) return true;

  return false;
}

/**
 * Check if API key has required permission and return detailed result
 */
export function checkPermission(apiKey: ApiKeyValidationResult['apiKey'], requiredPermission: string): {
  hasPermission: boolean;
  error?: string;
  missingPermission?: string;
  availablePermissions?: string[];
} {
  if (!apiKey) {
    return {
      hasPermission: false,
      error: 'No API key provided',
      missingPermission: requiredPermission
    };
  }

  // Check for wildcard permission (admin access)
  if (apiKey.permissions.includes('*')) {
    return { hasPermission: true };
  }

  // Check for specific permission (exact match)
  if (apiKey.permissions.includes(requiredPermission)) {
    return { hasPermission: true };
  }

  // Handle format differences: convert dots to colons and vice versa
  const normalizedRequired = requiredPermission.replace(/[:.]/g, ':');
  const alternativeRequired = requiredPermission.replace(/[:.]/g, '.');

  // Check for permission with alternative format
  if (apiKey.permissions.includes(alternativeRequired)) {
    return { hasPermission: true };
  }

  // Check for permission category wildcards (e.g., 'products:*' allows 'products:read')
  const [category] = normalizedRequired.split(':');
  if (apiKey.permissions.includes(`${category}:*`) || apiKey.permissions.includes(`${category}.*`)) {
    return { hasPermission: true };
  }

  // Generate specific error message based on the missing permission
  let errorMessage = `Insufficient permissions. Required permission: '${requiredPermission}'`;
  
  // Add context-specific error messages
  if (requiredPermission.startsWith('quotations:')) {
    const action = requiredPermission.split(':')[1];
    if (action === 'read') {
      errorMessage = `Access denied: Your API key lacks permission to view quotations. Required permission: '${requiredPermission}'`;
    } else if (action === 'write') {
      errorMessage = `Access denied: Your API key lacks permission to create or modify quotations. Required permission: '${requiredPermission}'`;
    }
  } else if (requiredPermission.startsWith('products:')) {
    const action = requiredPermission.split(':')[1];
    if (action === 'read') {
      errorMessage = `Access denied: Your API key lacks permission to view products. Required permission: '${requiredPermission}'`;
    } else if (action === 'write') {
      errorMessage = `Access denied: Your API key lacks permission to create or modify products. Required permission: '${requiredPermission}'`;
    } else if (action === 'delete') {
      errorMessage = `Access denied: Your API key lacks permission to delete products. Required permission: '${requiredPermission}'`;
    }
  } else if (requiredPermission.startsWith('collections:')) {
    const action = requiredPermission.split(':')[1];
    if (action === 'read') {
      errorMessage = `Access denied: Your API key lacks permission to view collections. Required permission: '${requiredPermission}'`;
    } else if (action === 'write') {
      errorMessage = `Access denied: Your API key lacks permission to create or modify collections. Required permission: '${requiredPermission}'`;
    } else if (action === 'delete') {
      errorMessage = `Access denied: Your API key lacks permission to delete collections. Required permission: '${requiredPermission}'`;
    }
  } else if (requiredPermission.startsWith('analytics:')) {
    errorMessage = `Access denied: Your API key lacks permission to access analytics data. Required permission: '${requiredPermission}'`;
  } else if (requiredPermission.startsWith('webhooks:')) {
    const action = requiredPermission.split(':')[1];
    if (action === 'read') {
      errorMessage = `Access denied: Your API key lacks permission to view webhooks. Required permission: '${requiredPermission}'`;
    } else if (action === 'write') {
      errorMessage = `Access denied: Your API key lacks permission to create or modify webhooks. Required permission: '${requiredPermission}'`;
    }
  }

  return {
    hasPermission: false,
    error: errorMessage,
    missingPermission: requiredPermission,
    availablePermissions: apiKey.permissions
  };
}

/**
 * Rate limiting check
 */
export async function checkRateLimit(apiKey: ApiKeyValidationResult['apiKey']): Promise<{
  allowed: boolean;
  error?: string;
  retryAfter?: number;
}> {
  if (!apiKey) {
    return { allowed: false, error: 'No API key provided' };
  }

  const now = Date.now();
  const currentMinute = Math.floor(now / 60000) * 60000; // Round to minute
  const currentHour = Math.floor(now / 3600000) * 3600000; // Round to hour
  const currentDay = Math.floor(now / 86400000) * 86400000; // Round to day

  const counts = apiKey.rateLimitCounts || { minute: 0, hour: 0, day: 0, burst: 0 };
  const resets = apiKey.rateLimitResets || { minute: currentMinute, hour: currentHour, day: currentDay };

  // Reset counters if time windows have passed
  if (resets.minute < currentMinute) {
    counts.minute = 0;
    counts.burst = 0;
  }
  if (resets.hour < currentHour) {
    counts.hour = 0;
  }
  if (resets.day < currentDay) {
    counts.day = 0;
  }

  // Check limits
  const limits = apiKey.rateLimit;
  
  // Check daily limit first (most restrictive long-term)
  if (counts.day >= limits.requestsPerDay) {
    const retryAfter = Math.ceil((currentDay + 86400000 - now) / 1000);
    return { 
      allowed: false, 
      error: 'Daily rate limit exceeded', 
      retryAfter 
    };
  }

  // Check hourly limit
  if (counts.hour >= limits.requestsPerHour) {
    const retryAfter = Math.ceil((currentHour + 3600000 - now) / 1000);
    return { 
      allowed: false, 
      error: 'Hourly rate limit exceeded', 
      retryAfter 
    };
  }

  // Check burst limit (if configured)
  if (limits.burstLimit && counts.burst >= limits.burstLimit) {
    const retryAfter = Math.ceil((currentMinute + 60000 - now) / 1000);
    return { 
      allowed: false, 
      error: 'Burst rate limit exceeded', 
      retryAfter 
    };
  }

  // Check per-minute limit
  if (counts.minute >= limits.requestsPerMinute) {
    const retryAfter = Math.ceil((currentMinute + 60000 - now) / 1000);
    return { 
      allowed: false, 
      error: 'Per-minute rate limit exceeded', 
      retryAfter 
    };
  }

  return { allowed: true };
}

/**
 * Update rate limit counters
 */
export async function updateRateLimitCounters(apiKey: string): Promise<void> {
  try {
    await convex.mutation(api.apiKeys.updateApiKeyUsage, { key: apiKey });
  } catch (error) {
    console.error('Failed to update rate limit counters:', error);
    // Don't throw error here as it shouldn't block the request
  }
}

/**
 * Create error response for API key validation failures
 */
export function createApiKeyErrorResponse(
  error: string, 
  statusCode: number = 401, 
  retryAfter?: number,
  additionalData?: {
    missingPermission?: string;
    availablePermissions?: string[];
    requiredPermissions?: string[];
  }
): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-RateLimit-Error': error
  };

  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  const responseBody: any = {
    success: false,
    error: error,
    code: statusCode === 401 ? 'UNAUTHORIZED' : 
          statusCode === 403 ? 'FORBIDDEN' : 
          statusCode === 429 ? 'RATE_LIMITED' : 'ERROR'
  };

  // Add permission-specific information for 403 errors
  if (statusCode === 403 && additionalData) {
    responseBody.details = {
      ...(additionalData.missingPermission && { missingPermission: additionalData.missingPermission }),
      ...(additionalData.availablePermissions && { availablePermissions: additionalData.availablePermissions }),
      ...(additionalData.requiredPermissions && { requiredPermissions: additionalData.requiredPermissions })
    };
  }

  return NextResponse.json(responseBody, { 
    status: statusCode,
    headers
  });
}

/**
 * Log API key usage for security monitoring
 */
export async function logApiKeyUsage(
  apiKey: ApiKeyValidationResult['apiKey'],
  request: NextRequest,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    // Extract relevant request information
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
      timestamp: Date.now(),
      success,
      error,
      keyId: apiKey?.keyId,
      environment: apiKey?.environment
    };

    // Log to console for now (in production, you might want to use a proper logging service)
    console.log('API Key Usage:', JSON.stringify(requestInfo, null, 2));

    // Log security events for failed attempts
    if (!success && error) {
      await logSecurityEvent(request, apiKey, error);
    }

    // Check for suspicious patterns
    await checkSuspiciousActivity(request, apiKey, success);

  } catch (logError) {
    console.error('Failed to log API key usage:', logError);
    // Don't throw error here as it shouldn't block the request
  }
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  request: NextRequest,
  apiKey: ApiKeyValidationResult['apiKey'] | undefined,
  error: string
): Promise<void> {
  try {
    let eventType: string;
    let severity: string;
    let description: string;

    // Determine event type and severity based on error
    if (error.includes('API key is required') || error.includes('Invalid API key')) {
      eventType = 'invalid_api_key';
      severity = 'medium';
      description = 'Invalid or missing API key attempt';
    } else if (error.includes('Rate limit exceeded')) {
      eventType = 'rate_limit_exceeded';
      severity = 'low';
      description = 'API rate limit exceeded';
    } else if (error.includes('Insufficient permissions')) {
      eventType = 'permission_violation';
      severity = 'medium';
      description = 'API key attempted to access unauthorized resource';
    } else {
      eventType = 'suspicious_usage_pattern';
      severity = 'low';
      description = `API request failed: ${error}`;
    }

    const details = {
      error,
      timestamp: Date.now(),
      requestPath: new URL(request.url).pathname,
      hasApiKey: !!apiKey,
    };

    await convex.mutation(api.security.logSecurityEvent, {
      eventType: eventType as any,
      severity: severity as any,
      description,
      details,
      ipAddress: request.headers.get('x-forwarded-for') ||
                 request.headers.get('x-real-ip') ||
                 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      requestUrl: request.url,
      requestMethod: request.method,
      apiKeyId: apiKey?.keyId,
      apiKeyEnvironment: apiKey?.environment,
    });

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function checkSuspiciousActivity(
  request: NextRequest,
  apiKey: ApiKeyValidationResult['apiKey'] | undefined,
  success: boolean
): Promise<void> {
  try {
    const ip = request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              'unknown';

    // Check for multiple failed attempts from same IP
    if (!success) {
      // In a real implementation, you would track failed attempts in a cache or database
      // For now, we'll just log a potential security event
      await convex.mutation(api.security.logSecurityEvent, {
        eventType: 'multiple_failed_attempts',
        severity: 'medium',
        description: 'Failed API request detected',
        details: {
          ip,
          userAgent: request.headers.get('user-agent'),
          requestPath: new URL(request.url).pathname,
          timestamp: Date.now(),
        },
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        requestUrl: request.url,
        requestMethod: request.method,
        apiKeyId: apiKey?.keyId,
        apiKeyEnvironment: apiKey?.environment,
      });
    }

    // Check for unusual usage patterns (simplified example)
    if (apiKey && success) {
      const hour = new Date().getHours();

      // Flag requests outside normal business hours as potentially suspicious
      if (hour < 6 || hour > 22) {
        await convex.mutation(api.security.logSecurityEvent, {
          eventType: 'unusual_ip_activity',
          severity: 'low',
          description: 'API request outside normal business hours',
          details: {
            hour,
            ip,
            keyId: apiKey.keyId,
            timestamp: Date.now(),
          },
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || undefined,
          requestUrl: request.url,
          requestMethod: request.method,
          apiKeyId: apiKey.keyId,
          apiKeyEnvironment: apiKey.environment,
        });
      }
    }

  } catch (error) {
    console.error('Failed to check suspicious activity:', error);
  }
}

/**
 * Middleware wrapper for API key authentication
 */
export function withApiKeyAuth(
  handler: (request: NextRequest, apiKey: NonNullable<ApiKeyValidationResult['apiKey']>, context?: any) => Promise<NextResponse>,
  options: {
    requiredPermission?: string;
    skipRateLimit?: boolean;
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extract API key from request
      const apiKeyString = extractApiKey(request);

      if (!apiKeyString) {
        await logApiKeyUsage(undefined, request, false, 'No API key provided');
        return createApiKeyErrorResponse('API key is required');
      }

      // Validate API key
      const validation = await validateApiKey(apiKeyString);

      if (!validation.isValid) {
        await logApiKeyUsage(undefined, request, false, validation.error);
        return createApiKeyErrorResponse(
          validation.error || 'Invalid API key',
          validation.statusCode || 401
        );
      }

      // Check permissions if required
      if (options.requiredPermission) {
        const permissionCheck = checkPermission(validation.apiKey, options.requiredPermission);
        
        if (!permissionCheck.hasPermission) {
          await logApiKeyUsage(validation.apiKey, request, false, permissionCheck.error || 'Insufficient permissions');
          return createApiKeyErrorResponse(
            permissionCheck.error || 'Insufficient permissions', 
            403,
            undefined,
            {
              missingPermission: permissionCheck.missingPermission,
              availablePermissions: permissionCheck.availablePermissions
            }
          );
        }
      }

      // Check rate limits (unless skipped)
      if (!options.skipRateLimit) {
        const rateLimitCheck = await checkRateLimit(validation.apiKey);

        if (!rateLimitCheck.allowed) {
          await logApiKeyUsage(validation.apiKey, request, false, rateLimitCheck.error);
          return createApiKeyErrorResponse(
            rateLimitCheck.error || 'Rate limit exceeded',
            429,
            rateLimitCheck.retryAfter
          );
        }

        // Update rate limit counters
        await updateRateLimitCounters(apiKeyString);
      }

      // Log successful authentication
      await logApiKeyUsage(validation.apiKey, request, true);

      // Call the actual handler with validated API key and context (for dynamic routes)
      const response = await handler(request, validation.apiKey, context);
      
      // Add CORS headers to all responses
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      
      return response;

    } catch (error) {
      console.error('API key middleware error:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        details: error // Log the full error object for more context
      });
      await logApiKeyUsage(undefined, request, false, 'Internal server error');
      return createApiKeyErrorResponse('Internal server error', 500);
    }
  };
}
