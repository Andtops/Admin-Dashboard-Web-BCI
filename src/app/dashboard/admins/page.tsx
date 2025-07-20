"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ConfirmDialog,
} from "@/components/ui/enhanced-dialog";
import {
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Plus,
  Edit,
  Trash2,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  RefreshCw,
  Download,
  UserPlus,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "admin",
    permissions: [] as string[]
  });
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [adminToUpdate, setAdminToUpdate] = useState<{id: string, isActive: boolean} | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const pageSize = 20;

  const { admin } = useAuth();

  // Queries
  const admins = useQuery(api.admins?.getAdmins, {
    search: searchTerm || undefined,
    role: roleFilter === "all" ? undefined : roleFilter as any,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const adminStats = useQuery(api.admins?.getAdminStats);

  // Mutations
  const createAdmin = useMutation(api.admins?.createAdmin);
  const updateAdminStatus = useMutation(api.admins?.updateAdminStatus);
  const updateAdminRole = useMutation(api.admins?.updateAdminRole);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const handleCreateAdmin = async () => {
    if (!admin || !newAdminData.email || !newAdminData.firstName || !newAdminData.lastName) return;

    setIsCreatingAdmin(true);
    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });
      await createAdmin({
        ...newAdminData,
        createdBy: adminId,
      });
      toast.success("Admin user created successfully");
      setShowCreateDialog(false);
      setNewAdminData({
        email: "",
        firstName: "",
        lastName: "",
        role: "admin",
        permissions: []
      });
    } catch (error) {
      toast.error("Failed to create admin user");
      console.error(error);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleUpdateStatus = async (adminId: string, isActive: boolean) => {
    setAdminToUpdate({ id: adminId, isActive });
    setShowStatusConfirm(true);
  };

  const confirmUpdateStatus = async () => {
    if (!admin || !adminToUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await updateAdminStatus({
        adminId: adminToUpdate.id as any,
        isActive: adminToUpdate.isActive,
      });
      toast.success(`Admin ${adminToUpdate.isActive ? 'activated' : 'deactivated'} successfully`);
      setShowStatusConfirm(false);
      setAdminToUpdate(null);
      if (selectedAdmin?._id === adminToUpdate.id) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      toast.error("Failed to update admin status");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge variant="default" className="bg-purple-500">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
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

  const openDetailsDialog = (adminUser: any) => {
    setSelectedAdmin(adminUser);
    setShowDetailsDialog(true);
  };

  // Use real data from API
  const adminsList = admins || [];
  const stats = adminStats || {
    total: 0,
    active: 0,
    superAdmins: 0,
    recentLogins: 0
  };

  const availablePermissions = [
    "users.read", "users.write", "users.approve", "users.delete",
    "products.read", "products.write", "products.delete",
    "admins.read", "admins.write", "admins.delete",
    "settings.read", "settings.write",
    "api_keys.read", "api_keys.write", "api_keys.delete",
    "notifications.read", "notifications.write",
    "logs.read", "reports.read"
  ];

  return (
    <ProtectedRoute requiredPermission="admins.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
              <p className="text-muted-foreground">
                Manage admin users, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Admins
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {isCreatingAdmin && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create New Admin User
                    </DialogTitle>
                    <DialogDescription>
                      Add a new admin user with specific role and permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newAdminData.firstName}
                          onChange={(e) => setNewAdminData({...newAdminData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newAdminData.lastName}
                          onChange={(e) => setNewAdminData({...newAdminData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdminData.email}
                        onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newAdminData.role} onValueChange={(value) => setNewAdminData({...newAdminData, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {availablePermissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission}
                              checked={newAdminData.permissions.includes(permission)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewAdminData({
                                    ...newAdminData,
                                    permissions: [...newAdminData.permissions, permission]
                                  });
                                } else {
                                  setNewAdminData({
                                    ...newAdminData,
                                    permissions: newAdminData.permissions.filter(p => p !== permission)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={permission} className="text-sm">
                              {permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      disabled={isCreatingAdmin}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateAdmin}
                      disabled={!newAdminData.email || !newAdminData.firstName || !newAdminData.lastName || isCreatingAdmin}
                    >
                      {isCreatingAdmin ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Admin
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.superAdmins}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.recentLogins}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage admin users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search admins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminsList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <User className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No admin users found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminsList.map((adminUser) => (
                      <TableRow key={adminUser._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {adminUser.firstName[0]}{adminUser.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {adminUser.firstName} {adminUser.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {adminUser.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(adminUser.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {adminUser.permissions.includes("*") ? (
                              <Badge variant="default" className="bg-purple-500">All Permissions</Badge>
                            ) : (
                              <>
                                {adminUser.permissions.slice(0, 2).map((permission, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {adminUser.permissions.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{adminUser.permissions.length - 2}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {adminUser.isActive ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {adminUser.lastLoginAt ? formatDate(adminUser.lastLoginAt) : 'Never'}
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(adminUser)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(adminUser._id, !adminUser.isActive)}
                              >
                                {adminUser.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Admin
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
                  Showing {adminsList.length} admin users
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
                    disabled={adminsList.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Admin User Details
                </DialogTitle>
                <DialogDescription>
                  Complete information for {selectedAdmin?.firstName} {selectedAdmin?.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {selectedAdmin?.firstName?.[0]}{selectedAdmin?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {selectedAdmin?.firstName} {selectedAdmin?.lastName}
                    </h3>
                    <p className="text-muted-foreground">{selectedAdmin?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedAdmin && getRoleBadge(selectedAdmin.role)}
                      {selectedAdmin?.isActive ? (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Account Information</h4>
                    <div className="space-y-1 text-sm">
                      <div>Email: {selectedAdmin?.email}</div>
                      <div>Role: {selectedAdmin?.role}</div>
                      <div>Status: {selectedAdmin?.isActive ? 'Active' : 'Inactive'}</div>
                      <div>Created: {selectedAdmin?.createdAt ? formatDate(selectedAdmin?.createdAt) : 'N/A'}</div>
                      <div>Last Login: {selectedAdmin?.lastLoginAt ? formatDate(selectedAdmin?.lastLoginAt) : 'Never'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Activity</h4>
                    <div className="space-y-1 text-sm">
                      <div>Last Updated: {selectedAdmin?.updatedAt ? formatDate(selectedAdmin?.updatedAt) : 'N/A'}</div>
                      <div>Created By: {selectedAdmin?.createdBy || 'System'}</div>
                      <div>Permission Count: {selectedAdmin?.permissions?.length || 0}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAdmin?.permissions?.includes("*") ? (
                      <Badge variant="default" className="bg-purple-500">
                        <Crown className="h-3 w-3 mr-1" />
                        All Permissions
                      </Badge>
                    ) : (
                      selectedAdmin?.permissions?.map((permission: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          {permission}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedAdmin?.permissions?.length || 0}
                      </div>
                      <div className="text-xs text-blue-600">Permissions</div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedAdmin?.isActive ? '100%' : '0%'}
                      </div>
                      <div className="text-xs text-green-600">Active Status</div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedAdmin?.lastLoginAt ?
                          Math.round((Date.now() - selectedAdmin.lastLoginAt) / (1000 * 60 * 60 * 24)) : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-purple-600">Days Since Login</div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Admin
                </Button>
                <Button
                  variant={selectedAdmin?.isActive ? "destructive" : "default"}
                  onClick={() => {
                    if (selectedAdmin) {
                      handleUpdateStatus(selectedAdmin._id, !selectedAdmin.isActive);
                    }
                  }}
                >
                  {selectedAdmin?.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Status Update Confirmation Dialog */}
          <ConfirmDialog
            open={showStatusConfirm}
            onOpenChange={setShowStatusConfirm}
            title={`${adminToUpdate?.isActive ? 'Activate' : 'Deactivate'} Admin`}
            description={`Are you sure you want to ${adminToUpdate?.isActive ? 'activate' : 'deactivate'} this admin user? This will ${adminToUpdate?.isActive ? 'grant' : 'revoke'} their access to the admin dashboard.`}
            confirmText={adminToUpdate?.isActive ? 'Activate' : 'Deactivate'}
            cancelText="Cancel"
            variant={adminToUpdate?.isActive ? "default" : "destructive"}
            loading={isUpdatingStatus}
            onConfirm={confirmUpdateStatus}
            onCancel={() => {
              setShowStatusConfirm(false);
              setAdminToUpdate(null);
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
