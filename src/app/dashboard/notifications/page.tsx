"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ConfirmDialog,
} from "@/components/ui/enhanced-dialog";
import { 
  Search, 
  MoreHorizontal, 
  Bell,
  BellRing,
  Eye,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  User,
  Package,
  Settings,
  Loader2
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationTest } from "@/components/notifications/notification-test";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageSize = 20;

  // Use the notifications hook
  const {
    notifications: allNotifications,
    unreadCount,
    notificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTimeAgo,
    getPriorityColor,
    isLoading,
  } = useNotifications();

  // Filter notifications based on current filters
  const filteredNotifications = allNotifications?.filter(notification => {
    // Search filter
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
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
  }) || [];

  // Paginate filtered notifications
  const paginatedNotifications = filteredNotifications.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      toast.success("Notification marked as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deleteNotification(notificationToDelete);
      if (success) {
        setShowDeleteConfirm(false);
        setNotificationToDelete(null);
        if (selectedNotification?._id === notificationToDelete) {
          setShowDetailsDialog(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The data will automatically refresh due to Convex real-time updates
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <User className="h-4 w-4" />;
      case "user_approval":
        return <CheckCircle className="h-4 w-4" />;
      case "user_rejection":
        return <XCircle className="h-4 w-4" />;
      case "product_update":
        return <Package className="h-4 w-4" />;
      case "system_alert":
        return <AlertTriangle className="h-4 w-4" />;
      case "gst_verification":
        return <CheckCircle className="h-4 w-4" />;
      case "order_notification":
        return <Package className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      user_registration: "User Registration",
      user_approval: "User Approval",
      user_rejection: "User Rejection",
      product_update: "Product Update",
      system_alert: "System Alert",
      gst_verification: "GST Verification",
      order_notification: "Order Notification"
    };
    
    return <Badge variant="outline">{typeLabels[type] || type}</Badge>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailsDialog = (notification: any) => {
    setSelectedNotification(notification);
    setShowDetailsDialog(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <ProtectedRoute requiredPermission="notifications.read">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading notifications...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission="notifications.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Manage system notifications and alerts
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read ({unreadCount})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notificationStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{notificationStats?.unread || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{notificationStats?.byPriority?.high || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{notificationStats?.recentNotifications || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                System notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="user_registration">User Registration</SelectItem>
                    <SelectItem value="user_approval">User Approval</SelectItem>
                    <SelectItem value="product_update">Product Update</SelectItem>
                    <SelectItem value="system_alert">System Alert</SelectItem>
                    <SelectItem value="gst_verification">GST Verification</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {paginatedNotifications.length > 0 ? (
                  paginatedNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-background'
                      }`}
                      onClick={() => openDetailsDialog(notification)}
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          !notification.isRead ? 'bg-blue-100' : 'bg-muted'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getTypeBadge(notification.type)}
                            {getPriorityBadge(notification.priority)}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            openDetailsDialog(notification);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {!notification.isRead && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}>
                              <Check className="mr-2 h-4 w-4" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-500">
                      {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || readFilter !== "all"
                        ? "Try adjusting your filters to see more notifications."
                        : "You're all caught up! No notifications to display."}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredNotifications.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredNotifications.length)} of {filteredNotifications.length} notifications
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {currentPage + 1} of {Math.ceil(filteredNotifications.length / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={(currentPage + 1) * pageSize >= filteredNotifications.length}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Notifications - Remove this in production */}
          <NotificationTest />

          {/* Notification Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedNotification && getNotificationIcon(selectedNotification.type)}
                  Notification Details
                </DialogTitle>
                <DialogDescription>
                  {selectedNotification?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2">
                  {selectedNotification && getTypeBadge(selectedNotification.type)}
                  {selectedNotification && getPriorityBadge(selectedNotification.priority)}
                  {selectedNotification?.isRead ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-blue-600 border-blue-600">
                      <BellRing className="h-3 w-3 mr-1" />
                      Unread
                    </Badge>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedNotification?.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Notification Info</h4>
                    <div className="space-y-1 text-sm">
                      <div>Created: {selectedNotification?.createdAt ? formatDate(selectedNotification?.createdAt) : 'N/A'}</div>
                      <div>Type: {selectedNotification?.type}</div>
                      <div>Priority: {selectedNotification?.priority}</div>
                      <div>Recipient: {selectedNotification?.recipientType}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <div className="space-y-1 text-sm">
                      <div>Read: {selectedNotification?.isRead ? 'Yes' : 'No'}</div>
                      {selectedNotification?.readAt && (
                        <div>Read At: {formatDate(selectedNotification?.readAt)}</div>
                      )}
                      {selectedNotification?.expiresAt && (
                        <div>Expires: {formatDate(selectedNotification?.expiresAt)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedNotification?.relatedEntityType && (
                  <div>
                    <h4 className="font-medium mb-2">Related Information</h4>
                    <div className="text-sm bg-muted p-3 rounded-lg">
                      <div>Entity Type: {selectedNotification?.relatedEntityType}</div>
                      {selectedNotification?.relatedEntityId && (
                        <div>Entity ID: {selectedNotification?.relatedEntityId}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {selectedNotification && !selectedNotification.isRead && (
                  <Button onClick={() => {
                    handleMarkAsRead(selectedNotification._id);
                    setShowDetailsDialog(false);
                  }}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedNotification) {
                      handleDeleteNotification(selectedNotification._id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete Notification"
            description="Are you sure you want to delete this notification? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
            loading={isDeleting}
            onConfirm={confirmDeleteNotification}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setNotificationToDelete(null);
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
