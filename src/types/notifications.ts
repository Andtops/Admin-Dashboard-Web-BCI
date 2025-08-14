/**
 * Notification system type definitions
 * Centralized types for better type safety across the notification system
 */

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    user_registration: number;
    user_approval: number;
    order_notification: number;
    product_update: number;
    system_alert: number;
    gst_verification: number;
    email_notification: number;
    admin_action: number;
  };
  recentNotifications: number;
  deliveryStats: {
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
  status: NotificationStatus;
  recipientType: RecipientType;
  recipientId?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  readAt?: number;
  deliveredAt?: number;
  failedAt?: number;
  errorMessage?: string;
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
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  recipientType?: RecipientType;
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

// Re-export types from constants for convenience
export type {
  NotificationType,
  NotificationPriority,
  RecipientType,
  NotificationStatus
} from "@/lib/notification-constants";

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