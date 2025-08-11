import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Try to send a minimal test message to validate the token
    const testMessage = {
      data: {
        test: 'validation',
        timestamp: new Date().toISOString()
      },
      token: token
    };

    try {
      const response = await messaging.send(testMessage);
      
      return NextResponse.json({
        success: true,
        valid: true,
        messageId: response,
        message: 'Token is valid and test message sent',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      let errorMessage = 'Unknown error';
      const valid = false;

      if (error.code === 'messaging/registration-token-not-registered') {
        errorMessage = 'Token is not registered or has expired';
      } else if (error.code === 'messaging/invalid-registration-token') {
        errorMessage = 'Token format is invalid';
      } else if (error.code === 'messaging/mismatched-credential') {
        errorMessage = 'Service account credentials mismatch';
      } else {
        errorMessage = error.message || 'Failed to validate token';
      }

      return NextResponse.json({
        success: false,
        valid: false,
        error: errorMessage,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error validating FCM token:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'FCM token validation endpoint',
    usage: {
      method: 'POST',
      body: {
        token: 'your_fcm_token_here'
      }
    }
  });
}