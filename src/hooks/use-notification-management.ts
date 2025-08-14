/**
 * Custom hook for notification management logic
 * Separates business logic from UI components
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNotificationContext } from "@/contexts/notification-context";
import { toast } from "sonner";
import { 
  Notification, 
  NotificationFilters, 
  BulkActionResult,
  NotificationAction
} from "@/types/notifications";

const DEFAULT_FILTERS: NotificationFilters = {
  search: "",
  type: "all",
  priority: "all",
  status: "all",
  dateRange: "all",
};

export function useNotificationManagement() {
  const { markAsRead, deleteNotification } = useNotificationContext();
  const [filters, setFilters] = useState<NotificationFilters>(DEFAULT_FILTERS);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Query notifications with filters
  const notifications = useQuery(api.notifications.getNotifications, {
    search: filters.search || undefined,
    type: filters.type === "all" ? undefined : filters.type as any,
    priority: filters.priority === "all" ? undefined : filters.priority as any,
    limit: 50,
  });

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter((notification: Notification) => {
      // Search filter
      const matchesSearch = !filters.search || 
        notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        notification.message.toLowerCase().includes(filters.search.toLowerCase());
      
      // Status filter
      const matchesStatus = filters.status === "all" || 
        (filters.status === "read" && notification.readAt) ||
        (filters.status === "unread" && !notification.readAt);
      
      // Date range filter
      const matchesDateRange = filters.dateRange === "all" || 
        isWithinDateRange(notification.createdAt, filters.dateRange || "all");
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [notifications, filters]);

  // Statistics
  const stats = useMemo(() => {
    if (!filteredNotifications) return { total: 0, unread: 0, read: 0 };
    
    return {
      total: filteredNotifications.length,
      unread: filteredNotifications.filter(n => !n.readAt).length,
      read: filteredNotifications.filter(n => n.readAt).length,
    };
  }, [filteredNotifications]);

  // Filter handlers
  const updateFilter = useCallback((key: keyof NotificationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Selection handlers
  const selectNotification = useCallback((notificationId: string, checked: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(notificationId);
      } else {
        newSet.delete(notificationId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
    } else {
      setSelectedNotifications(new Set());
    }
  }, [filteredNotifications]);

  const clearSelection = useCallback(() => {
    setSelectedNotifications(new Set());
  }, []);

  // Action handlers
  const handleSingleAction = useCallback(async (
    notificationId: string, 
    action: NotificationAction
  ): Promise<boolean> => {
    try {
      let success = false;
      
      switch (action) {
        case "markRead":
          success = await markAsRead(notificationId);
          if (success) toast.success("Notification marked as read");
          break;
        case "delete":
          success = await deleteNotification(notificationId);
          if (success) toast.success("Notification deleted");
          break;
        case "archive":
          // TODO: Implement archive functionality
          toast.info("Archive functionality coming soon");
          break;
      }
      
      return success;
    } catch (error) {
      console.error(`Failed to ${action} notification:`, error);
      toast.error(`Failed to ${action} notification`);
      return false;
    }
  }, [markAsRead, deleteNotification]);

  const handleBulkAction = useCallback(async (action: NotificationAction): Promise<BulkActionResult> => {
    if (selectedNotifications.size === 0) {
      toast.error("Please select notifications first");
      return { success: 0, failed: 0, errors: ["No notifications selected"] };
    }

    setIsLoading(true);
    const result: BulkActionResult = { success: 0, failed: 0, errors: [] };
    
    try {
      const promises = Array.from(selectedNotifications).map(async (id) => {
        try {
          const success = await handleSingleAction(id, action);
          if (success) {
            result.success++;
          } else {
            result.failed++;
            result.errors.push(`Failed to ${action} notification ${id}`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error processing notification ${id}: ${error}`);
        }
      });

      await Promise.all(promises);
      
      const actionText = getActionText(action);
      if (result.success > 0) {
        toast.success(`${result.success} notifications ${actionText}`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} notifications failed to ${action}`);
      }
      
      clearSelection();
    } catch (error) {
      console.error(`Failed to ${action} notifications:`, error);
      toast.error(`Failed to ${action} notifications`);
      result.errors.push(`Bulk action failed: ${error}`);
    } finally {
      setIsLoading(false);
    }

    return result;
  }, [selectedNotifications, handleSingleAction, clearSelection]);

  return {
    // Data
    notifications: filteredNotifications,
    stats,
    isLoading: isLoading || !notifications,
    
    // Filters
    filters,
    updateFilter,
    resetFilters,
    
    // Selection
    selectedNotifications,
    selectNotification,
    selectAll,
    clearSelection,
    
    // Actions
    handleSingleAction,
    handleBulkAction,
  };
}

// Helper functions
function isWithinDateRange(timestamp: number, range: string): boolean {
  const now = Date.now();
  const date = new Date(timestamp);
  const today = new Date();
  
  switch (range) {
    case "today":
      return date.toDateString() === today.toDateString();
    case "week":
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      return timestamp >= weekAgo;
    case "month":
      const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
      return timestamp >= monthAgo;
    default:
      return true;
  }
}

function getActionText(action: NotificationAction): string {
  switch (action) {
    case "markRead":
      return "marked as read";
    case "delete":
      return "deleted";
    case "archive":
      return "archived";
    default:
      return "processed";
  }
}