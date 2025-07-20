/**
 * Gmail OAuth Callback Handler
 * Handles OAuth callback and exchanges code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json({ error: `OAuth error: ${error}` }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost:3001/auth/gmail/callback'
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('🎉 Gmail OAuth tokens received:');
    console.log('Access Token:', tokens.access_token ? 'Received' : 'Missing');
    console.log('Refresh Token:', tokens.refresh_token ? 'Received' : 'Missing');
    console.log('Expires In:', tokens.expiry_date);

    // Return tokens in a user-friendly format
    return NextResponse.json({
      success: true,
      message: 'OAuth authorization successful!',
      tokens: {
        access_token: tokens.access_token ? 'Received (check console)' : 'Missing',
        refresh_token: tokens.refresh_token ? 'Received (check console)' : 'Missing',
        expires_in: tokens.expiry_date,
      },
      instructions: {
        step1: 'Copy the refresh_token from the server console',
        step2: 'Add it to your .env.local file as GMAIL_REFRESH_TOKEN',
        step3: 'Restart your development server',
        step4: 'Test the Gmail API endpoint',
      },
      refreshToken: tokens.refresh_token, // Only for development
    });

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to exchange authorization code for tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}