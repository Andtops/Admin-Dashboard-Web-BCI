/**
 * Notification utility functions
 * Helper functions for notification processing and formatting
 */

import { NotificationType, NotificationPriority } from "@/lib/notification-constants";
import { Notification } from "@/types/notifications";

/**
 * Format notification time ago
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format notification date
 */
export function formatNotificationDate(timestamp: number, format: "short" | "long" = "short"): string {
  const date = new Date(timestamp);
  
  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get notification priority weight for sorting
 */
export function getPriorityWeight(priority: NotificationPriority): number {
  const weights = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return weights[priority] || 2;
}

/**
 * Sort notifications by priority and date
 */
export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // First sort by priority (higher priority first)
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by date (newer first)
    return b.createdAt - a.createdAt;
  });
}

/**
 * Filter notifications by date range
 */
export function filterNotificationsByDate(
  notifications: Notification[],
  range: "today" | "week" | "month" | "all"
): Notification[] {
  if (range === "all") return notifications;
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfDay - (now.getDay() * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  let cutoffTime: number;
  switch (range) {
    case "today":
      cutoffTime = startOfDay;
      break;
    case "week":
      cutoffTime = startOfWeek;
      break;
    case "month":
      cutoffTime = startOfMonth;
      break;
    default:
      return notifications;
  }
  
  return notifications.filter(notification => notification.createdAt >= cutoffTime);
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const dateKey = date.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(notification);
  });
  
  return groups;
}

/**
 * Get notification statistics
 */
export function getNotificationStats(notifications: Notification[]) {
  const stats = {
    total: notifications.length,
    unread: 0,
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    byType: {} as Record<NotificationType, number>,
    byStatus: { read: 0, unread: 0, archived: 0 },
  };
  
  notifications.forEach(notification => {
    // Count by status
    if (notification.status === "read") {
      stats.byStatus.read++;
    } else if (notification.status === "archived") {
      stats.byStatus.archived++;
    } else {
      stats.unread++;
      stats.byStatus.unread++;
    }
    
    // Count by priority
    stats.byPriority[notification.priority]++;
    
    // Count by type
    if (!stats.byType[notification.type]) {
      stats.byType[notification.type] = 0;
    }
    stats.byType[notification.type]++;
  });
  
  return stats;
}

/**
 * Truncate notification message
 */
export function truncateMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength).trim() + "...";
}

/**
 * Generate notification preview text
 */
export function generateNotificationPreview(notification: Notification): string {
  const preview = `${notification.title}: ${truncateMessage(notification.message, 50)}`;
  return preview;
}

/**
 * Check if notification should show browser notification
 */
export function shouldShowBrowserNotification(
  notification: Notification,
  settings: { enableBrowserNotifications: boolean; priorityFilters: Record<NotificationPriority, boolean> }
): boolean {
  if (!settings.enableBrowserNotifications) return false;
  if (!settings.priorityFilters[notification.priority]) return false;
  
  // Don't show browser notification if page is visible
  if (document.visibilityState === "visible") return false;
  
  return true;
}

/**
 * Create browser notification
 */
export function createBrowserNotification(notification: Notification): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null;
  }
  
  try {
    const browserNotification = new Notification(notification.title, {
      body: truncateMessage(notification.message, 100),
      icon: "/favicon.ico", // You can customize this based on notification type
      tag: notification._id, // Prevents duplicate notifications
      requireInteraction: notification.priority === "urgent",
    });
    
    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== "urgent") {
      setTimeout(() => browserNotification.close(), 5000);
    }
    
    return browserNotification as any;
  } catch (error) {
    console.error("Failed to create browser notification:", error);
    return null;
  }
}

/**
 * Validate notification data
 */
export function validateNotificationData(data: Partial<Notification>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push("Title is required");
  }
  
  if (!data.message || data.message.trim().length === 0) {
    errors.push("Message is required");
  }
  
  if (data.title && data.title.length > 100) {
    errors.push("Title must be less than 100 characters");
  }
  
  if (data.message && data.message.length > 500) {
    errors.push("Message must be less than 500 characters");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}