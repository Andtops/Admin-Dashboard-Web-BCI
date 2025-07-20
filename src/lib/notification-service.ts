/**
 * Real-time notification service
 * Handles real-time notifications without using localStorage for sensitive data
 */

import { toast } from "sonner";

export interface NotificationEvent {
  type: "new_notification" | "notification_read" | "notification_deleted";
  data: {
    id: string;
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "urgent";
    notificationType: string;
    timestamp: number;
  };
}

class NotificationService {
  private eventListeners: Map<string, ((event: NotificationEvent) => void)[]> = new Map();
  private isInitialized = false;

  /**
   * Initialize the notification service
   */
  init() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    console.log("🔔 Notification service initialized");
  }

  /**
   * Subscribe to notification events
   */
  subscribe(eventType: string, callback: (event: NotificationEvent) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit notification event
   */
  private emit(eventType: string, event: NotificationEvent) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * Handle new notification
   */
  handleNewNotification(notification: {
    id: string;
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "urgent";
    type: string;
  }) {
    const event: NotificationEvent = {
      type: "new_notification",
      data: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        notificationType: notification.type,
        timestamp: Date.now(),
      }
    };

    // Emit to subscribers
    this.emit("new_notification", event);

    // Show toast notification
    this.showToastNotification(notification);
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: {
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "urgent";
    type: string;
  }) {
    const icon = this.getNotificationIcon(notification.type);
    const duration = this.getToastDuration(notification.priority);

    switch (notification.priority) {
      case "urgent":
        toast.error(`${icon} ${notification.title}`, {
          description: notification.message,
          duration,
          action: {
            label: "View",
            onClick: () => window.location.href = "/dashboard/notifications"
          }
        });
        break;
      case "high":
        toast.warning(`${icon} ${notification.title}`, {
          description: notification.message,
          duration,
          action: {
            label: "View",
            onClick: () => window.location.href = "/dashboard/notifications"
          }
        });
        break;
      case "medium":
        toast.info(`${icon} ${notification.title}`, {
          description: notification.message,
          duration,
          action: {
            label: "View",
            onClick: () => window.location.href = "/dashboard/notifications"
          }
        });
        break;
      case "low":
        toast(`${icon} ${notification.title}`, {
          description: notification.message,
          duration,
          action: {
            label: "View",
            onClick: () => window.location.href = "/dashboard/notifications"
          }
        });
        break;
      default:
        toast.info(`${icon} ${notification.title}`, {
          description: notification.message,
          duration,
          action: {
            label: "View",
            onClick: () => window.location.href = "/dashboard/notifications"
          }
        });
    }
  }

  /**
   * Get notification icon based on type
   */
  private getNotificationIcon(type: string): string {
    switch (type) {
      case "user_registration":
        return "👤";
      case "user_approval":
        return "✅";
      case "user_rejection":
        return "❌";
      case "product_update":
        return "📦";
      case "system_alert":
        return "⚠️";
      case "gst_verification":
        return "✅";
      case "order_notification":
        return "📋";
      default:
        return "🔔";
    }
  }

  /**
   * Get toast duration based on priority
   */
  private getToastDuration(priority: string): number {
    switch (priority) {
      case "urgent":
        return 8000; // 8 seconds
      case "high":
        return 6000; // 6 seconds
      case "medium":
        return 4000; // 4 seconds
      case "low":
        return 3000; // 3 seconds
      default:
        return 4000;
    }
  }

  /**
   * Handle notification read
   */
  handleNotificationRead(notificationId: string) {
    const event: NotificationEvent = {
      type: "notification_read",
      data: {
        id: notificationId,
        title: "",
        message: "",
        priority: "medium",
        notificationType: "",
        timestamp: Date.now(),
      }
    };

    this.emit("notification_read", event);
  }

  /**
   * Handle notification deleted
   */
  handleNotificationDeleted(notificationId: string) {
    const event: NotificationEvent = {
      type: "notification_deleted",
      data: {
        id: notificationId,
        title: "",
        message: "",
        priority: "medium",
        notificationType: "",
        timestamp: Date.now(),
      }
    };

    this.emit("notification_deleted", event);
  }

  /**
   * Check browser notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Show browser notification
   */
  async showBrowserNotification(notification: {
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "urgent";
    type: string;
  }) {
    const hasPermission = await this.requestNotificationPermission();
    if (!hasPermission) return;

    const icon = "/favicon.ico"; // Use your app's icon
    const tag = `notification-${Date.now()}`;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon,
      tag,
      requireInteraction: notification.priority === "urgent",
      silent: notification.priority === "low",
    });

    browserNotification.onclick = () => {
      window.focus();
      window.location.href = "/dashboard/notifications";
      browserNotification.close();
    };

    // Auto close after duration based on priority
    const duration = this.getToastDuration(notification.priority);
    setTimeout(() => {
      browserNotification.close();
    }, duration);
  }

  /**
   * Cleanup service
   */
  cleanup() {
    this.eventListeners.clear();
    this.isInitialized = false;
    console.log("🔔 Notification service cleaned up");
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Auto-initialize
if (typeof window !== "undefined") {
  notificationService.init();
}