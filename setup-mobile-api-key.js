#!/usr/bin/env node

// Setup script for mobile app API key
// This script creates the API key required for the mobile app to work with reviews

const { ConvexHttpClient } = require("convex/browser");
require('dotenv').config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  console.error("Please make sure your .env.local file is properly configured.");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function setupMobileApiKey() {
  try {
    console.log("🔧 Setting up Mobile App API Key...");
    console.log("📱 API Key: bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    console.log();

    // First, check if the API key already exists
    console.log("🔍 Checking if API key already exists...");
    
    const { api } = require("./convex/_generated/api.js");
    
    const existingKey = await convex.query(api.apiKeys.validateApiKey, {
      key: "bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ"
    });

    if (existingKey) {
      console.log("✅ API key already exists!");
      console.log("📋 Current permissions:", existingKey.permissions);
      
      // Check if it has reviews permissions
      const hasReviewsRead = existingKey.permissions.includes("reviews:read");
      const hasReviewsWrite = existingKey.permissions.includes("reviews:write");
      
      if (hasReviewsRead && hasReviewsWrite) {
        console.log("✅ API key already has reviews permissions!");
        console.log("🎉 Mobile app should work correctly now.");
        return;
      } else {
        console.log("⚠️  API key exists but missing reviews permissions.");
        console.log("❌ Missing permissions:", [
          !hasReviewsRead && "reviews:read",
          !hasReviewsWrite && "reviews:write"
        ].filter(Boolean));
        console.log();
        console.log("Please update the API key through the admin dashboard to add reviews permissions.");
        return;
      }
    }

    console.log("📝 API key not found. Creating new API key...");
    
    // Create a temporary admin to create the API key
    console.log("👤 Creating temporary admin for API key creation...");
    
    const tempAdmin = await convex.mutation(api.admins.getOrCreateAdmin, {
      email: "setup@benzochem.com"
    });

    console.log("🔑 Creating API key with all required permissions...");
    
    // Create the API key using the existing mutation
    const apiKeyResult = await convex.mutation(api.apiKeys.createApiKey, {
      name: "Mobile App API Key",
      permissions: [
        "users:read",
        "users:write",
        "products:read", 
        "collections:read",
        "quotations:read",
        "quotations:write",
        "reviews:read",
        "reviews:write"
      ],
      adminId: tempAdmin,
      environment: "live",
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 150,
      }
    });

    console.log("✅ API key created successfully!");
    console.log("🔑 Generated API Key:", apiKeyResult.key);
    console.log("📋 Permissions:", apiKeyResult.permissions);
    console.log();
    
    if (apiKeyResult.key !== "bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ") {
      console.log("⚠️  Generated key is different from expected key.");
      console.log("📱 Please update the mobile app configuration to use:");
      console.log("   ", apiKeyResult.key);
      console.log();
      console.log("Or manually create an API key with the exact key:");
      console.log("   bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    }
    
    console.log("🎉 Setup complete! Mobile app should now work with reviews.");

  } catch (error) {
    console.error("❌ Error setting up API key:", error.message);
    console.log();
    console.log("🔧 Manual Setup Required:");
    console.log("1. Open the admin dashboard: http://localhost:3001");
    console.log("2. Navigate to API Keys section");
    console.log("3. Create a new API key with these permissions:");
    console.log("   - users:read, users:write");
    console.log("   - products:read");
    console.log("   - collections:read");
    console.log("   - quotations:read, quotations:write");
    console.log("   - reviews:read, reviews:write");
    console.log("4. Set the API key to: bzk_live_nGkfHjbSjzjy8Ex76T32F54tcx8RgRUQ");
    console.log("   (or update the mobile app config with the generated key)");
  }
}

// Run the setup
setupMobileApiKey().then(() => {
  console.log("🏁 Setup script completed.");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Setup script failed:", error);
  process.exit(1);
});