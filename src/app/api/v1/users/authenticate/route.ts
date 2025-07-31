import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/v1/users/authenticate
 * Authenticate user login with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        },
        { status: 400 }
      );
    }

    // Authenticate with Convex
    const authResult = await convex.action(api.users_auth.authenticateUser, {
      email,
      password,
    });

    console.log('🔐 Convex auth result:', authResult);

    if (!authResult.success) {
      const responseData = {
        success: false,
        error: authResult.error || 'Authentication failed',
        code: authResult.code || (authResult.status === 'pending' ? 'PENDING_APPROVAL' : 'INVALID_CREDENTIALS'),
        status: authResult.status
      };

      console.log('🔐 Returning error response:', responseData);

      return NextResponse.json(
        responseData,
        { status: authResult.code === 'USER_NOT_FOUND' ? 404 : 401 }
      );
    }

    // Return user data (without sensitive information)
    const userData = authResult.user;

    console.log('🔐 Returning user data:', userData);

    return NextResponse.json({
      success: true,
      user: {
        id: userData.userId,
        userId: userData.userId, // Include both for compatibility
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        phone: userData.phone,
        businessName: userData.businessName,
        gstNumber: userData.gstNumber,
        isGstVerified: userData.isGstVerified,
        status: userData.status,
        role: userData.role,
        legalNameOfBusiness: userData.legalNameOfBusiness,
        tradeName: userData.tradeName,
        constitutionOfBusiness: userData.constitutionOfBusiness,
        taxpayerType: userData.taxpayerType,
        principalPlaceOfBusiness: userData.principalPlaceOfBusiness,
        gstStatus: userData.gstStatus,
        agreedToEmailMarketing: userData.agreedToEmailMarketing,
        agreedToSmsMarketing: userData.agreedToSmsMarketing,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastLoginAt: userData.lastLoginAt,
      }
    });

  } catch (error) {
    console.error('User authentication API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}