"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  MessageSquare,

  Target,
  Bell,
  Send,
  CheckCircle,
  Download
} from "lucide-react";
import { PushNotificationDashboard } from "@/components/marketing/push-notification-dashboard";
import { NotificationSettings } from "@/components/marketing/notification-settings";
import { NotificationAnalyticsDashboard } from "@/components/marketing/notification-analytics-dashboard";
import { NotificationTestPanel } from "@/components/marketing/notification-test-panel";

export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    pushSubscribers: 0,
    emailSubscribers: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    revenueGenerated: 0,
    totalNotificationsSent: 0,
    deliveryRate: 0
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    try {
      setLoading(true);
      // Load marketing statistics and campaigns
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setStats({
        totalCampaigns: 12,
        pushSubscribers: 2847,
        emailSubscribers: 1523,
        avgOpenRate: 24.5,
        avgClickRate: 3.2,
        revenueGenerated: 15420,
        totalNotificationsSent: 8934,
        deliveryRate: 97.8
      });

      // Mock notification campaigns
      setNotifications([
        {
          id: '1',
          title: 'New Product Launch',
          message: 'Check out our latest chemical products!',
          status: 'sent',
          sent: 2847,
          delivered: 2784,
          opened: 698,
          clicked: 89,
          createdAt: new Date().toISOString(),
          scheduledFor: null,
          targetAudience: 'all_users'
        },
        {
          id: '2',
          title: 'Order Update',
          message: 'Your order has been shipped',
          status: 'scheduled',
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          createdAt: new Date().toISOString(),
          scheduledFor: new Date(Date.now() + 3600000).toISOString(),
          targetAudience: 'recent_buyers'
        }
      ]);
    } catch (error) {
      console.error('Error loading marketing data:', error);
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage push notifications, campaigns, and track engagement
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="push-notifications">Push Notifications</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced Marketing Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Push Subscribers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pushSubscribers.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      +12% from last month
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notifications Sent</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNotificationsSent.toLocaleString()}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      +8% from last week
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.deliveryRate}%</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      Excellent performance
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Open Rate</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgOpenRate}%</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      Above industry average
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    Latest push notification campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-gray-500">{notification.message}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(notification.status)}
                          {notification.status === 'sent' && (
                            <div className="text-sm text-gray-500">
                              {notification.opened}/{notification.sent} opened
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="push-notifications" className="space-y-6">
              <PushNotificationDashboard
                notifications={notifications}
                onCreateNotification={(notification) => {
                  const newNotification = {
                    ...notification,
                    id: Date.now().toString(),
                  };
                  setNotifications(prev => [newNotification, ...prev]);
                }}
                onUpdateNotification={(id, updates) => {
                  setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, ...updates } : n)
                  );
                }}
                onDeleteNotification={(id) => {
                  setNotifications(prev => prev.filter(n => n.id !== id));
                }}
                onSendNotification={async (id) => {
                  // Simulate sending notification
                  const notification = notifications.find(n => n.id === id);
                  if (notification) {
                    const sent = Math.floor(Math.random() * 1000) + 500;
                    const delivered = Math.floor(sent * 0.95);
                    const opened = Math.floor(delivered * 0.25);
                    const clicked = Math.floor(opened * 0.1);

                    setNotifications(prev =>
                      prev.map(n => n.id === id ? {
                        ...n,
                        status: 'sent' as const,
                        sent,
                        delivered,
                        opened,
                        clicked
                      } : n)
                    );
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              {/* Traditional Campaigns */}
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Campaigns</CardTitle>
                  <CardDescription>
                    Manage email and social media campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Create your first marketing campaign to start reaching your customers.
                      </p>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign: any) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {getTypeIcon(campaign.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.type} • {campaign.audience}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(campaign.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <NotificationAnalyticsDashboard
                timeRange="7d"
                onTimeRangeChange={(range) => {
                  console.log('Time range changed:', range);
                  // Handle time range change
                }}
              />
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

            <TabsContent value="test" className="space-y-6">
              <NotificationTestPanel />
            </TabsContent>
          </Tabs>


        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}