import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Premium Email Templates with Modern Vanilla Latte Design System
const EMAIL_TEMPLATES = {
  USER_APPROVED: {
    subject: "✅ Welcome to Benzochem Industries - Account Approved",
    template: (user: any, customMessage?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Benzochem Industries</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: oklch(0.25 0.05 160);
            background: oklch(0.95 0.02 75);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: oklch(0.97 0.015 70);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid oklch(0.82 0.03 75);
        }
        
        .email-header { 
            background: linear-gradient(135deg, oklch(0.35 0.08 165) 0%, oklch(0.4 0.1 170) 100%);
            padding: 40px 32px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        }
        
        .email-logo { 
            width: 48px; 
            height: 48px; 
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            font-size: 24px;
            font-weight: 700;
            color: white;
            position: relative;
            z-index: 1;
        }
        
        .email-title { 
            font-size: 24px; 
            font-weight: 600; 
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .email-subtitle { 
            font-size: 16px; 
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }
        
        .email-content { 
            padding: 40px 32px;
        }
        
        .content-section {
            margin-bottom: 32px;
        }
        
        .content-section:last-child {
            margin-bottom: 0;
        }
        
        .greeting { 
            font-size: 18px; 
            font-weight: 600; 
            color: oklch(0.25 0.05 160);
            margin-bottom: 16px;
        }
        
        .message { 
            font-size: 16px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.7;
            margin-bottom: 24px;
        }
        
        .success-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 24px 0;
        }
        
        .success-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, oklch(0.7 0.18 85) 0%, oklch(0.75 0.2 85) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: white;
            box-shadow: 0 8px 24px oklch(0.7 0.18 85 / 0.3);
        }
        
        .info-box { 
            background: oklch(0.88 0.025 75);
            border: 1px solid oklch(0.82 0.03 75);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .info-box-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: oklch(0.35 0.08 165);
            margin-bottom: 8px;
        }
        
        .info-box-content { 
            font-size: 14px; 
            color: oklch(0.4 0.06 165);
            line-height: 1.6;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-approved {
            background: oklch(0.85 0.03 85);
            color: oklch(0.3 0.1 85);
        }
        
        .cta-button { 
            display: inline-block;
            background: linear-gradient(135deg, oklch(0.35 0.08 165) 0%, oklch(0.4 0.1 170) 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px oklch(0.35 0.08 165 / 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px oklch(0.35 0.08 165 / 0.4);
        }
        
        .cta-container { 
            text-align: center;
        }
        
        .details-section { 
            background: oklch(0.88 0.025 75);
            border: 1px solid oklch(0.82 0.03 75);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .details-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: oklch(0.35 0.08 165);
            margin-bottom: 16px;
        }
        
        .detail-item { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid oklch(0.82 0.03 75);
        }
        
        .detail-item:last-child { 
            border-bottom: none; 
        }
        
        .detail-label { 
            font-size: 14px; 
            color: oklch(0.5 0.04 160);
            font-weight: 500;
        }
        
        .detail-value { 
            font-size: 14px; 
            color: oklch(0.25 0.05 160);
            font-weight: 600;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 24px 0;
        }
        
        .feature-item { 
            background: oklch(0.97 0.015 70);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid oklch(0.82 0.03 75);
            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        }
        
        .feature-icon { 
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, oklch(0.35 0.08 165) 0%, oklch(0.4 0.1 170) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            margin-bottom: 12px;
        }
        
        .feature-text { 
            font-size: 14px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.5;
            font-weight: 400;
        }
        
        .email-footer { 
            background: oklch(0.88 0.025 75);
            padding: 32px;
            text-align: center;
            border-top: 1px solid oklch(0.82 0.03 75);
        }
        
        .footer-content { 
            font-size: 14px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.6;
        }
        
        .company-name { 
            font-weight: 700;
            color: oklch(0.25 0.05 160);
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, oklch(0.82 0.03 75), transparent);
            margin: 24px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 20px;
                border-radius: 8px;
            }
            
            .email-header,
            .email-content,
            .email-footer {
                padding: 24px 20px;
            }
            
            .email-title {
                font-size: 20px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
            
            .cta-button {
                display: block;
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div style="background-color: oklch(0.95 0.02 75); padding: 20px 0; min-height: 100vh;">
        <div class="email-container">
            <div class="email-header">
                <div class="email-logo">B</div>
                <h1 class="email-title">Welcome to Benzochem Industries</h1>
                <p class="email-subtitle">Your journey with premium chemicals begins here</p>
            </div>
            
            <div class="email-content">
                <div class="content-section">
                    <h2 class="greeting">Welcome, ${user.firstName}!</h2>
                    
                    <div class="success-indicator">
                        <div class="success-icon">✓</div>
                    </div>
                    
                    <p class="message">
                        Congratulations! Your account has been approved and you now have full access to our premium chemical products and services. We're excited to have you join our community of professionals in the chemical industry.
                    </p>
                </div>
                
                ${customMessage ? `
                <div class="info-box">
                    <div class="info-box-title">🎉 Personal Message from Our Team</div>
                    <div class="info-box-content">${customMessage}</div>
                </div>
                ` : ''}
                
                <div class="details-section">
                    <div class="details-title">Account Information</div>
                    <div class="detail-item">
                        <span class="detail-label">Full Name</span>
                        <span class="detail-value">${user.firstName} ${user.lastName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email Address</span>
                        <span class="detail-value">${user.email}</span>
                    </div>
                    ${user.businessName ? `
                    <div class="detail-item">
                        <span class="detail-label">Business Name</span>
                        <span class="detail-value">${user.businessName}</span>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <span class="detail-label">Account Status</span>
                        <span class="status-badge status-approved">✓ Approved</span>
                    </div>
                </div>
                
                <div class="info-box">
                    <div class="info-box-title">🎉 You can now:</div>
                    <div class="info-box-content">
                        <strong>• Browse Products:</strong> Access our complete catalog of chemical products<br>
                        <strong>• Request Quotations:</strong> Get competitive pricing for bulk orders<br>
                        <strong>• Track Orders:</strong> Monitor your order status and delivery updates<br>
                        <strong>• Premium Support:</strong> Get priority customer service
                    </div>
                </div>
                
                <div class="features-grid">
                    <div class="feature-item">
                        <div class="feature-icon">📋</div>
                        <div class="feature-text">Browse our complete chemical product catalog with detailed specifications</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">💼</div>
                        <div class="feature-text">Submit quotation requests and manage your orders seamlessly</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">⚙️</div>
                        <div class="feature-text">Access technical documentation and compliance information</div>
                    </div>
                    
                    <div class="feature-item">
                        <div class="feature-icon">👤</div>
                        <div class="feature-text">Manage your account preferences and business information</div>
                    </div>
                </div>
                
                <div class="content-section" style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_USER_APP_URL || 'http://localhost:3000'}/login" class="cta-button">
                        Access Your Dashboard
                    </a>
                </div>
                
                <div class="divider"></div>
                
                <p class="message">
                    Our dedicated support team is ready to assist you with any questions or help you get started. We're committed to providing you with exceptional service and premium chemical solutions.
                </p>
            </div>
            
            <div class="email-footer">
                <div class="footer-content">
                    <strong class="company-name">Benzochem Industries</strong><br>
                    Premium Chemical Solutions & Trading<br>
                    E-45 Jitali Road<br>
                    Phone: +91 83206 67594<br>
                    Email: benzochem.inds@gmail.com
                </div>
                
                <div style="margin-top: 20px; font-size: 12px; color: oklch(0.6 0.03 160);">
                    © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `
  },

  USER_REJECTED: {
    subject: "⚠️ Update on Your Benzochem Industries Application",
    template: (user: any, reason: string, customMessage?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Update - Benzochem Industries</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: oklch(0.25 0.05 160);
            background: oklch(0.95 0.02 75);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: oklch(0.97 0.015 70);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid oklch(0.82 0.03 75);
        }
        
        .email-header { 
            background: linear-gradient(135deg, oklch(0.5 0.04 160) 0%, oklch(0.55 0.06 165) 100%);
            padding: 40px 32px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        }
        
        .email-logo { 
            width: 48px; 
            height: 48px; 
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            font-size: 24px;
            font-weight: 700;
            color: white;
            position: relative;
            z-index: 1;
        }
        
        .email-title { 
            font-size: 24px; 
            font-weight: 600; 
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .email-subtitle { 
            font-size: 16px; 
            opacity: 0.9;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }
        
        .email-content { 
            padding: 40px 32px;
        }
        
        .content-section {
            margin-bottom: 32px;
        }
        
        .content-section:last-child {
            margin-bottom: 0;
        }
        
        .greeting { 
            font-size: 18px; 
            font-weight: 600; 
            color: oklch(0.25 0.05 160);
            margin-bottom: 16px;
        }
        
        .message { 
            font-size: 16px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.7;
            margin-bottom: 24px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 24px 0;
        }
        
        .status-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, oklch(0.65 0.15 45) 0%, oklch(0.7 0.18 45) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: white;
            box-shadow: 0 8px 24px oklch(0.65 0.15 45 / 0.3);
        }
        
        .info-box { 
            background: oklch(0.88 0.025 75);
            border: 1px solid oklch(0.82 0.03 75);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .info-box-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: oklch(0.35 0.08 165);
            margin-bottom: 8px;
        }
        
        .info-box-content { 
            font-size: 14px; 
            color: oklch(0.4 0.06 165);
            line-height: 1.6;
        }
        
        .reason-box { 
            background: oklch(0.65 0.15 45 / 0.05);
            border: 1px solid oklch(0.65 0.15 45 / 0.2);
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .reason-box-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: oklch(0.55 0.12 45);
            margin-bottom: 8px;
        }
        
        .reason-box-content { 
            font-size: 14px; 
            color: oklch(0.45 0.1 45);
            line-height: 1.6;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-rejected {
            background: oklch(0.85 0.03 25);
            color: oklch(0.3 0.1 25);
        }
        
        .cta-button { 
            display: inline-block;
            background: linear-gradient(135deg, oklch(0.35 0.08 165) 0%, oklch(0.4 0.1 170) 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px oklch(0.35 0.08 165 / 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px oklch(0.35 0.08 165 / 0.4);
        }
        
        .cta-container { 
            text-align: center;
        }
        
        .steps-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin: 24px 0;
        }
        
        .step-item { 
            background: oklch(0.97 0.015 70);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid oklch(0.82 0.03 75);
            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);
            display: flex;
            align-items: flex-start;
        }
        
        .step-icon { 
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, oklch(0.5 0.04 160) 0%, oklch(0.55 0.06 165) 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        
        .step-text { 
            font-size: 14px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.5;
            font-weight: 400;
            padding-top: 4px;
        }
        
        .email-footer { 
            background: oklch(0.88 0.025 75);
            padding: 32px;
            text-align: center;
            border-top: 1px solid oklch(0.82 0.03 75);
        }
        
        .footer-content { 
            font-size: 14px; 
            color: oklch(0.5 0.04 160);
            line-height: 1.6;
        }
        
        .company-name { 
            font-weight: 700;
            color: oklch(0.25 0.05 160);
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, oklch(0.82 0.03 75), transparent);
            margin: 24px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 20px;
                border-radius: 8px;
            }
            
            .email-header,
            .email-content,
            .email-footer {
                padding: 24px 20px;
            }
            
            .email-title {
                font-size: 20px;
            }
            
            .cta-button {
                display: block;
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div style="background-color: oklch(0.95 0.02 75); padding: 20px 0; min-height: 100vh;">
        <div class="email-container">
            <div class="email-header">
                <div class="email-logo">B</div>
                <h1 class="email-title">Application Update</h1>
                <p class="email-subtitle">Thank you for your interest</p>
            </div>
            
            <div class="email-content">
                <div class="content-section">
                    <h2 class="greeting">Hello, ${user.firstName}!</h2>
                    
                    <div class="status-indicator">
                        <div class="status-icon">⚠</div>
                    </div>
                    
                    <p class="message">
                        Thank you for your interest in Benzochem Industries and for taking the time to submit your application. After careful consideration and thorough review by our team, we regret to inform you that we are unable to approve your account at this time.
                    </p>
                </div>
                
                <div class="reason-box">
                    <div class="reason-box-title">📋 Reason for Our Decision</div>
                    <div class="reason-box-content">${reason}</div>
                </div>
                
                ${customMessage ? `
                <div class="info-box">
                    <div class="info-box-title">💬 Additional Information from Our Team</div>
                    <div class="info-box-content">${customMessage}</div>
                </div>
                ` : ''}
                
                <div class="info-box">
                    <div class="info-box-title">💡 We Understand This May Be Disappointing</div>
                    <div class="info-box-content">
                        We know that receiving this news isn't what you were hoping for. Please know that this decision was made after careful consideration, and it doesn't reflect on your value as a potential partner.
                    </div>
                </div>
                
                <div class="content-section">
                    <h3 style="font-size: 18px; font-weight: 600; color: oklch(0.25 0.05 160); margin-bottom: 16px; text-align: center;">Your Next Steps</h3>
                    
                    <div class="steps-grid">
                        <div class="step-item">
                            <div class="step-icon">📋</div>
                            <div class="step-text">Review the feedback provided and consider how you might address any concerns for future applications</div>
                        </div>
                        
                        <div class="step-item">
                            <div class="step-icon">📞</div>
                            <div class="step-text">Contact our support team if you have questions, need clarification, or would like guidance on next steps</div>
                        </div>
                        
                        <div class="step-item">
                            <div class="step-icon">🔄</div>
                            <div class="step-text">You're welcome to reapply in the future if your circumstances change or you can address the concerns mentioned</div>
                        </div>
                    </div>
                </div>
                
                <div class="content-section" style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_USER_APP_URL || 'http://localhost:3000'}/contact" class="cta-button">
                        Contact Our Support Team
                    </a>
                </div>
                
                <div class="divider"></div>
                
                <p class="message">
                    We genuinely appreciate your interest in our services and the time you invested in your application. Our team is committed to working with qualified partners, and we encourage you to reach out if you have any questions or if we can provide guidance for the future.
                </p>
            </div>
            
            <div class="email-footer">
                <div class="footer-content">
                    <strong class="company-name">Benzochem Industries</strong><br>
                    Premium Chemical Solutions & Trading<br>
                    E-45 Jitali Road<br>
                    Phone: +91 83206 67594<br>
                    Email: benzochem.inds@gmail.com
                </div>
                
                <div style="margin-top: 20px; font-size: 12px; color: oklch(0.6 0.03 160);">
                    © ${new Date().getFullYear()} Benzochem Industries. All rights reserved.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }
};

// Mutation to send email notification
export const sendEmailNotification = mutation({
  args: {
    to: v.string(),
    type: v.union(v.literal("USER_APPROVED"), v.literal("USER_REJECTED")),
    user: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      businessName: v.optional(v.string()),
    }),
    reason: v.optional(v.string()),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get email template
    const template = EMAIL_TEMPLATES[args.type];
    if (!template) {
      throw new Error(`Unknown email template: ${args.type}`);
    }

    // Generate email content
    const subject = template.subject;
    const htmlContent = args.type === "USER_APPROVED" 
      ? template.template(args.user, args.customMessage || "")
      : template.template(args.user, args.reason || "", args.customMessage || "");

    // In a real application, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    // - Nodemailer with SMTP
    
    // For now, we'll log the email and store it in the database
    console.log('📧 EMAIL NOTIFICATION:');
    console.log('To:', args.to);
    console.log('Subject:', subject);
    console.log('Type:', args.type);
    console.log('User:', args.user.firstName, args.user.lastName);
    
    // Store email record in database
    const emailId = await ctx.db.insert("emailLogs", {
      to: args.to,
      subject,
      type: args.type,
      htmlContent,
      user: args.user,
      reason: args.reason,
      customMessage: args.customMessage,
      status: "sent", // In real app, this would be "pending" until actually sent
      sentAt: now,
      createdAt: now,
    });

    // TODO: Integrate with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: args.to,
    //   from: 'noreply@benzochem.com',
    //   subject,
    //   html: htmlContent,
    // });

    return emailId;
  },
});

// Query to get email logs
export const getEmailLogs = mutation({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const emails = await ctx.db.query("emailLogs")
      .order("desc")
      .take(limit + offset);

    return emails.slice(offset);
  },
});