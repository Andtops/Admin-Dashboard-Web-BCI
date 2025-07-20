// This script will help set up the API key for the user application
// Run this with: node setup-api-key.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("=".repeat(60));
console.log("BENZOCHEM ADMIN API KEY SETUP");
console.log("=".repeat(60));
console.log();

console.log("The user application is trying to connect to the admin API but");
console.log("the API key doesn't have the required permissions.");
console.log();

console.log("Current API key in user/.env.local:");
console.log("bzk_live_6a30bzNDxDggC4b6XXe7TTEqHp448vTw");
console.log();

console.log("Required permissions for quotations to work:");
console.log("- users:read");
console.log("- users:write");
console.log("- products:read");
console.log("- collections:read");
console.log("- quotations:read");
console.log("- quotations:write");
console.log();

console.log("To fix this issue, you have two options:");
console.log();

console.log("OPTION 1: Create API key through Admin Dashboard");
console.log("1. Open http://localhost:3001 in your browser");
console.log("2. Log in to the admin dashboard");
console.log("3. Navigate to API Keys section");
console.log("4. Create a new API key with the permissions listed above");
console.log("5. Copy the generated API key");
console.log("6. Update NEXT_PUBLIC_API_KEY in user/.env.local");
console.log();

console.log("OPTION 2: Create API key directly in database");
console.log("1. We can create a script to insert the API key directly");
console.log("2. This bypasses the admin authentication requirement");
console.log("3. The API key will be: bzk_live_6a30bzNDxDggC4b6XXe7TTEqHp448vTw");
console.log();

rl.question('Which option would you like to use? (1 or 2): ', (answer) => {
  if (answer === '1') {
    console.log();
    console.log("Please follow the steps for Option 1 above.");
    console.log("If you don't have admin credentials, you may need to create");
    console.log("an admin account first or use Option 2.");
  } else if (answer === '2') {
    console.log();
    console.log("Creating API key setup script...");
    
    const setupScript = `
// Direct API key insertion script
const { ConvexHttpClient } = require("convex/browser");

async function setupApiKey() {
  try {
    console.log("Setting up API key directly in database...");
    
    // This would require direct database access
    // For now, we'll create a manual insertion script
    
    const apiKeyData = {
      name: "User App API Key",
      key: "bzk_live_6a30bzNDxDggC4b6XXe7TTEqHp448vTw",
      keyId: "6a30bzND",
      environment: "live",
      permissions: [
        "users:read",
        "users:write", 
        "products:read",
        "collections:read",
        "quotations:read",
        "quotations:write"
      ],
      isActive: true,
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 150,
      },
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    console.log("API Key data prepared:", apiKeyData);
    console.log("\\nThis needs to be inserted into the Convex database.");
    console.log("Please use the Convex dashboard or admin interface to add this key.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

setupApiKey();
`;
    
    require('fs').writeFileSync('insert-api-key.js', setupScript);
    console.log("Created insert-api-key.js script.");
    console.log("However, this still requires admin access to the database.");
  } else {
    console.log("Invalid option. Please run the script again and choose 1 or 2.");
  }
  
  rl.close();
});