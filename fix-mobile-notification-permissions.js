#!/usr/bin/env node

/**
 * Fix mobile app API key to include notification permissions
 * This script updates the existing mobile API key to include notification permissions
 */

const { ConvexHttpClient } = require("convex/browser");
require('dotenv').config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  console.error("Please make sure your .env.local file is properly configured.");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function fixMobileNotificationPermissions() {
  try {
    console.log("🔧 Fixing Mobile App API Key Notification Permissions...");
    console.log("📱 API Key: bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    console.log();

    const { api } = require("./convex/_generated/api.js");
    
    // Check if the API key exists
    console.log("🔍 Checking existing API key...");
    const existingKey = await convex.query(api.apiKeys.validateApiKey, {
      key: "bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ"
    });

    if (!existingKey) {
      console.log("❌ API key not found. Please run setup-mobile-api-key.js first.");
      process.exit(1);
    }

    console.log("✅ API key found!");
    console.log("📋 Current permissions:", existingKey.permissions);

    // Check if notification permissions are already present
    const hasNotificationRegister = existingKey.permissions.includes("notifications:register");
    const hasNotificationUpdate = existingKey.permissions.includes("notifications:update");
    const hasNotificationDelete = existingKey.permissions.includes("notifications:delete");

    if (hasNotificationRegister && hasNotificationUpdate && hasNotificationDelete) {
      console.log("✅ API key already has all notification permissions!");
      console.log("🎉 Mobile app should be able to register FCM tokens now.");
      return;
    }

    console.log("⚠️  API key missing notification permissions.");
    console.log("🔧 Adding notification permissions...");

    // Add notification permissions to existing permissions
    const updatedPermissions = [
      ...existingKey.permissions,
      "notifications:register",
      "notifications:update", 
      "notifications:delete"
    ];

    // Remove duplicates
    const uniquePermissions = [...new Set(updatedPermissions)];

    console.log("📝 Updated permissions:", uniquePermissions);

    // Get admin ID for the update
    const adminId = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: "setup@benzochem.com"
    });

    // Update the API key permissions
    await convex.mutation(api.apiKeys.updateApiKey, {
      apiKeyId: existingKey.id,
      permissions: uniquePermissions,
      updatedBy: adminId
    });

    console.log("✅ API key permissions updated successfully!");
    console.log("🎉 Mobile app can now register FCM tokens and receive push notifications!");
    console.log();
    console.log("📱 Test the mobile app now:");
    console.log("1. Open the mobile app");
    console.log("2. Check if FCM token registration works");
    console.log("3. Try sending a push notification from the admin dashboard");

  } catch (error) {
    console.error("❌ Error fixing API key permissions:", error.message);
    console.log();
    console.log("🔧 Manual Fix Required:");
    console.log("1. Open the admin dashboard");
    console.log("2. Navigate to API Keys section");
    console.log("3. Find the mobile app API key: bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    console.log("4. Edit the API key and add these permissions:");
    console.log("   - notifications:register");
    console.log("   - notifications:update");
    console.log("   - notifications:delete");
    console.log("5. Save the changes");
  }
}

// Run the fix
fixMobileNotificationPermissions().then(() => {
  console.log("🏁 Fix script completed.");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Fix script failed:", error);
  process.exit(1);
});