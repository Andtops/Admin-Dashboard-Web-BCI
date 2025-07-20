"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  UserCheck, 
  UserX, 
  Eye,
  Clock,
  Building,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function PendingUsersPageGmail() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { admin } = useAuth();

  // Queries
  const pendingUsers = useQuery(api.users.getPendingUsers, { limit: 50 });
  const userStats = useQuery(api.users.getUserStats);

  // Mutations
  const approveUser = useMutation(api.users.approveUser);
  const rejectUser = useMutation(api.users.rejectUser);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const handleApproveUser = async (userId: string, customMessage?: string) => {
    if (!admin) return;

    try {
      // Get or create admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Approve user in database
      await approveUser({
        userId: userId as any,
        adminId: adminId,
        customMessage: customMessage,
      });

      // Send approval email via Gmail API
      try {
        console.log('📧 Sending approval email via Gmail API for:', selectedUser?.email);
        
        const emailResult = await fetch('/api/gmail-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'approval',
            userEmail: selectedUser?.email || '',
            userName: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
            customMessage: customMessage || "Your account has been approved and you can now access all features.",
            businessInfo: {
              businessName: selectedUser?.businessName,
              gstNumber: selectedUser?.gstNumber,
              isGstVerified: selectedUser?.isGstVerified,
            },
          }),
        });

        const emailData = await emailResult.json();
        
        console.log('📧 Gmail API response:', emailData);
        
        if (emailData.success) {
          toast.success(`User approved successfully! Email sent to ${selectedUser?.email}`);
          console.log('✅ Gmail API email sent successfully:', emailData.messageId);
        } else {
          toast.success("User approved successfully (email failed to send)");
          console.warn('❌ Gmail API email failed:', emailData.error);
        }
      } catch (emailError) {
        toast.success("User approved successfully (email service unavailable)");
        console.warn('❌ Gmail API error:', emailError);
      }
      
      setShowApproveDialog(false);
      setApprovalMessage("");
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to approve user");
      console.error(error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!admin || !rejectionReason.trim()) return;

    try {
      // Get or create admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      // Reject user in database
      await rejectUser({
        userId: userId as any,
        adminId: adminId,
        reason: rejectionReason,
      });

      // Send rejection email via Gmail API
      try {
        console.log('📧 Sending rejection email via Gmail API for:', selectedUser?.email);
        
        const emailResult = await fetch('/api/gmail-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'rejection',
            userEmail: selectedUser?.email || '',
            userName: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
            rejectionReason: rejectionReason,
            businessInfo: {
              businessName: selectedUser?.businessName,
              gstNumber: selectedUser?.gstNumber,
            },
          }),
        });

        const emailData = await emailResult.json();
        
        console.log('📧 Gmail API response:', emailData);
        
        if (emailData.success) {
          toast.success(`User rejected successfully! Email sent to ${selectedUser?.email}`);
          console.log('✅ Gmail API email sent successfully:', emailData.messageId);
        } else {
          toast.success("User rejected successfully (email failed to send)");
          console.warn('❌ Gmail API email failed:', emailData.error);
        }
      } catch (emailError) {
        toast.success("User rejected successfully (email service unavailable)");
        console.warn('❌ Gmail API error:', emailError);
      }
      
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedUser(null);
    } catch (error) {
      toast.error("Failed to reject user");
      console.error(error);
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

  const openRejectDialog = (user: any) => {
    setSelectedUser(user);
    setShowRejectDialog(true);
    setRejectionReason("");
  };

  const openApproveDialog = (user: any) => {
    setSelectedUser(user);
    setShowApproveDialog(true);
    setApprovalMessage("");
  };

  return (
    <ProtectedRoute requiredPermission="users.approve">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pending User Approvals</h1>
              <p className="text-muted-foreground">
                Review and approve user registrations (Gmail API integration)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                {pendingUsers?.length || 0} Pending
              </Badge>
              <Badge variant="outline" className="text-sm">
                Gmail API ✅
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{userStats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats?.recentRegistrations || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">GST Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {pendingUsers?.filter(u => u.isGstVerified).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Business Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {pendingUsers?.filter(u => u.businessName).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Users List */}
          {pendingUsers && pendingUsers.length > 0 ? (
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(user.createdAt)}
                        </Badge>
                        {user.isGstVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            GST Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Business Information */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Business Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {user.businessName && (
                            <div>
                              <span className="font-medium">Trade Name:</span> {user.businessName}
                            </div>
                          )}
                          {user.legalNameOfBusiness && (
                            <div>
                              <span className="font-medium">Legal Name:</span> {user.legalNameOfBusiness}
                            </div>
                          )}
                          {user.tradeName && (
                            <div>
                              <span className="font-medium">Trade Name:</span> {user.tradeName}
                            </div>
                          )}
                          {user.constitutionOfBusiness && (
                            <div>
                              <span className="font-medium">Constitution:</span> {user.constitutionOfBusiness}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GST Information */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          GST Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {user.gstNumber && (
                            <div>
                              <span className="font-medium">GST Number:</span> 
                              <span className="font-mono ml-2">{user.gstNumber}</span>
                            </div>
                          )}
                          {user.taxpayerType && (
                            <div>
                              <span className="font-medium">Taxpayer Type:</span> {user.taxpayerType}
                            </div>
                          )}
                          {user.gstStatus && (
                            <div>
                              <span className="font-medium">GST Status:</span> {user.gstStatus}
                            </div>
                          )}
                          {user.principalPlaceOfBusiness && (
                            <div>
                              <span className="font-medium">Principal Place:</span> {user.principalPlaceOfBusiness}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => openRejectDialog(user)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openApproveDialog(user)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  There are no pending user approvals at the moment.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Approval Dialog */}
          <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve User Registration</DialogTitle>
                <DialogDescription>
                  Approve {selectedUser?.firstName} {selectedUser?.lastName}'s registration and send email via Gmail API.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="approval-message">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    id="approval-message"
                    placeholder="Add a personalized welcome message for the user..."
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be included in the approval email sent via Gmail API.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowApproveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => selectedUser && handleApproveUser(selectedUser._id, approvalMessage)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Rejection Dialog */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject User Registration</DialogTitle>
                <DialogDescription>
                  Please provide a reason for rejecting {selectedUser?.firstName} {selectedUser?.lastName}'s registration.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a clear reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    This reason will be included in the rejection email sent via Gmail API.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedUser && handleRejectUser(selectedUser._id)}
                  disabled={!rejectionReason.trim()}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Reject User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}