"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNotificationContext } from "@/contexts/notification-context";
import { 
  Send,
  Loader2,
  Plus,
  TestTube,
  Bell
} from "lucide-react";
import { toast } from "sonner";
import { 
  NOTIFICATION_TYPES, 
  PRIORITY_CONFIG, 
  getNotificationIcon as getIconFromConstants,
  formatNotificationType
} from "@/lib/notification-constants";
import type { NotificationType, NotificationPriority } from "@/types/notifications";

interface TestNotification {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
}

const PRESET_NOTIFICATIONS: TestNotification[] = [
  {
    type: "user_registration",
    title: "New User Registration",
    message: "John Doe has registered and is pending approval",
    priority: "medium",
  },
  {
    type: "order_notification",
    title: "New Quotation Request",
    message: "A new quotation request has been submitted for Benzene",
    priority: "high",
  },
  {
    type: "system_alert",
    title: "System Alert",
    message: "High number of pending user approvals detected",
    priority: "urgent",
  },
  {
    type: "user_approval",
    title: "User Approved",
    message: "Jane Smith's account has been approved successfully",
    priority: "low",
  },
  {
    type: "product_update",
    title: "Product Updated",
    message: "Toluene product information has been updated",
    priority: "medium",
  },
];

export function NotificationTest() {
  const { createNotification } = useNotificationContext();
  const [isCreating, setIsCreating] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNotification, setCustomNotification] = useState<TestNotification>({
    type: "user_registration",
    title: "",
    message: "",
    priority: "medium",
  });

  const handleCreateTestNotification = async (notification: TestNotification) => {
    setIsCreating(true);
    try {
      await createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        recipientType: "all_admins",
      });
      
      toast.success("Test notification created successfully!", {
        description: `${notification.title} - ${notification.priority} priority`,
      });
    } catch (error) {
      console.error("Failed to create test notification:", error);
      toast.error("Failed to create notification", {
        description: "Please check the console for more details",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCustomNotification = async () => {
    if (!customNotification.title.trim() || !customNotification.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    await handleCreateTestNotification(customNotification);
    
    // Reset form
    setCustomNotification({
      type: "user_registration",
      title: "",
      message: "",
      priority: "medium",
    });
    setShowCustomForm(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    const IconComponent = getIconFromConstants(type);
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Preset Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Preset Test Notifications
          </CardTitle>
          <CardDescription>
            Quick test notifications with predefined content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {PRESET_NOTIFICATIONS.map((notification, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-colors ${PRIORITY_CONFIG[notification.priority].borderColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {formatNotificationType(notification.type)}
                        </Badge>
                        <Badge 
                          className={`text-xs text-white ${PRIORITY_CONFIG[notification.priority].color}`}
                        >
                          {PRIORITY_CONFIG[notification.priority].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCreateTestNotification(notification)}
                    disabled={isCreating}
                    className="ml-4"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Custom Test Notification
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomForm(!showCustomForm)}
            >
              {showCustomForm ? "Hide Form" : "Create Custom"}
            </Button>
          </CardTitle>
          <CardDescription>
            Create a custom notification with your own content
          </CardDescription>
        </CardHeader>
        
        {showCustomForm && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notification-type">Type</Label>
                <Select
                  value={customNotification.type}
                  onValueChange={(value: NotificationType) =>
                    setCustomNotification(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-priority">Priority</Label>
                <Select
                  value={customNotification.priority}
                  onValueChange={(value: NotificationPriority) =>
                    setCustomNotification(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-title">Title *</Label>
              <Input
                id="notification-title"
                placeholder="Enter notification title"
                value={customNotification.title}
                onChange={(e) =>
                  setCustomNotification(prev => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-message">Message *</Label>
              <Textarea
                id="notification-message"
                placeholder="Enter notification message"
                value={customNotification.message}
                onChange={(e) =>
                  setCustomNotification(prev => ({ ...prev, message: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomNotification}
                disabled={isCreating || !customNotification.title.trim() || !customNotification.message.trim()}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Create & Send
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Testing Instructions */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200 text-base">
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              Click "Send" to generate a test notification
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              Check the notification bell icon in the header for the badge count
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              Click the bell to see the notification dropdown
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              Visit the "Manage" tab to see all notifications
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              Test marking notifications as read and deleting them
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}