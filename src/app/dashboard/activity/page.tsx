"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  Activity,
  User,
  Package,
  Settings,
  Key,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  UserCog
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [performerFilter, setPerformerFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const pageSize = 20;

  const { admin } = useAuth();

  // Queries
  const activityLogs = useQuery(api.activityLogs?.getActivityLogs, {
    search: searchTerm || undefined,
    entityType: entityFilter === "all" ? undefined : entityFilter as any,
    action: actionFilter === "all" ? undefined : actionFilter,
    performedByType: performerFilter === "all" ? undefined : performerFilter as any,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const activityStats = useQuery(api.activityLogs?.getActivityStats);

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "user":
        return <User className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      case "admin":
        return <UserCog className="h-4 w-4" />;
      case "setting":
        return <Settings className="h-4 w-4" />;
      case "api_key":
        return <Key className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      create: "bg-green-500",
      update: "bg-blue-500",
      delete: "bg-red-500",
      approve: "bg-green-500",
      reject: "bg-red-500",
      login: "bg-blue-500",
      logout: "bg-gray-500"
    };

    const color = actionColors[action.toLowerCase()] || "bg-gray-500";
    return <Badge className={color}>{action}</Badge>;
  };

  const getPerformerBadge = (performedByType: string) => {
    switch (performedByType) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "user":
        return <Badge variant="secondary">User</Badge>;
      case "system":
        return <Badge variant="outline">System</Badge>;
      default:
        return <Badge variant="outline">{performedByType}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const openDetailsDialog = (log: any) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  // Use real data from API
  const activityLogsList = activityLogs || [];
  const stats = activityStats || {
    total: 0,
    today: 0,
    adminActions: 0,
    systemActions: 0
  };

  return (
    <ProtectedRoute requiredPermission="logs.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
              <p className="text-muted-foreground">
                Monitor system activities and user actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.today}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.adminActions}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">System Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.systemActions}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Detailed system activity and audit trail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="product">Products</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="setting">Settings</SelectItem>
                    <SelectItem value="api_key">API Keys</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={performerFilter} onValueChange={setPerformerFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Performer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLogsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Activity className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No activity logs found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activityLogsList.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionBadge(log.action)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <div>
                              <div className="font-medium capitalize">{log.entityType}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {log.entityId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPerformerBadge(log.performedByType)}
                            <div className="text-sm text-muted-foreground font-mono">
                              {log.performedBy}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{log.ipAddress}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(log.createdAt)}
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(log)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {activityLogsList.length} activity logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={activityLogsList.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedLog && getEntityIcon(selectedLog.entityType)}
                  Activity Log Details
                </DialogTitle>
                <DialogDescription>
                  Detailed information for activity: {selectedLog?.action} on {selectedLog?.entityType}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2">
                  {selectedLog && getActionBadge(selectedLog.action)}
                  {selectedLog && getPerformerBadge(selectedLog.performedByType)}
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedLog?.createdAt ? formatDate(selectedLog?.createdAt) : 'N/A'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Activity Information</h4>
                    <div className="space-y-1 text-sm">
                      <div>Action: {selectedLog?.action}</div>
                      <div>Entity Type: {selectedLog?.entityType}</div>
                      <div>Entity ID: <span className="font-mono">{selectedLog?.entityId}</span></div>
                      <div>Performed By: <span className="font-mono">{selectedLog?.performedBy}</span></div>
                      <div>Performer Type: {selectedLog?.performedByType}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Technical Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>IP Address: <span className="font-mono">{selectedLog?.ipAddress}</span></div>
                      <div>Timestamp: {selectedLog?.createdAt ? formatDate(selectedLog?.createdAt) : 'N/A'}</div>
                      {selectedLog?.userAgent && (
                        <div>User Agent: <span className="font-mono text-xs">{selectedLog?.userAgent.substring(0, 50)}...</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedLog?.oldValues && (
                  <div>
                    <h4 className="font-medium mb-2">Previous Values</h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <pre className="text-xs text-red-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog?.oldValues, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog?.newValues && (
                  <div>
                    <h4 className="font-medium mb-2">New Values</h4>
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <pre className="text-xs text-green-800 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog?.newValues, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog?.oldValues && selectedLog?.newValues && (
                  <div>
                    <h4 className="font-medium mb-2">Changes Summary</h4>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <div className="text-sm text-blue-800">
                        {Object.keys(selectedLog?.newValues).map((key) => {
                          const oldValue = selectedLog?.oldValues?.[key];
                          const newValue = selectedLog?.newValues[key];
                          if (oldValue !== newValue) {
                            return (
                              <div key={key} className="mb-1">
                                <span className="font-medium">{key}:</span>
                                <span className="text-red-600 line-through ml-1">{String(oldValue)}</span>
                                <span className="text-green-600 ml-1">→ {String(newValue)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
