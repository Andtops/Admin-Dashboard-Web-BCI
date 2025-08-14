/**
 * Notification utility functions
 * Helper functions for notification processing and formatting
 */

import type { NotificationType, NotificationPriority } from "@/types/notifications";
import type { Notification, NotificationSettings } from "@/types/notifications";

// Constants for better maintainability
const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 500,
  DEFAULT_TRUNCATE_LENGTH: 100,
  PREVIEW_TRUNCATE_LENGTH: 50,
} as const;

const BROWSER_NOTIFICATION_CONFIG = {
  AUTO_CLOSE_DELAY: 5000,
  DEFAULT_ICON: "/favicon.ico",
} as const;

/**
 * Format notification time ago with improved accuracy
 */
export function formatTimeAgo(timestamp: number): string {
  if (!timestamp || timestamp <= 0) {
    return "Unknown time";
  }

  const now = Date.now();
  const diff = now - timestamp;
  
  // Handle future timestamps
  if (diff < 0) {
    return "In the future";
  }

  const seconds = Math.floor(diff / TIME_CONSTANTS.SECOND);
  const minutes = Math.floor(diff / TIME_CONSTANTS.MINUTE);
  const hours = Math.floor(diff / TIME_CONSTANTS.HOUR);
  const days = Math.floor(diff / TIME_CONSTANTS.DAY);
  const weeks = Math.floor(diff / TIME_CONSTANTS.WEEK);
  
  // Use more accurate month and year calculations
  const now_date = new Date(now);
  const timestamp_date = new Date(timestamp);
  const monthsDiff = (now_date.getFullYear() - timestamp_date.getFullYear()) * 12 + 
                    (now_date.getMonth() - timestamp_date.getMonth());
  const yearsDiff = now_date.getFullYear() - timestamp_date.getFullYear();

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (monthsDiff < 12) return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''} ago`;
  return `${yearsDiff} year${yearsDiff !== 1 ? 's' : ''} ago`;
}

/**
 * Format notification date with input validation
 */
export function formatNotificationDate(timestamp: number, format: "short" | "long" = "short"): string {
  if (!timestamp || timestamp <= 0) {
    return "Invalid date";
  }

  const date = new Date(timestamp);
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }
  
  const baseOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const longOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  
  return date.toLocaleDateString("en-US", format === "short" ? baseOptions : longOptions);
}

/**
 * Get notification priority weight for sorting with type safety
 */
export function getPriorityWeight(priority: NotificationPriority): number {
  const weights: Record<NotificationPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  } as const;
  
  return weights[priority] ?? weights.medium;
}

/**
 * Sort notifications by priority and date with input validation
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  if (!Array.isArray(notifications)) {
    return [];
  }

  return [...notifications].sort((a, b) => {
    // First sort by priority (higher priority first)
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by date (newer first)
    return b.createdAt - a.createdAt;
  });
}

/**
 * Filter notifications by date range with improved date calculations
 */
export function filterNotificationsByDate(
  notifications: Notification[],
  range: "today" | "week" | "month" | "all"
): Notification[] {
  if (!Array.isArray(notifications) || range === "all") {
    return notifications || [];
  }
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfDay - (now.getDay() * TIME_CONSTANTS.DAY);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const cutoffTimes = {
    today: startOfDay,
    week: startOfWeek,
    month: startOfMonth,
  } as const;
  
  const cutoffTime = cutoffTimes[range];
  if (cutoffTime === undefined) {
    return notifications;
  }
  
  return notifications.filter(notification => 
    notification?.createdAt && notification.createdAt >= cutoffTime
  );
}

/**
 * Group notifications by date with input validation
 */
export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  if (!Array.isArray(notifications)) {
    return {};
  }

  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    if (!notification?.createdAt) return;
    
    const date = new Date(notification.createdAt);
    if (isNaN(date.getTime())) return;
    
    const dateKey = date.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(notification);
  });
  
  return groups;
}

/**
 * Get notification statistics with input validation
 */
export function getNotificationStats(notifications: Notification[]) {
  if (!Array.isArray(notifications)) {
    return {
      total: 0,
      unread: 0,
      byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
      byType: {} as Record<NotificationType, number>,
      byStatus: { read: 0, unread: 0, archived: 0 },
    };
  }

  const stats = {
    total: notifications.length,
    unread: 0,
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    byType: {
      user_registration: 0,
      user_approval: 0,
      user_rejection: 0,
      order_notification: 0,
      product_update: 0,
      gst_verification: 0,
      system_alert: 0,
    } as Record<NotificationType, number>,
    byStatus: { read: 0, unread: 0, archived: 0 },
  };
  
  notifications.forEach(notification => {
    if (!notification) return;
    
    // Count by status
    if (notification.status === "read") {
      stats.byStatus.read++;
    } else if (notification.status === "archived") {
      stats.byStatus.archived++;
    } else {
      stats.unread++;
      stats.byStatus.unread++;
    }
    
    // Count by priority (with fallback)
    if (notification.priority && notification.priority in stats.byPriority) {
      stats.byPriority[notification.priority as NotificationPriority]++;
    }
    
    // Count by type
    if (notification.type && notification.type in stats.byType) {
      stats.byType[notification.type as NotificationType] = (stats.byType[notification.type as NotificationType] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * Truncate notification message with input validation
 */
export function truncateMessage(message: string, maxLength: number = VALIDATION_LIMITS.DEFAULT_TRUNCATE_LENGTH): string {
  if (!message || typeof message !== 'string') {
    return '';
  }
  
  if (maxLength <= 0) {
    return message;
  }
  
  if (message.length <= maxLength) {
    return message;
  }
  
  return message.substring(0, maxLength).trim() + "...";
}

/**
 * Generate notification preview text with input validation
 */
export function generateNotificationPreview(notification: Notification): string {
  if (!notification) {
    return 'Invalid notification';
  }
  
  const title = notification.title || 'Untitled';
  const message = truncateMessage(notification.message || '', VALIDATION_LIMITS.PREVIEW_TRUNCATE_LENGTH);
  
  return `${title}: ${message}`;
}

/**
 * Check if notification should show browser notification with improved validation
 */
export function shouldShowBrowserNotification(
  notification: Notification,
  settings: { enableBrowserNotifications: boolean; priorityFilters: Record<NotificationPriority, boolean> }
): boolean {
  if (!notification || !settings) return false;
  if (!settings.enableBrowserNotifications) return false;
  if (!notification.priority || !settings.priorityFilters[notification.priority as NotificationPriority]) return false;
  
  // Check if browser notifications are supported
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  
  // Don't show browser notification if page is visible
  if (typeof document !== 'undefined' && document.visibilityState === "visible") return false;
  
  return true;
}

/**
 * Create browser notification with improved error handling and configuration
 */
export function createBrowserNotification(notification: Notification): globalThis.Notification | null {
  // Validate input
  if (!notification || !notification.title) {
    console.warn("Invalid notification data provided");
    return null;
  }

  // Check browser support and permissions
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn("Browser notifications not supported");
    return null;
  }
  
  if (Notification.permission !== "granted") {
    console.warn("Browser notification permission not granted");
    return null;
  }
  
  try {
    const browserNotification = new Notification(notification.title, {
      body: truncateMessage(notification.message || '', VALIDATION_LIMITS.DEFAULT_TRUNCATE_LENGTH),
      icon: BROWSER_NOTIFICATION_CONFIG.DEFAULT_ICON,
      tag: notification._id, // Prevents duplicate notifications
      requireInteraction: notification.priority === "urgent",
      silent: false,
    });
    
    // Auto-close after configured delay for non-urgent notifications
    if (notification.priority !== "urgent") {
      setTimeout(() => {
        try {
          browserNotification.close();
        } catch (closeError) {
          console.warn("Failed to close browser notification:", closeError);
        }
      }, BROWSER_NOTIFICATION_CONFIG.AUTO_CLOSE_DELAY);
    }
    
    return browserNotification;
  } catch (error) {
    console.error("Failed to create browser notification:", error);
    return null;
  }
}

/**
 * Validate notification data with comprehensive validation
 */
export function validateNotificationData(data: Partial<Notification>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required field validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push("Title is required and must be a non-empty string");
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    errors.push("Message is required and must be a non-empty string");
  }
  
  // Length validation using constants
  if (data.title && data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    errors.push(`Title must be less than ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} characters`);
  }
  
  if (data.message && data.message.length > VALIDATION_LIMITS.MESSAGE_MAX_LENGTH) {
    errors.push(`Message must be less than ${VALIDATION_LIMITS.MESSAGE_MAX_LENGTH} characters`);
  }
  
  // Type validation
  if (data.type && typeof data.type !== 'string') {
    errors.push("Type must be a valid notification type");
  }
  
  if (data.priority && typeof data.priority !== 'string') {
    errors.push("Priority must be a valid priority level");
  }
  
  // Timestamp validation
  if (data.createdAt && (typeof data.createdAt !== 'number' || data.createdAt <= 0)) {
    errors.push("Created timestamp must be a positive number");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}