/**
 * Gmail OAuth Authorization Endpoint
 * Initiates OAuth flow for Gmail API access
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    // Check if credentials are configured
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Gmail OAuth credentials not configured',
        instructions: 'Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local'
      }, { status: 400 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost:3001/auth/gmail/callback'
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh token
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    console.log('🔗 Gmail OAuth authorization URL generated');
    console.log('📧 Make sure to sign in with: benzochem.inds@gmail.com');

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate OAuth authorization URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}