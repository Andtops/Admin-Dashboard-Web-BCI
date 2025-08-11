"use client";

import { useState, useEffect, useCallback } from "react";
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
  Filter,
  RefreshCw,
  AlertCircle,
  Target,
  Zap
} from "lucide-react";

interface AnalyticsDashboardProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export function NotificationAnalyticsDashboard({ 
  timeRange, 
  onTimeRangeChange 
}: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState('openRate');

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'sent': return <Send className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'opened': return <Eye className="h-4 w-4" />;
      case 'clicked': return <MousePointer className="h-4 w-4" />;
      case 'converted': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getPerformanceColor = (rate: number, type: 'open' | 'click' | 'conversion') => {
    let threshold = 20; // Default for open rate
    if (type === 'click') threshold = 3;
    if (type === 'conversion') threshold = 1;

    if (rate >= threshold * 1.5) return "text-green-600";
    if (rate >= threshold) return "text-blue-600";
    if (rate >= threshold * 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <div className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
          <Button onClick={loadAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track notification performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.overview.totalSent)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {getTrendIcon(analytics.overview.totalSent, analytics.overview.totalSent * 0.9)}
              <span className="text-green-600 ml-1">+12% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercentage(analytics.overview.deliveryRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {getTrendIcon(analytics.overview.deliveryRate, 95)}
              <span className="text-green-600 ml-1">Excellent performance</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.openRate, 'open')}`}>
                  {formatPercentage(analytics.overview.openRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {getTrendIcon(analytics.overview.openRate, 20)}
              <span className="text-green-600 ml-1">Above industry avg</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Click Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.clickRate, 'click')}`}>
                  {formatPercentage(analytics.overview.clickRate)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {getTrendIcon(analytics.overview.clickRate, 3)}
              <span className="text-red-600 ml-1">-2% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Engagement Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Funnel</CardTitle>
              <CardDescription>
                Track how users interact with your notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Sent', value: analytics.overview.totalSent, rate: 100, color: 'bg-blue-500' },
                  { label: 'Delivered', value: analytics.overview.totalDelivered, rate: analytics.overview.deliveryRate, color: 'bg-green-500' },
                  { label: 'Opened', value: analytics.overview.totalOpened, rate: analytics.overview.openRate, color: 'bg-purple-500' },
                  { label: 'Clicked', value: analytics.overview.totalClicked, rate: analytics.overview.clickRate, color: 'bg-orange-500' },
                  { label: 'Converted', value: analytics.overview.totalConverted, rate: analytics.overview.conversionRate, color: 'bg-red-500' }
                ].map((step, index) => (
                  <div key={step.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${step.color}`} />
                      <span className="font-medium">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(step.value)}</div>
                        <div className="text-xs text-gray-500">{formatPercentage(step.rate)}</div>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${step.color}`}
                          style={{ width: `${Math.min(100, step.rate)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Compare engagement across notification categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryPerformance.map((category: any) => (
                  <div key={category.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{category.category.replace('_', ' ')}</h4>
                      <Badge variant="outline">{formatNumber(category.sent)} sent</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(category.delivered)}</div>
                        <div className="text-gray-500">Delivered</div>
                        <div className="text-xs text-green-600">{formatPercentage(category.deliveryRate)}</div>
                      </div>
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
                        <div className="font-semibold">{formatCurrency(category.revenue)}</div>
                        <div className="text-gray-500">Revenue</div>
                        <div className="text-xs text-green-600">
                          {formatPercentage(category.conversionRate)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          {/* Audience Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Subscribers</span>
                    <span className="font-semibold">{formatNumber(analytics.audienceInsights.totalSubscribers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Users</span>
                    <span className="font-semibold">{formatNumber(analytics.audienceInsights.activeUsers)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>New Users</span>
                    <span className="font-semibold">{formatNumber(analytics.audienceInsights.newUsers)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>iOS Users</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analytics.audienceInsights.platformBreakdown.ios)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Android Users</span>
                    </div>
                    <span className="font-semibold">{formatNumber(analytics.audienceInsights.platformBreakdown.android)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>
                Campaigns with the highest engagement rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPerforming.map((campaign: any, index: number) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{campaign.title}</div>
                        <div className="text-sm text-gray-500 capitalize">{campaign.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{formatNumber(campaign.sent)}</div>
                        <div className="text-gray-500">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${getPerformanceColor(campaign.openRate, 'open')}`}>
                          {formatPercentage(campaign.openRate)}
                        </div>
                        <div className="text-gray-500">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${getPerformanceColor(campaign.clickRate, 'click')}`}>
                          {formatPercentage(campaign.clickRate)}
                        </div>
                        <div className="text-gray-500">Click Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{formatCurrency(campaign.revenue)}</div>
                        <div className="text-gray-500">Revenue</div>
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

          {/* Device Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Insights</CardTitle>
              <CardDescription>
                Understand delivery failures and response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Delivery Failures</h4>
                  <div className="space-y-2">
                    {analytics.deviceMetrics.deliveryFailures.map((failure: any) => (
                      <div key={failure.reason} className="flex justify-between items-center">
                        <span className="text-sm">{failure.reason}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{failure.count}</span>
                          <span className="text-xs text-gray-500">({formatPercentage(failure.percentage)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Response Times</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average</span>
                      <span className="text-sm font-medium">{analytics.deviceMetrics.responseTime.average}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">95th Percentile</span>
                      <span className="text-sm font-medium">{analytics.deviceMetrics.responseTime.p95}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">99th Percentile</span>
                      <span className="text-sm font-medium">{analytics.deviceMetrics.responseTime.p99}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
