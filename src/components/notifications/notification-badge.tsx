"use client";

import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useNotificationContext } from "@/contexts/notification-context";

interface NotificationBadgeProps {
  className?: string;
  showIcon?: boolean;
  maxCount?: number;
}

export function NotificationBadge({ 
  className = "", 
  showIcon = true, 
  maxCount = 99 
}: NotificationBadgeProps) {
  const { unreadCount } = useNotificationContext();

  if (unreadCount === 0) {
    return showIcon ? <Bell className={`h-5 w-5 ${className}`} /> : null;
  }

  return (
    <div className="relative">
      {showIcon && <Bell className={`h-5 w-5 ${className}`} />}
      <Badge 
        variant="destructive" 
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 flex items-center justify-center"
      >
        {unreadCount > maxCount ? `${maxCount}+` : unreadCount}
      </Badge>
    </div>
  );
}