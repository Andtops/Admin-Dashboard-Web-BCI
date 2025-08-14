/**
 * Notification system type definitions
 * Centralized types for better type safety across the notification system
 */

// Define types directly to avoid circular dependencies
export type NotificationType = 
  | "user_registration"
  | "user_approval" 
  | "user_rejection"
  | "order_notification"
  | "product_update"
  | "gst_verification"
  | "system_alert";

export type NotificationPriority = "urgent" | "high" | "medium" | "low";

export type RecipientType = "admin" | "user" | "all_admins" | "specific_user";

export type NotificationStatus = "unread" | "read" | "archived";

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<NotificationType, number>;
  recentNotifications: number;
  deliveryStats?: {
    successful: number;
    failed: number;
    pending: number;
  };
}

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status?: NotificationStatus; // Made optional to match Convex data structure
  recipientType: RecipientType;
  recipientId?: string; // Made optional to match Convex data structure
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt?: number;
  readAt?: number;
  deliveredAt?: number;
  failedAt?: number;
  errorMessage?: string;
  // Additional useful properties
  actionUrl?: string;
  expiresAt?: number;
}

export interface NotificationCreateRequest {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  recipientType: RecipientType;
  recipientId?: string;
  metadata?: Record<string, any>;
  scheduledFor?: number;
}

export interface NotificationFilters {
  search?: string;
  type?: NotificationType | "all";
  priority?: NotificationPriority | "all";
  status?: NotificationStatus | "all";
  recipientType?: RecipientType;
  dateRange?: "all" | "today" | "week" | "month";
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  offset?: number;
}

export interface NotificationSettings {
  enableBrowserNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  autoMarkAsRead: boolean;
  notificationSound: boolean;
  maxNotificationsToShow: number;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  priorityFilters: {
    urgent: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
}

// Error types
export interface NotificationError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// API Response types
export interface NotificationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: NotificationError;
  timestamp: number;
}

// Bulk operation types
export interface BulkNotificationOperation {
  action: "markRead" | "delete" | "archive";
  notificationIds: string[];
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

// Action types
export type NotificationAction = "markRead" | "delete" | "archive";

// Legacy alias for backward compatibility
export interface BulkActionResult {
  success: number;
  failed: number;
  errors: string[];
}

// Utility functions
export const getNotificationStatus = (notification: Notification): NotificationStatus => {
  // Use explicit status if available, otherwise derive from readAt
  if (notification.status) {
    return notification.status;
  }
  return notification.readAt ? "read" : "unread";
};