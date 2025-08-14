#!/usr/bin/env node

/**
 * Check FCM tokens registered in the system
 */

const { ConvexHttpClient } = require("convex/browser");
require('dotenv').config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function checkFCMTokens() {
  try {
    console.log("🔍 Checking FCM tokens in the system...");
    console.log("=====================================");

    const { api } = require("./convex/_generated/api.js");
    
    // Get all FCM tokens
    const tokens = await convex.query(api.notifications.getAllActiveFCMTokens);
    
    console.log(`📱 Total FCM tokens: ${tokens.length}`);
    
    if (tokens.length === 0) {
      console.log("❌ No FCM tokens found!");
      console.log("");
      console.log("🔧 Troubleshooting steps:");
      console.log("1. Make sure the mobile app is running");
      console.log("2. Check if the mobile app has notification permissions");
      console.log("3. Verify the mobile app is calling the FCM token registration API");
      console.log("4. Check the mobile app logs for any errors");
      console.log("");
      console.log("📱 Mobile app should call:");
      console.log("POST https://apibenzochem.vercel.app/api/notifications/register-token");
      console.log("Headers: X-API-Key: bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    } else {
      console.log("✅ FCM tokens found!");
      console.log("");
      
      tokens.forEach((token, index) => {
        console.log(`Token ${index + 1}:`);
        console.log(`  Platform: ${token.platform}`);
        console.log(`  User ID: ${token.userId || 'Anonymous'}`);
        console.log(`  Active: ${token.isActive}`);
        console.log(`  Registered: ${new Date(token.registeredAt).toLocaleString()}`);
        console.log(`  Token: ${token.token.substring(0, 20)}...`);
        console.log("");
      });
      
      console.log("🎉 Push notifications should work!");
      console.log("You can now send notifications from the admin dashboard.");
    }

  } catch (error) {
    console.error("❌ Error checking FCM tokens:", error.message);
  }
}

// Run the check
checkFCMTokens();