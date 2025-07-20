"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  DetailDialog,
  DetailSection,
  DetailField,
} from "@/components/ui/enhanced-dialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Eye,
  Download,
  RefreshCw,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const { admin } = useAuth();

  // Queries
  const users = useQuery(api.users.getUsers, {
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const userStats = useQuery(api.users.getUserStats);

  // Mutations
  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const openApprovalDialog = (user: any) => {
    setSelectedUser(user);
    setApprovalMessage("");
    setShowApprovalDialog(true);
  };

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

      // Send approval email
      try {
        const emailResponse = await fetch('/api/gmail-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'approval',
            userEmail: selectedUser.email,
            userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
            customMessage: approvalMessage || undefined,
            businessInfo: {
              businessName: selectedUser.businessName,
              gstNumber: selectedUser.gstNumber,
              isGstVerified: selectedUser.isGstVerified,
            },
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          toast.success("User approved and notification email sent successfully");
        } else {
          toast.success("User approved successfully, but email notification failed");
          console.warn("Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        toast.success("User approved successfully, but email notification failed");
        console.error("Email sending error:", emailError);
      }

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

  const openRejectionDialog = (user: any) => {
    setSelectedUser(user);
    setRejectionReason("");
    setRejectionMessage("");
    setShowRejectionDialog(true);
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

      // Send rejection email
      try {
        const emailResponse = await fetch('/api/gmail-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'rejection',
            userEmail: selectedUser.email,
            userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
            rejectionReason: rejectionReason,
            businessInfo: {
              businessName: selectedUser.businessName,
              gstNumber: selectedUser.gstNumber,
            },
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (emailResult.success) {
          toast.success("User rejected and notification email sent successfully");
        } else {
          toast.success("User rejected successfully, but email notification failed");
          console.warn("Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        toast.success("User rejected successfully, but email notification failed");
        console.error("Email sending error:", emailError);
      }

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

  const getStatusBadge = (status: string) => {
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
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailsDialog = (user: any) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  return (
    <ProtectedRoute requiredPermission="users.read">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">GST Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{userStats?.gstVerified || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage and monitor user accounts
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
                      <TableHead>User</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-muted-foreground">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {user.businessName && (
                              <div className="font-medium">{user.businessName}</div>
                            )}
                            {user.legalNameOfBusiness && (
                              <div className="text-sm text-muted-foreground">
                                {user.legalNameOfBusiness}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {user.gstNumber && (
                              <div className="font-mono text-sm">{user.gstNumber}</div>
                            )}
                            {user.isGstVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.createdAt)}
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openApprovalDialog(user)}
                                    className="text-green-600"
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Approve User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openRejectionDialog(user)}
                                    className="text-red-600"
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Reject User
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
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, users?.length || 0)} of {users?.length || 0} users
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

          {/* User Details Dialog */}
          <DetailDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            title="User Details"
            subtitle={`Complete information for ${selectedUser?.firstName} ${selectedUser?.lastName}`}
            size="5xl"
            actions={
              <>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {selectedUser?.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowDetailsDialog(false);
                        openApprovalDialog(selectedUser);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        openRejectionDialog(selectedUser);
                      }}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject User
                    </Button>
                  </div>
                )}
              </>
            }
          >
            <div className="space-y-8">
                {/* Personal Information */}
                <DetailSection title="Personal Information" columns={2}>
                  <DetailField
                    label="Full Name"
                    value={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
                  />
                  <DetailField
                    label="Email"
                    value={selectedUser?.email}
                  />
                  <DetailField
                    label="Phone"
                    value={selectedUser?.phone}
                  />
                  <DetailField
                    label="Date of Birth"
                    value={selectedUser?.dateOfBirth ? formatDate(selectedUser?.dateOfBirth) : undefined}
                  />
                  <DetailField
                    label="Account Status"
                    value={selectedUser && getStatusBadge(selectedUser.status)}
                  />
                  <DetailField
                    label="Email Verified"
                    value={
                      selectedUser?.emailVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Not Verified
                        </Badge>
                      )
                    }
                  />
                </DetailSection>

                {/* Business Information */}
                <DetailSection title="Business Information" columns={2}>
                  <DetailField
                    label="Trade Name"
                    value={selectedUser?.businessName}
                  />
                  <DetailField
                    label="Legal Name of Business"
                    value={selectedUser?.legalNameOfBusiness}
                  />
                  <DetailField
                    label="Trade Name"
                    value={selectedUser?.tradeName}
                  />
                  <DetailField
                    label="Business Type"
                    value={selectedUser?.businessType}
                  />
                  <DetailField
                    label="Industry Type"
                    value={selectedUser?.industryType}
                  />
                </DetailSection>



                {/* Address Information */}
                <DetailSection title="Address Information" columns={2}>
                  <DetailField
                    label="Address"
                    value={selectedUser?.address}
                  />
                  <DetailField
                    label="City"
                    value={selectedUser?.city}
                  />
                  <DetailField
                    label="State"
                    value={selectedUser?.state}
                  />
                  <DetailField
                    label="Pincode"
                    value={selectedUser?.pincode}
                  />
                  <DetailField
                    label="Country"
                    value={selectedUser?.country}
                  />
                </DetailSection>

                {/* Account Information */}
                <DetailSection title="Account Information" columns={3}>
                  <DetailField
                    label="Registration Date"
                    value={selectedUser?.createdAt ? formatDate(selectedUser?.createdAt) : 'N/A'}
                  />
                  <DetailField
                    label="Last Updated"
                    value={selectedUser?.updatedAt ? formatDate(selectedUser?.updatedAt) : 'N/A'}
                  />
                  <DetailField
                    label="Email Verified"
                    value={
                      selectedUser?.emailVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Not Verified
                        </Badge>
                      )
                    }
                  />
                </DetailSection>

                {/* Additional Information */}
                {(selectedUser?.website || selectedUser?.description || selectedUser?.socialMediaLinks) && (
                  <DetailSection title="Additional Information" columns={1}>
                    <DetailField
                      label="Website"
                      value={selectedUser?.website ? (
                        <a
                          href={selectedUser?.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {selectedUser?.website}
                        </a>
                      ) : undefined}
                    />
                    <DetailField
                      label="Description"
                      value={selectedUser?.description}
                    />
                    <DetailField
                      label="Social Media"
                      value={selectedUser?.socialMediaLinks && Object.keys(selectedUser?.socialMediaLinks).length > 0 ? (
                        <div className="flex gap-3 flex-wrap">
                          {Object.entries(selectedUser?.socialMediaLinks).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm transition-colors capitalize"
                            >
                              {platform}
                            </a>
                          ))}
                        </div>
                      ) : undefined}
                    />
                  </DetailSection>
                )}
            </div>
          </DetailDialog>

          {/* Approval Dialog */}
          <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Approve User Account
                </DialogTitle>
                <DialogDescription>
                  Approve {selectedUser?.firstName} {selectedUser?.lastName}'s account application.
                  They will receive an email notification with your custom message.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="approval-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="approval-message"
                    placeholder="Add a personalized welcome message for the user..."
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be included in the approval email along with the default welcome content.
                  </p>
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
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rejection Dialog */}
          <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-600" />
                  Reject User Account
                </DialogTitle>
                <DialogDescription>
                  Reject {selectedUser?.firstName} {selectedUser?.lastName}'s account application.
                  They will receive an email notification with the rejection reason.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Please provide a clear reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This reason will be included in the rejection email to help the user understand the decision.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejection-message">Additional Message (Optional)</Label>
                  <Textarea
                    id="rejection-message"
                    placeholder="Add any additional information or guidance for the user..."
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Provide additional context or next steps for the user.
                  </p>
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
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Reject User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
