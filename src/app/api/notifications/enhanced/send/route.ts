import { NextRequest, NextResponse } from 'next/server';
import { EnhancedNotificationSender } from '../../../../../lib/enhanced-notification-sender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...params } = body;

    console.log('📤 Enhanced notification request:', { type, params });

    let result;

    switch (type) {
      case 'account_approval':
        result = await EnhancedNotificationSender.sendAccountApprovalNotification(params);
        break;

      case 'account_rejection':
        result = await EnhancedNotificationSender.sendAccountRejectionNotification(params);
        break;

      case 'new_product':
        result = await EnhancedNotificationSender.sendNewProductNotification(params);
        break;

      case 'order_update':
        result = await EnhancedNotificationSender.sendOrderUpdateNotification(params);
        break;

      case 'quotation_update':
        result = await EnhancedNotificationSender.sendQuotationUpdateNotification(params);
        break;

      case 'promotion':
        result = await EnhancedNotificationSender.sendPromotionalNotification(params);
        break;

      case 'system':
        result = await EnhancedNotificationSender.sendSystemNotification(params);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Enhanced notification sent successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced notification API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Notification API',
    version: '1.0.0',
    supportedTypes: [
      'account_approval',
      'account_rejection', 
      'new_product',
      'order_update',
      'quotation_update',
      'promotion',
      'system'
    ],
    timestamp: new Date().toISOString()
  });
}