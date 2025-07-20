# Restart Development Server

## Issue
After installing nodemailer, the development server needs to be restarted to pick up the new package.

## Solution

1. **Stop the current server** (Ctrl+C in the terminal where `npm run dev` is running)

2. **Restart the server**:
   ```bash
   cd admin
   npm run dev
   ```

3. **Wait for the server to start** (you'll see "Ready - started server on 0.0.0.0:3001")

4. **Test Gmail SMTP**:
   ```bash
   # Test configuration
   Invoke-RestMethod -Uri "http://localhost:3001/api/test-gmail"
   
   # Send test email
   Invoke-RestMethod -Uri "http://localhost:3001/api/test-gmail" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"to": "benzochem.inds@gmail.com", "subject": "Gmail SMTP Test", "message": "Testing after server restart!", "type": "test"}'
   ```

## Expected Result

After restarting, you should see:
```json
{
  "success": true,
  "message": "Email sent successfully via Gmail SMTP",
  "messageId": "some-message-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Your Gmail App Password

✅ **Your Gmail App Password is correct**: `eivu hesb hdki wfid`
✅ **Gmail User is set**: `benzochem.inds@gmail.com`

The configuration is perfect - we just need to restart the server to load the nodemailer package properly.

## After Server Restart

Once the Gmail SMTP test works, I'll:
1. Update the user approval workflow to use Gmail SMTP
2. Test the complete user approval flow
3. Remove dependency on EmailJS templates

This will completely solve the EmailJS template limit issue!