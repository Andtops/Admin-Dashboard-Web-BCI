"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  TrendingUp,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function DashboardPage() {
  // Get dashboard statistics
  const userStats = useQuery(api.users.getUserStats);
  const productStats = useQuery(api.products.getProductStats);
  const liveVisitors = useQuery(api.analytics.getLiveVisitors);
  const visitorAnalytics = useQuery(api.analytics.getVisitorAnalytics, { timeRange: "24h" });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Home</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Here's what's happening with your store today's.
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total sales</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">$45,231.89</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +20.1% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">+2350</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +180.1% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Products</CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{productStats?.total || 0}</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +19% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active customers</CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.total || 0}</div>
                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +201 since last hour
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Real-time Analytics Overview */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Live Analytics</CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        Real-time visitor activity and engagement
                      </CardDescription>
                    </div>
                    <Link href="/dashboard/analytics">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Live Visitors */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Visitors</h3>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {liveVisitors?.count || 0}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Currently browsing your site
                      </p>
                    </div>

                    {/* 24h Stats */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Last 24 Hours</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Visitors</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {visitorAnalytics?.totalVisitors || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Page Views</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {visitorAnalytics?.totalPageViews || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Countries</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {visitorAnalytics?.topCountries?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Countries */}
                  {visitorAnalytics?.topCountries && visitorAnalytics.topCountries.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Top Countries</h3>
                      <div className="space-y-2">
                        {visitorAnalytics.topCountries.slice(0, 3).map((country, index) => (
                          <div key={country.country} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {country.country}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {country.visitors} visitors
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent activity</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Latest updates from your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">New order received</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Order #1234 from John Doe
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Product updated</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Benzene product information updated
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">5 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Customer registered</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Jane Smith created an account
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">10 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Low inventory alert</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Toluene stock is running low
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full mt-4 text-gray-600 dark:text-gray-400">
                  View all activity
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Products</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your inventory</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Customers</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View customer details</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Orders</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Process new orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View performance data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
