import { NextRequest, NextResponse } from 'next/server';
import { sendUserPushNotification } from '@/lib/firebase-admin';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required for testing' },
        { status: 400 }
      );
    }

    console.log('🧪 TEST NOTIFICATION SEND');
    console.log('Token:', token);
    console.log('Title:', title || 'Test Notification');
    console.log('Body:', messageBody || 'This is a test notification from BenzoChem Industries Admin Dashboard');
    console.log('Data:', data || {});

    // Send actual Firebase notification with enhanced configuration
    const notificationData = {
      token,
      title: title || 'Test Notification',
      body: messageBody || 'This is a test notification from BenzoChem Industries Admin Dashboard',
      data: data || {
        category: 'test',
        actionUrl: 'benzochem://notifications',
        customData: JSON.stringify({ 
          test: true, 
          timestamp: new Date().toISOString() 
        })
      },
      clickAction: 'benzochem://notifications'
    };

    const response = await sendUserPushNotification(notificationData);

    // Log notification to Convex database
    const logId = await convex.mutation(api.notifications.logPushNotification, {
      target: 'single',
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data,
      result: {
        success: response.success,
        message: response.success ? 'Test notification sent successfully' : (response.error || 'Failed to send notification'),
        successCount: response.success ? 1 : 0,
        failureCount: response.success ? 0 : 1,
      },
      sentAt: Date.now(),
    });

    if (response.success) {
      console.log('✅ Notification sent successfully and logged to Convex:', {
        messageId: response.messageId,
        logId
      });
      return NextResponse.json({
        success: true,
        messageId: response.messageId,
        logId,
        message: 'Test notification sent successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to send notification but logged to Convex:', {
        error: response.error,
        logId
      });
      return NextResponse.json(
        { 
          success: false, 
          error: response.error || 'Failed to send notification',
          logId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Push notification test endpoint is ready',
    endpoints: {
      test: 'POST /api/notifications/test - Send test notification',
      register: 'POST /api/notifications/register-token - Register FCM token',
      campaigns: 'GET/POST /api/notifications/campaigns - Manage campaigns',
      analytics: 'GET /api/notifications/analytics - Get analytics data'
    },
    instructions: {
      testNotification: {
        method: 'POST',
        url: '/api/notifications/test',
        body: {
          token: 'your_fcm_token_here',
          title: 'Test Title',
          body: 'Test message body',
          data: {
            category: 'test',
            actionUrl: 'benzochem://test'
          }
        }
      }
    }
  });
}
