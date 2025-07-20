// Script to update API key permissions to include collections access
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

async function updateApiKeyPermissions() {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  
  try {
    // First, get all API keys to find the one we want to update
    const apiKeys = await client.query(api.apiKeys.getApiKeys);
    console.log('Found API keys:', apiKeys.length);
    
    // Find the API key with keyId "R3j4SW2k"
    const targetApiKey = apiKeys.find(key => key.keyId === 'R3j4SW2k');
    
    if (!targetApiKey) {
      console.error('API key with keyId "R3j4SW2k" not found');
      return;
    }
    
    console.log('Found target API key:', {
      id: targetApiKey._id,
      name: targetApiKey.name,
      currentPermissions: targetApiKey.permissions
    });
    
    // Add collections permissions to the existing permissions
    const newPermissions = [
      ...targetApiKey.permissions,
      'collections.read',
      'collections.write'
    ];
    
    // Remove duplicates
    const uniquePermissions = [...new Set(newPermissions)];
    
    console.log('Updating permissions to:', uniquePermissions);
    
    // Update the API key
    await client.mutation(api.apiKeys.updateApiKey, {
      apiKeyId: targetApiKey._id,
      permissions: uniquePermissions
    });
    
    console.log('✅ API key permissions updated successfully!');
    
    // Verify the update
    const updatedApiKeys = await client.query(api.apiKeys.getApiKeys);
    const updatedApiKey = updatedApiKeys.find(key => key.keyId === 'R3j4SW2k');
    
    console.log('Updated permissions:', updatedApiKey?.permissions);
    
  } catch (error) {
    console.error('❌ Error updating API key permissions:', error);
  }
}

updateApiKeyPermissions();
