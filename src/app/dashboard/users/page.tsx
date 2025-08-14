"use client";

import { useState, useCallback, useMemo } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  UserCheck,
  UserX,
  Eye,
  Download,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserNotifications } from "@/hooks/useUserNotifications";

// Types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  businessName?: string;
  gstNumber?: string;
  isGstVerified?: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt: number;
  updatedAt: number;
  emailVerified?: boolean;
  legalNameOfBusiness?: string;
  tradeName?: string;
  businessType?: string;
  industryType?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  website?: string;
  description?: string;
  socialMediaLinks?: Record<string, string>;
  dateOfBirth?: number;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const pageSize = 20;

  // Auth context
  const { admin } = useAuth();

  // Custom hooks
  const { sendApprovalNotifications, sendRejectionNotifications, showNotificationResult } = useUserNotifications();

  // Memoized query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: pageSize,
    offset: currentPage * pageSize,
  }), [searchTerm, statusFilter, currentPage, pageSize]);

  // Queries
  const users = useQuery(api.users.getUsers, queryParams);

  const userStats = useQuery(api.users.getUserStats);

  // Mutations
  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  // Utility functions
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "suspended":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Dialog handlers
  const openApprovalDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setApprovalMessage("");
    setShowApprovalDialog(true);
  }, []);

  const openRejectionDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setRejectionReason("");
    setRejectionMessage("");
    setShowRejectionDialog(true);
  }, []);

  const openDetailsDialog = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  }, []);

  const handleApproveUser = async () => {
    if (!admin || !selectedUser) return;

    setIsProcessing(true);
    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Approve user in database
      await approveUser({
        userId: selectedUser._id as any,
        adminId: adminId,
        customMessage: approvalMessage || undefined,
      });

      // Send notifications using custom hook
      const notificationResult = await sendApprovalNotifications(selectedUser._id, {
        userEmail: selectedUser.email,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        customMessage: approvalMessage || undefined,
        businessInfo: {
          businessName: selectedUser.businessName,
          gstNumber: selectedUser.gstNumber,
          isGstVerified: selectedUser.isGstVerified,
        },
      });

      showNotificationResult(notificationResult, 'approved');

      setShowApprovalDialog(false);
      setSelectedUser(null);
      setApprovalMessage("");
    } catch (error) {
      toast.error("Failed to approve user");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async () => {
    if (!admin || !selectedUser || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Reject user in database
      await rejectUser({
        userId: selectedUser._id as any,
        adminId: adminId,
        reason: rejectionReason,
        customMessage: rejectionMessage || undefined,
      });

      // Send notifications using custom hook
      const notificationResult = await sendRejectionNotifications(selectedUser._id, {
        userEmail: selectedUser.email,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        rejectionReason: rejectionReason,
        businessInfo: {
          businessName: selectedUser.businessName,
          gstNumber: selectedUser.gstNumber,
        },
      });

      showNotificationResult(notificationResult, 'rejected');

      setShowRejectionDialog(false);
      setSelectedUser(null);
      setRejectionReason("");
      setRejectionMessage("");
    } catch (error) {
      toast.error("Failed to reject user");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage user registrations, approvals, and account status
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{userStats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats?.approved || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{userStats?.rejected || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage user accounts and registration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: User) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.businessName || "N/A"}
                          {user.gstNumber && (
                            <div className="text-xs text-muted-foreground">
                              GST: {user.gstNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => openApprovalDialog(user)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openRejectionDialog(user)}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {users?.length ? (
                    <>Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, users.length)} of {users.length} users</>
                  ) : (
                    "No users found"
                  )}
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
                    disabled={!users || users.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Approve User
              </DialogTitle>
              <DialogDescription>
                Approve {selectedUser?.firstName} {selectedUser?.lastName}'s account application.
                They will receive an email notification with your custom message.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="approval-message">Custom Message (Optional)</Label>
                <Textarea
                  id="approval-message"
                  placeholder="Add a personalized welcome message for the user..."
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  className="min-h-[100px]"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveUser}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Approving..." : "Approve User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-600" />
                Reject User
              </DialogTitle>
              <DialogDescription>
                Reject {selectedUser?.firstName} {selectedUser?.lastName}'s account application.
                They will receive an email notification with the rejection reason.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a clear reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px]"
                  rows={3}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rejection-message">Additional Message (Optional)</Label>
                <Textarea
                  id="rejection-message"
                  placeholder="Any additional information or next steps..."
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                  className="min-h-[60px]"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectionDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectUser}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? "Rejecting..." : "Reject User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedUser.phone || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <Label>Business Name</Label>
                    <p className="text-sm">{selectedUser.businessName || "N/A"}</p>
                  </div>
                  <div>
                    <Label>GST Number</Label>
                    <p className="text-sm">{selectedUser.gstNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Registered</Label>
                    <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm">{formatDate(selectedUser.updatedAt)}</p>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}