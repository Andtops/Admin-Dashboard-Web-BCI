/**
 * Notification system constants and configurations
 * Centralized configuration for better maintainability
 */

import { 
  Bell, 
  User, 
  Package, 
  AlertTriangle, 
  CheckCircle,
  ShoppingBag,
  FileText,
  Settings,
  Mail,
  Shield
} from "lucide-react";

// Notification Types
export const NOTIFICATION_TYPES = {
  user_registration: { 
    label: "User Registration", 
    icon: User,
    description: "New user account registrations"
  },
  user_approval: { 
    label: "User Approval", 
    icon: CheckCircle,
    description: "User account approvals and rejections"
  },
  order_notification: { 
    label: "Order Notification", 
    icon: ShoppingBag,
    description: "New orders and quotation requests"
  },
  product_update: { 
    label: "Product Update", 
    icon: Package,
    description: "Product information changes"
  },
  system_alert: { 
    label: "System Alert", 
    icon: AlertTriangle,
    description: "System warnings and alerts"
  },
  gst_verification: { 
    label: "GST Verification", 
    icon: Shield,
    description: "GST verification status updates"
  },
  email_notification: { 
    label: "Email Notification", 
    icon: Mail,
    description: "Email delivery status"
  },
  admin_action: { 
    label: "Admin Action", 
    icon: Settings,
    description: "Administrative actions and updates"
  },
} as const;

// Priority Levels
export const PRIORITY_CONFIG = {
  urgent: { 
    label: "Urgent", 
    color: "bg-red-500", 
    borderColor: "border-red-500 bg-red-50 dark:bg-red-950",
    textColor: "text-red-600 dark:text-red-400",
    description: "Requires immediate attention"
  },
  high: { 
    label: "High", 
    color: "bg-orange-500", 
    borderColor: "border-orange-500 bg-orange-50 dark:bg-orange-950",
    textColor: "text-orange-600 dark:text-orange-400",
    description: "Important, should be addressed soon"
  },
  medium: { 
    label: "Medium", 
    color: "bg-blue-500", 
    borderColor: "border-blue-500 bg-blue-50 dark:bg-blue-950",
    textColor: "text-blue-600 dark:text-blue-400",
    description: "Normal priority"
  },
  low: { 
    label: "Low", 
    color: "bg-green-500", 
    borderColor: "border-green-500 bg-green-50 dark:bg-green-950",
    textColor: "text-green-600 dark:text-green-400",
    description: "Informational, no rush"
  },
} as const;

// Recipient Types
export const RECIPIENT_TYPES = {
  all_admins: { label: "All Admins", description: "Send to all admin users" },
  specific_admin: { label: "Specific Admin", description: "Send to a specific admin" },
  role_based: { label: "Role Based", description: "Send based on admin role" },
} as const;

// Notification Status
export const NOTIFICATION_STATUS = {
  unread: { label: "Unread", color: "bg-blue-500" },
  read: { label: "Read", color: "bg-gray-500" },
  archived: { label: "Archived", color: "bg-gray-400" },
} as const;

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS = {
  enableBrowserNotifications: true,
  enableEmailNotifications: true,
  enablePushNotifications: true,
  autoMarkAsRead: false,
  notificationSound: true,
  maxNotificationsToShow: 50,
} as const;

// Notification templates for testing
export const NOTIFICATION_TEMPLATES = {
  user_registration: [
    {
      title: "New User Registration",
      message: "{{userName}} has registered and is pending approval",
      priority: "medium" as const,
    },
    {
      title: "Bulk Registration Alert",
      message: "{{count}} new users have registered in the last hour",
      priority: "high" as const,
    },
  ],
  order_notification: [
    {
      title: "New Quotation Request",
      message: "A new quotation request has been submitted for {{productName}}",
      priority: "high" as const,
    },
    {
      title: "Urgent Order",
      message: "High-priority order received from {{customerName}}",
      priority: "urgent" as const,
    },
  ],
  system_alert: [
    {
      title: "System Maintenance",
      message: "Scheduled maintenance will begin in {{timeRemaining}}",
      priority: "medium" as const,
    },
    {
      title: "High Server Load",
      message: "Server load is above normal thresholds",
      priority: "urgent" as const,
    },
  ],
} as const;

// Type definitions
export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type NotificationPriority = keyof typeof PRIORITY_CONFIG;
export type RecipientType = keyof typeof RECIPIENT_TYPES;
export type NotificationStatus = keyof typeof NOTIFICATION_STATUS;

// Utility functions
export const getNotificationIcon = (type: NotificationType) => {
  return NOTIFICATION_TYPES[type]?.icon || Bell;
};

export const getPriorityConfig = (priority: NotificationPriority) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
};

export const formatNotificationType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getNotificationTypeDescription = (type: NotificationType) => {
  return NOTIFICATION_TYPES[type]?.description || "General notification";
};