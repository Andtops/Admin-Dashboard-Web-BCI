"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter
} from "@/components/ui/modal";
// Remove the problematic import for now
import {
  Search,
  MoreHorizontal,
  Eye,
  Grid3X3,
  Package,
  Plus,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  Tag,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Enhanced form components are now inline to avoid import issues

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const pageSize = 20;

  const { admin } = useAuth();

  // Queries
  const collections = useQuery(api.collections.getCollections, {
    search: searchTerm || undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const collectionStats = useQuery(api.collections.getCollectionStats);

  // Mutations
  const createCollection = useMutation(api.collections.createCollection);
  const updateCollection = useMutation(api.collections.updateCollection);
  const deleteCollection = useMutation(api.collections.deleteCollection);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  // Collection creation/editing state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);

  const [newCollection, setNewCollection] = useState({
    title: "",
    description: "",
    handle: "",
    status: "active" as "active" | "inactive",
    isVisible: true,
    seoTitle: "",
    seoDescription: "",
    sortOrder: "",
  });

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form function
  const resetForm = () => {
    setNewCollection({
      title: "",
      description: "",
      handle: "",
      status: "active",
      isVisible: true,
      seoTitle: "",
      seoDescription: "",
      sortOrder: "",
    });
    setValidationErrors({});
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openDetailsDialog = (collection: any) => {
    setSelectedCollection(collection);
    setShowDetailsDialog(true);
  };

  // Generate URL-friendly handle from title
  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle collection creation
  const handleCreateCollection = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    if (!admin) {
      toast.error("Authentication required");
      return;
    }

    // Enhanced validation
    const errors: Record<string, string> = {};

    if (!newCollection.title.trim()) {
      errors.title = "Collection title is required";
    }

    if (newCollection.title.trim().length < 2) {
      errors.title = "Collection title must be at least 2 characters";
    }

    // Handle validation removed since it's auto-generated and always valid

    if (newCollection.seoTitle.length > 60) {
      errors.seoTitle = "SEO title must be 60 characters or less";
    }

    if (newCollection.seoDescription.length > 160) {
      errors.seoDescription = "SEO description must be 160 characters or less";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    setIsCreatingCollection(true);
    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });

      const collectionData = {
        collectionId: `col_${Date.now()}`,
        title: newCollection.title.trim(),
        description: newCollection.description.trim() || undefined,
        handle: newCollection.handle.trim() || generateHandle(newCollection.title),
        status: newCollection.status,
        isVisible: newCollection.isVisible,
        seoTitle: newCollection.seoTitle.trim() || undefined,
        seoDescription: newCollection.seoDescription.trim() || undefined,
        sortOrder: newCollection.sortOrder ? parseInt(newCollection.sortOrder) : undefined,
        adminId,
      };

      await createCollection(collectionData);

      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      toast.success("Collection created successfully");
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create collection");
    } finally {
      setIsCreatingCollection(false);
    }
  };

  // Handle collection editing
  const openEditDialog = (collection: any) => {
    setSelectedCollection(collection);
    setNewCollection({
      title: collection.title,
      description: collection.description || "",
      handle: collection.handle,
      status: collection.status,
      isVisible: collection.isVisible,
      seoTitle: collection.seoTitle || "",
      seoDescription: collection.seoDescription || "",
      sortOrder: collection.sortOrder?.toString() || "",
    });
    setShowEditDialog(true);
  };

  // Handle collection update
  const handleUpdateCollection = async () => {
    if (!admin || !selectedCollection) {
      toast.error("Authentication required");
      return;
    }

    if (!newCollection.title.trim()) {
      toast.error("Collection title is required");
      return;
    }

    setIsUpdatingCollection(true);
    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });

      const updateData = {
        id: selectedCollection._id,
        title: newCollection.title.trim(),
        description: newCollection.description.trim() || undefined,
        handle: newCollection.handle.trim() || generateHandle(newCollection.title),
        status: newCollection.status,
        isVisible: newCollection.isVisible,
        seoTitle: newCollection.seoTitle.trim() || undefined,
        seoDescription: newCollection.seoDescription.trim() || undefined,
        sortOrder: newCollection.sortOrder ? parseInt(newCollection.sortOrder) : undefined,
        adminId,
      };

      await updateCollection(updateData);

      setShowEditDialog(false);
      setSelectedCollection(null);
      toast.success("Collection updated successfully");
    } catch (error) {
      console.error("Failed to update collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update collection");
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  // Handle collection deletion
  const handleDeleteCollection = async (collection: any) => {
    if (!admin) {
      toast.error("Authentication required");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${collection.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingCollection(true);
    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });
      await deleteCollection({ id: collection._id, adminId });
      toast.success("Collection deleted successfully");
    } catch (error) {
      console.error("Failed to delete collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete collection");
    } finally {
      setIsDeletingCollection(false);
    }
  };



  return (
    <ProtectedRoute requiredPermission="products.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Collections</h1>
              <p className="text-muted-foreground">
                Organize and manage product collections and categories
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Collections
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collectionStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {collectionStats?.active || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {collectionStats?.totalProducts || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Products/Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {collectionStats?.avgProductsPerCollection || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
              <CardDescription>
                Manage your product collections and categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search collections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections && collections.length > 0 ? (
                      collections.map((collection) => (
                        <TableRow key={collection._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                                <Grid3X3 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">{collection.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {collection.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{collection.productCount || 0}</span>
                              <span className="text-sm text-muted-foreground">products</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {collection.handle}
                              </Badge>
                              {collection.isVisible && (
                                <Badge variant="outline" className="text-xs">
                                  Visible
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {collection.status === "active" ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(collection.updatedAt)}
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
                                <DropdownMenuItem onClick={() => openDetailsDialog(collection)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Collection
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteCollection(collection)}
                                  disabled={isDeletingCollection}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Collection
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">No collections found</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Create your first collection to get started
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {collections?.length || 0} collections
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
                    disabled={!collections || collections.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Collection Details Modal */}
          <Modal
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            className="w-[95vw] max-w-5xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => setShowDetailsDialog(false)}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Collection Details
                </ModalTitle>
                <ModalDescription>
                  Complete information for {selectedCollection?.title}
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selectedCollection && (
                  <div className="space-y-8">
                    {/* Collection Header */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Grid3X3 className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-xl">{selectedCollection.title}</h3>
                          <p className="text-muted-foreground text-base mt-2 leading-relaxed">
                            {selectedCollection.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-3 mt-4">
                            {selectedCollection.status === "active" ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Badge variant="outline" className="border-blue-200 text-blue-700">
                              <Package className="h-3 w-3 mr-1" />
                              {selectedCollection.productCount || 0} products
                            </Badge>
                            {selectedCollection.isVisible && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Visible in Navigation
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          Basic Information
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Collection Title</label>
                            <div className="text-base font-medium">{selectedCollection.title}</div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Handle</label>
                            <div className="text-base font-mono text-muted-foreground">
                              {selectedCollection.handle || 'Not set'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                            <div className="text-base">
                              {selectedCollection.createdAt ? formatDate(selectedCollection.createdAt) : 'N/A'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                            <div className="text-base">
                              {selectedCollection.updatedAt ? formatDate(selectedCollection.updatedAt) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        {selectedCollection.description && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <div className="text-base leading-relaxed p-4 bg-muted/30 rounded-lg">
                              {selectedCollection.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Collection Settings */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          Collection Settings
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div>
                              {selectedCollection.status === "active" ? (
                                <Badge variant="default" className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                            <div className="text-base">{selectedCollection.sortOrder || 'Not set'}</div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                            <div>
                              {selectedCollection.isVisible ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Visible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO Information */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          SEO Information
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">SEO Title</label>
                            <div className="text-base">
                              {selectedCollection.seoTitle || (
                                <span className="text-muted-foreground italic">Not set (defaults to collection title)</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">SEO Description</label>
                            <div className="text-base">
                              {selectedCollection.seoDescription || (
                                <span className="text-muted-foreground italic">Not set</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collection Statistics */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          Collection Statistics
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {selectedCollection.productCount || 0}
                            </div>
                            <div className="text-sm font-medium text-blue-700">Total Products</div>
                            <div className="text-xs text-blue-600 mt-1">
                              Products in this collection
                            </div>
                          </div>
                          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {selectedCollection.status === 'active' ? '100%' : '0%'}
                            </div>
                            <div className="text-sm font-medium text-green-700">Active Rate</div>
                            <div className="text-xs text-green-600 mt-1">
                              Collection availability
                            </div>
                          </div>
                          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                              {selectedCollection.isVisible ? 'Yes' : 'No'}
                            </div>
                            <div className="text-sm font-medium text-purple-700">Navigation Visible</div>
                            <div className="text-xs text-purple-600 mt-1">
                              Shown in main navigation
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    openEditDialog(selectedCollection);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Collection
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Create Collection Modal */}
          <Modal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) {
                resetForm();
              }
            }}
            className="w-[95vw] max-w-4xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  {isCreatingCollection && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create New Collection
                </ModalTitle>
                <ModalDescription>
                  Add a new collection to organize your products and improve navigation
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                      Basic Information
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                      Essential collection details and identification
                    </p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Collection Title
                            <span className="text-destructive ml-1" aria-hidden="true">*</span>
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The main name of your collection
                          </p>
                        </div>
                        <Input
                          placeholder="Enter collection title"
                          value={newCollection.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            setNewCollection(prev => ({
                              ...prev,
                              title,
                              // Always auto-generate handle from title
                              handle: generateHandle(title)
                            }));
                            // Clear validation error when user starts typing
                            if (validationErrors.title) {
                              setValidationErrors(prev => ({ ...prev, title: "" }));
                            }
                          }}
                          className={`transition-all focus:ring-2 focus:ring-primary/20 ${
                            validationErrors.title ? "border-red-500 focus:border-red-500" : ""
                          }`}
                        />
                        {validationErrors.title && (
                          <p className="text-xs text-destructive leading-relaxed" role="alert" aria-live="polite">
                            {validationErrors.title}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Handle
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            URL-friendly identifier (auto-generated from title)
                          </p>
                        </div>
                        <Input
                          placeholder="collection-handle"
                          value={newCollection.handle}
                          disabled
                          readOnly
                          className="transition-all bg-muted/50 cursor-not-allowed text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                      <div className="space-y-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                          Description
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Brief description of what this collection contains
                        </p>
                      </div>
                      <Textarea
                        placeholder="Enter collection description"
                        value={newCollection.description}
                        onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Settings */}
                <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                      Collection Settings
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                      Configure visibility, status, and ordering preferences
                    </p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Status
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Control whether this collection is active or inactive
                          </p>
                        </div>
                        <Select
                          value={newCollection.status}
                          onValueChange={(value: "active" | "inactive") =>
                            setNewCollection(prev => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Sort Order
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Numeric value for ordering collections (optional)
                          </p>
                        </div>
                        <Input
                          type="number"
                          placeholder="1"
                          value={newCollection.sortOrder}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, sortOrder: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          min="0"
                          step="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                      <div className="space-y-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                          Visibility Settings
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Control where this collection appears
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg bg-muted/20">
                        <Switch
                          checked={newCollection.isVisible}
                          onCheckedChange={(checked) => setNewCollection(prev => ({ ...prev, isVisible: checked }))}
                          className="transition-all"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">Visible in navigation</div>
                          <div className="text-xs text-muted-foreground">
                            Show this collection in the main navigation menu
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO Settings */}
                <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                      SEO Settings
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                      Optimize your collection for search engines (optional)
                    </p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            SEO Title
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Custom title for search engines (defaults to collection title)
                          </p>
                        </div>
                        <Input
                          placeholder="SEO optimized title"
                          value={newCollection.seoTitle}
                          onChange={(e) => {
                            setNewCollection(prev => ({ ...prev, seoTitle: e.target.value }));
                            // Clear validation error when user starts typing
                            if (validationErrors.seoTitle) {
                              setValidationErrors(prev => ({ ...prev, seoTitle: "" }));
                            }
                          }}
                          className={`transition-all focus:ring-2 focus:ring-primary/20 ${
                            validationErrors.seoTitle ? "border-red-500 focus:border-red-500" : ""
                          }`}
                          maxLength={60}
                        />
                        <div className={`text-xs mt-1 ${
                          newCollection.seoTitle.length > 50 ? "text-orange-500" : "text-muted-foreground"
                        }`}>
                          {newCollection.seoTitle.length}/60 characters
                        </div>
                        {validationErrors.seoTitle && (
                          <p className="text-xs text-destructive leading-relaxed" role="alert" aria-live="polite">
                            {validationErrors.seoTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            SEO Description
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Meta description for search engine results
                          </p>
                        </div>
                        <Textarea
                          placeholder="Brief description for search engines"
                          value={newCollection.seoDescription}
                          onChange={(e) => {
                            setNewCollection(prev => ({ ...prev, seoDescription: e.target.value }));
                            // Clear validation error when user starts typing
                            if (validationErrors.seoDescription) {
                              setValidationErrors(prev => ({ ...prev, seoDescription: "" }));
                            }
                          }}
                          rows={3}
                          className={`transition-all focus:ring-2 focus:ring-primary/20 ${
                            validationErrors.seoDescription ? "border-red-500 focus:border-red-500" : ""
                          }`}
                          maxLength={160}
                        />
                        <div className={`text-xs mt-1 ${
                          newCollection.seoDescription.length > 140 ? "text-orange-500" : "text-muted-foreground"
                        }`}>
                          {newCollection.seoDescription.length}/160 characters
                        </div>
                        {validationErrors.seoDescription && (
                          <p className="text-xs text-destructive leading-relaxed" role="alert" aria-live="polite">
                            {validationErrors.seoDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={isCreatingCollection}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCollection}
                  disabled={!newCollection.title.trim() || isCreatingCollection}
                  className="transition-all"
                >
                  {isCreatingCollection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Collection...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Collection
                    </>
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Edit Collection Modal */}
          <Modal
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) {
                setSelectedCollection(null);
              }
            }}
            className="w-[95vw] max-w-4xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedCollection(null);
              }}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  {isUpdatingCollection && <Loader2 className="h-4 w-4 animate-spin" />}
                  Edit Collection
                </ModalTitle>
                <ModalDescription>
                  Update collection information and settings
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                        Basic Information
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                        Essential collection details and identification
                      </p>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              Collection Title
                              <span className="text-destructive ml-1" aria-hidden="true">*</span>
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              The main name of your collection
                            </p>
                          </div>
                          <Input
                            placeholder="Enter collection title"
                            value={newCollection.title}
                            onChange={(e) => {
                              const title = e.target.value;
                              setNewCollection(prev => ({
                                ...prev,
                                title,
                                // Always auto-generate handle from title
                                handle: generateHandle(title)
                              }));
                            }}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              Handle
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              URL-friendly identifier (auto-generated from title)
                            </p>
                          </div>
                          <Input
                            placeholder="collection-handle"
                            value={newCollection.handle}
                            disabled
                            readOnly
                            className="transition-all bg-muted/50 cursor-not-allowed text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Description
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Brief description of what this collection contains
                          </p>
                        </div>
                        <Textarea
                          placeholder="Enter collection description"
                          value={newCollection.description}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collection Settings */}
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                        Collection Settings
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                        Configure visibility, status, and ordering preferences
                      </p>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              Status
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Control whether this collection is active or inactive
                            </p>
                          </div>
                          <Select
                            value={newCollection.status}
                            onValueChange={(value: "active" | "inactive") =>
                              setNewCollection(prev => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              Sort Order
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Numeric value for ordering collections (optional)
                            </p>
                          </div>
                          <Input
                            type="number"
                            placeholder="1"
                            value={newCollection.sortOrder}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, sortOrder: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            min="0"
                            step="1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                        <div className="space-y-1">
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                            Visibility Settings
                          </label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Control where this collection appears
                          </p>
                        </div>
                        <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg bg-muted/20">
                          <Switch
                            checked={newCollection.isVisible}
                            onCheckedChange={(checked) => setNewCollection(prev => ({ ...prev, isVisible: checked }))}
                            className="transition-all"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Visible in navigation</div>
                            <div className="text-xs text-muted-foreground">
                              Show this collection in the main navigation menu
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Settings */}
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                        SEO Settings
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
                        Optimize your collection for search engines (optional)
                      </p>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              SEO Title
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Custom title for search engines (defaults to collection title)
                            </p>
                          </div>
                          <Input
                            placeholder="SEO optimized title"
                            value={newCollection.seoTitle}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, seoTitle: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            maxLength={60}
                          />
                          <div className={`text-xs mt-1 ${
                            newCollection.seoTitle.length > 50 ? "text-orange-500" : "text-muted-foreground"
                          }`}>
                            {newCollection.seoTitle.length}/60 characters
                          </div>
                        </div>

                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200">
                              SEO Description
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Meta description for search engine results
                            </p>
                          </div>
                          <Textarea
                            placeholder="Brief description for search engines"
                            value={newCollection.seoDescription}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, seoDescription: e.target.value }))}
                            rows={3}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                            maxLength={160}
                          />
                          <div className={`text-xs mt-1 ${
                            newCollection.seoDescription.length > 140 ? "text-orange-500" : "text-muted-foreground"
                          }`}>
                            {newCollection.seoDescription.length}/160 characters
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedCollection(null);
                  }}
                  disabled={isUpdatingCollection}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCollection}
                  disabled={!newCollection.title.trim() || isUpdatingCollection}
                  className="transition-all"
                >
                  {isUpdatingCollection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Collection...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Collection
                    </>
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
