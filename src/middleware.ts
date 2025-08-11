import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/users',
  '/products',
  '/orders',
  '/inventory',
  '/reports',
  '/collections',
  '/settings',
  '/api/admin', // Protect admin API routes
];

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/v1/analytics/track-visitor', // Allow visitor tracking without auth
  '/analytics-tracker.js', // Allow tracking script access
  '/analytics-demo', // Allow demo page access
];

// Define routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for analytics API endpoints
  if (pathname.startsWith('/api/v1/analytics/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Add CORS headers to actual requests
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    // For track-visitor endpoint, allow without authentication
    if (pathname === '/api/v1/analytics/track-visitor') {
      return response;
    }
  }

  // Handle CORS for notification API endpoints (for mobile app)
  if (pathname.startsWith('/api/notifications/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Add CORS headers to actual requests but let API key auth handle authentication
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    // Let the API endpoints handle their own authentication via API keys
    return response;
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // Check if the route is an auth route (login/setup)
  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  try {
    // Get session from request
    const session = await getSessionFromRequest(request);
    const isAuthenticated = !!session;

    // Handle protected routes
    if (isProtectedRoute) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Add session info to request headers for API routes
      if (pathname.startsWith('/api/admin')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-admin-id', session.adminId);
        requestHeaders.set('x-admin-role', session.role);
        requestHeaders.set('x-admin-permissions', JSON.stringify(session.permissions));

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      return NextResponse.next();
    }

    // Handle auth routes (login only)
    if (isAuthRoute) {
      if (isAuthenticated) {
        // Redirect to dashboard if already authenticated
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // For login route, always allow access
      return NextResponse.next();
    }

    // Handle public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Handle root route
    if (pathname === '/') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        // Always redirect unauthenticated users to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Default: allow the request to continue
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);

    // On error, redirect to login for protected routes
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For other routes, continue normally
    return NextResponse.next();
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
