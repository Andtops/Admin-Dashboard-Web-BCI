"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  CheckCircle,
  Archive,
  RefreshCw,
  Download
} from "lucide-react";
import { useNotificationContext } from "@/contexts/notification-context";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { 
  NOTIFICATION_TYPES, 
  PRIORITY_CONFIG, 
  NotificationType, 
  NotificationPriority,
  getNotificationIcon,
  formatNotificationType
} from "@/lib/notification-constants";

interface NotificationFilters {
  search: string;
  type: string;
  priority: string;
  status: string;
  dateRange: string;
}

export function NotificationManagement() {
  const { markAsRead, deleteNotification, markAllAsRead } = useNotificationContext();
  const [filters, setFilters] = useState<NotificationFilters>({
    search: "",
    type: "all",
    priority: "all",
    status: "all",
    dateRange: "all",
  });
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Query notifications with filters
  const notifications = useQuery(api.notifications.getNotifications, {
    search: filters.search || undefined,
    type: filters.type === "all" ? undefined : filters.type as NotificationType,
    priority: filters.priority === "all" ? undefined : filters.priority as NotificationPriority,
    status: filters.status === "all" ? undefined : filters.status,
    limit: 50,
  });

  // Memoized filtered notifications for better performance
  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter(notification => {
      const matchesSearch = !filters.search || 
        notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        notification.message.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesSearch;
    });
  }, [notifications, filters.search]);

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(notificationId);
      } else {
        newSet.delete(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const handleBulkAction = async (action: "markRead" | "delete" | "archive") => {
    if (selectedNotifications.size === 0) {
      toast.error("Please select notifications first");
      return;
    }

    setIsLoading(true);
    try {
      const promises = Array.from(selectedNotifications).map(id => {
        switch (action) {
          case "markRead":
            return markAsRead(id);
          case "delete":
            return deleteNotification(id);
          case "archive":
            // Implement archive functionality
            return Promise.resolve();
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      
      const actionText = action === "markRead" ? "marked as read" : 
                        action === "delete" ? "deleted" : "archived";
      
      toast.success(`${selectedNotifications.size} notifications ${actionText}`);
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error(`Failed to ${action} notifications:`, error);
      toast.error(`Failed to ${action} notifications`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleAction = async (notificationId: string, action: "markRead" | "delete") => {
    try {
      if (action === "markRead") {
        await markAsRead(notificationId);
        toast.success("Notification marked as read");
      } else if (action === "delete") {
        await deleteNotification(notificationId);
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error(`Failed to ${action} notification:`, error);
      toast.error(`Failed to ${action} notification`);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return <Badge variant="outline" className="text-gray-600">Read</Badge>;
      case "unread":
        return <Badge variant="default" className="bg-blue-500">Unread</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Notifications</CardTitle>
          <CardDescription>
            Search and filter notifications by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
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
              <Label htmlFor="priority-filter">Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange("dateRange", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedNotifications.size} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Bulk actions available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("markRead")}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("archive")}
                  disabled={isLoading}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction("delete")}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {filteredNotifications.length} notifications found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type as NotificationType);
                  return (
                    <TableRow key={notification._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNotifications.has(notification._id)}
                          onCheckedChange={(checked) => 
                            handleSelectNotification(notification._id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {notification.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formatNotificationType(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`text-xs text-white ${PRIORITY_CONFIG[notification.priority as NotificationPriority]?.color || PRIORITY_CONFIG.medium.color}`}
                        >
                          {PRIORITY_CONFIG[notification.priority as NotificationPriority]?.label || "Medium"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(notification.status || "unread")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(notification.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {notification.status !== "read" && (
                              <DropdownMenuItem
                                onClick={() => handleSingleAction(notification._id, "markRead")}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(notification._id, "delete")}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}