"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Globe,
  Activity,
} from "lucide-react";
import { LiveVisitorsGlobe } from "@/components/analytics/live-visitors-globe";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function AnalyticsPage() {
  // Get real-time analytics data
  const liveVisitors = useQuery(api.analytics.getLiveVisitors);
  const visitorAnalytics = useQuery(api.analytics.getVisitorAnalytics, { timeRange: "24h" });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track your store's performance and growth
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="30days">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-gray-200 dark:border-gray-600">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Visitors</CardTitle>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Activity className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {liveVisitors?.count || 0}
                </div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <Globe className="h-3 w-3 mr-1" />
                  Online now
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Visitors (24h)</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {visitorAnalytics?.totalVisitors || 0}
                </div>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                  <Eye className="h-3 w-3 mr-1" />
                  {visitorAnalytics?.totalPageViews || 0} page views
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Countries</CardTitle>
                <Globe className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {visitorAnalytics?.topCountries?.length || 0}
                </div>
                <div className="flex items-center text-xs text-purple-600 dark:text-purple-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Global reach
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Session</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {visitorAnalytics?.totalVisitors ? 
                    Math.round((visitorAnalytics.totalPageViews / visitorAnalytics.totalVisitors) * 10) / 10 : 0}
                </div>
                <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  pages per session
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Visitors Globe */}
          <LiveVisitorsGlobe />

          {/* Real-time Analytics Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Hourly Visitor Chart */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Hourly Visitors (24h)</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Visitor activity over the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visitorAnalytics?.hourlyData?.slice(-12).map((hour, index) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {hour.hour}h
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {hour.hour}:00
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {hour.visitors} visitors
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {hour.pageViews} page views
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No hourly data available yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Data will appear as visitors browse your site</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Countries */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Top Countries</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Countries with the most visitors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visitorAnalytics?.topCountries?.slice(0, 5).map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {country.country}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {country.cities.length} cities
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {country.visitors} visitors
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {country.pageViews} page views
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No country data available yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Data will appear as visitors browse your site</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}