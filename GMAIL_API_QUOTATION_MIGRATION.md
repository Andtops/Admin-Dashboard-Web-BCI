# Gmail API Quotation Email Migration

## Overview

This document outlines the migration from EmailJS to Gmail API for sending quotation-related emails in the Benzochem Industries application.

## Changes Made

1. Created a new `gmail-quotation-service.ts` file that implements all quotation email functionality using Gmail API
2. Updated `quotation-email-service.ts` to use the Gmail API service internally
3. Maintained the same function names and interfaces to ensure backward compatibility
4. Added professional HTML email templates for all quotation email types

## Benefits

- **Improved Reliability**: Gmail API provides more reliable email delivery compared to EmailJS
- **Better Deliverability**: Emails sent through Gmail have better inbox placement rates
- **Professional Templates**: New HTML email templates provide a more professional look and feel
- **Cost Savings**: No need for a paid EmailJS subscription
- **Better Tracking**: Gmail API provides message IDs for tracking email delivery

## Implementation Details

The migration maintains the same function signatures to ensure backward compatibility:

- `sendQuotationEmailJS` - Now uses Gmail API internally
- `sendNewQuotationNotificationEmailJS` - Now uses Gmail API internally
- `sendQuotationReminderEmailJS` - Now uses Gmail API internally

All existing code that uses these functions will continue to work without any changes.

## Email Templates

New HTML email templates have been created for:

1. Processing notification
2. Quotation ready notification
3. Quotation accepted notification
4. Quotation rejected notification
5. Quotation expired notification
6. Quotation reminders
7. Admin notifications

## Configuration

The Gmail API service uses the following environment variables:

- `GMAIL_CLIENT_ID` - OAuth client ID
- `GMAIL_CLIENT_SECRET` - OAuth client secret
- `GMAIL_REDIRECT_URI` - OAuth redirect URI
- `GMAIL_REFRESH_TOKEN` - OAuth refresh token
- `EMAIL_FROM` - Sender email address (defaults to benzochem.inds@gmail.com)
- `EMAIL_REPLY_TO` - Reply-to email address (defaults to support@benzochem.com)

## Testing

To test the new email functionality:

1. Update a quotation status in the admin dashboard
2. Check the email delivery to the customer
3. Create a new quotation to test admin notifications

## Troubleshooting

If emails are not being sent:

1. Check the console logs for any error messages
2. Verify that the Gmail API credentials are correctly configured
3. Ensure the Gmail API has been enabled in the Google Cloud Console
4. Check that the refresh token is valid and has not expired