/**
 * Notification utilities for Brevo email integration and Firebase push notifications
 * Handles email notifications and push notifications for user management actions
 */

import {
  sendPushNotification,
  sendMulticastPushNotification,
  PushNotificationData,
  NotificationTarget,
  NotificationOptions
} from './firebase-messaging';

export interface NotificationData {
  type: 'user_approved' | 'user_rejected' | 'user_updated' | 'admin_action';
  userId: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
  customMessage?: string;
  rejectionReason?: string;
  timestamp: string;
  adminEmail?: string;
  adminName?: string;
  source: string;
  version: string;
  environment: string;
  userBusinessInfo?: {
    businessName?: string;
    gstNumber?: string;
    isGstVerified?: boolean;
    constitutionOfBusiness?: string;
    principalPlaceOfBusiness?: string;
  };
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  timestamp: string;
  messageId?: string;
}

export interface BrevoEmailData {
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: {
    email: string;
    name: string;
  };
  replyTo?: {
    email: string;
    name?: string;
  };
  tags?: string[];
}

/**
 * Send email notification via Brevo API
 */
export async function sendBrevoEmail(emailData: BrevoEmailData): Promise<NotificationResponse> {
  const startTime = Date.now();
  
  try {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
      console.warn('Brevo API key not configured. Skipping email notification.');
      return {
        success: false,
        message: 'Brevo API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@benzochem.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Benzochem Industries';

    const payload = {
      ...emailData,
      sender: emailData.sender || {
        email: senderEmail,
        name: senderName,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    const processingTime = Date.now() - startTime;

    if (response.ok) {
      const result = await response.json();
      console.log(`Brevo email sent successfully in ${processingTime}ms`);
      return {
        success: true,
        message: 'Email sent successfully via Brevo',
        timestamp: new Date().toISOString(),
        messageId: result.messageId,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Brevo API returned non-OK status:', response.status, errorData);
      
      return {
        success: false,
        message: `Brevo API returned status ${response.status}: ${errorData.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`Brevo request timed out after ${processingTime}ms`);
        return {
          success: false,
          message: 'Request timed out',
          timestamp: new Date().toISOString(),
        };
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('Brevo service is not available');
        return {
          success: false,
          message: 'Brevo service unavailable',
          timestamp: new Date().toISOString(),
        };
      } else {
        console.warn('Brevo notification failed:', error.message);
        return {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      console.warn('Brevo notification failed with unknown error');
      return {
        success: false,
        message: 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Generate HTML content for user approval email
 */
function generateApprovalEmailHTML(params: {
  userName: string;
  customMessage?: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): string {
  const { userName, customMessage, userBusinessInfo } = params;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved - Benzochem Industries</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0f766e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .success-icon { color: #10b981; font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <h2>Welcome to Benzochem Industries, ${userName}!</h2>
          <p>Great news! Your account has been approved and you now have full access to our platform.</p>
          
          ${customMessage ? `
            <div style="background: #e0f2fe; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
              <h3>Personal Message:</h3>
              <p>${customMessage}</p>
            </div>
          ` : ''}
          
          ${userBusinessInfo?.businessName ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3>Your Business Information:</h3>
              <p><strong>Business Name:</strong> ${userBusinessInfo.businessName}</p>
              ${userBusinessInfo.gstNumber ? `<p><strong>GST Number:</strong> ${userBusinessInfo.gstNumber}</p>` : ''}
              ${userBusinessInfo.isGstVerified ? '<p><span style="color: #10b981;">✓ GST Verified</span></p>' : ''}
            </div>
          ` : ''}
          
          <h3>What's Next?</h3>
          <ul>
            <li>Log in to your account to access all features</li>
            <li>Browse our product catalog</li>
            <li>Request quotations for your business needs</li>
            <li>Contact our support team if you need assistance</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://benzochem.com/login" class="button">Login to Your Account</a>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent by Benzochem Industries. If you have any questions, please contact our support team.</p>
          <p>&copy; ${new Date().getFullYear()} Benzochem Industries. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML content for user rejection email
 */
function generateRejectionEmailHTML(params: {
  userName: string;
  rejectionReason: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): string {
  const { userName, rejectionReason, userBusinessInfo } = params;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Application Update - Benzochem Industries</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #0f766e; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .warning-icon { color: #dc2626; font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Application Update</h1>
        </div>
        <div class="content">
          <div class="warning-icon">⚠️</div>
          <h2>Hello ${userName},</h2>
          <p>Thank you for your interest in Benzochem Industries. After reviewing your application, we are unable to approve your account at this time.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <h3>Reason for Rejection:</h3>
            <p>${rejectionReason}</p>
          </div>
          
          ${userBusinessInfo?.businessName ? `
            <div style="background: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <h3>Application Details:</h3>
              <p><strong>Business Name:</strong> ${userBusinessInfo.businessName}</p>
              ${userBusinessInfo.gstNumber ? `<p><strong>GST Number:</strong> ${userBusinessInfo.gstNumber}</p>` : ''}
            </div>
          ` : ''}
          
          <h3>What You Can Do:</h3>
          <ul>
            <li>Review the rejection reason above</li>
            <li>Address any issues mentioned</li>
            <li>Contact our support team for clarification</li>
            <li>Reapply once you've resolved the issues</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@benzochem.com" class="button">Contact Support</a>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent by Benzochem Industries. If you have any questions, please contact our support team.</p>
          <p>&copy; ${new Date().getFullYear()} Benzochem Industries. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send user approval notification
 */
export async function sendUserApprovalNotification(params: {
  userId: string;
  userEmail: string;
  userPhone?: string;
  userName: string;
  customMessage?: string;
  adminEmail: string;
  adminName: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): Promise<NotificationResponse> {
  const emailData: BrevoEmailData = {
    to: [
      {
        email: params.userEmail,
        name: params.userName,
      },
    ],
    subject: '🎉 Your Benzochem Industries Account Has Been Approved!',
    htmlContent: generateApprovalEmailHTML({
      userName: params.userName,
      customMessage: params.customMessage,
      userBusinessInfo: params.userBusinessInfo,
    }),
    textContent: `Hello ${params.userName},

Great news! Your Benzochem Industries account has been approved and you now have full access to our platform.

${params.customMessage ? `Personal Message: ${params.customMessage}` : ''}

What's Next:
- Log in to your account to access all features
- Browse our product catalog
- Request quotations for your business needs
- Contact our support team if you need assistance

Login at: https://benzochem.com/login

Best regards,
Benzochem Industries Team`,
    tags: ['user-approval', 'account-management'],
  };

  return sendBrevoEmail(emailData);
}

/**
 * Send user rejection notification
 */
export async function sendUserRejectionNotification(params: {
  userId: string;
  userEmail: string;
  userPhone?: string;
  userName: string;
  rejectionReason: string;
  adminEmail: string;
  adminName: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): Promise<NotificationResponse> {
  const emailData: BrevoEmailData = {
    to: [
      {
        email: params.userEmail,
        name: params.userName,
      },
    ],
    subject: 'Benzochem Industries Account Application Update',
    htmlContent: generateRejectionEmailHTML({
      userName: params.userName,
      rejectionReason: params.rejectionReason,
      userBusinessInfo: params.userBusinessInfo,
    }),
    textContent: `Hello ${params.userName},

Thank you for your interest in Benzochem Industries. After reviewing your application, we are unable to approve your account at this time.

Reason for Rejection: ${params.rejectionReason}

What You Can Do:
- Review the rejection reason above
- Address any issues mentioned
- Contact our support team for clarification
- Reapply once you've resolved the issues

Contact Support: support@benzochem.com

Best regards,
Benzochem Industries Team`,
    tags: ['user-rejection', 'account-management'],
  };

  return sendBrevoEmail(emailData);
}

/**
 * Send admin action notification
 */
export async function sendAdminActionNotification(params: {
  type: 'user_updated' | 'admin_action';
  userId?: string;
  userEmail?: string;
  userName?: string;
  adminEmail: string;
  adminName: string;
  action: string;
  details?: Record<string, any>;
}): Promise<NotificationResponse> {
  // For admin actions, we might want to send internal notifications
  // This is a placeholder for future admin notification requirements
  console.log('Admin action logged:', params);
  
  return {
    success: true,
    message: 'Admin action logged successfully',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate notification data
 */
export function validateNotificationData(data: Partial<NotificationData>): string[] {
  const errors: string[] = [];
  
  if (!data.type) {
    errors.push('Notification type is required');
  }
  
  if (!data.userId) {
    errors.push('User ID is required');
  }
  
  if (data.type === 'user_approved' || data.type === 'user_rejected') {
    if (!data.userEmail) {
      errors.push('User email is required for user notifications');
    }
    
    if (!data.userName) {
      errors.push('User name is required for user notifications');
    }
    
    if (data.type === 'user_rejected' && !data.rejectionReason) {
      errors.push('Rejection reason is required for rejection notifications');
    }
  }
  
  return errors;
}

/**
 * Format user business info for notifications
 */
export function formatUserBusinessInfo(user: any): NotificationData['userBusinessInfo'] {
  if (!user) return undefined;
  
  return {
    businessName: user.businessName,
    gstNumber: user.gstNumber,
    isGstVerified: user.isGstVerified || false,
    constitutionOfBusiness: user.constitutionOfBusiness,
    principalPlaceOfBusiness: user.principalPlaceOfBusiness,
  };
}

/**
 * Send push notification to user
 */
export async function sendUserPushNotification(params: {
  userToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  priority?: 'normal' | 'high';
}): Promise<NotificationResponse> {
  try {
    const notificationData: PushNotificationData = {
      title: params.title,
      body: params.body,
      data: params.data,
      imageUrl: params.imageUrl,
      clickAction: params.clickAction,
    };

    const target: NotificationTarget = {
      token: params.userToken,
    };

    const options: NotificationOptions = {
      priority: params.priority || 'high',
      channelId: 'benzochem_notifications',
    };

    const result = await sendPushNotification(target, notificationData, options);

    return {
      success: result.success,
      message: result.success ? 'Push notification sent successfully' : result.error || 'Failed to send push notification',
      timestamp: new Date().toISOString(),
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendMultipleUsersPushNotification(params: {
  userTokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  priority?: 'normal' | 'high';
}): Promise<NotificationResponse & { successCount: number; failureCount: number }> {
  try {
    const notificationData: PushNotificationData = {
      title: params.title,
      body: params.body,
      data: params.data,
      imageUrl: params.imageUrl,
      clickAction: params.clickAction,
    };

    const options: NotificationOptions = {
      priority: params.priority || 'high',
      channelId: 'benzochem_notifications',
    };

    const result = await sendMulticastPushNotification(params.userTokens, notificationData, options);

    return {
      success: result.success,
      message: `Push notifications sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
      timestamp: new Date().toISOString(),
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  } catch (error) {
    console.error('Error sending multicast push notification:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      successCount: 0,
      failureCount: params.userTokens.length,
    };
  }
}

/**
 * Send combined email and push notification for user approval
 */
export async function sendUserApprovalNotifications(params: {
  userId: string;
  userEmail: string;
  userPhone?: string;
  userName: string;
  userToken?: string;
  customMessage?: string;
  adminEmail: string;
  adminName: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): Promise<{ email: NotificationResponse; push?: NotificationResponse }> {
  // Send email notification
  const emailResult = await sendUserApprovalNotification(params);

  let pushResult: NotificationResponse | undefined;

  // Send push notification if token is available
  if (params.userToken) {
    pushResult = await sendUserPushNotification({
      userToken: params.userToken,
      title: '🎉 Account Approved!',
      body: `Welcome to Benzochem Industries, ${params.userName}! Your account has been approved.`,
      data: {
        type: 'user_approval',
        userId: params.userId,
        action: 'account_approved',
      },
      clickAction: '/dashboard',
      priority: 'high',
    });
  }

  return {
    email: emailResult,
    push: pushResult,
  };
}

/**
 * Send combined email and push notification for user rejection
 */
export async function sendUserRejectionNotifications(params: {
  userId: string;
  userEmail: string;
  userPhone?: string;
  userName: string;
  userToken?: string;
  rejectionReason: string;
  adminEmail: string;
  adminName: string;
  userBusinessInfo?: NotificationData['userBusinessInfo'];
}): Promise<{ email: NotificationResponse; push?: NotificationResponse }> {
  // Send email notification
  const emailResult = await sendUserRejectionNotification(params);

  let pushResult: NotificationResponse | undefined;

  // Send push notification if token is available
  if (params.userToken) {
    pushResult = await sendUserPushNotification({
      userToken: params.userToken,
      title: 'Account Application Update',
      body: `Your Benzochem Industries account application requires attention. Please check your email for details.`,
      data: {
        type: 'user_rejection',
        userId: params.userId,
        action: 'account_rejected',
      },
      clickAction: '/support',
      priority: 'high',
    });
  }

  return {
    email: emailResult,
    push: pushResult,
  };
}

// Test functions removed for production