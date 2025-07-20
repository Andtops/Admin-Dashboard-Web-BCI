# Gmail API Scope Fix for EmailJS Integration

## Problem
Error: `412Gmail_API: Request had insufficient authentication scopes`

This error occurs when EmailJS is configured to use Gmail as the email service provider, but the Gmail account doesn't have the proper OAuth scopes or authentication setup.

## Root Cause Analysis

The error is likely occurring because:

1. **EmailJS Gmail Service**: Your EmailJS service is configured to use Gmail
2. **Insufficient Scopes**: The Gmail account used by EmailJS doesn't have the required OAuth scopes
3. **Authentication Issues**: Gmail's OAuth setup is incomplete or expired

## Solution 1: Fix Gmail OAuth Scopes in EmailJS

### Step 1: Check EmailJS Service Configuration

1. Log into your [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Go to **Email Services**
3. Find your Gmail service configuration
4. Check the authentication status

### Step 2: Re-authenticate Gmail Service

1. **Delete Current Gmail Service**:
   - In EmailJS dashboard, go to Email Services
   - Delete the existing Gmail service

2. **Create New Gmail Service**:
   - Click "Add New Service"
   - Select "Gmail"
   - Follow the OAuth flow completely

3. **Required Gmail Scopes**:
   When setting up Gmail in EmailJS, ensure these scopes are granted:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.compose
   https://mail.google.com/
   ```

### Step 3: Update Gmail Account Settings

1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Factor Authentication

2. **Create App Password** (if using SMTP):
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for EmailJS

3. **Check Gmail API Status**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Gmail API if not already enabled
   - Check quotas and limits

## Solution 2: Switch to Alternative Email Service

If Gmail continues to have issues, switch to a more reliable email service:

### Option A: Use Outlook/Hotmail

1. **Create Outlook Service in EmailJS**:
   - Go to EmailJS Dashboard → Email Services
   - Add New Service → Outlook
   - Use your Outlook/Hotmail account

2. **Update Environment Variables**:
   ```env
   # Update your .env.local
   EMAILJS_SERVICE_ID=service_outlook_xyz
   ```

### Option B: Use Custom SMTP

1. **Set up Business Email SMTP**:
   - Use your domain's email service (e.g., cPanel, Hostinger, etc.)
   - Get SMTP credentials from your hosting provider

2. **Configure Custom SMTP in EmailJS**:
   - EmailJS Dashboard → Email Services → Add New Service → Other
   - Enter SMTP settings:
     ```
     SMTP Server: mail.yourdomain.com
     Port: 587 (or 465 for SSL)
     Username: noreply@yourdomain.com
     Password: your_email_password
     ```

## Solution 3: Implement Direct SMTP (Recommended)

For better reliability, implement direct SMTP without EmailJS:

### Step 1: Install Nodemailer

```bash
cd admin
npm install nodemailer @types/nodemailer
```

### Step 2: Create SMTP Service

I'll create a new SMTP service file for you.

## Solution 4: Use Professional Email Service

### Option A: SendGrid (Recommended)

1. **Sign up for SendGrid**:
   - Go to [SendGrid](https://sendgrid.com/)
   - Create free account (100 emails/day)

2. **Get API Key**:
   - SendGrid Dashboard → Settings → API Keys
   - Create new API key with "Mail Send" permissions

3. **Update Environment**:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Option B: Resend (Modern Alternative)

1. **Sign up for Resend**:
   - Go to [Resend](https://resend.com/)
   - Create account (3,000 emails/month free)

2. **Get API Key**:
   - Resend Dashboard → API Keys
   - Create new API key

3. **Update Environment**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

## Immediate Fix for Current Setup

### Step 1: Verify EmailJS Configuration

Check your current EmailJS setup:

```bash
# In your admin directory
npm run dev
```

Then visit: `http://localhost:3001/debug-qstash`

### Step 2: Test Email Sending

1. Click "Test EmailJS" button
2. Check browser console for detailed error messages
3. Check EmailJS dashboard for delivery logs

### Step 3: Update Gmail Service

If using Gmail in EmailJS:

1. **Re-authenticate Gmail Service**:
   - EmailJS Dashboard → Email Services
   - Edit your Gmail service
   - Click "Re-authenticate" or "Test Connection"

2. **Grant All Required Permissions**:
   - When OAuth popup appears, grant ALL requested permissions
   - Don't skip any permission requests

## Environment Variables Update

Update your `.env.local` with proper configuration:

```env
# EmailJS Configuration (Current)
EMAILJS_SERVICE_ID=service_your_actual_id
EMAILJS_PUBLIC_KEY=user_your_actual_public_key
EMAILJS_PRIVATE_KEY=your_actual_private_key

# Template IDs
EMAILJS_APPROVAL_TEMPLATE_ID=template_approval
EMAILJS_REJECTION_TEMPLATE_ID=template_rejection
EMAILJS_TEST_TEMPLATE_ID=template_test
EMAILJS_DEFAULT_TEMPLATE_ID=template_default

# Email Configuration
EMAIL_FROM=noreply@benzochem.com

# Alternative: SendGrid (if switching)
# SENDGRID_API_KEY=SG.your_api_key_here

# Alternative: Resend (if switching)
# RESEND_API_KEY=re_your_api_key_here
```

## Testing the Fix

1. **Test EmailJS Connection**:
   ```bash
   curl -X GET http://localhost:3001/api/qstash/status
   ```

2. **Test Email Sending**:
   - Visit debug page: `http://localhost:3001/debug-qstash`
   - Click "Test EmailJS"
   - Check for success/error messages

3. **Check EmailJS Dashboard**:
   - Go to EmailJS Dashboard → Logs
   - Check for recent email attempts
   - Look for error details

## Prevention

To prevent this issue in the future:

1. **Use Business Email Service**: Avoid personal Gmail accounts for business applications
2. **Monitor Quotas**: Keep track of email sending limits
3. **Set up Monitoring**: Implement email delivery monitoring
4. **Have Backup Service**: Configure multiple email services for redundancy

## Next Steps

1. Try Solution 1 (fix Gmail OAuth) first
2. If that fails, implement Solution 3 (direct SMTP)
3. For production, use Solution 4 (professional email service)

The most reliable long-term solution is to use a professional email service like SendGrid or Resend instead of relying on personal email accounts through EmailJS.