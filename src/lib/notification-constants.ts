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

// Import types from the types file to avoid circular dependencies
import type { NotificationType, NotificationPriority, RecipientType, NotificationStatus } from "@/types/notifications";

// Notification Types with improved organization and consistency
export const NOTIFICATION_TYPES = {
  // User-related notifications
  user_registration: { 
    label: "User Registration", 
    icon: User,
    description: "New user account registrations",
    category: "user",
    defaultPriority: "medium" as const
  },
  user_approval: { 
    label: "User Approval", 
    icon: CheckCircle,
    description: "User account approvals",
    category: "user",
    defaultPriority: "high" as const
  },
  user_rejection: { 
    label: "User Rejection", 
    icon: User, // Consider using UserX for better visual distinction
    description: "User account rejections",
    category: "user",
    defaultPriority: "high" as const
  },
  
  // Business-related notifications
  order_notification: { 
    label: "Order Notification", 
    icon: ShoppingBag,
    description: "New orders and quotation requests",
    category: "business",
    defaultPriority: "high" as const
  },
  product_update: { 
    label: "Product Update", 
    icon: Package,
    description: "Product information changes",
    category: "business",
    defaultPriority: "medium" as const
  },
  gst_verification: { 
    label: "GST Verification", 
    icon: Shield,
    description: "GST verification status updates",
    category: "business",
    defaultPriority: "medium" as const
  },
  
  // System notifications
  system_alert: { 
    label: "System Alert", 
    icon: AlertTriangle,
    description: "System warnings and alerts",
    category: "system",
    defaultPriority: "urgent" as const
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
  admin: { label: "Admin", description: "Send to admin users" },
  user: { label: "User", description: "Send to regular users" },
  all_admins: { label: "All Admins", description: "Send to all admin users" },
  specific_user: { label: "Specific User", description: "Send to a specific user" },
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
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  },
  priorityFilters: {
    urgent: true,
    high: true,
    medium: true,
    low: true,
  },
};

// Notification templates for testing and consistency
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
  user_approval: [
    {
      title: "User Account Approved",
      message: "{{userName}}'s account has been approved successfully",
      priority: "high" as const,
    },
  ],
  user_rejection: [
    {
      title: "User Account Rejected",
      message: "{{userName}}'s account has been rejected: {{reason}}",
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

// Category groupings for better organization
export const NOTIFICATION_CATEGORIES = {
  user: {
    label: "User Management",
    description: "User registration, approval, and account management",
    types: ["user_registration", "user_approval", "user_rejection"] as const
  },
  business: {
    label: "Business Operations", 
    description: "Orders, products, and business-related activities",
    types: ["order_notification", "product_update", "gst_verification"] as const
  },
  system: {
    label: "System & Admin",
    description: "System alerts and administrative actions", 
    types: ["system_alert"] as const
  }
} as const;

// Utility functions
export const getNotificationIcon = (type: NotificationType) => {
  return NOTIFICATION_TYPES[type]?.icon || Bell;
};

export const getPriorityConfig = (priority: NotificationPriority) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
};

export const getDefaultPriority = (type: NotificationType): NotificationPriority => {
  return NOTIFICATION_TYPES[type]?.defaultPriority || "medium";
};

export const getNotificationCategory = (type: NotificationType) => {
  return NOTIFICATION_TYPES[type]?.category || "system";
};

export const getNotificationsByCategory = (category: keyof typeof NOTIFICATION_CATEGORIES) => {
  return NOTIFICATION_CATEGORIES[category].types.map(type => ({
    type,
    ...NOTIFICATION_TYPES[type]
  }));
};

export const formatNotificationType = (type: string) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getNotificationTypeDescription = (type: NotificationType) => {
  return NOTIFICATION_TYPES[type]?.description || "General notification";
};

export const isHighPriorityNotification = (type: NotificationType) => {
  const priority = getDefaultPriority(type);
  return priority === "urgent" || priority === "high";
};