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
  ConfirmDialog,
  FormSection,
  FormField,
  DetailDialog,
  DetailSection,
  DetailField,
} from "@/components/ui/enhanced-dialog";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { SecureApiKeyDisplay, SecureApiKeyField } from "@/components/ui/secure-api-key-display";
import {
  Search,
  MoreHorizontal,
  Eye,
  Key,
  Plus,
  Trash2,
  Shield,
  Activity,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api.js";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  useApiKeys,
  useApiKeyStats,
  useCreateApiKey,
  useRevokeApiKey,
  useDeleteApiKey,
} from "@/hooks/useApiKeysGraphQL";

export default function APIKeysPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedApiKey, setSelectedApiKey] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [selectAllEssential, setSelectAllEssential] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [apiKeyToRevoke, setApiKeyToRevoke] = useState<string | null>(null);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recentlyCreatedKeys, setRecentlyCreatedKeys] = useState<Set<string>>(new Set());
  const pageSize = 20;

  const { admin } = useAuth();

  // GraphQL Queries
  const { data: apiKeys, loading: apiKeysLoading, error: apiKeysError } = useApiKeys({
    search: searchTerm || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const { data: apiKeyStats, loading: statsLoading, error: statsError } = useApiKeyStats();

  // Handle GraphQL errors
  if (apiKeysError) {
    console.error('GraphQL API Keys Error:', apiKeysError);
    toast.error('Failed to load API keys');
  }

  if (statsError) {
    console.error('GraphQL Stats Error:', statsError);
    toast.error('Failed to load API key statistics');
  }

  // GraphQL Mutations
  const { createApiKey, loading: isCreatingKey, error: createError } = useCreateApiKey();
  const { revokeApiKey, loading: isRevoking, error: revokeError } = useRevokeApiKey();
  const { deleteApiKey, loading: isDeleting, error: deleteError } = useDeleteApiKey();

  // Keep Convex mutation for admin operations (until migrated)
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const handleCreateApiKey = async () => {
    if (!admin || !newKeyName.trim()) return;

    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });
      const result = await createApiKey({
        name: newKeyName,
        permissions: newKeyPermissions,
        adminId: adminId,
      });

      // Track this key as recently created for immediate access
      if (result?.id) {
        setRecentlyCreatedKeys(prev => new Set(prev).add(result.id));
        // Remove from recently created after 5 minutes
        setTimeout(() => {
          setRecentlyCreatedKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(result.id);
            return newSet;
          });
        }, 5 * 60 * 1000);
      }

      toast.success("API key created successfully");
      setShowCreateDialog(false);
      setNewKeyName("");
      setNewKeyPermissions([]);
      setSelectAllEssential(false);
    } catch (error) {
      toast.error("Failed to create API key");
      console.error(error);
    }
  };

  const handleRevokeApiKey = async (apiKeyId: string) => {
    setApiKeyToRevoke(apiKeyId);
    setShowRevokeConfirm(true);
  };

  const confirmRevokeApiKey = async () => {
    if (!admin || !apiKeyToRevoke) return;

    try {
      // Get or create admin ID first
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await revokeApiKey({
        apiKeyId: apiKeyToRevoke,
        revokedBy: adminId,
        reason: "Revoked via admin dashboard"
      });
      toast.success("API key revoked successfully");
      setShowRevokeConfirm(false);
      setApiKeyToRevoke(null);
      if (selectedApiKey?.id === apiKeyToRevoke) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      toast.error("Failed to revoke API key");
      console.error(error);
    }
  };

  const handleDeleteApiKey = async (apiKeyId: string) => {
    setApiKeyToDelete(apiKeyId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteApiKey = async () => {
    if (!admin || !apiKeyToDelete) return;

    try {
      // Get or create admin ID first
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await deleteApiKey({
        apiKeyId: apiKeyToDelete,
        deletedBy: adminId,
        reason: "Permanently deleted via admin dashboard"
      });
      toast.success("API key permanently deleted");
      setShowDeleteConfirm(false);
      setApiKeyToDelete(null);
      if (selectedApiKey?.id === apiKeyToDelete) {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      toast.error("Failed to delete API key");
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

  const openDetailsDialog = (apiKey: any) => {
    setSelectedApiKey(apiKey);
    setShowDetailsDialog(true);
  };



  // Permission categories for better UX
  const permissionCategories = {
    essential: {
      title: "Essential Permissions",
      description: "Core permissions typically required for frontend applications and basic API access",
      icon: Shield,
      permissions: [
        {
          name: "collections.read",
          label: "Collections Read",
          description: "View product collections and categories"
        },
        {
          name: "collections.write",
          label: "Collections Write",
          description: "Create and modify product collections"
        },
        {
          name: "products.read",
          label: "Products Read",
          description: "View product information and inventory"
        },
        {
          name: "products.write",
          label: "Products Write",
          description: "Create and update product data"
        },
        {
          name: "analytics.read",
          label: "Analytics Read",
          description: "Access basic analytics and reporting data"
        },
        {
          name: "quotations.read",
          label: "Quotations Read",
          description: "View customer quotation requests and history"
        },
        {
          name: "quotations.write",
          label: "Quotations Write",
          description: "Create and update quotation requests"
        },
        {
          name: "users.read",
          label: "Users Read",
          description: "View user accounts and profiles"
        },
        {
          name: "users.write",
          label: "Users Write",
          description: "Create and modify user accounts"
        }
      ]
    },
    advanced: {
      title: "Advanced/Optional Permissions",
      description: "Additional permissions for specific features and administrative tasks",
      icon: Activity,
      permissions: [
        {
          name: "products.delete",
          label: "Products Delete",
          description: "Permanently remove products from the system"
        },
        {
          name: "collections.delete",
          label: "Collections Delete",
          description: "Permanently remove collections"
        },
        {
          name: "analytics.write",
          label: "Analytics Write",
          description: "Create and modify analytics data and configurations"
        },
        {
          name: "quotations.delete",
          label: "Quotations Delete",
          description: "Permanently remove quotation requests"
        },
        {
          name: "users.approve",
          label: "Users Approve",
          description: "Approve or reject user registrations"
        },
        {
          name: "users.delete",
          label: "Users Delete",
          description: "Permanently remove user accounts"
        },
        {
          name: "webhooks.read",
          label: "Webhooks Read",
          description: "View webhook configurations and logs"
        },
        {
          name: "webhooks.write",
          label: "Webhooks Write",
          description: "Create and manage webhook endpoints"
        },
        {
          name: "webhooks.delete",
          label: "Webhooks Delete",
          description: "Remove webhook configurations"
        },
        {
          name: "orders.read",
          label: "Orders Read",
          description: "View order information and history"
        },
        {
          name: "orders.write",
          label: "Orders Write",
          description: "Create and modify orders"
        },
        {
          name: "orders.fulfill",
          label: "Orders Fulfill",
          description: "Process and fulfill customer orders"
        },
        {
          name: "orders.delete",
          label: "Orders Delete",
          description: "Permanently remove orders"
        },
        {
          name: "reports.read",
          label: "Reports Read",
          description: "Access detailed reports and analytics"
        },
        {
          name: "reports.write",
          label: "Reports Write",
          description: "Create and modify custom reports"
        },
        {
          name: "settings.read",
          label: "Settings Read",
          description: "View system configuration and settings"
        },
        {
          name: "settings.write",
          label: "Settings Write",
          description: "Modify system configuration and settings"
        },
        {
          name: "api-keys.read",
          label: "API Keys Read",
          description: "View API key information and statistics"
        },
        {
          name: "api-keys.write",
          label: "API Keys Write",
          description: "Create and manage API keys"
        },
        {
          name: "api-keys.delete",
          label: "API Keys Delete",
          description: "Revoke and delete API keys"
        },
        {
          name: "notifications.read",
          label: "Notifications Read",
          description: "View system notifications and alerts"
        },
        {
          name: "notifications.write",
          label: "Notifications Write",
          description: "Create and send notifications"
        },
        {
          name: "security.read",
          label: "Security Read",
          description: "View security events and audit logs"
        },
        {
          name: "security.write",
          label: "Security Write",
          description: "Manage security settings and policies"
        }
      ]
    }
  };

  // Helper functions for permission management
  const getEssentialPermissions = () => permissionCategories.essential.permissions.map(p => p.name);

  const handleSelectAllEssential = (checked: boolean) => {
    setSelectAllEssential(checked);
    const essentialPerms = getEssentialPermissions();

    if (checked) {
      // Add all essential permissions that aren't already selected
      const newPermissions = [...new Set([...newKeyPermissions, ...essentialPerms])];
      setNewKeyPermissions(newPermissions);
    } else {
      // Remove all essential permissions
      const filteredPermissions = newKeyPermissions.filter(p => !essentialPerms.includes(p));
      setNewKeyPermissions(filteredPermissions);
    }
  };

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    if (checked) {
      setNewKeyPermissions([...newKeyPermissions, permissionName]);
    } else {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permissionName));
    }

    // Update "Select All Essential" state
    const essentialPerms = getEssentialPermissions();
    const hasAllEssential = essentialPerms.every(p =>
      checked && permissionName === p ? true : newKeyPermissions.includes(p)
    );
    setSelectAllEssential(hasAllEssential);
  };

  const resetCreateForm = () => {
    setNewKeyName("");
    setNewKeyPermissions([]);
    setSelectAllEssential(false);
  };

  return (
    <ProtectedRoute requiredPermission="api_keys.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
              <p className="text-muted-foreground">
                Manage API keys for external integrations and access control
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Usage
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>

              <Modal
                open={showCreateDialog}
                onOpenChange={(open) => {
                  setShowCreateDialog(open);
                  if (!open) resetCreateForm();
                }}
                className="w-[95vw] max-w-6xl"
              >
                <ModalContent
                  className="w-full max-h-[95vh] overflow-hidden flex flex-col"
                  showCloseButton={true}
                  onClose={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
                  }}
                >
                  <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                      {isCreatingKey && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create New API Key
                    </ModalTitle>
                    <ModalDescription>
                      Generate a new API key with specific permissions and access levels
                    </ModalDescription>
                  </ModalHeader>

                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="space-y-10">
                      <FormSection
                        title="Basic Information"
                        description="Provide a name for your API key to help identify its purpose"
                      >
                        <FormField
                          label="API Key Name"
                          description="Choose a descriptive name like 'Production API' or 'Mobile App'"
                          required
                        >
                          <Input
                            placeholder="e.g., Production API, Mobile App"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </FormField>
                      </FormSection>

                <FormSection
                  title="API Permissions"
                  description="Configure access levels and permissions for your API key. Choose from essential permissions for core functionality or advanced permissions for specialized features."
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Essential Permissions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-900">{permissionCategories.essential.title}</h4>
                            <p className="text-sm text-blue-700">Recommended for most applications</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-blue-600 hover:text-blue-800 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{permissionCategories.essential.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="select-all-essential"
                            checked={selectAllEssential}
                            onChange={(e) => handleSelectAllEssential(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <Label htmlFor="select-all-essential" className="text-sm font-medium text-blue-800 cursor-pointer">
                            Select All
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {permissionCategories.essential.permissions.map((permission) => (
                          <div key={permission.name} className="group bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                id={permission.name}
                                checked={newKeyPermissions.includes(permission.name)}
                                onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={permission.name} className="text-sm font-semibold text-blue-900 cursor-pointer group-hover:text-blue-700 transition-colors">
                                  {permission.label}
                                </Label>
                                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Permissions Section */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-900">{permissionCategories.advanced.title}</h4>
                            <p className="text-sm text-orange-700">For specialized features and admin tasks</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-orange-600 hover:text-orange-800 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{permissionCategories.advanced.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {permissionCategories.advanced.permissions.map((permission) => (
                          <div key={permission.name} className="group bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition-all duration-200">
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                id={permission.name}
                                checked={newKeyPermissions.includes(permission.name)}
                                onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                                className="mt-1 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={permission.name} className="text-sm font-semibold text-orange-900 cursor-pointer group-hover:text-orange-700 transition-colors">
                                  {permission.label}
                                </Label>
                                <p className="text-xs text-orange-600 mt-1 leading-relaxed">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selected Permissions Summary */}
                  {newKeyPermissions.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <h5 className="font-medium text-gray-900 mb-3">Selected Permissions ({newKeyPermissions.length})</h5>
                      <div className="flex flex-wrap gap-2">
                        {newKeyPermissions.map((permission) => (
                          <div key={permission} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                            <Shield className="h-3 w-3" />
                            {permission}
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                  </FormSection>
                    </div>
                  </div>

                  <ModalFooter>
                    <div className="flex items-center justify-between w-full">
                      <div className="text-sm text-muted-foreground">
                        {newKeyPermissions.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            {newKeyPermissions.length} permission{newKeyPermissions.length !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          "No permissions selected"
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateDialog(false);
                            resetCreateForm();
                          }}
                          disabled={isCreatingKey}
                          className="px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateApiKey}
                          disabled={!newKeyName.trim() || isCreatingKey}
                          className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isCreatingKey ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating API Key...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Create API Key
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold">{apiKeys?.length || 0}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {apiKeys?.filter((key: any) => key.isActive).length || 0}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-blue-600">
                    {apiKeys?.reduce((sum: number, key: any) => sum + (key.usageCount || 0), 0).toLocaleString() || '0'}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expired Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeysLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-red-600">
                    {apiKeys?.filter((key: any) => key.expiresAt && key.expiresAt < Date.now()).length || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys and monitor their usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search API keys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Keys</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeysLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-muted-foreground">Loading API keys...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : apiKeysError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-red-600">
                            Failed to load API keys. Please try again.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (apiKeys || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-muted-foreground">
                            No API keys found. Create your first API key to get started.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (apiKeys || [])
                        .filter((key: any) =>
                          !searchTerm ||
                          key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          key.key.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .filter((key: any) => statusFilter === "all" ||
                          (statusFilter === "active" && key.isActive) ||
                          (statusFilter === "inactive" && !key.isActive)
                        )
                        .map((apiKey: any) => (
                      <TableRow key={apiKey.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{apiKey.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Created {formatDate(apiKey.createdAt)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-0">
                          <SecureApiKeyDisplay
                            apiKey={apiKey.key}
                            keyId={apiKey.keyId}
                            apiKeyDocId={apiKey.id}
                            placeholder="••••••••••••••••••••••••••••••••"
                            allowImmediateAccess={recentlyCreatedKeys.has(apiKey.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {apiKey.permissions.slice(0, 2).map((permission: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {apiKey.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{apiKey.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{apiKey.usageCount.toLocaleString()}</div>
                            <div className="text-muted-foreground">requests</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {apiKey.isActive ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {apiKey.expiresAt && apiKey.expiresAt < Date.now() && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : 'Never'}
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(apiKey)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => handleRevokeApiKey(apiKey.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteApiKey(apiKey.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permanently
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
                  Showing {(apiKeys || []).filter((key: any) =>
                    (!searchTerm ||
                     key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     key.key.toLowerCase().includes(searchTerm.toLowerCase())) &&
                    (statusFilter === "all" ||
                     (statusFilter === "active" && key.isActive) ||
                     (statusFilter === "inactive" && !key.isActive))
                  ).length} API keys
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
                    disabled={(apiKeys?.length || 0) < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Details Dialog */}
          <DetailDialog
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            title="API Key Details"
            subtitle={`Complete information for ${selectedApiKey?.name || 'API Key'}`}
            size="3xl"
            actions={
              <>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  onClick={() => {
                    if (selectedApiKey) {
                      handleRevokeApiKey(selectedApiKey.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Key
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedApiKey) {
                      handleDeleteApiKey(selectedApiKey.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </>
            }
          >
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex items-center gap-2">
                {selectedApiKey?.isActive ? (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {selectedApiKey?.expiresAt && selectedApiKey?.expiresAt < Date.now() && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>

              {/* API Key Information and Rate Limits */}
              <DetailSection title="Basic Information" columns={2}>
                <DetailField
                  label="Name"
                  value={selectedApiKey?.name}
                />
                <DetailField
                  label="Created"
                  value={selectedApiKey?.createdAt ? formatDate(selectedApiKey?.createdAt) : 'N/A'}
                />
                <DetailField
                  label="Last Used"
                  value={selectedApiKey?.lastUsedAt ? formatDate(selectedApiKey?.lastUsedAt) : 'Never'}
                />
                <DetailField
                  label="Usage Count"
                  value={selectedApiKey?.usageCount?.toLocaleString() || 0}
                />
                {selectedApiKey?.expiresAt && (
                  <DetailField
                    label="Expires"
                    value={formatDate(selectedApiKey?.expiresAt)}
                  />
                )}
                <DetailField
                  label="Rate Limit (Per Minute)"
                  value={selectedApiKey?.rateLimit?.requestsPerMinute || 'N/A'}
                />
                <DetailField
                  label="Rate Limit (Per Hour)"
                  value={selectedApiKey?.rateLimit?.requestsPerHour || 'N/A'}
                />
                <DetailField
                  label="Rate Limit (Per Day)"
                  value={selectedApiKey?.rateLimit?.requestsPerDay || 'N/A'}
                />
              </DetailSection>

              {/* API Key Field */}
              <DetailSection title="API Key">
                <SecureApiKeyField
                  label="API Key"
                  apiKey={selectedApiKey?.key || ''}
                  keyId={selectedApiKey?.keyId || ''}
                  apiKeyDocId={selectedApiKey?.id}
                  description="This API key provides access to your account. Keep it secure and never share it publicly."
                />
              </DetailSection>

              {/* Permissions */}
              <DetailSection title="Permissions">
                <div className="flex flex-wrap gap-2">
                  {selectedApiKey?.permissions?.map((permission: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      {permission}
                    </Badge>
                  ))}
                </div>
              </DetailSection>

              {/* Usage Statistics */}
              <DetailSection title="Usage Statistics" columns={3}>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedApiKey?.usageCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-blue-600">Total Requests</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedApiKey?.isActive ? '100%' : '0%'}
                  </div>
                  <div className="text-xs text-green-600">Uptime</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedApiKey?.lastUsedAt ?
                      Math.round((Date.now() - selectedApiKey.lastUsedAt) / (1000 * 60 * 60)) : 'N/A'
                    }h
                  </div>
                  <div className="text-xs text-purple-600">Since Last Use</div>
                </div>
              </DetailSection>
            </div>
          </DetailDialog>

          {/* Revoke Confirmation Dialog */}
          <ConfirmDialog
            open={showRevokeConfirm}
            onOpenChange={setShowRevokeConfirm}
            title="Revoke API Key"
            description="Are you sure you want to revoke this API key? This will disable the key but keep it in the database for audit purposes. The key can be viewed but not used for API requests."
            confirmText="Revoke Key"
            cancelText="Cancel"
            variant="destructive"
            loading={isRevoking}
            onConfirm={confirmRevokeApiKey}
            onCancel={() => {
              setShowRevokeConfirm(false);
              setApiKeyToRevoke(null);
            }}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete API Key Permanently"
            description="Are you sure you want to permanently delete this API key? This action cannot be undone and will completely remove the key from the database. All audit logs will be preserved, but the key itself will be gone forever."
            confirmText="Delete Permanently"
            cancelText="Cancel"
            variant="destructive"
            loading={isDeleting}
            onConfirm={confirmDeleteApiKey}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setApiKeyToDelete(null);
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
