/**
 * Notification Detail Dialog Component
 * Reusable dialog for viewing notification details
 */

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  getNotificationIcon, 
  formatNotificationType, 
  PRIORITY_CONFIG 
} from "@/lib/notification-constants";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationDetailDialogProps {
  notification: Notification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onMarkAsRead,
  onDelete,
}: NotificationDetailDialogProps) {
  if (!notification) return null;

  const IconComponent = getNotificationIcon(notification.type);
  const priorityConfig = PRIORITY_CONFIG[notification.priority as keyof typeof PRIORITY_CONFIG];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                {notification.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {formatNotificationType(notification.type)} • {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={notification.readAt ? "outline" : "default"}>
                {notification.readAt ? "Read" : "Unread"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Priority:</span>
              <Badge className={`text-white ${priorityConfig.color}`}>
                {priorityConfig.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div>
            <h4 className="text-sm font-medium mb-2">Message</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Additional Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-muted-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span>
              <p className="text-muted-foreground">{formatDate(notification.createdAt)}</p>
            </div>
            {notification.readAt && (
              <div>
                <span className="font-medium">Read:</span>
                <p className="text-muted-foreground">{formatDate(notification.readAt)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            {!notification.readAt && onMarkAsRead && (
              <Button
                size="sm"
                onClick={() => {
                  onMarkAsRead(notification._id);
                  onOpenChange(false);
                }}
              >
                Mark as Read
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onDelete(notification._id);
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}