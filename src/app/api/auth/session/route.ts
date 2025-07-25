import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { 
  getSessionFromRequest, 
  createSessionToken, 
  setSessionCookie,
  refreshSessionToken 
} from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    console.log('Session API: Starting session check');

    // Get session from cookies
    const session = await getSessionFromRequest(request);
    console.log('Session API: Session from request:', session ? 'Found' : 'Not found');

    if (!session) {
      console.log('Session API: No valid session found');
      return NextResponse.json(
        { success: false, error: 'No valid session found' },
        { status: 401 }
      );
    }

    // Validate session with Convex (check if admin still exists and is active)
    console.log('Session API: Validating with Convex, adminId:', session.adminId);
    const validationResult = await convex.action(api.auth.validateAdminSession, {
      adminId: session.adminId as Id<'admins'>,
    });
    console.log('Session API: Validation result:', validationResult);

    if (!validationResult.valid || !validationResult.admin) {
      console.log('Session API: Session validation failed');
      return NextResponse.json(
        { success: false, error: 'Session is no longer valid' },
        { status: 401 }
      );
    }

    // Check if session needs refresh (if it's more than halfway to expiration)
    const now = Date.now();
    const sessionAge = now - session.loginTime;
    const sessionDuration = session.expiresAt - session.loginTime;
    const shouldRefresh = sessionAge > sessionDuration / 2;

    const response = NextResponse.json({
      success: true,
      admin: {
        _id: validationResult.admin._id,
        email: validationResult.admin.email,
        firstName: validationResult.admin.firstName,
        lastName: validationResult.admin.lastName,
        role: validationResult.admin.role,
        permissions: validationResult.admin.permissions,
        isActive: validationResult.admin.isActive,
      },
      sessionRefreshed: shouldRefresh,
    });

    // Refresh session if needed
    if (shouldRefresh) {
      const currentToken = request.cookies.get('benzochem-admin-session')?.value;
      if (currentToken) {
        const refreshedToken = await refreshSessionToken(currentToken);
        if (refreshedToken) {
          setSessionCookie(response, refreshedToken);
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Session validation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}