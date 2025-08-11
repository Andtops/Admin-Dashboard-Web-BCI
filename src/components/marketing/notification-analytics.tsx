"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Smartphone,
  Calendar,
  Download,
  Filter
} from "lucide-react";

interface AnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenueGenerated: number;
  topPerformingNotifications: Array<{
    id: string;
    title: string;
    openRate: number;
    clickRate: number;
    sent: number;
  }>;
  performanceByCategory: Array<{
    category: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}

interface NotificationAnalyticsProps {
  data: AnalyticsData;
}

export function NotificationAnalytics({ data }: NotificationAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("openRate");

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "sent":
        return <Send className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "opened":
        return <Eye className="h-4 w-4" />;
      case "clicked":
        return <MousePointer className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (rate: number, type: 'open' | 'click') => {
    const threshold = type === 'open' ? 20 : 3; // Industry averages
    if (rate >= threshold * 1.5) return "text-green-600";
    if (rate >= threshold) return "text-blue-600";
    if (rate >= threshold * 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track notification performance and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(data.totalSent)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.deliveryRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">Excellent performance</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.openRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">Above industry avg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(data.clickRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-red-600">-2% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Funnel</CardTitle>
                <CardDescription>
                  Track how users interact with your notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Sent</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatNumber(data.totalSent)}</div>
                      <div className="text-xs text-gray-500">100%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Delivered</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatNumber(data.totalDelivered)}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(data.deliveryRate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Opened</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatNumber(data.totalOpened)}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(data.openRate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Clicked</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatNumber(data.totalClicked)}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(data.clickRate)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Impact</CardTitle>
                <CardDescription>
                  Revenue generated from notification campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${data.revenueGenerated.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Revenue Generated</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{formatPercentage(data.conversionRate)}</div>
                      <div className="text-xs text-gray-500">Conversion Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        ${(data.revenueGenerated / data.totalSent).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Revenue per Notification</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Top Performing Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Notifications</CardTitle>
              <CardDescription>
                Notifications with the highest engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPerformingNotifications.map((notification, index) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-gray-500">{formatNumber(notification.sent)} sent</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className={`font-semibold ${getPerformanceColor(notification.openRate, 'open')}`}>
                          {formatPercentage(notification.openRate)}
                        </div>
                        <div className="text-gray-500">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${getPerformanceColor(notification.clickRate, 'click')}`}>
                          {formatPercentage(notification.clickRate)}
                        </div>
                        <div className="text-gray-500">Click Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Performance by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Compare engagement across different notification categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performanceByCategory.map((category) => (
                  <div key={category.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{category.category.replace('_', ' ')}</h4>
                      <Badge variant="outline">{formatNumber(category.sent)} sent</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(category.opened)}</div>
                        <div className="text-gray-500">Opened</div>
                        <div className={`text-xs ${getPerformanceColor(category.openRate, 'open')}`}>
                          {formatPercentage(category.openRate)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(category.clicked)}</div>
                        <div className="text-gray-500">Clicked</div>
                        <div className={`text-xs ${getPerformanceColor(category.clickRate, 'click')}`}>
                          {formatPercentage(category.clickRate)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">
                          {formatPercentage((category.clicked / category.sent) * 100)}
                        </div>
                        <div className="text-gray-500">CTR</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Time Series Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track notification performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would go here</p>
                  <p className="text-sm text-gray-400">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
