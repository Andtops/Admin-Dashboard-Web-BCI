# QStash Workflow Migration Guide

This guide explains how to migrate from Brevo.com to Upstash QStash for workflow automation in the Benzochem Industries admin system.

## Overview

We've replaced the direct Brevo email integration with a more flexible QStash-based workflow system that supports:

- **Email notifications** via multiple providers (Resend, SendGrid, etc.)
- **WhatsApp messaging** via WhatsApp Business API
- **Workflow scheduling** and retry mechanisms
- **Better error handling** and monitoring
- **Scalable architecture** for future expansion

## What Changed

### Before (Brevo Integration)
- Direct API calls to Brevo for email sending
- Limited to email notifications only
- Synchronous processing
- Single point of failure

### After (QStash Workflow)
- Asynchronous workflow processing via QStash
- Support for multiple notification channels (Email + WhatsApp)
- Configurable email providers
- Better error handling and retry mechanisms
- Workflow scheduling capabilities

## Setup Instructions

### 1. Upstash QStash Setup

1. Create an account at [Upstash Console](https://console.upstash.com)
2. Navigate to QStash section
3. Create a new QStash token
4. Copy the token for environment configuration

### 2. Email Service Setup

Choose one of the following email providers:

#### Option A: Resend (Recommended)
1. Create account at [Resend](https://resend.com)
2. Generate API key
3. Verify your sending domain

#### Option B: SendGrid
1. Create account at [SendGrid](https://sendgrid.com)
2. Generate API key
3. Verify sender identity

### 3. WhatsApp Setup (Optional)

For WhatsApp messaging, you can use:

#### Option A: WhatsApp Business API
1. Apply for WhatsApp Business API access
2. Set up webhook endpoints
3. Configure phone number verification

#### Option B: Twilio WhatsApp
1. Create Twilio account
2. Set up WhatsApp sandbox or production
3. Get API credentials

### 4. Environment Configuration

Update your `.env.local` file with the following variables:

```env
# QStash Configuration
QSTASH_TOKEN=your_qstash_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Email Service (choose one)
EMAIL_API_KEY=your_email_api_key_here
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@benzochem.com
EMAIL_SERVICE_URL=https://api.resend.com/emails

# WhatsApp Service (optional)
WHATSAPP_SERVICE_URL=your_whatsapp_service_url_here
WHATSAPP_API_KEY=your_whatsapp_api_key_here
```

## Code Changes

### Updated Files

1. **`src/lib/qstash-workflows.ts`** - New workflow system
2. **`src/app/api/workflows/execute/route.ts`** - Workflow execution endpoint
3. **`src/app/api/qstash/status/route.ts`** - Status monitoring
4. **`src/app/dashboard/users/pending/page.tsx`** - Updated to use QStash
5. **`src/app/debug-qstash/page.tsx`** - New debug interface

### Migration Steps

1. **Install Dependencies**
   ```bash
   npm install @upstash/qstash
   ```

2. **Update Import Statements**
   ```typescript
   // Old
   import { sendUserApprovalNotification } from "@/lib/notifications";
   
   // New
   import { sendUserApprovalWorkflow } from "@/lib/qstash-workflows";
   ```

3. **Update Function Calls**
   ```typescript
   // Old
   await sendUserApprovalNotification({
     userId,
     userEmail,
     userName,
     customMessage,
     adminEmail,
     adminName,
     userBusinessInfo
   });
   
   // New
   await sendUserApprovalWorkflow({
     userId,
     userEmail,
     userPhone, // New: WhatsApp support
     userName,
     customMessage,
     adminEmail,
     adminName,
     userBusinessInfo
   });
   ```

## Features

### Email Notifications
- HTML and text content
- Multiple email providers support
- Template-based emails
- Delivery tracking

### WhatsApp Messaging
- Text messages
- Template messages
- Phone number formatting
- International support

### Workflow Management
- Asynchronous processing
- Retry mechanisms
- Scheduling capabilities
- Error handling

### Monitoring
- Status endpoints
- Debug interface
- Logging and tracking
- Performance metrics

## Testing

### Debug Interface
Visit `/debug-qstash` to test the workflow system:

1. **Status Check** - Verify configuration
2. **Connection Test** - Test QStash connectivity
3. **Approval Workflow** - Test user approval flow
4. **Rejection Workflow** - Test user rejection flow

### API Endpoints

- `GET /api/qstash/status` - Check configuration status
- `POST /api/workflows/execute` - Execute workflow (called by QStash)

## Troubleshooting

### Common Issues

1. **QStash Token Not Working**
   - Verify token is correct
   - Check token permissions
   - Ensure NEXT_PUBLIC_APP_URL is accessible

2. **Email Not Sending**
   - Verify email service API key
   - Check sender domain verification
   - Review email service logs

3. **WhatsApp Not Working**
   - Verify phone number format
   - Check WhatsApp API credentials
   - Ensure webhook endpoints are configured

### Debug Steps

1. Check environment variables
2. Test individual components
3. Review QStash dashboard
4. Check application logs
5. Use debug interface

## Migration Checklist

- [ ] Set up Upstash QStash account
- [ ] Configure email service (Resend/SendGrid)
- [ ] Set up WhatsApp service (optional)
- [ ] Update environment variables
- [ ] Install npm dependencies
- [ ] Update code imports
- [ ] Test workflow functionality
- [ ] Monitor production deployment

## Benefits

### Improved Reliability
- Asynchronous processing
- Automatic retries
- Better error handling

### Enhanced Features
- Multi-channel notifications
- Workflow scheduling
- Template management

### Better Monitoring
- Status endpoints
- Debug interface
- Performance tracking

### Scalability
- Queue-based processing
- Multiple service providers
- Easy to extend

## Support

For issues or questions:

1. Check the debug interface at `/debug-qstash`
2. Review QStash documentation
3. Check email service provider docs
4. Review application logs

## Next Steps

After migration, consider:

1. Setting up monitoring alerts
2. Creating custom email templates
3. Implementing WhatsApp templates
4. Adding workflow scheduling
5. Setting up analytics tracking