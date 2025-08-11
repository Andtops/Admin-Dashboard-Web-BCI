// Simple Firebase Admin SDK test script
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, 'config', 'benzochem-industries-b9e64-firebase-adminsdk-fbsvc-4702fe7876.json');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  }

  // Test sending a notification with enhanced debugging
  async function testNotification() {
    const testToken = 'dGqvvGViT_6hAjr9qB8iGG:APA91bF5EHsh1k0vHzdHcS7Y-IUveTwXXRtqahYAmxO9OqaYZWa87JFt4XSDNkAhYjb-E1h1eAGROUpvt-110eQIZenuwRWjullZ0tQNa7nBCukE85C9xYA';
    
    console.log('🔍 Testing with token:', testToken.substring(0, 20) + '...');
    
    const message = {
      notification: {
        title: 'Firebase Test - Enhanced',
        body: 'Testing Firebase Admin SDK with enhanced debugging'
      },
      data: {
        category: 'test',
        timestamp: new Date().toISOString(),
        source: 'admin-test-script'
      },
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          channelId: 'benzochem_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: 'Firebase Test - Enhanced',
              body: 'Testing Firebase Admin SDK with enhanced debugging'
            },
            sound: 'default',
            badge: 1
          }
        }
      },
      token: testToken
    };

    try {
      console.log('📤 Sending notification...');
      const response = await admin.messaging().send(message);
      console.log('✅ Test notification sent successfully!');
      console.log('📋 Message ID:', response);
      console.log('🎯 If you don\'t receive the notification, check:');
      console.log('   1. Mobile app is running and in foreground/background');
      console.log('   2. Notification permissions are enabled');
      console.log('   3. FCM token is fresh (regenerate if needed)');
      console.log('   4. Mobile app Firebase configuration matches project');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      
      // Check specific error types
      if (error.code === 'messaging/registration-token-not-registered') {
        console.log('🔍 Token is not registered or expired - regenerate FCM token in mobile app');
      } else if (error.code === 'messaging/invalid-registration-token') {
        console.log('🔍 Token format is invalid - check token generation');
      } else if (error.code === 'messaging/mismatched-credential') {
        console.log('🔍 Service account credentials mismatch - check Firebase project');
      } else {
        console.log('🔍 Error details:', error.message);
      }
    }
  }

  testNotification();

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}