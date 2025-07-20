import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Session configuration
const SESSION_COOKIE_NAME = 'benzochem-admin-session';
const CSRF_COOKIE_NAME = 'benzochem-csrf-token';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CSRF_TOKEN_LENGTH = 32;

// Get JWT secret from environment variable
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

// Get session encryption key from environment variable
function getSessionKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return secret;
}

// Admin session data interface
export interface AdminSession {
  adminId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  isActive: boolean;
  loginTime: number;
  expiresAt: number;
}

// CSRF token generation
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create JWT token for session
export async function createSessionToken(adminData: Omit<AdminSession, 'loginTime' | 'expiresAt'>): Promise<string> {
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION;
  
  const payload: AdminSession & Record<string, any> = {
    ...adminData,
    loginTime: now,
    expiresAt,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now / 1000)
    .setExpirationTime(expiresAt / 1000)
    .setIssuer('benzochem-admin')
    .setAudience('benzochem-admin-dashboard')
    .sign(getJWTSecret());

  return token;
}

// Verify and decode JWT token
export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    console.log('verifySessionToken: Verifying token...');
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      issuer: 'benzochem-admin',
      audience: 'benzochem-admin-dashboard',
    });

    const session = payload as unknown as AdminSession;
    console.log('verifySessionToken: Token verified, checking expiration...');
    console.log('verifySessionToken: Session expires at:', new Date(session.expiresAt));
    console.log('verifySessionToken: Current time:', new Date());

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      console.log('verifySessionToken: Session has expired');
      return null;
    }

    console.log('verifySessionToken: Session is valid');
    return session;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}

// Set secure session cookie
export function setSessionCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction, // Only use secure in production (HTTPS)
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

// Set CSRF token cookie
export function setCSRFCookie(response: NextResponse, csrfToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // CSRF token needs to be accessible to client-side JavaScript
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

// Get session from request cookies
export async function getSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  console.log('getSessionFromRequest: Token found:', !!token);

  if (!token) {
    console.log('getSessionFromRequest: No token found');
    return null;
  }

  const session = await verifySessionToken(token);
  console.log('getSessionFromRequest: Session verified:', !!session);
  return session;
}

// Get session from server-side cookies
export async function getServerSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }

  return await verifySessionToken(token);
}

// Clear session cookies
export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(CSRF_COOKIE_NAME);
}

// Validate CSRF token
export function validateCSRFToken(request: NextRequest, providedToken: string): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  return cookieToken === providedToken && cookieToken !== undefined;
}

// Session cookie configuration for iron-session (alternative approach)
export const sessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: getSessionKey(),
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION / 1000,
  },
};

// Type for iron-session
declare module 'iron-session' {
  interface IronSessionData {
    admin?: AdminSession;
    csrfToken?: string;
  }
}

// Refresh session token (extend expiration)
export async function refreshSessionToken(currentToken: string): Promise<string | null> {
  const session = await verifySessionToken(currentToken);
  
  if (!session) {
    return null;
  }

  // Create new token with extended expiration
  const refreshedSession: Omit<AdminSession, 'loginTime' | 'expiresAt'> = {
    adminId: session.adminId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    role: session.role,
    permissions: session.permissions,
    isActive: session.isActive,
  };

  return await createSessionToken(refreshedSession);
}
