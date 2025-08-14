/**
 * Custom hook for managing notification settings
 * Provides a clean interface for notification preferences
 */

import { useState, useEffect } from "react";
import { NotificationSettings } from "@/types/notifications";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/notification-constants";

const SETTINGS_STORAGE_KEY = "notification-settings";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load notification settings:", err);
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      
      // If browser notifications are enabled, request permission
      if (updatedSettings.enableBrowserNotifications && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error("Failed to update notification settings:", err);
      setError("Failed to update settings");
      return { success: false, error: "Failed to update settings" };
    }
  };

  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  // Check if browser notifications are supported and permitted
  const getBrowserNotificationStatus = () => {
    if (!("Notification" in window)) {
      return { supported: false, permission: "unsupported" };
    }
    
    return {
      supported: true,
      permission: Notification.permission,
    };
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    getBrowserNotificationStatus,
  };
}