# MAKE.com Integration Guide for @admin Project

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [MAKE.com Account Setup](#makecom-account-setup)
4. [Webhook Configuration](#webhook-configuration)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Integration Implementation](#integration-implementation)
7. [Testing the Integration](#testing-the-integration)
8. [2025 MAKE.com Updates & New Features](#2025-makecom-updates--new-features)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

## Overview

This guide covers the complete setup and usage of MAKE.com (formerly Integromat) with your Benzochem Industries admin project. The integration enables automated email and WhatsApp notifications for user status updates (approval/rejection) and other administrative actions.

### Current Integration Features
- User status notification system (email & WhatsApp)
- Webhook-based communication
- Fallback to N8N (legacy support)
- Real-time notification delivery

## Prerequisites

Before starting, ensure you have:
- [ ] MAKE.com account (free or paid plan)
- [ ] Admin project running locally or deployed
- [ ] Access to environment variables configuration
- [ ] Basic understanding of webhooks and API integrations

## MAKE.com Account Setup

### 1. Create MAKE.com Account
1. Visit [make.com](https://www.make.com)
2. Sign up for a free account or log in to existing account
3. Verify your email address
4. Complete the onboarding process

### 2. Understanding MAKE.com Plans
- **Free Plan**: 1,000 operations/month, 2 active scenarios
- **Core Plan**: 10,000 operations/month, unlimited scenarios
- **Pro Plan**: 40,000 operations/month, advanced features
- **Teams Plan**: 80,000+ operations/month, team collaboration

## Webhook Configuration

### 1. Create a New Scenario

1. **Navigate to Scenarios**
   ```
   Dashboard → Scenarios → Create a new scenario
   ```

2. **Add Webhook Trigger**
   - Click the "+" button to add a module
   - Search for "Webhooks"
   - Select "Custom Webhook"
   - Click "Add" to create a new webhook

3. **Configure Webhook Settings & Data Structure**
   
   **Option 1: Auto-detect (Recommended for beginners)**
   ```json
   {
     "webhook_name": "benzochem-admin-notifications",
     "data_structure": "auto-detect",
     "response_type": "JSON"
   }
   ```

   **Option 2: Manual Data Structure Definition (2025 Update)**
   
   In the Data Structure section, you'll see two new options:
   
   **A. Add Item Method:**
   1. Click "Add Item" to manually define each field
   2. Define the expected payload structure:
   
   ```json
   {
     "user_id": "text",
     "user_name": "text", 
     "user_email": "email",
     "user_phone": "phone",
     "status": "text",
     "notification_type": "text",
     "timestamp": "date",
     "admin_notes": "text",
     "source": "text",
     "version": "text"
   }
   ```
   
   **Manual Field Configuration:**
   - **user_id**: Type: Text, Required: Yes
   - **user_name**: Type: Text, Required: Yes
   - **user_email**: Type: Email, Required: Yes
   - **user_phone**: Type: Phone, Required: No
   - **status**: Type: Text, Required: Yes, Values: ["approved", "rejected", "pending"]
   - **notification_type**: Type: Text, Required: Yes, Values: ["status_update", "welcome", "reminder"]
   - **timestamp**: Type: Date, Required: Yes
   - **admin_notes**: Type: Text, Required: No
   - **source**: Type: Text, Required: No, Default: "benzochem-admin"
   - **version**: Type: Text, Required: No, Default: "1.0"

   **B. Generate Method (AI-Powered - 2025 Feature):**
   1. Click "Generate" button
   2. Provide a sample JSON payload or description
   3. MAKE.com will automatically generate the data structure
   
   **Sample payload for generation:**
   ```json
   {
     "user_id": "user_12345",
     "user_name": "John Doe",
     "user_email": "john.doe@example.com",
     "user_phone": "+1234567890",
     "status": "approved",
     "notification_type": "status_update",
     "timestamp": "2025-01-15T10:30:00.000Z",
     "admin_notes": "Account approved after document verification",
     "source": "benzochem-admin",
     "version": "1.0"
   }
   ```
   
   **Or describe in natural language:**
   ```
   "Create a webhook that receives user notification data including user ID, name, email, phone number, approval status, notification type, timestamp, and optional admin notes from a Benzochem Industries admin system."
   ```

4. **Advanced Data Structure Options (2025 Updates)**
   
   **Validation Rules:**
   - Enable field validation for email format
   - Set required field constraints
   - Define enum values for status and notification_type
   - Set minimum/maximum length for text fields
   
   **Data Transformation:**
   - Auto-format phone numbers to international format
   - Convert timestamps to specific timezone
   - Sanitize admin notes for security
   - Normalize email addresses to lowercase

5. **Copy Webhook URL**
   - After creating, copy the webhook URL
   - Format: `https://hook.eu1.make.com/[unique-id]`
   - Save this URL for environment configuration

### 2. Design Notification Flow

#### Email Notification Module
1. **Add Email Module**
   - Search for "Email" in modules
   - Select "Send an Email"
   - Configure SMTP settings or use MAKE's built-in email service

2. **Email Configuration**
   ```json
   {
     "to": "{{user_email}}",
     "subject": "Account Status Update - Benzochem Industries",
     "content": "Dear {{user_name}},\n\nYour account status has been updated to: {{status}}\n\nBest regards,\nBenzochem Admin Team",
     "content_type": "text/plain"
   }
   ```

#### WhatsApp Notification Module
1. **Add WhatsApp Module**
   - Search for "WhatsApp Business"
   - Select "Send a Message"
   - Connect your WhatsApp Business account

2. **WhatsApp Configuration**
   ```json
   {
     "phone_number": "{{user_phone}}",
     "message": "Hello {{user_name}}! Your Benzochem Industries account status has been updated to: {{status}}. For questions, contact our support team."
   }
   ```

### 3. Add Conditional Logic

1. **Add Router Module**
   - Helps route different notification types
   - Based on `notification_type` field

2. **Configure Filters**
   ```javascript
   // For approval notifications
   {{status}} = "approved"
   
   // For rejection notifications  
   {{status}} = "rejected"
   
   // For general updates
   {{notification_type}} = "status_update"
   ```

## Environment Variables Setup

### 1. Update .env.local File

Open your `.env.local` file and update the MAKE.com configuration:

```bash
# =============================================================================
# MAKE.COM WEBHOOK CONFIGURATION FOR EMAIL AND WHATSAPP NOTIFICATIONS
# =============================================================================

# Primary webhook URL from your MAKE.com scenario
NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-actual-webhook-id-here

# Optional: MAKE.com API Configuration (for advanced features)
MAKE_API_KEY=your_make_api_key_here
MAKE_TEAM_ID=your_make_team_id_here
MAKE_ORGANIZATION_ID=your_organization_id_here

# Webhook authentication (recommended for production)
MAKE_WEBHOOK_SECRET=your-secure-webhook-secret-key

# Rate limiting configuration
MAKE_RATE_LIMIT_PER_MINUTE=60
MAKE_RETRY_ATTEMPTS=3
MAKE_RETRY_DELAY=1000
```

### 2. Environment Variables Explanation

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_MAKE_WEBHOOK_URL` | Main webhook URL for notifications | Yes | `https://hook.eu1.make.com/abc123` |
| `MAKE_API_KEY` | API key for advanced MAKE.com features | No | `sk_live_abc123...` |
| `MAKE_TEAM_ID` | Your MAKE.com team identifier | No | `team_abc123` |
| `MAKE_WEBHOOK_SECRET` | Secret for webhook authentication | Recommended | `your-secret-key` |

## Integration Implementation

### 1. Create Webhook Service

Create a new service file for MAKE.com integration:

```typescript
// src/lib/services/makeWebhook.ts
interface NotificationPayload {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: 'approved' | 'rejected' | 'pending';
  notification_type: 'status_update' | 'welcome' | 'reminder';
  timestamp: string;
  admin_notes?: string;
}

export class MakeWebhookService {
  private webhookUrl: string;
  private secret?: string;

  constructor() {
    this.webhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL!;
    this.secret = process.env.MAKE_WEBHOOK_SECRET;
  }

  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authentication if secret is configured
      if (this.secret) {
        headers['X-Webhook-Secret'] = this.secret;
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          source: 'benzochem-admin',
          version: '1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('MAKE webhook error:', error);
      return false;
    }
  }

  async sendUserStatusUpdate(
    userId: string,
    status: 'approved' | 'rejected',
    userDetails: {
      name: string;
      email: string;
      phone?: string;
    },
    adminNotes?: string
  ): Promise<boolean> {
    return this.sendNotification({
      user_id: userId,
      user_name: userDetails.name,
      user_email: userDetails.email,
      user_phone: userDetails.phone,
      status,
      notification_type: 'status_update',
      timestamp: new Date().toISOString(),
      admin_notes: adminNotes
    });
  }
}
```

### 2. Integration with Admin Actions

Update your admin action handlers to include MAKE.com notifications:

```typescript
// src/app/api/admin/users/[id]/status/route.ts
import { MakeWebhookService } from '@/lib/services/makeWebhook';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, adminNotes } = await request.json();
    const userId = params.id;

    // Update user status in database (your existing logic)
    const updatedUser = await updateUserStatus(userId, status);

    // Send notification via MAKE.com
    const makeService = new MakeWebhookService();
    const notificationSent = await makeService.sendUserStatusUpdate(
      userId,
      status,
      {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone
      },
      adminNotes
    );

    return Response.json({
      success: true,
      user: updatedUser,
      notificationSent
    });
  } catch (error) {
    console.error('Status update error:', error);
    return Response.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
```

### 3. Frontend Integration

Add notification status to your admin interface:

```typescript
// src/components/admin/UserStatusModal.tsx
import { useState } from 'react';
import { toast } from 'sonner';

export function UserStatusModal({ user, onClose, onUpdate }) {
  const [status, setStatus] = useState(user.status);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `User ${status} successfully${result.notificationSent ? ' and notified' : ''}`
        );
        onUpdate(result.user);
        onClose();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      toast.error('An error occurred while updating status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Your modal JSX with status update form
    <div>
      {/* Status selection, admin notes input, etc. */}
      <button onClick={handleStatusUpdate} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Status'}
      </button>
    </div>
  );
}
```

## Testing the Integration

### 1. Test Webhook Connectivity

Create a test endpoint to verify webhook functionality:

```typescript
// src/app/api/test/make-webhook/route.ts
import { MakeWebhookService } from '@/lib/services/makeWebhook';

export async function POST() {
  const makeService = new MakeWebhookService();
  
  const testPayload = {
    user_id: 'test-user-123',
    user_name: 'Test User',
    user_email: 'test@example.com',
    user_phone: '+1234567890',
    status: 'approved' as const,
    notification_type: 'status_update' as const,
    timestamp: new Date().toISOString(),
    admin_notes: 'This is a test notification'
  };

  const success = await makeService.sendNotification(testPayload);

  return Response.json({
    success,
    message: success ? 'Test notification sent' : 'Test notification failed',
    payload: testPayload
  });
}
```

### 2. Manual Testing Steps

1. **Test Webhook URL**
   ```bash
   curl -X POST "https://hook.eu1.make.com/your-webhook-id" \
     -H "Content-Type: application/json" \
     -d '{
       "user_name": "Test User",
       "user_email": "test@example.com",
       "status": "approved",
       "notification_type": "status_update"
     }'
   ```

2. **Test via Admin Interface**
   - Log into admin panel
   - Navigate to user management
   - Update a test user's status
   - Verify notifications are sent

3. **Monitor MAKE.com Execution**
   - Go to MAKE.com dashboard
   - Check scenario execution history
   - Review any errors or failed executions

## 2025 MAKE.com Updates & New Features

### 1. Enhanced Data Structure Management

#### AI-Powered Schema Generation
The new "Generate" feature uses AI to automatically create webhook data structures:

**Benefits:**
- Faster setup process
- Reduced configuration errors
- Intelligent field type detection
- Automatic validation rule suggestions

**Best Practices:**
```typescript
// When using the Generate feature, provide comprehensive sample data
const samplePayload = {
  // Core user data
  user_id: "usr_1234567890abcdef",
  user_name: "Dr. Sarah Johnson",
  user_email: "sarah.johnson@company.com",
  user_phone: "+1-555-123-4567",
  
  // Status information
  status: "approved", // approved | rejected | pending | suspended
  previous_status: "pending",
  status_changed_at: "2025-01-15T14:30:00.000Z",
  
  // Notification details
  notification_type: "status_update", // status_update | welcome | reminder | alert
  priority: "high", // low | medium | high | urgent
  
  // Administrative data
  admin_id: "admin_987654321",
  admin_name: "John Admin",
  admin_notes: "Approved after successful document verification and background check",
  
  // System metadata
  source: "benzochem-admin",
  version: "2.0",
  timestamp: "2025-01-15T14:30:00.000Z",
  environment: "production", // development | staging | production
  
  // Additional context
  user_role: "chemical_engineer",
  department: "research_development",
  approval_reason: "credentials_verified",
  
  // Notification preferences
  send_email: true,
  send_whatsapp: true,
  send_sms: false,
  
  // Tracking
  request_id: "req_abc123def456",
  correlation_id: "corr_xyz789"
};
```

#### Manual Field Configuration (Add Item Method)
For precise control over data structure:

**Step-by-Step Configuration:**
1. **Click "Add Item"** for each field
2. **Configure Field Properties:**
   ```
   Field Name: user_id
   Type: Text
   Required: Yes
   Validation: Regex pattern for user ID format
   Description: Unique identifier for the user
   ```

3. **Advanced Field Types (2025):**
   - **Rich Text**: For formatted admin notes
   - **JSON Object**: For nested data structures
   - **Array**: For multiple values (e.g., user roles)
   - **Boolean**: For true/false flags
   - **Number**: For numeric values with validation
   - **URL**: For links with automatic validation
   - **File**: For document attachments

#### Data Structure Templates (New in 2025)
MAKE.com now provides pre-built templates:

**Available Templates:**
- **User Management**: User CRUD operations
- **Notification System**: Multi-channel notifications
- **E-commerce**: Order and payment processing
- **CRM Integration**: Customer relationship management
- **Authentication**: Login/logout events

**Using Templates:**
1. Select "Use Template" in data structure section
2. Choose "User Management" template
3. Customize fields for your specific needs
4. Add Benzochem-specific fields

### 2. Enhanced Webhook Security (2025 Updates)

#### Multi-Layer Authentication
```typescript
// Updated webhook service with 2025 security features
export class MakeWebhookService {
  private async sendSecureNotification(payload: NotificationPayload): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BenzochemAdmin/2.0',
      'X-API-Version': '2025-01',
    };

    // Method 1: Webhook Secret (Traditional)
    if (this.secret) {
      headers['X-Webhook-Secret'] = this.secret;
    }

    // Method 2: HMAC Signature (2025 Enhanced)
    if (this.hmacSecret) {
      const signature = this.generateHMACSignature(payload);
      headers['X-Signature-SHA256'] = `sha256=${signature}`;
    }

    // Method 3: JWT Token (2025 New)
    if (this.jwtSecret) {
      const token = this.generateJWTToken(payload);
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Method 4: API Key Authentication (2025 New)
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return this.makeRequest(headers, payload);
  }

  private generateHMACSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.hmacSecret!)
      .update(payloadString)
      .digest('hex');
  }

  private generateJWTToken(payload: any): string {
    return jwt.sign(
      {
        data: payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
      },
      this.jwtSecret!
    );
  }
}
```

### 3. Smart Routing & Conditional Logic (2025)

#### AI-Powered Route Suggestions
MAKE.com now suggests optimal routing based on your data:

```javascript
// Example of 2025 smart routing configuration
{
  "routes": [
    {
      "name": "urgent_notifications",
      "condition": "{{priority}} = 'urgent' OR {{status}} = 'suspended'",
      "actions": ["immediate_email", "sms_alert", "admin_notification"]
    },
    {
      "name": "standard_approvals", 
      "condition": "{{status}} = 'approved' AND {{priority}} != 'urgent'",
      "actions": ["welcome_email", "whatsapp_notification"]
    },
    {
      "name": "rejection_handling",
      "condition": "{{status}} = 'rejected'",
      "actions": ["rejection_email", "feedback_request"]
    }
  ]
}
```

#### Dynamic Content Generation
Use AI to generate personalized content:

```javascript
// 2025 AI Content Generation
{
  "email_content": {
    "subject": "AI_GENERATE: Professional subject for {{status}} notification to {{user_name}}",
    "body": "AI_GENERATE: Personalized email body for user {{user_name}} with status {{status}}, considering their role as {{user_role}} in {{department}} department. Include relevant next steps and contact information."
  },
  "whatsapp_content": {
    "message": "AI_GENERATE: Friendly WhatsApp message for {{user_name}} about their {{status}} status, keep it under 160 characters"
  }
}
```

### 4. Real-time Monitoring & Analytics (2025)

#### Enhanced Execution Tracking
```typescript
// Integration with MAKE.com's new analytics API
export class MakeAnalyticsService {
  async getWebhookMetrics(timeframe: '1h' | '24h' | '7d' | '30d') {
    const response = await fetch(`https://api.make.com/v2/scenarios/${this.scenarioId}/metrics`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Version': '2025-01'
      },
      params: { timeframe }
    });

    return response.json();
  }

  async getFailureAnalysis() {
    // Get detailed failure analysis with AI insights
    const response = await fetch(`https://api.make.com/v2/scenarios/${this.scenarioId}/failures/analysis`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Version': '2025-01'
      }
    });

    return response.json();
  }
}
```

#### Proactive Error Detection
MAKE.com 2025 includes AI-powered error prediction:

```javascript
// Configure proactive monitoring
{
  "monitoring": {
    "error_prediction": true,
    "performance_alerts": {
      "slow_execution": "5s",
      "high_failure_rate": "10%",
      "unusual_patterns": true
    },
    "auto_scaling": {
      "enabled": true,
      "max_concurrent": 50,
      "scale_trigger": "queue_length > 10"
    }
  }
}
```

### 5. Integration with Modern APIs (2025)

#### GraphQL Support
```typescript
// MAKE.com now supports GraphQL webhooks
const graphqlPayload = {
  query: `
    mutation UpdateUserStatus($userId: ID!, $status: UserStatus!, $notes: String) {
      updateUserStatus(userId: $userId, status: $status, adminNotes: $notes) {
        id
        status
        updatedAt
        notifications {
          email {
            sent
            deliveredAt
          }
          whatsapp {
            sent
            deliveredAt
          }
        }
      }
    }
  `,
  variables: {
    userId: payload.user_id,
    status: payload.status.toUpperCase(),
    notes: payload.admin_notes
  }
};
```

#### Webhook Chaining (2025 Feature)
Connect multiple webhooks in sequence:

```javascript
{
  "webhook_chain": [
    {
      "name": "primary_notification",
      "url": "https://hook.eu1.make.com/primary-webhook",
      "on_success": "secondary_processing",
      "on_failure": "error_handling"
    },
    {
      "name": "secondary_processing", 
      "url": "https://hook.eu1.make.com/secondary-webhook",
      "condition": "{{primary_notification.success}} = true"
    },
    {
      "name": "error_handling",
      "url": "https://hook.eu1.make.com/error-webhook",
      "condition": "{{primary_notification.success}} = false"
    }
  ]
}
```

## Advanced Features

### 1. Batch Notifications

For processing multiple notifications:

```typescript
export class MakeWebhookService {
  async sendBatchNotifications(notifications: NotificationPayload[]): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendNotification(notification))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error');

    return { successful, failed, errors };
  }
}
```

### 2. Notification Templates

Create reusable notification templates:

```typescript
export const NotificationTemplates = {
  USER_APPROVED: {
    email: {
      subject: 'Welcome to Benzochem Industries - Account Approved!',
      template: `
        Dear {{user_name}},
        
        Congratulations! Your account has been approved.
        You can now access all features of our platform.
        
        Login at: https://admin.benzochem.com
        
        Best regards,
        Benzochem Team
      `
    },
    whatsapp: {
      template: 'Hello {{user_name}}! 🎉 Your Benzochem Industries account has been approved. You can now login and start using our services.'
    }
  },
  USER_REJECTED: {
    email: {
      subject: 'Benzochem Industries - Account Application Update',
      template: `
        Dear {{user_name}},
        
        Thank you for your interest in Benzochem Industries.
        Unfortunately, we cannot approve your account at this time.
        
        {{admin_notes}}
        
        You may reapply after addressing the mentioned requirements.
        
        Best regards,
        Benzochem Team
      `
    },
    whatsapp: {
      template: 'Hello {{user_name}}, your Benzochem Industries account application needs additional review. Please check your email for details.'
    }
  }
};
```

### 3. Webhook Security

Implement webhook signature verification:

```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 4. Rate Limiting and Retry Logic

```typescript
export class MakeWebhookService {
  private rateLimiter = new Map<string, number[]>();
  
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.rateLimiter.has(identifier)) {
      this.rateLimiter.set(identifier, []);
    }
    
    const requests = this.rateLimiter.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= 60) { // 60 requests per minute
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(identifier, recentRequests);
    return true;
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Webhook Not Receiving Data
**Problem**: MAKE.com scenario not triggering
**Solutions**:
- Verify webhook URL is correct
- Check if webhook is active in MAKE.com
- Test with curl or Postman
- Review MAKE.com execution history

#### 2. Authentication Errors
**Problem**: 401/403 errors when calling webhook
**Solutions**:
- Verify API keys and secrets
- Check webhook authentication settings
- Ensure proper headers are sent

#### 3. Rate Limiting Issues
**Problem**: Too many requests error
**Solutions**:
- Implement proper rate limiting
- Use batch processing for multiple notifications
- Consider upgrading MAKE.com plan

#### 4. Email/WhatsApp Not Sending
**Problem**: Notifications not delivered
**Solutions**:
- Verify email/WhatsApp module configuration
- Check recipient contact information
- Review MAKE.com module connection status
- Test with known working email/phone

### Debugging Tools

#### 1. Webhook Testing
```bash
# Test webhook with curl
curl -X POST "${NEXT_PUBLIC_MAKE_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: ${MAKE_WEBHOOK_SECRET}" \
  -d '{
    "user_name": "Debug User",
    "user_email": "debug@test.com",
    "status": "approved",
    "notification_type": "status_update",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

#### 2. Logging Configuration
```typescript
// Enhanced logging for debugging
export class MakeWebhookService {
  private log(level: 'info' | 'error' | 'debug', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MAKE-${level.toUpperCase()}] ${message}`, data || '');
  }

  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    this.log('info', 'Sending notification', { 
      user_id: payload.user_id, 
      type: payload.notification_type 
    });

    try {
      // ... webhook logic
      this.log('info', 'Notification sent successfully');
      return true;
    } catch (error) {
      this.log('error', 'Notification failed', error);
      return false;
    }
  }
}
```

## Best Practices

### 1. Security
- Always use HTTPS for webhook URLs
- Implement webhook signature verification
- Store secrets in environment variables
- Use rate limiting to prevent abuse
- Validate all incoming webhook data

### 2. Reliability
- Implement retry logic with exponential backoff
- Use dead letter queues for failed notifications
- Monitor webhook success rates
- Set up alerting for failed notifications

### 3. Performance
- Use batch processing for multiple notifications
- Implement proper rate limiting
- Cache frequently used data
- Use async processing for non-critical notifications

### 4. Monitoring
- Log all webhook attempts and results
- Monitor MAKE.com scenario execution
- Set up alerts for high failure rates
- Track notification delivery metrics

### 5. Maintenance
- Regularly review and update notification templates
- Keep webhook URLs and secrets secure
- Monitor MAKE.com usage and costs
- Update integration when MAKE.com APIs change

## Conclusion

This comprehensive guide provides everything needed to successfully integrate MAKE.com with your Benzochem Industries admin project. The integration enables powerful automation capabilities for user notifications and can be extended to support additional business processes.

For additional support or questions about this integration, refer to:
- [MAKE.com Documentation](https://www.make.com/en/help)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- Your project's existing documentation files

Remember to test thoroughly in a development environment before deploying to production, and always follow security best practices when handling user data and webhook communications.