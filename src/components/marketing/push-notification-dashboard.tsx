"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bell, 
  Send, 
  Users, 
  Target, 
  Calendar as CalendarIcon,
  Clock,
  Image,
  Link,
  Smartphone,
  Eye,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PushNotification {
  id: string;
  title: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  targetAudience: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  createdAt: string;
  scheduledFor?: string;
  imageUrl?: string;
  actionUrl?: string;
  category: string;
}

interface PushNotificationDashboardProps {
  notifications: PushNotification[];
  onCreateNotification: (notification: Partial<PushNotification>) => void;
  onUpdateNotification: (id: string, updates: Partial<PushNotification>) => void;
  onDeleteNotification: (id: string) => void;
  onSendNotification: (id: string) => void;
}

export function PushNotificationDashboard({
  notifications,
  onCreateNotification,
  onUpdateNotification,
  onDeleteNotification,
  onSendNotification
}: PushNotificationDashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<PushNotification | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    targetAudience: "all_users",
    category: "general",
    imageUrl: "",
    actionUrl: "",
    scheduledFor: undefined as Date | undefined,
    isScheduled: false
  });

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || notification.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateNotification = () => {
    const notificationData: Partial<PushNotification> = {
      title: newNotification.title,
      message: newNotification.message,
      targetAudience: newNotification.targetAudience,
      category: newNotification.category,
      imageUrl: newNotification.imageUrl || undefined,
      actionUrl: newNotification.actionUrl || undefined,
      status: newNotification.isScheduled ? 'scheduled' : 'draft',
      scheduledFor: newNotification.scheduledFor?.toISOString(),
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      createdAt: new Date().toISOString()
    };

    onCreateNotification(notificationData);
    setIsCreateDialogOpen(false);
    setNewNotification({
      title: "",
      message: "",
      targetAudience: "all_users",
      category: "general",
      imageUrl: "",
      actionUrl: "",
      scheduledFor: undefined,
      isScheduled: false
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-700">Sent</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order":
        return <Target className="h-4 w-4" />;
      case "promotion":
        return <Bell className="h-4 w-4" />;
      case "system":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Push Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage push notification campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Push Notification</DialogTitle>
                <DialogDescription>
                  Create a new push notification to send to your users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Notification title"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newNotification.category}
                      onValueChange={(value) => setNewNotification(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="order">Order Updates</SelectItem>
                        <SelectItem value="promotion">Promotions</SelectItem>
                        <SelectItem value="system">System Alerts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select
                      value={newNotification.targetAudience}
                      onValueChange={(value) => setNewNotification(prev => ({ ...prev, targetAudience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="active_users">Active Users</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="premium_users">Premium Users</SelectItem>
                        <SelectItem value="inactive_users">Inactive Users</SelectItem>
                        <SelectItem value="individual_users">Individual Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={newNotification.imageUrl}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, imageUrl: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                  <Input
                    id="actionUrl"
                    placeholder="https://example.com/action"
                    value={newNotification.actionUrl}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, actionUrl: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="schedule"
                    checked={newNotification.isScheduled}
                    onCheckedChange={(checked) => setNewNotification(prev => ({ ...prev, isScheduled: checked }))}
                  />
                  <Label htmlFor="schedule">Schedule for later</Label>
                </div>
                {newNotification.isScheduled && (
                  <div className="space-y-2">
                    <Label>Schedule Date & Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newNotification.scheduledFor && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newNotification.scheduledFor ? format(newNotification.scheduledFor, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newNotification.scheduledFor}
                          onSelect={(date) => setNewNotification(prev => ({ ...prev, scheduledFor: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNotification} disabled={!newNotification.title || !newNotification.message}>
                  {newNotification.isScheduled ? 'Schedule Notification' : 'Create Notification'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="grid gap-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first push notification to get started"
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getCategoryIcon(notification.category)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      {getStatusBadge(notification.status)}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{notification.targetAudience.replace('_', ' ')}</span>
                      </div>
                      {notification.status === 'sent' && (
                        <>
                          <div className="flex items-center gap-1">
                            <Send className="h-4 w-4" />
                            <span>{notification.sent.toLocaleString()} sent</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{notification.opened.toLocaleString()} opened</span>
                          </div>
                        </>
                      )}
                      {notification.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Scheduled for {format(new Date(notification.scheduledFor), "PPp")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => onSendNotification(notification.id)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    )}
                    {notification.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateNotification(notification.id, { status: 'draft' })}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Unschedule
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Copy notification
                        const copy = { ...notification, id: undefined, status: 'draft' as const };
                        onCreateNotification(copy);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {notification.imageUrl && (
                  <div className="mt-4">
                    <img
                      src={notification.imageUrl}
                      alt="Notification preview"
                      className="w-full max-w-md h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
