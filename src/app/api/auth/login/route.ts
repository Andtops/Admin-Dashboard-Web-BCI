import { NextRequest, NextResponse } from 'next/server';
import { useMutation } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { 
  createSessionToken, 
  setSessionCookie, 
  setCSRFCookie, 
  generateCSRFToken,
  validateCSRFToken 
} from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, csrfToken } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate CSRF token (skip for initial login, but validate for subsequent requests)
    const hasCsrfCookie = request.cookies.get('benzochem-csrf-token');
    if (hasCsrfCookie && csrfToken && !validateCSRFToken(request, csrfToken)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Authenticate with Convex
    const authResult = await convex.mutation(api.auth.authenticateAdmin, {
      email,
      password,
    });

    if (!authResult.success || !authResult.admin) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = await createSessionToken({
      adminId: authResult.admin._id,
      email: authResult.admin.email,
      firstName: authResult.admin.firstName,
      lastName: authResult.admin.lastName,
      role: authResult.admin.role,
      permissions: authResult.admin.permissions,
      isActive: authResult.admin.isActive,
    });

    // Generate CSRF token
    const newCSRFToken = generateCSRFToken();

    // Create response
    const response = NextResponse.json({
      success: true,
      admin: {
        _id: authResult.admin._id,
        email: authResult.admin.email,
        firstName: authResult.admin.firstName,
        lastName: authResult.admin.lastName,
        role: authResult.admin.role,
        permissions: authResult.admin.permissions,
        isActive: authResult.admin.isActive,
      },
      csrfToken: newCSRFToken,
    });

    // Set secure cookies
    setSessionCookie(response, sessionToken);
    setCSRFCookie(response, newCSRFToken);

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    },
  });
}
