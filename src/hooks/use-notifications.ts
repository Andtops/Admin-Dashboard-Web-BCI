import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { notificationService } from "@/lib/notification-service";

export interface NotificationData {
  _id: string;
  type: "user_registration" | "user_approval" | "user_rejection" | "product_update" | "system_alert" | "gst_verification" | "order_notification";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  createdAt: number;
  readAt?: number;
  recipientType: "admin" | "user" | "all_admins" | "specific_user";
  recipientId?: string;
  relatedEntityType?: "user" | "product" | "order";
  relatedEntityId?: string;
  expiresAt?: number;
  createdBy?: string;
  readBy?: string;
}

export function useNotifications() {
  const { admin } = useAuth();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [lastNotificationCount, setLastNotificationCount] = useState<number>(0);

  // Mutations
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const createNotification = useMutation(api.notifications.createNotification);

  // Queries
  const notifications = useQuery(api.notifications.getNotifications, {
    recipientType: "all_admins",
    limit: 50,
  });

  const unreadCount = useQuery(api.notifications.getUnreadCount, {
    recipientType: "all_admins",
  });

  const notificationStats = useQuery(api.notifications.getNotificationStats);

  // Initialize admin ID
  useEffect(() => {
    if (admin?.email && !adminId) {
      getOrCreateAdmin({ email: admin.email })
        .then(setAdminId)
        .catch(console.error);
    }
  }, [admin?.email, adminId, getOrCreateAdmin]);

  // Real-time notification alerts
  useEffect(() => {
    if (unreadCount !== undefined && unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      // Get the latest notifications to show details
      const newNotifications = notifications?.filter(n => !n.isRead).slice(0, unreadCount - lastNotificationCount) || [];
      
      // Show individual notifications for new ones
      newNotifications.forEach(notification => {
        notificationService.handleNewNotification({
          id: notification._id,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          type: notification.type,
        });
      });
    }
    if (unreadCount !== undefined) {
      setLastNotificationCount(unreadCount);
    }
  }, [unreadCount, lastNotificationCount, notifications]);

  // Subscribe to notification service events
  useEffect(() => {
    const unsubscribeNew = notificationService.subscribe("new_notification", (event) => {
      console.log("New notification received:", event);
    });

    const unsubscribeRead = notificationService.subscribe("notification_read", (event) => {
      console.log("Notification marked as read:", event);
    });

    const unsubscribeDeleted = notificationService.subscribe("notification_deleted", (event) => {
      console.log("Notification deleted:", event);
    });

    return () => {
      unsubscribeNew();
      unsubscribeRead();
      unsubscribeDeleted();
    };
  }, []);

  // Mark notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!adminId) return false;

    try {
      await markAsRead({
        notificationId: notificationId as any,
        adminId: adminId as any,
      });
      
      // Notify service
      notificationService.handleNotificationRead(notificationId);
      return true;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to mark notification as read");
      return false;
    }
  }, [adminId, markAsRead]);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!adminId) return false;

    try {
      await markAllAsRead({ adminId: adminId as any });
      toast.success("All notifications marked as read");
      return true;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
      return false;
    }
  }, [adminId, markAllAsRead]);

  // Delete notification
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification({
        notificationId: notificationId as any,
      });
      
      // Notify service
      notificationService.handleNotificationDeleted(notificationId);
      toast.success("Notification deleted");
      return true;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
      return false;
    }
  }, [deleteNotification]);

  // Create new notification
  const handleCreateNotification = useCallback(async (data: {
    type: NotificationData["type"];
    title: string;
    message: string;
    priority?: NotificationData["priority"];
    recipientType?: NotificationData["recipientType"];
    recipientId?: string;
    relatedEntityType?: NotificationData["relatedEntityType"];
    relatedEntityId?: string;
    expiresAt?: number;
  }) => {
    try {
      const notificationId = await createNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || "medium",
        recipientType: data.recipientType || "all_admins",
        recipientId: data.recipientId as any,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        expiresAt: data.expiresAt,
        createdBy: adminId as any,
      });
      return notificationId;
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast.error("Failed to create notification");
      return null;
    }
  }, [createNotification, adminId]);

  // Get recent unread notifications
  const recentNotifications = notifications?.filter(n => !n.isRead).slice(0, 5) || [];

  // Utility functions
  const getNotificationIcon = (type: string) => {
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
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  return {
    // Data
    notifications,
    recentNotifications,
    unreadCount: unreadCount || 0,
    notificationStats,
    adminId,
    
    // Actions
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    createNotification: handleCreateNotification,
    
    // Utilities
    getNotificationIcon,
    formatTimeAgo,
    getPriorityColor,
    
    // Loading states
    isLoading: notifications === undefined || unreadCount === undefined,
  };
}