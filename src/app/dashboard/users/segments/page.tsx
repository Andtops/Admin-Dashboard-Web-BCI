"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Target,
  TrendingUp,
  Filter,
} from "lucide-react";

export default function CustomerSegmentsPage() {
  // Mock data - in real app this would come from your API
  const segments = [
    {
      id: 1,
      name: "High Value Customers",
      description: "Customers with orders over $1000",
      customerCount: 234,
      criteria: "Total spent > $1000",
      lastUpdated: "2 hours ago",
      status: "active",
    },
    {
      id: 2,
      name: "New Customers",
      description: "Customers who joined in the last 30 days",
      customerCount: 89,
      criteria: "Registration date < 30 days",
      lastUpdated: "1 day ago",
      status: "active",
    },
    {
      id: 3,
      name: "Inactive Customers",
      description: "Customers with no orders in 90+ days",
      customerCount: 156,
      criteria: "Last order > 90 days ago",
      lastUpdated: "3 days ago",
      status: "active",
    },
    {
      id: 4,
      name: "Bulk Buyers",
      description: "Customers who frequently place large orders",
      customerCount: 67,
      criteria: "Average order value > $500",
      lastUpdated: "1 week ago",
      status: "draft",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customer Segments</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create and manage customer segments for targeted marketing
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create segment
            </Button>
          </div>

          {/* Segment Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Segments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  +2 this month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Segments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  All performing well
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Segmented Customers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">2,456</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Filter className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  78% of total customers
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Segment Size</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">205</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  +12% from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search segments..."
                      className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>
                <Button variant="outline" className="border-gray-200 dark:border-gray-600">
                  All segments
                </Button>
                <Button variant="outline" className="border-gray-200 dark:border-gray-600">
                  Active
                </Button>
                <Button variant="outline" className="border-gray-200 dark:border-gray-600">
                  Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Segments Table */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Customer Segments
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Manage your customer segments and their criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-600 dark:text-gray-400">Segment</TableHead>
                    <TableHead className="text-gray-600 dark:text-gray-400">Criteria</TableHead>
                    <TableHead className="text-gray-600 dark:text-gray-400">Customers</TableHead>
                    <TableHead className="text-gray-600 dark:text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-600 dark:text-gray-400">Last Updated</TableHead>
                    <TableHead className="text-gray-600 dark:text-gray-400 w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {segment.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {segment.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {segment.criteria}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {segment.customerCount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(segment.status)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {segment.lastUpdated}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View customers
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit segment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Segment Templates */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Segment Templates
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Create segments using pre-built templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">VIP Customers</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Top spending customers</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Customers with lifetime value &gt; $5,000
                  </p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 dark:border-gray-600">
                    Create Segment
                  </Button>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Repeat Customers</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loyal returning customers</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Customers with 3+ orders
                  </p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 dark:border-gray-600">
                    Create Segment
                  </Button>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">At-Risk Customers</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Customers likely to churn</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    No orders in 60+ days
                  </p>
                  <Button size="sm" variant="outline" className="w-full border-gray-200 dark:border-gray-600">
                    Create Segment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}