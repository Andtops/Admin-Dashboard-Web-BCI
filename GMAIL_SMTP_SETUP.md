# Gmail SMTP Setup - Bypass EmailJS Template Limits

## Problem Solved
EmailJS free plan has template limits, so we're switching to direct Gmail SMTP which has no template restrictions and is more reliable.

## Step 1: Enable Gmail App Password

### 1.1 Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click "2-Step Verification"
3. Follow the setup process if not already enabled

### 1.2 Generate App Password
1. In Google Account Security, click "2-Step Verification"
2. Scroll down to "App passwords"
3. Click "App passwords"
4. Select "Mail" from the dropdown
5. Click "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 1.3 Update Environment Variables
Edit your `.env.local` file:

```env
# Replace this line:
GMAIL_APP_PASSWORD=your_gmail_app_password_here

# With your actual app password (no spaces):
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

## Step 2: Test SMTP Email

### 2.1 Test Configuration
```bash
# Check SMTP configuration
Invoke-RestMethod -Uri "http://localhost:3001/api/smtp-email"
```

### 2.2 Send Test Email
```bash
# Send test email (replace with your email)
Invoke-RestMethod -Uri "http://localhost:3001/api/smtp-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"to": "your-email@example.com", "subject": "SMTP Test", "message": "This is a test email via Gmail SMTP!", "type": "test"}'
```

## Step 3: Update User Approval Workflow

Once SMTP is working, I'll update the user approval system to use SMTP instead of EmailJS.

## Benefits of SMTP over EmailJS

✅ **No template limits** - Create unlimited email templates
✅ **No subscription required** - Use Gmail's free SMTP
✅ **More reliable** - Direct connection to Gmail
✅ **Better error handling** - Clear error messages
✅ **Full control** - Custom HTML templates
✅ **No external dependencies** - Works with any SMTP provider

## Expected Results

### Successful Configuration Check:
```json
{
  "message": "SMTP Email Service",
  "config": {
    "smtp": {
      "gmail": {
        "configured": true,
        "user": "benzochem.inds@gmail.com"
      }
    }
  }
}
```

### Successful Email Send:
```json
{
  "success": true,
  "message": "Email sent successfully via SMTP",
  "messageId": "some-message-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Troubleshooting

### Error: "Authentication failed"
- **Cause**: Wrong app password or 2FA not enabled
- **Solution**: Double-check app password and ensure 2FA is enabled

### Error: "Connection refused"
- **Cause**: Network/firewall issues
- **Solution**: Try different network or check firewall settings

### Error: "App password not set"
- **Cause**: Environment variable not updated
- **Solution**: Restart your dev server after updating `.env.local`

## Next Steps

1. **Set up Gmail App Password** (5 minutes)
2. **Test SMTP email** (1 minute)
3. **Update user approval workflow** (I'll do this)
4. **Test complete user approval flow** (2 minutes)

## Alternative SMTP Providers

If Gmail doesn't work, you can use:

### Outlook/Hotmail SMTP
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your_password
```

### Custom Business Email SMTP
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password
```

## Security Notes

- App passwords are safer than regular passwords
- App passwords can be revoked anytime
- Each app should have its own app password
- Never share app passwords

Once you've set up the Gmail App Password, the email system will work perfectly without any template limits!