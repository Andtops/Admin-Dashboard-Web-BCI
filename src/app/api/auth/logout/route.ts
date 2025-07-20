import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies, validateCSRFToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { csrfToken } = body;

    // Validate CSRF token if provided, but allow logout without it for security
    const hasCsrfCookie = request.cookies.get('benzochem-csrf-token');
    if (hasCsrfCookie && csrfToken && !validateCSRFToken(request, csrfToken)) {
      // Still clear cookies even if CSRF validation fails for security
      const response = NextResponse.json(
        { success: false, error: 'Invalid CSRF token, but session cleared for security' },
        { status: 403 }
      );
      clearSessionCookies(response);
      return response;
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear session cookies
    clearSessionCookies(response);

    return response;
  } catch (error) {
    console.error('Logout API error:', error);

    // Even if there's an error, clear the cookies for security
    const response = NextResponse.json(
      { success: true, message: 'Session cleared' }, // Return success to ensure logout completes
      { status: 200 }
    );

    clearSessionCookies(response);
    return response;
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
