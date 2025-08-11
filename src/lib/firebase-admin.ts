import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Method 1: Try using service account JSON file path (if you have the file)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      admin.initializeApp({
        credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    // Method 2: Use individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    // Method 3: Use default credentials (if running on Google Cloud)
    else {
      admin.initializeApp({
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export { admin };
export const messaging = admin.messaging();
export const firestore = admin.firestore();

// Push notification functions
interface PushNotificationData {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

interface BulkPushNotificationData {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
  android?: admin.messaging.AndroidConfig;
  apns?: admin.messaging.ApnsConfig;
}

export async function sendUserPushNotification({
  token,
  title,
  body,
  data,
  imageUrl,
  clickAction,
}: PushNotificationData) {
  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
        imageUrl,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          imageUrl,
          clickAction,
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          channelId: 'benzochem_notifications',
          color: '#FF6B35', // BenzoChem brand color
          icon: 'ic_notification',
          tag: 'benzochem_notification'
        },
        data: data || {}
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: 'default',
            badge: 1,
            category: clickAction,
            'mutable-content': 1
          }
        },
        fcmOptions: imageUrl ? {
          imageUrl: imageUrl
        } : undefined
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          image: imageUrl,
          tag: 'benzochem-notification',
          requireInteraction: true
        },
        fcmOptions: {
          link: clickAction
        }
      }
    };

    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);

    return {
      success: true,
      messageId: response,
      message: 'Notification sent successfully',
    };
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Enhanced error handling
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific Firebase error codes
      if ('code' in error) {
        const firebaseError = error as any;
        switch (firebaseError.code) {
          case 'messaging/registration-token-not-registered':
            errorMessage = 'FCM token is not registered or has expired. Please regenerate the token.';
            break;
          case 'messaging/invalid-registration-token':
            errorMessage = 'FCM token format is invalid. Please check the token.';
            break;
          case 'messaging/mismatched-credential':
            errorMessage = 'Firebase credentials mismatch. Please check your service account.';
            break;
          case 'messaging/invalid-argument':
            errorMessage = 'Invalid message payload. Please check the notification data.';
            break;
        }
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function sendBulkPushNotifications({
  tokens,
  title,
  body,
  data,
  imageUrl,
  clickAction,
  android,
  apns,
}: BulkPushNotificationData) {
  try {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        imageUrl,
      },
      data: data || {},
      android: android || {
        notification: {
          clickAction,
          priority: 'high',
        },
      },
      apns: apns || {
        payload: {
          aps: {
            category: clickAction,
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log('Successfully sent messages:', response);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
      message: `Sent ${response.successCount}/${tokens.length} notifications successfully`,
    };
  } catch (error) {
    console.error('Error sending bulk messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
