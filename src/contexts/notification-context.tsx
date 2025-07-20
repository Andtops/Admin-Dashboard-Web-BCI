"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { notificationService } from "@/lib/notification-service";

interface NotificationContextType {
  unreadCount: number;
  recentNotifications: any[];
  isLoading: boolean;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  createNotification: (data: any) => Promise<string | null>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    unreadCount,
    recentNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  } = useNotifications();

  // Initialize notification service
  useEffect(() => {
    if (!isInitialized) {
      notificationService.init();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Request browser notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      try {
        await notificationService.requestNotificationPermission();
      } catch (error) {
        console.warn("Failed to request notification permission:", error);
      }
    };

    requestPermission();
  }, []);

  const refreshNotifications = () => {
    // Convex automatically handles real-time updates, so this is mainly for UI feedback
    console.log("Refreshing notifications...");
  };

  const contextValue: NotificationContextType = {
    unreadCount: unreadCount || 0,
    recentNotifications: recentNotifications || [],
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
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