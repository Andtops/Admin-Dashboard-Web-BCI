// Test script to verify Convex integration for FCM tokens and push notifications
require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require('convex/browser');

console.log('Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testConvexIntegration() {
  console.log('🧪 Testing Convex Integration for Push Notifications...\n');

  try {
    // Test 1: Register a test FCM token
    console.log('1️⃣ Testing FCM Token Registration...');
    const tokenId = await convex.mutation('notifications:registerFCMToken', {
      token: 'test_token_' + Date.now(),
      platform: 'android',
      deviceInfo: {
        platform: 'android',
        version: '13.0',
        model: 'Test Device',
        appVersion: '1.0.0',
      },
      // userId is optional, so we don't pass it
      registeredAt: Date.now(),
    });
    console.log('✅ FCM Token registered with ID:', tokenId);

    // Test 2: Get all active FCM tokens
    console.log('\n2️⃣ Testing FCM Token Retrieval...');
    const tokens = await convex.query('notifications:getAllActiveFCMTokens');
    console.log('✅ Retrieved', tokens.length, 'active FCM tokens');

    // Test 3: Log a test push notification
    console.log('\n3️⃣ Testing Push Notification Logging...');
    const logId = await convex.mutation('notifications:logPushNotification', {
      target: 'single',
      title: 'Test Notification',
      body: 'This is a test notification for Convex integration',
      data: {
        category: 'test',
        timestamp: new Date().toISOString(),
      },
      result: {
        success: true,
        message: 'Test notification logged successfully',
        successCount: 1,
        failureCount: 0,
      },
      sentAt: Date.now(),
    });
    console.log('✅ Push notification logged with ID:', logId);

    // Test 4: Get users (if any exist)
    console.log('\n4️⃣ Testing User Retrieval...');
    const users = await convex.query('users:getUsers', {
      limit: 10,
      offset: 0
    });
    console.log('✅ Retrieved', users.length, 'users from database');

    console.log('\n🎉 All Convex integration tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - FCM Token Registration: ✅ Working');
    console.log('   - FCM Token Retrieval: ✅ Working');
    console.log('   - Push Notification Logging: ✅ Working');
    console.log('   - User Management: ✅ Working');
    console.log('\n🚀 Your push notification system is ready to use!');

  } catch (error) {
    console.error('❌ Convex integration test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure Convex is running: npx convex dev');
    console.log('   2. Check NEXT_PUBLIC_CONVEX_URL in .env.local');
    console.log('   3. Verify Convex functions are deployed');
  }
}

// Run the test
testConvexIntegration();