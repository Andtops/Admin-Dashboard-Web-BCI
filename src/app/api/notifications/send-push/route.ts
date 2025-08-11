import { NextRequest, NextResponse } from 'next/server';
import {
  sendUserPushNotification,
  sendBulkPushNotifications,
} from '../../../../lib/firebase-admin';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Log notification to Convex database
    const logId = await convex.mutation(api.notifications.logPushNotification, {
      target: tokens.length === 1 ? 'single' : 'multiple',
      title,
      body: messageBody,
      data: data || {},
      result: {
        success: result.success,
        message: result.message || 'Push notification sent',
        successCount: 'successCount' in result ? (result.successCount || 0) : (result.success ? 1 : 0),
        failureCount: 'failureCount' in result ? (result.failureCount || 0) : (result.success ? 0 : 1),
      },
      sentAt: Date.now(),
    });

    console.log('✅ Push notification sent and logged to Convex:', {
      target: tokens.length === 1 ? 'single' : 'multiple',
      title,
      body: messageBody,
      tokens: tokens.length,
      result,
      logId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      result,
      logId,
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
