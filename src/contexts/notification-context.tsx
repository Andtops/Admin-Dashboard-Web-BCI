"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { notificationService } from "@/lib/notification-service";
import { useNotificationSettings } from "@/hooks/use-notification-settings";
import { 
  shouldShowBrowserNotification, 
  createBrowserNotification,
  validateNotificationData 
} from "@/lib/notification-utils";
import { toast } from "sonner";

interface NotificationContextType {
  unreadCount: number;
  recentNotifications: any[];
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  createNotification: (data: any) => Promise<string | null>;
  refreshNotifications: () => void;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useNotificationSettings();
  
  const {
    unreadCount,
    recentNotifications,
    isLoading,
    markAsRead: originalMarkAsRead,
    markAllAsRead: originalMarkAllAsRead,
    deleteNotification: originalDeleteNotification,
    createNotification: originalCreateNotification,
  } = useNotifications();

  // Initialize notification service
  useEffect(() => {
    if (!isInitialized) {
      try {
        notificationService.init();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize notification service:", err);
        setError("Failed to initialize notifications");
      }
    }
  }, [isInitialized]);

  // Request browser notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (settings.enableBrowserNotifications) {
          await notificationService.requestNotificationPermission();
        }
      } catch (error) {
        console.warn("Failed to request notification permission:", error);
        setError("Browser notifications not available");
      }
    };

    requestPermission();
  }, [settings.enableBrowserNotifications]);

  // Enhanced wrapper functions with error handling
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await originalMarkAsRead(id);
      if (!result) {
        throw new Error("Failed to mark notification as read");
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error marking notification as read:", err);
      return false;
    }
  }, [originalMarkAsRead]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const result = await originalMarkAllAsRead();
      if (!result) {
        throw new Error("Failed to mark all notifications as read");
      }
      toast.success("All notifications marked as read");
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error marking all notifications as read:", err);
      toast.error("Failed to mark all notifications as read");
      return false;
    }
  }, [originalMarkAllAsRead]);

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await originalDeleteNotification(id);
      if (!result) {
        throw new Error("Failed to delete notification");
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error deleting notification:", err);
      return false;
    }
  }, [originalDeleteNotification]);

  const createNotification = useCallback(async (data: any): Promise<string | null> => {
    try {
      setError(null);
      
      // Validate notification data
      const validation = validateNotificationData(data);
      if (!validation.valid) {
        throw new Error(`Invalid notification data: ${validation.errors.join(", ")}`);
      }

      const result = await originalCreateNotification(data);
      if (!result) {
        throw new Error("Failed to create notification");
      }

      // Show browser notification if conditions are met
      if (shouldShowBrowserNotification(data, settings)) {
        createBrowserNotification(data);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error creating notification:", err);
      return null;
    }
  }, [originalCreateNotification, settings]);

  const refreshNotifications = useCallback(() => {
    try {
      setError(null);
      // Convex automatically handles real-time updates, so this is mainly for UI feedback
      console.log("Refreshing notifications...");
      toast.success("Notifications refreshed");
    } catch (err) {
      console.error("Error refreshing notifications:", err);
      setError("Failed to refresh notifications");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: NotificationContextType = {
    unreadCount: unreadCount || 0,
    recentNotifications: recentNotifications || [],
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
    clearError,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}

// Export for backward compatibility
export { useNotifications as useNotificationHook };