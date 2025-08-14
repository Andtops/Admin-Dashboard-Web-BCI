#!/usr/bin/env node

/**
 * Test sending a push notification to registered devices
 */

const { ConvexHttpClient } = require("convex/browser");
require('dotenv').config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function testPushNotification() {
  try {
    console.log("🚀 Testing Push Notification...");
    console.log("=====================================");

    const { api } = require("./convex/_generated/api.js");
    
    // Get all active FCM tokens
    const tokens = await convex.query(api.notifications.getAllActiveFCMTokens);
    
    if (tokens.length === 0) {
      console.log("❌ No FCM tokens found! Cannot send notification.");
      console.log("Please make sure the mobile app is registered for notifications.");
      return;
    }

    console.log(`📱 Found ${tokens.length} FCM token(s)`);
    
    // Extract just the token strings
    const tokenStrings = tokens.map(t => t.token);
    
    console.log("📤 Sending test notification...");
    
    // Send notification via the admin API
    const response = await fetch('https://apibenzochem.vercel.app/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ'
      },
      body: JSON.stringify({
        tokens: tokenStrings,
        title: '🧪 Test Notification',
        body: 'This is a test notification from the admin dashboard! If you see this, push notifications are working correctly.',
        data: {
          category: 'test',
          timestamp: new Date().toISOString(),
          testId: 'admin-test-' + Date.now()
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Notification sent successfully!");
      console.log("📊 Result:", result.result);
      console.log("");
      console.log("📱 Check your mobile device now!");
      console.log("You should see a test notification.");
    } else {
      console.log("❌ Failed to send notification:");
      console.log("Error:", result.error);
    }

  } catch (error) {
    console.error("❌ Error testing push notification:", error.message);
  }
}

// Run the test
testPushNotification();