import { messaging } from './firebase-admin';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export interface NotificationTarget {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
}

export interface NotificationOptions {
  priority?: 'normal' | 'high';
  timeToLive?: number;
  collapseKey?: string;
  badge?: number;
  sound?: string;
  channelId?: string;
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  target: NotificationTarget,
  notification: PushNotificationData,
  options: NotificationOptions = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: any = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data || {},
      android: {
        priority: options.priority || 'high',
        ttl: options.timeToLive || 3600000, // 1 hour default
        collapseKey: options.collapseKey,
        notification: {
          channelId: options.channelId || 'default',
          sound: options.sound || 'default',
          clickAction: notification.clickAction,
          priority: options.priority || 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            badge: options.badge,
            sound: options.sound || 'default',
            'content-available': 1,
          },
        },
        fcm_options: {
          image: notification.imageUrl,
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/favicon.ico',
          image: notification.imageUrl,
          badge: '/badge-icon.png',
          requireInteraction: options.priority === 'high',
        },
        fcm_options: {
          link: notification.clickAction,
        },
      },
    };

    // Set target
    if (target.token) {
      message.token = target.token;
    } else if (target.topic) {
      message.topic = target.topic;
    } else if (target.condition) {
      message.condition = target.condition;
    } else {
      throw new Error('No valid target specified');
    }

    const response = await messaging.send(message);
    
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification to multiple devices
 */
export async function sendMulticastPushNotification(
  tokens: string[],
  notification: PushNotificationData,
  options: NotificationOptions = {}
): Promise<{ 
  success: boolean; 
  successCount: number; 
  failureCount: number; 
  responses: any[];
  error?: string;
}> {
  try {
    if (!tokens || tokens.length === 0) {
      throw new Error('No tokens provided');
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl,
      },
      data: notification.data || {},
      android: {
        priority: (options.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
        ttl: options.timeToLive || 3600000,
        collapseKey: options.collapseKey,
        notification: {
          channelId: options.channelId || 'default',
          sound: options.sound || 'default',
          clickAction: notification.clickAction,
          priority: (options.priority === 'high' ? 'high' : 'default') as 'low' | 'high' | 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            badge: options.badge,
            sound: options.sound || 'default',
            'content-available': 1,
          },
        },
        fcm_options: {
          image: notification.imageUrl,
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/favicon.ico',
          image: notification.imageUrl,
          badge: '/badge-icon.png',
          requireInteraction: options.priority === 'high',
        },
        fcm_options: {
          link: notification.clickAction,
        },
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    
    return {
      success: response.failureCount === 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('Error sending multicast push notification:', error);
    return {
      success: false,
      successCount: 0,
      failureCount: tokens.length,
      responses: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Subscribe tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await messaging.subscribeToTopic(tokens, topic);
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unsubscribe tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await messaging.unsubscribeFromTopic(tokens, topic);
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification to a topic
 */
export async function sendTopicNotification(
  topic: string,
  notification: PushNotificationData,
  options: NotificationOptions = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendPushNotification(
    { topic },
    notification,
    options
  );
}

/**
 * Validate FCM token
 */
export async function validateFCMToken(token: string): Promise<boolean> {
  try {
    // Try to send a dry-run message to validate the token
    await messaging.send({
      token,
      notification: {
        title: 'Test',
        body: 'Test',
      },
    }, true); // dry-run mode
    
    return true;
  } catch (error) {
    console.error('Invalid FCM token:', error);
    return false;
  }
}
