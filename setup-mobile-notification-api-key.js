#!/usr/bin/env node

/**
 * Setup script for creating a mobile app API key with notification permissions
 * This script creates an API key specifically for the mobile app to register FCM tokens
 * and handle push notifications.
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api.js");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function setupMobileNotificationApiKey() {
  try {
    console.log("🔧 Setting up Mobile Notification API Key...");
    console.log("=====================================");

    // Create or get admin user
    const adminEmail = "admin@benzochem.com";
    console.log(`📧 Getting admin user: ${adminEmail}`);
    
    const adminId = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: adminEmail
    });
    
    console.log(`✅ Admin ID: ${adminId}`);

    // Define mobile app notification permissions
    const mobileNotificationPermissions = [
      // Core notification permissions
      "notifications:register",
      "notifications:update", 
      "notifications:delete",
      "notifications:send",
      
      // User management (for token association)
      "users:read",
      "users:write",
      
      // Analytics (for notification tracking)
      "analytics:read",
      
      // Basic product access (for notification content)
      "products:read",
      "collections:read"
    ];

    console.log("🔑 Creating Mobile Notification API Key...");
    console.log("Permissions:", mobileNotificationPermissions);

    // Create the API key
    const apiKey = await convex.mutation(api.apiKeys.createApiKey, {
      name: "Mobile App - Push Notifications",
      permissions: mobileNotificationPermissions,
      adminId: adminId,
      environment: "live",
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 20
      }
    });

    console.log("✅ Mobile Notification API Key created successfully!");
    console.log("=====================================");
    console.log("📋 API Key Details:");
    console.log(`   Name: ${apiKey.name}`);
    console.log(`   Key ID: ${apiKey.keyId}`);
    console.log(`   Environment: ${apiKey.environment}`);
    console.log(`   Permissions: ${apiKey.permissions.length} permissions`);
    console.log("=====================================");
    console.log("🔐 API Key (KEEP SECURE):");
    console.log(`   ${apiKey.key}`);
    console.log("=====================================");
    console.log("");
    console.log("📱 Mobile App Configuration:");
    console.log("Add this API key to your mobile app's configuration:");
    console.log("");
    console.log("React Native (.env):");
    console.log(`REACT_NATIVE_API_KEY=${apiKey.key}`);
    console.log(`REACT_NATIVE_API_BASE_URL=https://your-domain.com/api`);
    console.log("");
    console.log("Flutter (config.dart):");
    console.log(`static const String apiKey = '${apiKey.key}';`);
    console.log(`static const String apiBaseUrl = 'https://your-domain.com/api';`);
    console.log("");
    console.log("📡 API Endpoints Available:");
    console.log("- POST /api/notifications/register-token");
    console.log("- PUT /api/notifications/register-token");
    console.log("- DELETE /api/notifications/register-token");
    console.log("- POST /api/notifications/send-push");
    console.log("- GET /api/notifications/test");
    console.log("");
    console.log("🔒 Security Notes:");
    console.log("- Store this API key securely in your mobile app");
    console.log("- Never commit the API key to version control");
    console.log("- Use environment variables or secure storage");
    console.log("- Monitor API key usage in the admin dashboard");
    console.log("");
    console.log("✅ Setup completed successfully!");

  } catch (error) {
    console.error("❌ Error setting up mobile notification API key:", error);
    process.exit(1);
  }
}

// Run the setup
setupMobileNotificationApiKey();