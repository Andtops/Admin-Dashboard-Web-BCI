"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationContext } from "@/contexts/notification-context";
import { Bell, User, Package, AlertTriangle, CheckCircle } from "lucide-react";

export function NotificationTest() {
  const { createNotification } = useNotificationContext();

  const testNotifications = [
    {
      type: "user_registration" as const,
      title: "New User Registration",
      message: "John Doe has registered and is pending approval",
      priority: "medium" as const,
    },
    {
      type: "order_notification" as const,
      title: "New Quotation Request",
      message: "A new quotation request has been submitted for Benzene",
      priority: "high" as const,
    },
    {
      type: "system_alert" as const,
      title: "System Alert",
      message: "High number of pending user approvals detected",
      priority: "urgent" as const,
    },
    {
      type: "user_approval" as const,
      title: "User Approved",
      message: "Jane Smith's account has been approved successfully",
      priority: "low" as const,
    },
    {
      type: "product_update" as const,
      title: "Product Updated",
      message: "Toluene product information has been updated",
      priority: "medium" as const,
    },
  ];

  const handleCreateTestNotification = async (notification: typeof testNotifications[0]) => {
    try {
      await createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        recipientType: "all_admins",
      });
    } catch (error) {
      console.error("Failed to create test notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <User className="h-4 w-4" />;
      case "order_notification":
        return <Package className="h-4 w-4" />;
      case "system_alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "user_approval":
        return <CheckCircle className="h-4 w-4" />;
      case "product_update":
        return <Package className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-blue-500 bg-blue-50";
      case "low":
        return "border-green-500 bg-green-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test Notifications
        </CardTitle>
        <CardDescription>
          Create test notifications to verify the real-time notification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {testNotifications.map((notification, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getPriorityColor(notification.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-white">
                    {getIcon(notification.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700">
                        {notification.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full text-white ${
                        notification.priority === 'urgent' ? 'bg-red-500' :
                        notification.priority === 'high' ? 'bg-orange-500' :
                        notification.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCreateTestNotification(notification)}
                >
                  Create
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Testing Instructions</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Click "Create" to generate a test notification</li>
            <li>• Check the notification bell icon in the header for the badge count</li>
            <li>• Click the bell to see the notification dropdown</li>
            <li>• Visit the notifications page to see all notifications</li>
            <li>• Test marking notifications as read and deleting them</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}