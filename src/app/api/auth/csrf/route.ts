import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const csrfToken = generateCSRFToken();

    // Create response with the token
    const response = NextResponse.json({
      success: true,
      csrfToken,
    });

    // Set the CSRF token in a cookie
    setCSRFCookie(response, csrfToken);

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
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
