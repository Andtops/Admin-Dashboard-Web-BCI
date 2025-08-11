"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter,
  Smartphone,
  Mail,
  Building,
  CheckCircle,
  User,
  Send,
  Bell
} from "lucide-react";

interface NotificationUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  businessName?: string;
  tokens: Array<{
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
    appVersion: string;
    osVersion: string;
    isActive: boolean;
    lastSeen: string;
    registeredAt: string;
  }>;
  preferences: {
    categories: Record<string, any>;
    quietHours: any;
    doNotDisturb: boolean;
    globallyEnabled: boolean;
  };
  segments: string[];
  metadata: {
    lastActiveAt: string;
    registrationDate: string;
    totalOrders: number;
    isPremium: boolean;
    location?: {
      country: string;
      region: string;
      city: string;
    };
    engagement: {
      totalNotificationsReceived: number;
      totalOpened: number;
      totalClicked: number;
      openRate: number;
      clickRate: number;
      lastEngagement: string;
    };
  };
}

interface UserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSendNotification: (userIds: string[], notificationData: {
    title: string;
    body: string;
    category: string;
    imageUrl?: string;
    clickAction?: string;
    data?: Record<string, any>;
  }) => Promise<void>;
}

export function UserSelector({ isOpen, onClose, onSendNotification }: UserSelectorProps) {
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: "",
    body: "",
    category: "general",
    imageUrl: "",
    clickAction: "",
  });

  // Load users when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data.users);
      } else {
        console.error('Failed to load users:', result.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.businessName && user.businessName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPlatform = platformFilter === "all" || 
                           user.tokens.some(token => token.platform === platformFilter);
    
    return matchesSearch && matchesPlatform;
  });

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleSendNotification = async () => {
    if (selectedUsers.size === 0 || !notificationData.title || !notificationData.body) {
      return;
    }

    try {
      setSending(true);
      await onSendNotification(Array.from(selectedUsers), {
        title: notificationData.title,
        body: notificationData.body,
        category: notificationData.category,
        imageUrl: notificationData.imageUrl || undefined,
        clickAction: notificationData.clickAction || undefined,
        data: {
          category: notificationData.category,
          timestamp: new Date().toISOString(),
        }
      });

      // Reset form and close dialog
      setSelectedUsers(new Set());
      setNotificationData({
        title: "",
        body: "",
        category: "general",
        imageUrl: "",
        clickAction: "",
      });
      onClose();
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setSending(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return <Smartphone className="h-4 w-4" />;
  };

  const getEngagementBadge = (openRate: number) => {
    if (openRate >= 40) return <Badge className="bg-green-100 text-green-700">High</Badge>;
    if (openRate >= 20) return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Send Notification to Individual Users</DialogTitle>
          <DialogDescription>
            Select users and create a personalized notification
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* User Selection Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Users</h3>
              <Badge variant="outline">
                {selectedUsers.size} of {filteredUsers.length} selected
              </Badge>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredUsers.length === 0}
                >
                  {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Users List */}
            <ScrollArea className="h-[400px] border rounded-lg">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">
                    {searchQuery || platformFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No users with FCM tokens available"
                    }
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.has(user.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleUserToggle(user.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900 truncate">
                              {user.name}
                            </span>
                            {getEngagementBadge(user.metadata.engagement.openRate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.businessName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{user.businessName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {user.tokens.map((token, index) => (
                              <div key={index} className="flex items-center gap-1">
                                {getPlatformIcon(token.platform)}
                                <span className="text-xs text-gray-500 capitalize">
                                  {token.platform}
                                </span>
                              </div>
                            ))}
                            <span className="text-xs text-gray-500">
                              {user.tokens.length} device{user.tokens.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Notification Creation Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notification Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={notificationData.category}
                    onValueChange={(value) => setNotificationData(prev => ({ ...prev, category: value }))}
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
                <Label htmlFor="body">Message</Label>
                <textarea
                  id="body"
                  placeholder="Notification message"
                  value={notificationData.body}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={notificationData.imageUrl}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clickAction">Click Action URL (Optional)</Label>
                <Input
                  id="clickAction"
                  placeholder="benzochem://notifications"
                  value={notificationData.clickAction}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, clickAction: e.target.value }))}
                />
              </div>

              {/* Preview */}
              {notificationData.title && notificationData.body && (
                <Card className="bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {notificationData.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {notificationData.body}
                          </div>
                          {notificationData.imageUrl && (
                            <img
                              src={notificationData.imageUrl}
                              alt="Preview"
                              className="mt-2 w-full max-w-xs h-20 object-cover rounded"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-600">
              {selectedUsers.size > 0 && (
                <span>
                  Ready to send to {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={selectedUsers.size === 0 || !notificationData.title || !notificationData.body || sending}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}