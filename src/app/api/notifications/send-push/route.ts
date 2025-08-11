import { NextRequest, NextResponse } from 'next/server';
import {
  sendUserPushNotification,
  sendBulkPushNotifications,
} from '../../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokens, // direct tokens
      title,
      body: messageBody,
      data,
      imageUrl,
      clickAction
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'FCM tokens are required' },
        { status: 400 }
      );
    }

    let result;

    if (tokens.length === 1) {
      // Single notification
      result = await sendUserPushNotification({
        token: tokens[0],
        title,
        body: messageBody,
        data,
        imageUrl,
        clickAction,
      });
    } else {
      // Multiple notifications
      result = await sendBulkPushNotifications({
        tokens,
        title,
        body: messageBody,
        data,
        imageUrl,
        clickAction,
      });
    }

    // Log notification (simple console log for now)
    console.log('Push notification sent:', {
      target: tokens.length === 1 ? 'single' : 'multiple',
      title,
      body: messageBody,
      tokens: tokens.length,
      result,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Push notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send push notification' 
      },
      { status: 500 }
    );
  }
}
