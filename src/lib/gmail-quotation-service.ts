/**
 * Gmail Quotation Email Service
 * Handles sending quotation emails using Gmail API instead of EmailJS
 */

import { sendGmailEmail, EmailData, EmailResult } from './gmail-api'

interface QuotationProduct {
  productId: string
  productName: string
  quantity: string
  unit: string
  specifications?: string
}

interface QuotationLineItem {
  itemId: string
  productId: string
  productName: string
  quantity: number
  unit: string
  specifications?: string
  notes?: string
  unitPrice?: number
  productImage?: string
}

interface AdminResponse {
  quotedBy: string
  quotedAt: number
  totalAmount?: string
  validUntil?: number
  terms?: string
  notes?: string
  gstDetails?: {
    subtotal: number
    cgstRate: number
    sgstRate: number
    igstRate: number
    cgstAmount: number
    sgstAmount: number
    igstAmount: number
    totalTax: number
  }
}

interface Quotation {
  _id: string
  userId: string
  userEmail: string
  userName: string
  userPhone?: string
  businessName?: string
  products?: QuotationProduct[]  // Legacy format
  lineItems?: QuotationLineItem[]  // New format
  additionalRequirements?: string
  deliveryLocation?: string
  urgency: "standard" | "urgent" | "asap"
  status: "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired"
  adminResponse?: AdminResponse
  createdAt: number
  updatedAt: number
}

export interface QuotationEmailResponse {
  success: boolean
  message: string
  emailService: string
  timestamp: string
  messageId?: string
}

/**
 * Send quotation status update email via Gmail API
 */
export async function sendQuotationEmailGmail(params: {
  quotation: Quotation
  status: "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired"
  adminResponse?: AdminResponse
}): Promise<QuotationEmailResponse> {
  const { quotation, status, adminResponse } = params

  try {
    const { subject, html } = generateQuotationEmailContent(quotation, status, adminResponse)
    
    const emailData: EmailData = {
      to: quotation.userEmail,
      subject,
      html
    }

    const result = await sendGmailEmail(emailData)

    return {
      success: result.success,
      message: result.success ? 'Quotation email sent successfully' : result.error || 'Failed to send email',
      emailService: 'Gmail API',
      timestamp: result.timestamp,
      messageId: result.messageId
    }

  } catch (error) {
    console.error('Gmail quotation email failed:', error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      emailService: 'Gmail API',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Send new quotation notification to admin via Gmail API
 */
export async function sendNewQuotationNotificationGmail(params: {
  quotation: Quotation
  adminEmail: string
  adminName: string
}): Promise<QuotationEmailResponse> {
  const { quotation, adminEmail, adminName } = params

  try {
    const { subject, html } = generateAdminNotificationContent(quotation, adminName)
    
    const emailData: EmailData = {
      to: adminEmail,
      subject,
      html
    }

    const result = await sendGmailEmail(emailData)

    return {
      success: result.success,
      message: result.success ? 'Admin notification sent successfully' : result.error || 'Failed to send notification',
      emailService: 'Gmail API',
      timestamp: result.timestamp,
      messageId: result.messageId
    }

  } catch (error) {
    console.error('Gmail admin notification failed:', error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      emailService: 'Gmail API',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Send quotation reminder email to customer
 */
export async function sendQuotationReminderGmail(params: {
  quotation: Quotation
  reminderType: "quote_pending" | "quote_expiring"
}): Promise<QuotationEmailResponse> {
  const { quotation, reminderType } = params

  try {
    let subject: string
    let html: string

    switch (reminderType) {
      case "quote_pending":
        subject = "Quotation Awaiting Your Response - Benzochem Industries"
        html = generateReminderEmailHTML(
          quotation, 
          "We sent you a quotation recently and wanted to follow up to see if you have any questions.",
          "Please log in to your account to review the quotation details and let us know how you'd like to proceed.",
          "We're here to help if you need any clarification!"
        )
        break

      case "quote_expiring":
        subject = "Your Quotation is Expiring Soon - Benzochem Industries"
        html = generateReminderEmailHTML(
          quotation,
          "This is a friendly reminder that your quotation will expire soon.",
          "If you're still interested in the products, please respond soon or we can provide you with an updated quote.",
          "Don't miss out on this opportunity!"
        )
        break

      default:
        throw new Error(`Unsupported reminder type: ${reminderType}`)
    }

    const emailData: EmailData = {
      to: quotation.userEmail,
      subject,
      html
    }

    const result = await sendGmailEmail(emailData)

    return {
      success: result.success,
      message: result.success ? 'Reminder email sent successfully' : result.error || 'Failed to send reminder',
      emailService: 'Gmail API',
      timestamp: result.timestamp,
      messageId: result.messageId
    }

  } catch (error) {
    console.error('Gmail reminder email failed:', error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      emailService: 'Gmail API',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Helper function to generate products HTML from either format
 */
function getProductsHtml(quotation: Quotation): string {
  // Handle new lineItems format
  if (quotation.lineItems && quotation.lineItems.length > 0) {
    return quotation.lineItems.map(item => 
      `<li><strong>${item.productName}</strong> - ${item.quantity} ${item.unit}${item.specifications ? ` (${item.specifications})` : ''}</li>`
    ).join('')
  }
  
  // Handle legacy products format
  if (quotation.products && quotation.products.length > 0) {
    return quotation.products.map(p => 
      `<li><strong>${p.productName}</strong> - ${p.quantity} ${p.unit}${p.specifications ? ` (${p.specifications})` : ''}</li>`
    ).join('')
  }
  
  // Fallback if no products found
  return '<li>No products specified</li>'
}

/**
 * Generate quotation email content based on status
 */
function generateQuotationEmailContent(
  quotation: Quotation, 
  status: string, 
  adminResponse?: AdminResponse
): { subject: string; html: string } {
  const productsHtml = getProductsHtml(quotation)

  const loginUrl = process.env.NEXT_PUBLIC_USER_APP_URL || 'https://benzochem.com/login'

  switch (status) {
    case 'processing':
      return {
        subject: 'Your Quotation Request is Being Processed - Benzochem Industries',
        html: generateProcessingEmailHTML(quotation, productsHtml, loginUrl)
      }

    case 'quoted':
      return {
        subject: 'Your Quotation is Ready! - Benzochem Industries',
        html: generateQuotedEmailHTML(quotation, productsHtml, adminResponse, loginUrl)
      }

    case 'accepted':
      return {
        subject: 'Quotation Accepted - Next Steps - Benzochem Industries',
        html: generateAcceptedEmailHTML(quotation, productsHtml, loginUrl)
      }

    case 'rejected':
      return {
        subject: 'Quotation Update - Benzochem Industries',
        html: generateRejectedEmailHTML(quotation, productsHtml, loginUrl)
      }

    case 'expired':
      return {
        subject: 'Quotation Expired - Benzochem Industries',
        html: generateExpiredEmailHTML(quotation, productsHtml, loginUrl)
      }

    default:
      throw new Error(`Unsupported quotation status: ${status}`)
  }
}

/**
 * Generate admin notification content
 */
function generateAdminNotificationContent(quotation: Quotation, adminName: string): { subject: string; html: string } {
  const productsHtml = getProductsHtml(quotation)

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.benzochem.com'

  return {
    subject: `New Quotation Request - ${quotation.userName} - Benzochem Industries`,
    html: generateAdminNotificationHTML(quotation, productsHtml, adminName, adminUrl)
  }
}

/**
 * HTML Templates for different quotation statuses
 */
function generateProcessingEmailHTML(quotation: Quotation, productsHtml: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation Processing - Benzochem Industries</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #3d4852; background-color: #f5f3f0;">
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 20px 0; background-color: #f5f3f0;">
        <tr>
            <td style="padding: 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #faf8f5; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e8e3dc;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); padding: 40px 32px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
                            <div style="width: 48px; height: 48px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; font-weight: 700; color: white;">B</div>
                            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Benzochem Industries</h1>
                            <p style="margin: 0; font-size: 16px; opacity: 0.9; font-weight: 400;">Processing your quotation request</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #3d4852;">Hello ${quotation.userName},</h2>
                            
                            <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.7;">
                                We have received your quotation request and our team is currently processing it. We will get back to you with a detailed quote soon.
                            </p>
                            
                            <div style="background: #f0f4f8; border: 1px solid #e8e3dc; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 16px; font-weight: 600; color: #4a7c59; margin-bottom: 16px;">Requested Products:</div>
                                <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                                    ${productsHtml}
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c59 0%, #5a8a68 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(74, 124, 89, 0.3);">View Request Status</a>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                Thank you for your patience. We'll notify you as soon as your quotation is ready.
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
</html>`
}

function generateQuotedEmailHTML(quotation: Quotation, productsHtml: string, adminResponse: AdminResponse | undefined, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Quotation is Ready - Benzochem Industries</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6; 
            color: #1d1d1f;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            margin: 0;
            padding: 0;
        }
        .email-container { 
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
        }
        .header { 
            background: #000000;
            padding: 40px 32px;
            text-align: center;
            color: white;
        }
        .logo { 
            width: 60px; 
            height: 60px; 
            background: #ffffff;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 16px;
            color: #000000;
            font-weight: 600;
        }
        .header h1 { 
            font-size: 24px; 
            font-weight: 600; 
            margin-bottom: 4px;
            letter-spacing: -0.5px;
        }
        .header .subtitle { 
            font-size: 16px; 
            opacity: 0.8;
            font-weight: 400;
        }
        .content { 
            padding: 40px 32px;
        }
        .greeting { 
            font-size: 28px; 
            font-weight: 600; 
            margin-bottom: 16px;
            color: #1d1d1f;
            letter-spacing: -0.5px;
        }
        .main-text { 
            font-size: 17px; 
            color: #86868b;
            margin-bottom: 32px;
            line-height: 1.5;
            font-weight: 400;
        }
        .quote-card { 
            background: #f5f5f7;
            border-radius: 16px;
            padding: 32px;
            margin: 32px 0;
        }
        .quote-title {
            font-size: 20px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 24px;
            text-align: center;
        }
        .price-breakdown { 
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #e5e5e7;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 16px;
            border-bottom: 1px solid #f5f5f7;
        }
        .price-row:last-child {
            border-bottom: none;
            padding-top: 16px;
            margin-top: 8px;
            border-top: 1px solid #e5e5e7;
            font-weight: 600;
            font-size: 18px;
        }
        .price-label {
            color: #1d1d1f;
        }
        .price-value {
            color: #1d1d1f;
            font-weight: 500;
        }
        .final-amount {
            text-align: center;
            margin: 24px 0;
            padding: 24px;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e5e5e7;
        }
        .final-label {
            font-size: 16px;
            color: #86868b;
            margin-bottom: 8px;
        }
        .final-price {
            font-size: 32px;
            font-weight: 600;
            color: #1d1d1f;
            letter-spacing: -1px;
        }
        .validity-info {
            text-align: center;
            font-size: 15px;
            color: #86868b;
            margin: 16px 0;
        }
        .products-section { 
            background: #f5f5f7;
            border-radius: 16px;
            padding: 32px;
            margin: 32px 0;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 20px;
            text-align: center;
        }
        .product-item {
            background: #ffffff;
            padding: 20px;
            margin: 12px 0;
            border-radius: 12px;
            border: 1px solid #e5e5e7;
        }
        .product-name {
            font-size: 16px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 4px;
        }
        .product-details {
            font-size: 15px;
            color: #86868b;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button { 
            display: inline-block;
            background: #007aff;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.2s ease;
        }
        .cta-button:hover {
            background: #0056cc;
            transform: translateY(-1px);
        }
        .notes-section {
            background: #fff9e6;
            border: 1px solid #ffd60a;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
        }
        .notes-title {
            font-size: 16px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 8px;
        }
        .notes-text {
            font-size: 15px;
            color: #86868b;
            line-height: 1.5;
        }
        .footer { 
            background: #f5f5f7;
            padding: 32px;
            text-align: center;
            border-top: 1px solid #e5e5e7;
        }
        .footer-text { 
            font-size: 13px; 
            color: #86868b;
            line-height: 1.5;
            margin: 8px 0;
        }
        .company-name { 
            font-weight: 600;
            color: #1d1d1f;
        }
        @media (max-width: 600px) {
            .content, .header, .footer { padding: 24px 20px; }
            .quote-card, .products-section { padding: 24px 20px; }
            .greeting { font-size: 24px; }
            .final-price { font-size: 28px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">BC</div>
            <h1>Benzochem Industries</h1>
            <div class="subtitle">Your quotation is ready</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello ${quotation.userName},</div>
            
            <div class="main-text">
                We've prepared your custom quotation with detailed pricing and specifications. 
                Everything is ready for your review.
            </div>
            
            ${adminResponse ? `
            <div class="quote-card">
                <div class="quote-title">Quotation Summary</div>
                
                ${adminResponse.gstDetails ? `
                <div class="price-breakdown">
                    <div class="price-row">
                        <span class="price-label">Subtotal</span>
                        <span class="price-value">₹${adminResponse.gstDetails.subtotal.toFixed(2)}</span>
                    </div>
                    ${adminResponse.gstDetails.cgstRate > 0 ? `
                    <div class="price-row">
                        <span class="price-label">CGST (${adminResponse.gstDetails.cgstRate}%)</span>
                        <span class="price-value">₹${adminResponse.gstDetails.cgstAmount.toFixed(2)}</span>
                    </div>` : ''}
                    ${adminResponse.gstDetails.sgstRate > 0 ? `
                    <div class="price-row">
                        <span class="price-label">SGST (${adminResponse.gstDetails.sgstRate}%)</span>
                        <span class="price-value">₹${adminResponse.gstDetails.sgstAmount.toFixed(2)}</span>
                    </div>` : ''}
                    ${adminResponse.gstDetails.igstRate > 0 ? `
                    <div class="price-row">
                        <span class="price-label">IGST (${adminResponse.gstDetails.igstRate}%)</span>
                        <span class="price-value">₹${adminResponse.gstDetails.igstAmount.toFixed(2)}</span>
                    </div>` : ''}
                    <div class="price-row">
                        <span class="price-label">Total Tax</span>
                        <span class="price-value">₹${adminResponse.gstDetails.totalTax.toFixed(2)}</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="final-amount">
                    <div class="final-label">Total Amount</div>
                    <div class="final-price">${adminResponse.totalAmount ? `₹${adminResponse.totalAmount}` : 'Contact us'}</div>
                </div>
                
                <div class="validity-info">
                    Valid until ${adminResponse.validUntil ? new Date(adminResponse.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Please contact us'}
                </div>
                
                ${adminResponse.notes ? `
                <div class="notes-section">
                    <div class="notes-title">Special Notes</div>
                    <div class="notes-text">${adminResponse.notes}</div>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="products-section">
                <div class="section-title">Products</div>
                ${quotation.lineItems && quotation.lineItems.length > 0 ? 
                    quotation.lineItems.map(item => `
                    <div class="product-item">
                        <div class="product-name">${item.productName}</div>
                        <div class="product-details">Quantity: ${item.quantity} ${item.unit}${item.specifications ? ` • ${item.specifications}` : ''}</div>
                    </div>`).join('') :
                    quotation.products ? quotation.products.map(p => `
                    <div class="product-item">
                        <div class="product-name">${p.productName}</div>
                        <div class="product-details">Quantity: ${p.quantity} ${p.unit}${p.specifications ? ` • ${p.specifications}` : ''}</div>
                    </div>`).join('') : 
                    '<div class="product-item"><div class="product-name">No products specified</div></div>'
                }
            </div>
            
            <div class="cta-section">
                <a href="${loginUrl}" class="cta-button">
                    View Full Quotation
                </a>
            </div>
            
            <div class="main-text">
                Questions? Our team is here to help. Simply reply to this email or 
                log in to your account for complete details.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © ${new Date().getFullYear()} <span class="company-name">Benzochem Industries</span>
            </div>
            <div class="footer-text">
                This quotation was generated automatically from our secure system.
            </div>
        </div>
    </div>
</body>
</html>`
}

function generateAcceptedEmailHTML(quotation: Quotation, productsHtml: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation Accepted - Benzochem Industries</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benzochem Industries</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Quotation Accepted - Next Steps</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Thank you, ${quotation.userName}!</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            Thank you for accepting our quotation! We are pleased to move forward with your order.
        </p>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin-bottom: 15px;">Next Steps:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li>Our team will contact you shortly</li>
                <li>Payment and delivery arrangements will be discussed</li>
                <li>Order processing will begin immediately</li>
            </ul>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">Accepted Products:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${productsHtml}
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Your Order</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            We appreciate your business and look forward to serving you!
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
    </div>
</body>
</html>`
}

function generateRejectedEmailHTML(quotation: Quotation, productsHtml: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation Update - Benzochem Industries</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benzochem Industries</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Quotation Update</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Hello ${quotation.userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            We regret to inform you that we are unable to fulfill your quotation request at this time.
        </p>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">Requested Products:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${productsHtml}
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:support@benzochem.com" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            If you have any questions or would like to discuss alternative options, please feel free to contact us.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
    </div>
</body>
</html>`
}

function generateExpiredEmailHTML(quotation: Quotation, productsHtml: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation Expired - Benzochem Industries</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benzochem Industries</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Quotation Expired</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Hello ${quotation.userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            Your quotation has expired. If you are still interested in the products, please submit a new quotation request and we will be happy to provide you with updated pricing.
        </p>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">Expired Products:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${productsHtml}
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Submit New Request</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Thank you for your interest in Benzochem Industries.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
    </div>
</body>
</html>`
}

function generateReminderEmailHTML(quotation: Quotation, mainMessage: string, actionMessage: string, closingMessage: string): string {
  const loginUrl = process.env.NEXT_PUBLIC_USER_APP_URL || 'https://benzochem.com/login'
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation Reminder - Benzochem Industries</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benzochem Industries</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Quotation Reminder</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Hello ${quotation.userName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            ${mainMessage}
        </p>
        
        <div style="background: #f5f3ff; border: 1px solid #ddd6fe; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #5b21b6; margin-bottom: 15px;">Important:</h3>
            <p style="margin: 0; color: #5b21b6;">
                ${actionMessage}
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Quotation</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            ${closingMessage}
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
    </div>
</body>
</html>`
}

function generateAdminNotificationHTML(quotation: Quotation, productsHtml: string, adminName: string, adminUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Quotation Request - Benzochem Industries</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benzochem Industries</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">New Quotation Request</p>
    </div>
    
    <div style="background: white; padding: 40px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1a202c; margin-bottom: 20px;">Hello ${adminName},</h2>
        
        <p style="font-size: 16px; margin-bottom: 25px;">
            A new quotation request has been received from <strong>${quotation.userName}</strong>.
        </p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #dc2626; margin-bottom: 15px;">Customer Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${quotation.userName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${quotation.userEmail}</p>
            <p style="margin: 5px 0;"><strong>Business:</strong> ${quotation.businessName || 'Individual'}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${quotation.userPhone || 'Not provided'}</p>
            <p style="margin: 5px 0;"><strong>Urgency:</strong> ${quotation.urgency.toUpperCase()}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1a202c; margin-bottom: 15px;">Requested Products:</h3>
            <ul style="margin: 0; padding-left: 20px;">
                ${productsHtml}
            </ul>
        </div>
        
        ${quotation.additionalRequirements ? `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #0369a1; margin-bottom: 15px;">Additional Requirements:</h3>
            <p style="margin: 0; color: #0369a1;">${quotation.additionalRequirements}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${adminUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review & Respond</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Please log in to the admin dashboard to review and respond to this quotation request.
        </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
    </div>
</body>
</html>`
}