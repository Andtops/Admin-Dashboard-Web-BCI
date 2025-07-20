/**
 * Simple Gmail API Email Endpoint
 * Direct Gmail API - no QStash, no EmailJS, no SMTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalEmailGmail, sendRejectionEmailGmail } from '@/lib/gmail-api';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Gmail API email endpoint called');
    
    const body = await request.json();
    const { type, userEmail, userName, customMessage, rejectionReason, businessInfo } = body;

    // Validate required fields
    if (!type || !userEmail || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, userEmail, userName' },
        { status: 400 }
      );
    }

    console.log('📧 Sending email via Gmail API:', {
      type,
      to: userEmail,
      userName,
    });

    let result;

    if (type === 'approval') {
      result = await sendApprovalEmailGmail({
        userEmail,
        userName,
        customMessage,
        businessInfo,
      });
    } else if (type === 'rejection') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'rejectionReason is required for rejection emails' },
          { status: 400 }
        );
      }
      
      result = await sendRejectionEmailGmail({
        userEmail,
        userName,
        rejectionReason,
        businessInfo,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "approval" or "rejection"' },
        { status: 400 }
      );
    }

    console.log('📧 Gmail API result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Gmail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Gmail API Email Service',
    timestamp: new Date().toISOString(),
    config: {
      gmail: {
        clientId: process.env.GMAIL_CLIENT_ID ? 'Set' : 'Missing',
        clientSecret: process.env.GMAIL_CLIENT_SECRET ? 'Set' : 'Missing',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN ? 'Set' : 'Missing',
        emailFrom: process.env.EMAIL_FROM || 'benzochem.inds@gmail.com',
      },
    },
    usage: {
      method: 'POST',
      types: ['approval', 'rejection'],
      fields: {
        approval: ['type', 'userEmail', 'userName', 'customMessage?', 'businessInfo?'],
        rejection: ['type', 'userEmail', 'userName', 'rejectionReason', 'businessInfo?'],
      },
      examples: {
        approval: {
          type: 'approval',
          userEmail: 'user@example.com',
          userName: 'John Doe',
          customMessage: 'Welcome to our platform!',
          businessInfo: {
            businessName: 'Example Corp',
            gstNumber: '12ABCDE3456F7GH',
            isGstVerified: true
          }
        },
        rejection: {
          type: 'rejection',
          userEmail: 'user@example.com',
          userName: 'John Doe',
          rejectionReason: 'Incomplete documentation',
          businessInfo: {
            businessName: 'Example Corp',
            gstNumber: '12ABCDE3456F7GH'
          }
        }
      }
    }
  });
}