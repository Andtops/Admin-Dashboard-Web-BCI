"use client";

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
  Download,
  RotateCcw
} from "lucide-react";
import {
  NOTIFICATION_TYPES,
  PRIORITY_CONFIG,
  getNotificationIcon,
  formatNotificationType
} from "@/lib/notification-constants";
import type { NotificationType, NotificationPriority } from "@/types/notifications";
import { useNotificationManagement } from "@/hooks/use-notification-management";
import { Notification } from "@/types/notifications";
import { NotificationDetailDialog } from "./notification-detail-dialog";
import { useState, useCallback } from "react";

// Constants for better maintainability
const EMPTY_STATE_ICON_SIZE = "h-12 w-12";

export function NotificationManagement() {
  const {
    notifications: filteredNotifications,
    stats,
    isLoading,
    filters,
    updateFilter,
    resetFilters,
    selectedNotifications,
    selectNotification,
    selectAll,
    handleSingleAction,
    handleBulkAction,
  } = useNotificationManagement();

  // Detail dialog state
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const openDetailDialog = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailDialog(true);
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusBadge = useCallback((notification: Notification) => {
    // Use explicit status if available, otherwise derive from readAt
    const status = notification.status || (notification.readAt ? "read" : "unread");

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
  }, []);

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
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
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
              <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
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
              <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
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
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter("dateRange", value)}>
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

          {/* Filter Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </Button>
            <div className="text-sm text-muted-foreground">
              {stats.total} total • {stats.unread} unread • {stats.read} read
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export notifications');
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to refresh page:', error);
                  }
                }}
                disabled={isLoading}
              >
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
                      onCheckedChange={selectAll}
                      aria-label="Select all notifications"
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
                            selectNotification(notification._id, checked as boolean)
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
                        {getStatusBadge(notification)}
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
                            <DropdownMenuItem onClick={() => openDetailDialog(notification)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!notification.readAt && (
                              <DropdownMenuItem
                                onClick={() => handleSingleAction(notification._id, "markRead")}
                                disabled={isLoading}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(notification._id, "archive")}
                              disabled={isLoading}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(notification._id, "delete")}
                              className="text-red-600"
                              disabled={isLoading}
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
              <Filter className={`${EMPTY_STATE_ICON_SIZE} mx-auto mb-4 opacity-50`} />
              <p>No notifications found matching your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <NotificationDetailDialog
        notification={selectedNotification}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onMarkAsRead={(id) => handleSingleAction(id, "markRead")}
        onDelete={(id) => handleSingleAction(id, "delete")}
      />
    </div>
  );
}