"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Bell,
  Send,
  CheckCircle,
  Download,
  Eye,
  TrendingUp,
  Users,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Mail,
  MessageSquare,
  Target,
  Edit,
  Trash2,
  MoreHorizontal,
  BarChart3,
  TrendingDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PushNotificationDashboard } from "@/components/marketing/push-notification-dashboard";
import { NotificationSettings } from "@/components/marketing/notification-settings";
import { NotificationAnalyticsDashboard } from "@/components/marketing/notification-analytics-dashboard";
import { UserSelector } from "@/components/marketing/user-selector";
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';


// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface NotificationStats {
  totalSubscribers: number;
  activeTokens: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  platformBreakdown: {
    ios: number;
    android: number;
  };
  recentGrowth: {
    subscribers: number;
    sent: number;
  };
}

interface PushNotificationLog {
  _id: string;
  target: string;
  title: string;
  body: string;
  data: any;
  result: {
    success: boolean;
    message: string;
    successCount: number;
    failureCount: number;
  };
  sentAt: number;
}

export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real data states
  const [stats, setStats] = useState<NotificationStats>({
    totalSubscribers: 0,
    activeTokens: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    platformBreakdown: { ios: 0, android: 0 },
    recentGrowth: { subscribers: 0, sent: 0 }
  });

  const [notifications, setNotifications] = useState<PushNotificationLog[]>([]);
  const [fcmTokens, setFcmTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns] = useState<any[]>([]); // Empty campaigns array for now

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadRealMarketingData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRealMarketingData();
  }, []);

  const loadRealMarketingData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading real marketing data from Convex...');

      // Fetch real data from Convex in parallel
      const [
        fcmTokensData,
        notificationLogs,
        usersData
      ] = await Promise.all([
        convex.query(api.notifications.getAllActiveFCMTokens),
        convex.query(api.notifications.getAllPushNotificationLogs, { limit: 100, offset: 0 }),
        convex.query(api.users.getUsers, { limit: 1000, offset: 0 })
      ]);

      console.log('✅ Data loaded:', {
        tokens: fcmTokensData.length,
        logs: notificationLogs?.length || 0,
        users: usersData.length
      });

      // Process FCM tokens
      setFcmTokens(fcmTokensData);
      setUsers(usersData);

      // Calculate platform breakdown
      const platformBreakdown = fcmTokensData.reduce((acc: any, token: any) => {
        acc[token.platform] = (acc[token.platform] || 0) + 1;
        return acc;
      }, { ios: 0, android: 0 });

      // Process notification logs if available
      const logs = notificationLogs || [];
      setNotifications(logs);

      // Calculate real statistics
      const totalSent = logs.reduce((sum: number, log: any) => sum + (log.result?.successCount || 0), 0);
      const totalDelivered = logs.reduce((sum: number, log: any) => sum + (log.result?.successCount || 0), 0);
      const totalFailed = logs.reduce((sum: number, log: any) => sum + (log.result?.failureCount || 0), 0);

      // Calculate delivery rate
      const deliveryRate = totalSent > 0 ? ((totalDelivered / (totalSent + totalFailed)) * 100) : 0;

      // Calculate growth (last 7 days vs previous 7 days)
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

      const recentTokens = fcmTokensData.filter((token: any) => token.registeredAt > sevenDaysAgo);
      const previousTokens = fcmTokensData.filter((token: any) =>
        token.registeredAt > fourteenDaysAgo && token.registeredAt <= sevenDaysAgo
      );

      const recentSent = logs.filter((log: any) => log.sentAt > sevenDaysAgo)
        .reduce((sum: number, log: any) => sum + (log.result?.successCount || 0), 0);
      const previousSent = logs.filter((log: any) =>
        log.sentAt > fourteenDaysAgo && log.sentAt <= sevenDaysAgo
      ).reduce((sum: number, log: any) => sum + (log.result?.successCount || 0), 0);

      const subscriberGrowth = previousTokens.length > 0
        ? ((recentTokens.length - previousTokens.length) / previousTokens.length) * 100
        : recentTokens.length > 0 ? 100 : 0;

      const sentGrowth = previousSent > 0
        ? ((recentSent - previousSent) / previousSent) * 100
        : recentSent > 0 ? 100 : 0;

      // Set real statistics
      setStats({
        totalSubscribers: usersData.length,
        activeTokens: fcmTokensData.length,
        totalSent,
        totalDelivered,
        totalOpened: Math.floor(totalDelivered * 0.25), // Estimated 25% open rate
        totalClicked: Math.floor(totalDelivered * 0.05), // Estimated 5% click rate
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: 25, // Industry average for push notifications
        clickRate: 5, // Industry average for push notifications
        platformBreakdown,
        recentGrowth: {
          subscribers: Math.round(subscriberGrowth * 100) / 100,
          sent: Math.round(sentGrowth * 100) / 100
        }
      });

    } catch (error) {
      console.error('❌ Error loading real marketing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load marketing data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Paused</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "push":
        return <Bell className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with Real-time Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Dashboard</h1>
                {error && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Error
                  </Badge>
                )}
                {refreshing && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Refreshing
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time push notification management and analytics
              </p>
              {error && (
                <p className="text-red-600 text-sm mt-1">
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="push-notifications">Push Notifications</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Real-time Marketing Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Devices</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTokens.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500">iOS: {stats.platformBreakdown.ios}</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-500">Android: {stats.platformBreakdown.android}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSent.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      {stats.recentGrowth.sent >= 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          <TrendingUp className="inline h-3 w-3 mr-1" />
                          +{stats.recentGrowth.sent.toFixed(1)}% from last week
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          {stats.recentGrowth.sent.toFixed(1)}% from last week
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.deliveryRate.toFixed(1)}%</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-gray-500">
                        {stats.totalDelivered.toLocaleString()} delivered
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Registered Users</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubscribers.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs">
                      {stats.recentGrowth.subscribers >= 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          <TrendingUp className="inline h-3 w-3 mr-1" />
                          +{stats.recentGrowth.subscribers.toFixed(1)}% growth
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          {stats.recentGrowth.subscribers.toFixed(1)}% growth
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Notifications - Real Data */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Notifications</CardTitle>
                      <CardDescription>
                        Latest push notifications sent from the system
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notifications.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No notifications sent yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start sending push notifications to see them appear here
                      </p>
                      <Button
                        onClick={() => setIsUserSelectorOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send First Notification
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.slice(0, 5).map((notification) => (
                        <div key={notification._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {notification.body}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {notification.target}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Send className="h-3 w-3" />
                                  {notification.result.successCount} sent
                                </span>
                                {notification.result.failureCount > 0 && (
                                  <span className="flex items-center gap-1 text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {notification.result.failureCount} failed
                                  </span>
                                )}
                                <span>
                                  {new Date(notification.sentAt).toLocaleDateString()} {new Date(notification.sentAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={notification.result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {notification.result.success ? 'Delivered' : 'Failed'}
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {((notification.result.successCount / (notification.result.successCount + notification.result.failureCount)) * 100).toFixed(1)}% success
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm">
                            View All {notifications.length} Notifications
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="push-notifications" className="space-y-6">
              {/* Individual User Notifications Button */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Push Notification Management</CardTitle>
                      <CardDescription>
                        Send notifications to all users or target individual users
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsUserSelectorOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Individual Users
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <PushNotificationDashboard
                notifications={notifications.map(log => ({
                  id: log._id,
                  title: log.title,
                  message: log.body,
                  status: log.result.success ? 'sent' : 'failed',
                  targetAudience: log.target,
                  sent: log.result.successCount,
                  delivered: log.result.successCount,
                  opened: Math.floor(log.result.successCount * 0.25), // Estimated
                  clicked: Math.floor(log.result.successCount * 0.05), // Estimated
                  createdAt: new Date(log.sentAt).toISOString(),
                  category: log.data?.category || 'general'
                }))}
                onCreateNotification={async (notification) => {
                  try {
                    // Send real notification via API
                    const response = await fetch('/api/notifications/send-push', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        tokens: fcmTokens.map(token => token.token),
                        title: notification.title,
                        body: notification.message,
                        data: {
                          category: notification.category || 'general',
                          timestamp: new Date().toISOString()
                        }
                      })
                    });

                    const result = await response.json();

                    if (result.success) {
                      // Refresh data to show the new notification
                      await refreshData();
                      console.log('✅ Broadcast notification sent successfully:', result);
                    } else {
                      console.error('❌ Failed to send broadcast notification:', result.error);
                      throw new Error(result.error);
                    }
                  } catch (error) {
                    console.error('Error sending broadcast notification:', error);
                    throw error;
                  }
                }}
                onUpdateNotification={async (id, updates) => {
                  // For now, just refresh data since we don't have update API
                  console.log('Update notification:', id, updates);
                  await refreshData();
                }}
                onDeleteNotification={async (id) => {
                  // For now, just refresh data since we don't have delete API
                  console.log('Delete notification:', id);
                  await refreshData();
                }}
                onSendNotification={async (id) => {
                  // This would be for sending scheduled notifications
                  console.log('Send scheduled notification:', id);
                  await refreshData();
                }}
              />

              {/* User Selector Dialog */}
              <UserSelector
                isOpen={isUserSelectorOpen}
                onClose={() => setIsUserSelectorOpen(false)}
                onSendNotification={async (userIds, notificationData) => {
                  try {
                    const response = await fetch('/api/notifications/users', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        userIds,
                        title: notificationData.title,
                        body: notificationData.body,
                        category: notificationData.category,
                        imageUrl: notificationData.imageUrl,
                        clickAction: notificationData.clickAction,
                        data: notificationData.data,
                      }),
                    });

                    const result = await response.json();

                    if (result.success) {
                      // Create notification object that matches PushNotificationLog interface
                      const newNotification: PushNotificationLog = {
                        _id: Date.now().toString(),
                        target: `${userIds.length} individual users`,
                        title: notificationData.title,
                        body: notificationData.body,
                        data: {
                          category: notificationData.category,
                          timestamp: new Date().toISOString(),
                          userIds: userIds
                        },
                        result: {
                          success: true,
                          message: 'Individual notification sent successfully',
                          successCount: result.data.deviceCount,
                          failureCount: 0
                        },
                        sentAt: Date.now()
                      };

                      setNotifications(prev => [newNotification, ...prev]);

                      console.log('✅ Individual notification sent successfully:', result);
                    } else {
                      console.error('❌ Failed to send individual notification:', result.error);
                      throw new Error(result.error);
                    }
                  } catch (error) {
                    console.error('Error sending individual notification:', error);
                    throw error;
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              {/* Enterprise Campaign Management */}
              <Tabs defaultValue="campaigns" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
                  <TabsTrigger value="segments">Segments</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Marketing Campaigns</CardTitle>
                          <CardDescription>
                            Create and manage advanced marketing campaigns with scheduling and targeting
                          </CardDescription>
                        </div>
                        <Button
                          onClick={async () => {
                            // Create a sample campaign for demonstration
                            const sampleCampaign = {
                              name: "New Product Launch",
                              type: "push" as const,
                              targetAudience: "all_users",
                              content: {
                                title: "🚀 New Chemical Products Available!",
                                message: "Check out our latest industrial chemicals with special launch pricing.",
                                imageUrl: "",
                                actionUrl: "benzochem://products/new"
                              },
                              schedule: {
                                type: "immediate" as const
                              },
                              status: "running" as const
                            };

                            try {
                              // Send real notification
                              const response = await fetch('/api/notifications/send-push', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  tokens: fcmTokens.map(token => token.token),
                                  title: sampleCampaign.content.title,
                                  body: sampleCampaign.content.message,
                                  data: {
                                    category: 'promotion',
                                    campaign: sampleCampaign.name,
                                    timestamp: new Date().toISOString()
                                  }
                                })
                              });

                              if (response.ok) {
                                await refreshData();
                                console.log('✅ Campaign launched successfully');
                              }
                            } catch (error) {
                              console.error('Error launching campaign:', error);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Launch Campaign
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Launch your first marketing campaign to start reaching your customers.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {notifications.slice(0, 6).map((notification) => (
                              <Card key={notification._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-4 w-4 text-blue-600" />
                                      <Badge className={notification.result.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                        {notification.result.success ? 'Active' : 'Failed'}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(notification.sentAt).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {notification.body}
                                  </p>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500">Sent:</span>
                                      <div className="font-semibold">{notification.result.successCount}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Success Rate:</span>
                                      <div className="font-semibold text-green-600">
                                        {((notification.result.successCount / (notification.result.successCount + notification.result.failureCount)) * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ab-testing" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>A/B Testing</CardTitle>
                      <CardDescription>
                        Test different notification variants to optimize engagement
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">A/B Testing Coming Soon</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Advanced A/B testing features will be available in the next update.
                        </p>
                        <Button variant="outline" disabled>
                          <Plus className="h-4 w-4 mr-2" />
                          Create A/B Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="segments" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Segments</CardTitle>
                      <CardDescription>
                        Create and manage user segments for targeted campaigns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                          <CardContent className="p-6 text-center">
                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">All Users</h4>
                            <p className="text-sm text-gray-500">{stats.totalSubscribers} users</p>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                          <CardContent className="p-6 text-center">
                            <Smartphone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">iOS Users</h4>
                            <p className="text-sm text-gray-500">{stats.platformBreakdown.ios} devices</p>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                          <CardContent className="p-6 text-center">
                            <Smartphone className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Android Users</h4>
                            <p className="text-sm text-gray-500">{stats.platformBreakdown.android} devices</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Real-time Analytics Dashboard */}
              <div className="space-y-6">
                {/* Analytics Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Insights</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Real-time performance metrics and detailed analytics
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Export analytics data
                        const exportData = {
                          overview: stats,
                          notifications: notifications.map(n => ({
                            title: n.title,
                            body: n.body,
                            target: n.target,
                            sent: n.result.successCount,
                            failed: n.result.failureCount,
                            successRate: ((n.result.successCount / (n.result.successCount + n.result.failureCount)) * 100).toFixed(1),
                            sentAt: new Date(n.sentAt).toISOString()
                          })),
                          platformBreakdown: stats.platformBreakdown,
                          exportedAt: new Date().toISOString()
                        };

                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `marketing-analytics-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics
                    </Button>
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Delivery Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="font-semibold text-green-600">{stats.deliveryRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Delivered</span>
                          <span className="font-semibold">{stats.totalDelivered.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Failed</span>
                          <span className="font-semibold text-red-600">
                            {notifications.reduce((sum, n) => sum + n.result.failureCount, 0)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Engagement Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Est. Open Rate</span>
                          <span className="font-semibold text-blue-600">{stats.openRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Est. Click Rate</span>
                          <span className="font-semibold text-purple-600">{stats.clickRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Opens</span>
                          <span className="font-semibold">{stats.totalOpened.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Platform Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            iOS Devices
                          </span>
                          <span className="font-semibold">{stats.platformBreakdown.ios}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Android Devices
                          </span>
                          <span className="font-semibold">{stats.platformBreakdown.android}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Active</span>
                          <span className="font-semibold text-green-600">{stats.activeTokens}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Campaign Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>
                      Detailed performance metrics for each notification campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaign data yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Send some notifications to see detailed analytics here
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Campaign</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Target</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Sent</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Success Rate</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Est. Opens</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {notifications.slice(0, 10).map((notification) => {
                              const successRate = ((notification.result.successCount / (notification.result.successCount + notification.result.failureCount)) * 100);
                              const estimatedOpens = Math.floor(notification.result.successCount * 0.25);

                              return (
                                <tr key={notification._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <td className="py-3 px-4">
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">{notification.title}</div>
                                      <div className="text-xs text-gray-500 truncate max-w-xs">{notification.body}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{notification.target}</td>
                                  <td className="py-3 px-4 text-right font-medium">{notification.result.successCount}</td>
                                  <td className="py-3 px-4 text-right">
                                    <Badge className={successRate >= 95 ? "bg-green-100 text-green-700" : successRate >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                                      {successRate.toFixed(1)}%
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{estimatedOpens}</td>
                                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                    {new Date(notification.sentAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Growth Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Trends</CardTitle>
                    <CardDescription>
                      Week-over-week growth analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Subscriber Growth</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            {stats.recentGrowth.subscribers >= 0 ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.recentGrowth.subscribers >= 0 ? '+' : ''}{stats.recentGrowth.subscribers.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">vs. previous week</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Notification Volume</h4>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            {stats.recentGrowth.sent >= 0 ? (
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.recentGrowth.sent >= 0 ? '+' : ''}{stats.recentGrowth.sent.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">vs. previous week</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <NotificationSettings
                settings={{
                  firebase: {
                    projectId: 'benzochem-industries-b9e64',
                    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
                    clientEmail: 'firebase-adminsdk-xxxxx@benzochem-industries-b9e64.iam.gserviceaccount.com',
                    isConfigured: true
                  },
                  general: {
                    enablePushNotifications: true,
                    enableEmailNotifications: true,
                    defaultSendTime: '10:00',
                    maxNotificationsPerDay: 5,
                    quietHoursStart: '22:00',
                    quietHoursEnd: '08:00'
                  },
                  templates: {
                    orderUpdate: 'Your order #{orderId} has been {status}',
                    promotion: '🎉 Special offer: {discount}% off on {productCategory}!',
                    systemAlert: 'System notification: {message}',
                    welcome: 'Welcome to BenzoChem Industries, {customerName}!'
                  },
                  targeting: {
                    enableGeolocation: true,
                    enableBehavioralTargeting: true,
                    enableSegmentation: true,
                    retentionDays: 90
                  }
                }}
                onUpdateSettings={(section, updates) => {
                  console.log('Updating settings:', section, updates);
                  // Implement settings update logic
                }}
              />
            </TabsContent>


          </Tabs>


        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}