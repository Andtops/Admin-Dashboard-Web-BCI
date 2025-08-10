// Script to fix API key permissions for quotation functionality
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

async function fixQuotationPermissions() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  
  try {
    console.log('🔍 Searching for API keys...');
    
    // Get all API keys to find the one being used
    const apiKeys = await client.query(api.apiKeys.getApiKeys);
    console.log(`Found ${apiKeys.length} API keys`);
    
    // Look for the API key that matches the one in user/.env.local
    const targetKeyId = 'KNkDFFq7'; // From bzk_live_KNkDFFq7YXizJpStewzShNwVD20loWZd
    let targetApiKey = apiKeys.find(key => key.keyId === targetKeyId);
    
    if (!targetApiKey) {
      console.log(`❌ API key with keyId "${targetKeyId}" not found`);
      console.log('Available API keys:');
      apiKeys.forEach(key => {
        console.log(`  - ${key.keyId}: ${key.name} (${key.permissions.join(', ')})`);
      });
      
      // Try to find any API key that might work
      targetApiKey = apiKeys.find(key => 
        key.permissions.includes('quotations:read') || 
        key.permissions.includes('quotations.read') ||
        key.permissions.includes('*')
      );
      
      if (!targetApiKey) {
        console.log('❌ No suitable API key found. Creating a new one...');
        
        // Create a new API key with all required permissions
        const newApiKey = await client.mutation(api.apiKeys.createApiKey, {
          name: "User App - Full Access",
          permissions: [
            "users:read",
            "users:write",
            "products:read",
            "collections:read", 
            "quotations:read",
            "quotations:write"
          ],
          environment: "live",
          rateLimit: {
            requestsPerMinute: 100,
            requestsPerHour: 5000,
            requestsPerDay: 50000,
            burstLimit: 150,
          }
        });
        
        console.log('✅ Created new API key:', newApiKey);
        console.log('🔧 Please update user/.env.local with this new API key:');
        console.log(`NEXT_PUBLIC_API_KEY=${newApiKey.key}`);
        return;
      }
    }
    
    console.log('🎯 Found target API key:', {
      id: targetApiKey._id,
      keyId: targetApiKey.keyId,
      name: targetApiKey.name,
      currentPermissions: targetApiKey.permissions
    });
    
    // Check if it already has the required permissions
    const requiredPermissions = [
      'users:read',
      'users:write', 
      'products:read',
      'collections:read',
      'quotations:read',
      'quotations:write'
    ];
    
    const hasAllPermissions = requiredPermissions.every(perm => 
      targetApiKey.permissions.includes(perm) || 
      targetApiKey.permissions.includes(perm.replace(':', '.')) ||
      targetApiKey.permissions.includes('*')
    );
    
    if (hasAllPermissions) {
      console.log('✅ API key already has all required permissions!');
      console.log('🤔 The issue might be elsewhere. Let me check the API key format...');
      
      // Check if the key format matches what's expected
      const expectedKey = `bzk_live_${targetApiKey.keyId}${targetApiKey.key.split('_')[2] || 'YXizJpStewzShNwVD20loWZd'}`;
      console.log('Expected key format:', expectedKey);
      console.log('Current key in user/.env.local: bzk_live_KNkDFFq7YXizJpStewzShNwVD20loWZd');
      
      return;
    }
    
    // Add missing permissions
    const currentPermissions = targetApiKey.permissions;
    const newPermissions = [...new Set([...currentPermissions, ...requiredPermissions])];
    
    console.log('🔧 Updating permissions...');
    console.log('Current:', currentPermissions);
    console.log('New:', newPermissions);
    
    // Update the API key
    await client.mutation(api.apiKeys.updateApiKey, {
      apiKeyId: targetApiKey._id,
      permissions: newPermissions
    });
    
    console.log('✅ API key permissions updated successfully!');
    
    // Verify the update
    const updatedApiKeys = await client.query(api.apiKeys.getApiKeys);
    const updatedApiKey = updatedApiKeys.find(key => key._id === targetApiKey._id);
    
    console.log('✅ Verified updated permissions:', updatedApiKey?.permissions);
    console.log('🎉 Quotation functionality should now work!');
    
  } catch (error) {
    console.error('❌ Error fixing quotation permissions:', error);
    
    if (error.message.includes('CONVEX_URL')) {
      console.log('💡 Make sure NEXT_PUBLIC_CONVEX_URL is set in your .env.local file');
    }
  }
}

console.log('🚀 Starting API key permission fix...');
fixQuotationPermissions();