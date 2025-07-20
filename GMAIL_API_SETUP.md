# Gmail API Setup - Simple Direct Email Solution

## 🎯 Goal
Set up direct Gmail API integration to send user approval/rejection emails without any third-party services.

## 📋 Prerequisites
- Google account (benzochem.inds@gmail.com)
- Google Cloud Console access

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click "Select a project" → "New Project"
   - Project name: "Benzochem Email Service"
   - Click "Create"

### Step 2: Enable Gmail API

1. **Navigate to APIs & Services** → **Library**
2. **Search for "Gmail API"**
3. **Click "Gmail API"** → **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. **Go to APIs & Services** → **Credentials**
2. **Click "Create Credentials"** → **OAuth 2.0 Client IDs**
3. **Configure OAuth consent screen** (if prompted):
   - User Type: External
   - App name: "Benzochem Email Service"
   - User support email: benzochem.inds@gmail.com
   - Developer contact: benzochem.inds@gmail.com
   - Save and continue through all steps

4. **Create OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: "Benzochem Email Client"
   - Authorized redirect URIs: `http://localhost:3001/auth/gmail/callback`
   - Click "Create"

5. **Copy the credentials**:
   - Client ID: `123456789-abcdefg.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abcdefghijklmnop`

### Step 4: Get Refresh Token

1. **Go to OAuth 2.0 Playground**: https://developers.google.com/oauthplayground/
2. **Click the gear icon** (Settings) in top right
3. **Check "Use your own OAuth credentials"**
4. **Enter your credentials**:
   - OAuth Client ID: (from step 3)
   - OAuth Client Secret: (from step 3)
5. **In left panel, find "Gmail API v1"**
6. **Select scope**: `https://www.googleapis.com/auth/gmail.send`
7. **Click "Authorize APIs"**
8. **Sign in with benzochem.inds@gmail.com**
9. **Click "Exchange authorization code for tokens"**
10. **Copy the Refresh Token**: `1//04abcdefghijklmnop...`

### Step 5: Update Environment Variables

Edit your `.env.local` file:

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GMAIL_REFRESH_TOKEN=1//04abcdefghijklmnop...
EMAIL_FROM=benzochem.inds@gmail.com
```

### Step 6: Test Gmail API

```bash
# Test Gmail API configuration
Invoke-RestMethod -Uri "http://localhost:3001/api/gmail-send"

# Send test approval email
Invoke-RestMethod -Uri "http://localhost:3001/api/gmail-send" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"type": "approval", "userEmail": "benzochem.inds@gmail.com", "userName": "Test User", "customMessage": "Welcome to Benzochem!"}'
```

## 🔧 Update User Approval Workflow

I'll update the pending users page to use the new Gmail API endpoint.

## ✅ Expected Results

After setup, you should see:

```json
{
  "success": true,
  "messageId": "gmail-message-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🎯 Benefits

- ✅ **Direct Gmail API** - No third-party dependencies
- ✅ **No template limits** - Send unlimited emails
- ✅ **No subscription fees** - Free Gmail API usage
- ✅ **Reliable delivery** - Direct from Gmail
- ✅ **Professional emails** - Beautiful HTML templates
- ✅ **Simple setup** - One-time configuration

## 🔍 Troubleshooting

### Error: "Invalid credentials"
- Check Client ID and Client Secret
- Verify OAuth consent screen is configured

### Error: "Invalid refresh token"
- Generate new refresh token in OAuth playground
- Make sure you used the correct Gmail account

### Error: "Insufficient permissions"
- Verify Gmail API is enabled
- Check OAuth scope includes `gmail.send`

## 🚀 Next Steps

1. **Complete Gmail API setup** (15 minutes)
2. **Test email sending** (2 minutes)
3. **Update user approval workflow** (I'll do this)
4. **Test complete user approval flow** (2 minutes)

Once Gmail API is working, user approval emails will be sent directly through Gmail with no external dependencies!