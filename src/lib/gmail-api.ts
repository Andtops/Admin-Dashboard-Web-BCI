/**
 * Gmail API Service
 * Direct Gmail API integration for sending emails
 * Uses OAuth2 for secure authentication with professional email templates
 */

import { google } from 'googleapis';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
  method: 'gmail-api';
  recipient?: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  gstNumber?: string;
  isGstVerified?: boolean;
}

export interface ApprovalEmailParams {
  user: UserInfo;
  customMessage?: string;
  loginUrl?: string;
}

export interface RejectionEmailParams {
  user: UserInfo;
  rejectionReason: string;
  customMessage?: string;
  supportUrl?: string;
}

/**
 * Create Gmail API client using OAuth2
 */
function createGmailClient() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'http://localhost:3001/auth/gmail/callback'
    );

    // Set credentials using refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error('❌ Failed to create Gmail client:', error);
    throw new Error('Gmail client initialization failed');
  }
}

/**
 * Create email message in RFC 2822 format
 */
function createEmailMessage(emailData: EmailData): string {
  const { to, subject, html, text } = emailData;
  const from = process.env.EMAIL_FROM || 'benzochem.inds@gmail.com';
  const replyTo = process.env.EMAIL_REPLY_TO || 'support@benzochem.com';

  const messageParts = [
    `From: Benzochem Industries <${from}>`,
    `Reply-To: ${replyTo}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="benzochem-email-boundary"',
    'X-Mailer: Benzochem Industries Email Service',
    '',
    '--benzochem-email-boundary',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || stripHtmlTags(html),
    '',
    '--benzochem-email-boundary',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    '--benzochem-email-boundary--'
  ];

  return messageParts.join('\n');
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send email via Gmail API
 */
export async function sendGmailEmail(emailData: EmailData): Promise<EmailResult> {
  const startTime = Date.now();

  try {
    console.log('📧 Preparing to send email via Gmail API:', {
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
    });

    const gmail = createGmailClient();
    const emailMessage = createEmailMessage(emailData);

    // Encode message in base64url format (Gmail API requirement)
    const encodedMessage = Buffer.from(emailMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    const duration = Date.now() - startTime;

    console.log('✅ Gmail API email sent successfully:', {
      messageId: response.data.id,
      recipient: emailData.to,
      duration: `${duration}ms`,
    });

    return {
      success: true,
      messageId: response.data.id || 'gmail-api-success',
      timestamp: new Date().toISOString(),
      method: 'gmail-api',
      recipient: emailData.to,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Gmail API sending failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipient: emailData.to,
      duration: `${duration}ms`,
    });

    let errorMessage = 'Gmail API error';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific Gmail API errors
      if (error.message.includes('invalid_grant')) {
        errorMessage = 'Gmail authentication failed - refresh token may be expired';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Gmail API quota exceeded';
      } else if (error.message.includes('rate')) {
        errorMessage = 'Gmail API rate limit exceeded';
      }
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      method: 'gmail-api',
      recipient: emailData.to,
    };
  }
}

/**
 * Send user approval email with professional template
 */
export async function sendApprovalEmailGmail(params: {
  userEmail: string;
  userName: string;
  customMessage?: string;
  businessInfo?: {
    businessName?: string;
    gstNumber?: string;
    isGstVerified?: boolean;
  };
}): Promise<EmailResult> {
  // Convert userName to firstName/lastName
  const nameParts = params.userName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const userInfo: UserInfo = {
    firstName,
    lastName,
    email: params.userEmail,
    businessName: params.businessInfo?.businessName,
    gstNumber: params.businessInfo?.gstNumber,
    isGstVerified: params.businessInfo?.isGstVerified,
  };

  const html = generateProfessionalApprovalEmailHTML({
    user: userInfo,
    customMessage: params.customMessage,
  });

  return sendGmailEmail({
    to: params.userEmail,
    subject: 'Welcome to Benzochem Industries - Account Approved',
    html,
  });
}

/**
 * Send user rejection email with professional template
 */
export async function sendRejectionEmailGmail(params: {
  userEmail: string;
  userName: string;
  rejectionReason: string;
  customMessage?: string;
  businessInfo?: {
    businessName?: string;
    gstNumber?: string;
  };
}): Promise<EmailResult> {
  // Convert userName to firstName/lastName
  const nameParts = params.userName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const userInfo: UserInfo = {
    firstName,
    lastName,
    email: params.userEmail,
    businessName: params.businessInfo?.businessName,
    gstNumber: params.businessInfo?.gstNumber,
  };

  const html = generateProfessionalRejectionEmailHTML({
    user: userInfo,
    rejectionReason: params.rejectionReason,
    customMessage: params.customMessage,
  });

  return sendGmailEmail({
    to: params.userEmail,
    subject: 'Update on Your Benzochem Industries Application',
    html,
  });
}

/**
 * Generate professional approval email HTML with Vanilla Latte design system
 */
function generateProfessionalApprovalEmailHTML(params: ApprovalEmailParams): string {
  const { user, customMessage, loginUrl } = params;
  const appUrl = loginUrl || process.env.NEXT_PUBLIC_USER_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Benzochem Industries</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3d4852; background-color: #f5f3f0;">
    
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 20px 0; background-color: #f5f3f0;">
        <tr>
            <td style="padding: 0;">
                
                <!-- Main Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #faf8f5; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e8e3dc;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); padding: 40px 32px; text-align: center; color: white; border-radius: 12px 12px 0 0; position: relative;">
                            <div style="width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; font-weight: 700; color: white;">B</div>
                            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Welcome to Benzochem Industries</h1>
                            <p style="margin: 0; font-size: 16px; opacity: 0.9; font-weight: 400;">Your journey with premium chemicals begins here</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            
                            <!-- Welcome Message -->
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #3d4852;">Welcome, ${user.firstName}!</h2>
                            
                            <!-- Success Icon -->
                            <div style="text-align: center; margin: 24px 0;">
                                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #68d391 0%, #48bb78 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; color: white; box-shadow: 0 8px 24px rgba(104, 211, 145, 0.3);">✓</div>
                            </div>
                            
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.7;">
                                Congratulations! Your account has been approved and you now have full access to our premium chemical products and services. We're excited to have you join our community of professionals in the chemical industry.
                            </p>
                            
                            ${customMessage ? `
                            <!-- Custom Message -->
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 8px;">🎉 Personal Message from Our Team</div>
                                <div style="font-size: 14px; color: #5a6c7d; line-height: 1.6;">${customMessage}</div>
                            </div>
                            ` : ''}
                            
                            <!-- Account Details -->
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 16px;">Account Information</div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e3dc;">
                                    <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Full Name</span>
                                    <span style="font-size: 14px; color: #3d4852; font-weight: 600;">${user.firstName} ${user.lastName}</span>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e3dc;">
                                    <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Email Address</span>
                                    <span style="font-size: 14px; color: #3d4852; font-weight: 600;">${user.email}</span>
                                </div>
                                
                                ${user.businessName ? `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e8e3dc;">
                                    <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Business Name</span>
                                    <span style="font-size: 14px; color: #3d4852; font-weight: 600;">${user.businessName}</span>
                                </div>
                                ` : ''}
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                                    <span style="font-size: 14px; color: #6b7280; font-weight: 500;">Account Status</span>
                                    <span style="display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: #d4edda; color: #155724;">✓ Approved</span>
                                </div>
                            </div>
                            
                            <!-- Features -->
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 8px;">🎉 You can now:</div>
                                <div style="font-size: 14px; color: #5a6c7d; line-height: 1.6;">
                                    <strong>• Browse Products:</strong> Access our complete catalog of chemical products<br>
                                    <strong>• Request Quotations:</strong> Get competitive pricing for bulk orders<br>
                                    <strong>• Track Orders:</strong> Monitor your order status and delivery updates<br>
                                    <strong>• Premium Support:</strong> Get priority customer service
                                </div>
                            </div>
                            
                            <!-- Features Grid -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                                <tr>
                                    <td style="width: 50%; padding: 0 8px 16px 0; vertical-align: top;">
                                        <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-bottom: 12px;">📋</div>
                                            <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400;">Browse our complete chemical product catalog with detailed specifications</div>
                                        </div>
                                    </td>
                                    <td style="width: 50%; padding: 0 0 16px 8px; vertical-align: top;">
                                        <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-bottom: 12px;">💼</div>
                                            <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400;">Submit quotation requests and manage your orders seamlessly</div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width: 50%; padding: 0 8px 0 0; vertical-align: top;">
                                        <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-bottom: 12px;">⚙️</div>
                                            <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400;">Access technical documentation and compliance information</div>
                                        </div>
                                    </td>
                                    <td style="width: 50%; padding: 0 0 0 8px; vertical-align: top;">
                                        <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-bottom: 12px;">👤</div>
                                            <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400;">Manage your account preferences and business information</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(74, 124, 89, 0.3);">Access Your Dashboard</a>
                            </div>
                            
                            <!-- Divider -->
                            <div style="height: 1px; background: linear-gradient(to right, transparent, #e8e3dc, transparent); margin: 24px 0;"></div>
                            
                            <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.7;">
                                Our dedicated support team is ready to assist you with any questions or help you get started. We're committed to providing you with exceptional service and premium chemical solutions.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f0f4f8; padding: 32px; text-align: center; border-top: 1px solid #e8e3dc; border-radius: 0 0 12px 12px;">
                            <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                                <strong style="font-weight: 700; color: #3d4852;">Benzochem Industries</strong><br>
                                Premium Chemical Solutions & Trading<br>
                                E-45 Jitali Road<br>
                                Phone: +91 83206 67594<br>
                                Email: benzochem.inds@gmail.com
                            </div>
                            
                            <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

/**
 * Generate professional rejection email HTML with Vanilla Latte design system
 */
function generateProfessionalRejectionEmailHTML(params: RejectionEmailParams): string {
  const { user, rejectionReason, customMessage, supportUrl } = params;
  const supportLink = supportUrl || process.env.NEXT_PUBLIC_SUPPORT_URL || 'mailto:support@benzochem.com';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update - Benzochem Industries</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3d4852; background-color: #f5f3f0;">
    
    <!-- Email Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 20px 0; background-color: #f5f3f0;">
        <tr>
            <td style="padding: 0;">
                
                <!-- Main Content -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #faf8f5; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e8e3dc;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6b7280 0%, #7c8a96 100%); padding: 40px 32px; text-align: center; color: white; border-radius: 12px 12px 0 0; position: relative;">
                            <div style="width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; font-weight: 700; color: white;">B</div>
                            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Application Update</h1>
                            <p style="margin: 0; font-size: 16px; opacity: 0.9; font-weight: 400;">Thank you for your interest</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            
                            <!-- Welcome Message -->
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #3d4852;">Hello, ${user.firstName}!</h2>
                            
                            <!-- Status Icon -->
                            <div style="text-align: center; margin: 24px 0;">
                                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; color: white; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);">⚠</div>
                            </div>
                            
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.7;">
                                Thank you for your interest in Benzochem Industries and for taking the time to submit your application. After careful consideration and thorough review by our team, we regret to inform you that we are unable to approve your account at this time.
                            </p>
                            
                            <!-- Rejection Reason -->
                            <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #d97706; margin-bottom: 8px;">📋 Reason for Our Decision</div>
                                <div style="font-size: 14px; color: #b45309; line-height: 1.6;">${rejectionReason}</div>
                            </div>
                            
                            ${customMessage ? `
                            <!-- Custom Message -->
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 8px;">💬 Additional Information from Our Team</div>
                                <div style="font-size: 14px; color: #5a6c7d; line-height: 1.6;">${customMessage}</div>
                            </div>
                            ` : ''}
                            
                            <!-- Empathy Message -->
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 8px;">💡 We Understand This May Be Disappointing</div>
                                <div style="font-size: 14px; color: #5a6c7d; line-height: 1.6;">
                                    We know that receiving this news isn't what you were hoping for. Please know that this decision was made after careful consideration, and it doesn't reflect on your value as a potential partner.
                                </div>
                            </div>
                            
                            <!-- Next Steps -->
                            <h3 style="font-size: 18px; font-weight: 600; color: #3d4852; margin: 32px 0 16px 0; text-align: center;">Your Next Steps</h3>
                            
                            <div style="margin: 24px 0;">
                                <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04); display: flex; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6b7280 0%, #7c8a96 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-right: 16px; flex-shrink: 0;">📋</div>
                                    <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400; padding-top: 4px;">Review the feedback provided and consider how you might address any concerns for future applications</div>
                                </div>
                                
                                <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04); display: flex; align-items: flex-start; margin-bottom: 16px;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6b7280 0%, #7c8a96 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-right: 16px; flex-shrink: 0;">📞</div>
                                    <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400; padding-top: 4px;">Contact our support team if you have questions, need clarification, or would like guidance on next steps</div>
                                </div>
                                
                                <div style="background: #faf8f5; padding: 20px; border-radius: 8px; border: 1px solid #e8e3dc; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04); display: flex; align-items: flex-start;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6b7280 0%, #7c8a96 100%); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 18px; margin-right: 16px; flex-shrink: 0;">🔄</div>
                                    <div style="font-size: 14px; color: #6b7280; line-height: 1.5; font-weight: 400; padding-top: 4px;">You're welcome to reapply in the future if your circumstances change or you can address the concerns mentioned</div>
                                </div>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${supportLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(74, 124, 89, 0.3);">Contact Our Support Team</a>
                            </div>
                            
                            <!-- Divider -->
                            <div style="height: 1px; background: linear-gradient(to right, transparent, #e8e3dc, transparent); margin: 24px 0;"></div>
                            
                            <p style="margin: 0; font-size: 16px; color: #6b7280; line-height: 1.7;">
                                We genuinely appreciate your interest in our services and the time you invested in your application. Our team is committed to working with qualified partners, and we encourage you to reach out if you have any questions or if we can provide guidance for the future.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f0f4f8; padding: 32px; text-align: center; border-top: 1px solid #e8e3dc; border-radius: 0 0 12px 12px;">
                            <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                                <strong style="font-weight: 700; color: #3d4852;">Benzochem Industries</strong><br>
                                Premium Chemical Solutions & Trading<br>
                                E-45 Jitali Road<br>
                                Phone: +91 83206 67594<br>
                                Email: benzochem.inds@gmail.com
                            </div>
                            
                            <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
                            </div>
                        </td>
                    </tr>
                </table>
                
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

