/**
 * Real-time notification service
 * Handles real-time notifications without using localStorage for sensitive data
 */

import React from "react";
import { toast } from "sonner";
import {
  getNotificationIcon
} from "@/lib/notification-constants";
import type { NotificationType, NotificationPriority } from "@/types/notifications";

export interface NotificationEvent {
  type: "new_notification" | "notification_read" | "notification_deleted";
  data: {
    id: string;
    title: string;
    message: string;
    priority: NotificationPriority;
    notificationType: NotificationType;
    timestamp: number;
  };
}

export interface NotificationOptions {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  type: NotificationType;
}

export interface UserInfo {
  userEmail: string;
  userName: string;
  businessInfo?: {
    businessName?: string;
    gstNumber?: string;
    isGstVerified?: boolean;
  };
}

class NotificationService {
  private eventListeners: Map<string, ((event: NotificationEvent) => void)[]> = new Map();
  private isInitialized = false;
  private notificationQueue: NotificationOptions[] = [];
  private isProcessingQueue = false;

  /**
   * Initialize the notification service
   */
  init() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log("🔔 Notification service initialized");
    
    // Process any queued notifications
    this.processQueue();
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
   * Handle new notification with error handling
   */
  handleNewNotification(notification: NotificationOptions) {
    try {
      // Validate notification data
      if (!this.validateNotification(notification)) {
        console.error("Invalid notification data:", notification);
        return;
      }

      // If service is not initialized, queue the notification
      if (!this.isInitialized) {
        this.notificationQueue.push(notification);
        return;
      }

      this.processNotification(notification);
    } catch (error) {
      console.error("Error handling new notification:", error);
    }
  }

  /**
   * Process a single notification
   */
  private processNotification(notification: NotificationOptions) {
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
   * Process queued notifications
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) return;

    this.isProcessingQueue = true;
    
    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        if (notification) {
          this.processNotification(notification);
          // Small delay to prevent overwhelming the UI
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error("Error processing notification queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Validate notification data
   */
  private validateNotification(notification: NotificationOptions): boolean {
    return !!(
      notification.id &&
      notification.title &&
      notification.message &&
      notification.priority &&
      notification.type
    );
  }

  /**
   * Show toast notification
   */
  private showToastNotification(notification: {
    title: string;
    message: string;
    priority: NotificationPriority;
    type: NotificationType;
  }) {
    const IconComponent = getNotificationIcon(notification.type);
    const duration = this.getToastDuration(notification.priority);

    const commonOptions = {
      description: notification.message,
      duration,
      action: {
        label: "View",
        onClick: () => window.location.href = "/dashboard/notifications"
      },
      icon: React.createElement(IconComponent, { className: "h-4 w-4" })
    };

    switch (notification.priority) {
      case "urgent":
        toast.error(notification.title, commonOptions);
        break;
      case "high":
        toast.warning(notification.title, commonOptions);
        break;
      case "medium":
        toast.info(notification.title, commonOptions);
        break;
      case "low":
        toast(notification.title, commonOptions);
        break;
      default:
        toast.info(notification.title, commonOptions);
    }
  }

  /**
   * Get toast duration based on priority
   */
  private getToastDuration(priority: NotificationPriority): number {
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
        priority: "medium" as const,
        notificationType: "system_alert" as const,
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
        priority: "medium" as const,
        notificationType: "system_alert" as const,
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
    priority: NotificationPriority;
    type: NotificationType;
  }) {
    try {
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
    } catch (error) {
      console.error("Error showing browser notification:", error);
    }
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