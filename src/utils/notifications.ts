import { Notification, NotificationType } from '@/types/notifications';
import { NOTIFICATION_TYPES } from '@/constants/notifications';

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getNotificationTypeLabel = (type: NotificationType): string => {
  return NOTIFICATION_TYPES[type] || type;
};

export const filterNotifications = (
  notifications: Notification[],
  filters: {
    searchTerm: string;
    typeFilter: string;
    priorityFilter: string;
    readFilter: string;
  }
): Notification[] => {
  const { searchTerm, typeFilter, priorityFilter, readFilter } = filters;
  
  return notifications.filter(notification => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = notification.title.toLowerCase().includes(searchLower);
      const messageMatch = notification.message.toLowerCase().includes(searchLower);
      if (!titleMatch && !messageMatch) return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && notification.type !== typeFilter) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== "all" && notification.priority !== priorityFilter) {
      return false;
    }
    
    // Read status filter
    if (readFilter === "read" && !notification.isRead) {
      return false;
    }
    if (readFilter === "unread" && notification.isRead) {
      return false;
    }
    
    return true;
  });
};

export const paginateArray = <T>(array: T[], page: number, pageSize: number): T[] => {
  return array.slice(page * pageSize, (page + 1) * pageSize);
};