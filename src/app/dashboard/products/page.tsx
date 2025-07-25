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
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  EnhancedDialog,
  FormSection,
  FormField,
} from "@/components/ui/enhanced-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Star,
  Package,
  Plus,
  Download,
  RefreshCw,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Link,
  Camera,
  Trash2,
  Wand2,
  MessageSquare
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RemoveBgUpload } from "@/components/ui/remove-bg-upload";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { StarDisplay } from "@/components/ui/star-rating";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const pageSize = 20;

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    casNumber: "",
    molecularFormula: "",
    molecularWeight: "",
    purity: "",
    hsnNumber: "",
    appearance: "",
    solubility: "",
    phValue: "",
    chemicalName: "",
    packaging: "",
    features: "",
    applications: "",
    status: "active",
    featured: false,
    quantity: "", // Available quantity for sale
    images: [] as string[],
    collections: [] as string[], // Array of collection IDs
  });

  // Edit Product Form State
  const [editProduct, setEditProduct] = useState({
    title: "",
    description: "",
    casNumber: "",
    molecularFormula: "",
    molecularWeight: "",
    purity: "",
    hsnNumber: "",
    appearance: "",
    solubility: "",
    phValue: "",
    chemicalName: "",
    packaging: "",
    features: "",
    applications: "",
    status: "active",
    featured: false,
    quantity: "", // Available quantity for sale
    images: [] as string[],
    collections: [] as string[], // Array of collection IDs
  });

  
  const { admin } = useAuth();

  
  // Queries
  const products = useQuery(api.products.getProducts, {
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const productStats = useQuery(api.products.getProductStats);
  const activeCollections = useQuery(api.collections.getActiveCollections);

  // Mutations
  const toggleFeatured = useMutation(api.products.toggleProductFeatured);
  const updateStatus = useMutation(api.products.updateProductStatus);
  const createProduct = useMutation(api.products.createProduct);
  const upsertProduct = useMutation(api.products.upsertProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);
  const createSampleCollections = useMutation(api.collections.createSampleCollections);

  // Initialize collections if none exist
  const initializeCollections = async () => {
    if (!admin) return;

    try {
      const adminId = await getOrCreateAdmin({ email: admin.email });
      await createSampleCollections({ adminId });
      toast.success("Sample collections created successfully");
    } catch (error) {
      console.error("Failed to create sample collections:", error);
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    if (!admin) return;

    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await toggleFeatured({
        productId: productId as any,
        adminId: adminId,
      });
      toast.success("Product featured status updated");
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  const handleUpdateStatus = async (productId: string, status: string) => {
    if (!admin) return;

    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await updateStatus({
        productId: productId as any,
        status: status as any,
        adminId: adminId,
      });
      toast.success("Product status updated");
    } catch (error) {
      toast.error("Failed to update product status");
      console.error(error);
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  // Handle confirming product deletion
  const confirmDeleteProduct = async () => {
    if (!admin || !productToDelete) return;

    setIsDeletingProduct(true);
    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await deleteProduct({
        productId: productToDelete._id,
        adminId: adminId,
      });

      toast.success("Product deleted successfully");
      setShowDeleteDialog(false);
      setProductToDelete(null);

      // Close other dialogs if they're showing the deleted product
      if (selectedProduct?._id === productToDelete._id) {
        setShowViewDialog(false);
        setShowEditDialog(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
      console.error(error);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Handle opening view details modal
  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowViewDialog(true);
  };

  // Handle opening edit product modal
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);

    // Populate edit form with product data
    setEditProduct({
      title: product.title || "",
      description: product.description || "",
      casNumber: product.casNumber || "",
      molecularFormula: product.molecularFormula || "",
      molecularWeight: product.molecularWeight || "",
      purity: product.purity || "",
      hsnNumber: product.hsnNumber || "",
      appearance: product.appearance || "",
      solubility: product.solubility || "",
      phValue: product.phValue || "",
      chemicalName: product.chemicalName || "",
      packaging: product.packaging || "",
      features: product.features ? product.features.join(", ") : "",
      applications: product.applications ? product.applications.join(", ") : "",
      status: product.status || "active",
      featured: product.featured || false,
      quantity: typeof product.quantity === 'number' ? product.quantity : 0,
      images: product.images ? product.images.map((img: any) => img.url) : [],
      collections: product.collections || [],
    });

    setShowEditDialog(true);
  };

  // Handle updating product
  const handleUpdateProduct = async () => {
    if (!admin || !selectedProduct) return;

    setIsUpdatingProduct(true);
    try {
      // Enhanced validation
      if (!editProduct.title.trim()) {
        toast.error("Product title is required");
        setIsUpdatingProduct(false);
        return;
      }

      // Check if description has meaningful content (not just empty HTML tags)
      const descriptionText = editProduct.description.replace(/<[^>]*>/g, '').trim();
      if (!descriptionText) {
        toast.error("Product description is required");
        setIsUpdatingProduct(false);
        return;
      }

      // Validate image URLs and data size
      const invalidImages = editProduct.images.filter(img => {
        if (!img.trim()) return false;
        // Skip validation for data URLs (base64 images)
        if (img.startsWith('data:')) return false;
        try {
          new URL(img);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidImages.length > 0) {
        toast.error("Please check image URLs - some appear to be invalid");
        setIsUpdatingProduct(false);
        return;
      }

      // Prepare product data for update
      const productData = {
        productId: selectedProduct.productId || selectedProduct._id,
        title: editProduct.title.trim(),
        description: editProduct.description,
        descriptionHtml: editProduct.description, // For rich text content
        casNumber: editProduct.casNumber.trim() || undefined,
        molecularFormula: editProduct.molecularFormula.trim() || undefined,
        molecularWeight: editProduct.molecularWeight.trim() || undefined,
        purity: editProduct.purity || undefined,
        hsnNumber: editProduct.hsnNumber.trim() || undefined,
        appearance: editProduct.appearance.trim() || undefined,
        solubility: editProduct.solubility.trim() || undefined,
        phValue: editProduct.phValue || undefined,
        chemicalName: editProduct.chemicalName.trim() || undefined,
        packaging: editProduct.packaging.trim() || undefined,
        features: editProduct.features.trim() ? editProduct.features.split(',').map(f => f.trim()) : undefined,
        applications: editProduct.applications.trim() ? editProduct.applications.split(',').map(a => a.trim()) : undefined,
        collections: editProduct.collections, // Array of collection IDs
        images: editProduct.images
          .filter(img => img.trim())
          .map(url => ({ url: url.trim() })),
        status: editProduct.status as any,
        featured: editProduct.featured,
        quantity: parseInt(editProduct.quantity) || 0,
        tags: [], // Add tags if needed
        // Include priceRange from existing product or default values
        priceRange: selectedProduct.priceRange || {
          minVariantPrice: { amount: "0", currencyCode: "INR" },
          maxVariantPrice: { amount: "0", currencyCode: "INR" },
        },
      };

      // Check total data size before submission
      const dataSize = JSON.stringify(productData).length;
      if (dataSize > 900000) { // 900KB limit (leaving buffer for Convex overhead)
        toast.error("Product data is too large. Please reduce image sizes or use fewer images.");
        setIsUpdatingProduct(false);
        return;
      }

      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await upsertProduct({
        ...productData,
        adminId: adminId,
      });

      toast.success("Product updated successfully");
      setShowEditDialog(false);
      setSelectedProduct(null);

    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleAddProduct = async () => {
    if (!admin) return;

    setIsCreatingProduct(true);
    try {
      // Enhanced validation
      if (!newProduct.title.trim()) {
        toast.error("Product title is required");
        setIsCreatingProduct(false);
        return;
      }

      // Check if description has meaningful content (not just empty HTML tags)
      const descriptionText = newProduct.description.replace(/<[^>]*>/g, '').trim();
      if (!descriptionText) {
        toast.error("Product description is required");
        setIsCreatingProduct(false);
        return;
      }

      // Validate image URLs and data size
      const invalidImages = newProduct.images.filter(img => {
        if (!img.trim()) return false;
        // Skip validation for data URLs (base64 images)
        if (img.startsWith('data:')) return false;
        try {
          new URL(img);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidImages.length > 0) {
        toast.error("Please check image URLs - some appear to be invalid");
        setIsCreatingProduct(false);
        return;
      }

      // Check total data size before submission
      const productData = {
        productId: `prod_${Date.now()}`,
        title: newProduct.title.trim(),
        description: newProduct.description,
        casNumber: newProduct.casNumber.trim() || undefined,
        molecularFormula: newProduct.molecularFormula.trim() || undefined,
        molecularWeight: newProduct.molecularWeight.trim() || undefined,
        purity: newProduct.purity || undefined,
        hsnNumber: newProduct.hsnNumber.trim() || undefined,
        appearance: newProduct.appearance.trim() || undefined,
        solubility: newProduct.solubility.trim() || undefined,
        phValue: newProduct.phValue || undefined,
        chemicalName: newProduct.chemicalName.trim() || undefined,
        packaging: newProduct.packaging.trim() || undefined,
        features: newProduct.features.trim() ? newProduct.features.split(',').map(f => f.trim()) : undefined,
        applications: newProduct.applications.trim() ? newProduct.applications.split(',').map(a => a.trim()) : undefined,
        collections: newProduct.collections, // Array of collection IDs
        images: newProduct.images
          .filter(img => img.trim())
          .map(url => ({ url: url.trim() })),
        status: newProduct.status as any,
        featured: newProduct.featured,
        quantity: parseInt(newProduct.quantity) || 0,
      };

      const dataSize = JSON.stringify(productData).length;
      if (dataSize > 900000) { // 900KB limit (leaving buffer for Convex overhead)
        toast.error("Product data is too large. Please reduce image sizes or use fewer images.");
        setIsCreatingProduct(false);
        return;
      }

      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await createProduct({
        ...productData,
        adminId: adminId,
      });

      toast.success("Product created successfully");
      setShowAddDialog(false);

      // Reset form and upload states
      setNewProduct({
        title: "",
        description: "", // Will be empty HTML
        casNumber: "",
        molecularFormula: "",
        molecularWeight: "",
        purity: "",
        hsnNumber: "",
        appearance: "",
        solubility: "",
        phValue: "",
        chemicalName: "",
        packaging: "",
        features: "",
        applications: "",
        status: "active",
        featured: false,
        quantity: "0",
        images: [],
        collections: [],
      });

      // Reset upload states - handled by RemoveBgUpload component
    } catch (error) {
      toast.error("Failed to create product");
      console.error(error);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refetch by updating search term temporarily
      const currentSearch = searchTerm;
      setSearchTerm("");
      setTimeout(() => {
        setSearchTerm(currentSearch);
        setIsRefreshing(false);
        toast.success("Products refreshed");
      }, 500);
    } catch (error) {
      setIsRefreshing(false);
      toast.error("Failed to refresh products");
    }
  };

  const handleExport = async () => {
    if (!products || products.length === 0) {
      toast.error("No products to export");
      return;
    }

    setIsExporting(true);
    try {
      // Prepare CSV data
      const csvHeaders = [
        "Product ID",
        "Title",
        "Description",
        "CAS Number",
        "Molecular Formula",
        "Molecular Weight",
        "Purity",
        "pH Value",
        "Appearance",
        "Solubility",
        "Status",
        "Featured",
        "Created Date",
        "Updated Date"
      ];

      const csvData = products.map(product => [
        product.productId || product._id,
        product.title,
        product.description || "",
        product.casNumber || "",
        product.molecularFormula || "",
        product.molecularWeight || "",
        product.purity || "",
        product.phValue || "",
        product.appearance || "",
        product.solubility || "",
        product.status,
        product.featured ? "Yes" : "No",
        formatDate(product.createdAt),
        formatDate(product.updatedAt)
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Products exported successfully");
    } catch (error) {
      toast.error("Failed to export products");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "discontinued":
        return <Badge variant="destructive">Discontinued</Badge>;
      case "pending_review":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };



  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredPermission="products.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
              <p className="text-muted-foreground">
                Manage your product catalog and inventory
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || !products || products.length === 0}
              >
                <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{productStats?.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{productStats?.featured || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{productStats?.inactive || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{productStats?.collections || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                Manage your product catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    products && products.length > 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'
                  }`} />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${
                      products && products.length > 0 ? '' : 'opacity-50 cursor-not-allowed'
                    }`}
                    disabled={!products || products.length === 0}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  disabled={!products || products.length === 0}
                >
                  <SelectTrigger className={`w-[180px] ${
                    products && products.length > 0 ? '' : 'opacity-50 cursor-not-allowed'
                  }`}>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!products ? (
                // Skeleton loading state
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Chemical Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-10 h-10 rounded" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-3 w-20" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : products.length === 0 ? (
                // Empty state
                <div className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/5">
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-3 mb-8">
                      <h3 className="text-xl font-semibold text-foreground">
                        No Chemical Products Available
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Start building your chemical catalog by adding your first product.
                        You can add detailed chemical properties, specifications, and organize products into collections.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="px-6 py-2.5 text-sm font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Product
                      </Button>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>💡 <strong>Quick tip:</strong> You can also import products in bulk using CSV files</p>
                        <p>🔬 Add chemical properties like CAS numbers, molecular formulas, and pH values</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Products table with data
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Chemical Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.title}</div>
                              {product.featured && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600 mt-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {product.casNumber && (
                              <div className="text-sm">
                                <span className="font-medium">CAS:</span> {product.casNumber}
                              </div>
                            )}
                            {product.molecularFormula && (
                              <div className="text-sm">
                                <span className="font-medium">Formula:</span> {product.molecularFormula}
                              </div>
                            )}
                            {product.purity && (
                              <div className="text-sm">
                                <span className="font-medium">Purity:</span> {product.purity}
                              </div>
                            )}
                            {product.phValue && (
                              <div className="text-sm">
                                <span className="font-medium">pH:</span> {product.phValue}
                              </div>
                            )}
                            {product.quantity !== undefined && product.quantity !== null && (
                              <div className="text-sm">
                                <span className="font-medium">Qty:</span> {product.quantity}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(product.updatedAt)}
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
                              <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleFeatured(product._id)}
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {product.featured ? "Remove from Featured" : "Mark as Featured"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(product._id, product.status === "active" ? "inactive" : "active")}
                              >
                                {product.status === "active" ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination - only show when there are products */}
              {products && products.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, products.length)} of {products.length} products
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
                      disabled={products.length < pageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Product Modal */}
          <Modal
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            className="w-[95vw] max-w-7xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => setShowAddDialog(false)}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  {isCreatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add New Product
                </ModalTitle>
                <ModalDescription>
                  Create a new chemical product in your catalog
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {isCreatingProduct && !newProduct.title ? (
                  // Skeleton loading for add modal initialization
                  <div className="space-y-10">
                    {/* Basic Information Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </div>

                    {/* Image Upload Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <Skeleton className="h-48 w-full rounded-lg" />
                    </div>

                    {/* Collections Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="h-4 w-4 rounded" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Basic Information */}
                    <FormSection
                      title="Basic Information"
                      description="Essential product details and identification"
                    >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Product Title"
                      required
                      description="The main name of your chemical product"
                    >
                      <Input
                        placeholder="Enter product title"
                        value={newProduct.title || ""}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormField>

                    <FormField
                      label="Chemical Name"
                      description="IUPAC or common chemical name"
                    >
                      <Input
                        placeholder="Enter chemical name"
                        value={newProduct.chemicalName || ""}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, chemicalName: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Description"
                    description="Detailed description of the product and its properties"
                  >
                    <RichTextEditor
                      content={newProduct.description}
                      onChange={(content) => setNewProduct(prev => ({ ...prev, description: content }))}
                      placeholder="Enter a detailed product description with formatting..."
                      className="min-h-[200px]"
                    />
                  </FormField>
                </FormSection>

                {/* Product Images */}
                <FormSection
                  title="Product Images"
                  description="Upload or add images to showcase your chemical product with Remove.bg automatic background removal"
                >
                  <RemoveBgUpload
                    images={newProduct.images}
                    onImagesChange={(images) => setNewProduct(prev => ({ ...prev, images }))}
                    maxImages={10}
                    disabled={isCreatingProduct}
                  />
                </FormSection>

                {/* Collections */}
                <FormSection
                  title="Product Collections"
                  description="Organize your product by assigning it to relevant collections"
                >
                  <FormField
                    label="Collections"
                    description="Select one or more collections for this product"
                  >
                    <div className="space-y-4">
                      {activeCollections === undefined ? (
                        // Skeleton loading for collections
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center space-x-3">
                                <Skeleton className="h-4 w-4 rounded" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                  <Skeleton className="h-3 w-1/3" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : activeCollections && activeCollections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {activeCollections.map((collection) => (
                            <div
                              key={collection._id}
                              className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
                                newProduct.collections.includes(collection.collectionId)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200'
                              }`}
                              onClick={() => {
                                setNewProduct(prev => ({
                                  ...prev,
                                  collections: prev.collections.includes(collection.collectionId)
                                    ? prev.collections.filter(id => id !== collection.collectionId)
                                    : [...prev.collections, collection.collectionId]
                                }));
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={newProduct.collections.includes(collection.collectionId)}
                                  onChange={() => {}} // Handled by parent div onClick
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-100 truncate">
                                    {collection.title}
                                  </p>
                                  {collection.description && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {collection.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    {collection.productCount || 0} products
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">No collections available</p>
                          <p className="text-xs text-gray-400 mt-1 mb-4">
                            Create collections first to organize your products
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={initializeCollections}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create Sample Collections
                          </Button>
                        </div>
                      )}

                      {newProduct.collections.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            Selected Collections ({newProduct.collections.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {newProduct.collections.map((collectionId) => {
                              const collection = activeCollections?.find(c => c.collectionId === collectionId);
                              return collection ? (
                                <span
                                  key={collectionId}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {collection.title}
                                  <button
                                    type="button"
                                    className="ml-1.5 h-3 w-3 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewProduct(prev => ({
                                        ...prev,
                                        collections: prev.collections.filter(id => id !== collectionId)
                                      }));
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormField>
                </FormSection>

                {/* Chemical Properties */}
                <FormSection
                  title="Chemical Properties"
                  description="Technical specifications and chemical characteristics"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      label="CAS Number"
                      description="Chemical Abstracts Service registry number"
                    >
                      <Input
                        placeholder="e.g., 64-17-5"
                        value={newProduct.casNumber || ""}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, casNumber: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </FormField>

                    <FormField
                      label="HSN Number"
                      description="Harmonized System of Nomenclature code"
                    >
                      <Input
                        placeholder="e.g., 29051100"
                        value={newProduct.hsnNumber}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, hsnNumber: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </FormField>

                    <FormField
                      label="Purity"
                      description="Chemical purity percentage"
                    >
                      <div className="space-y-2">
                        <Select
                          value={newProduct.purity || ""}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setNewProduct(prev => ({ ...prev, purity: "" }));
                            } else {
                              setNewProduct(prev => ({ ...prev, purity: value }));
                            }
                          }}
                        >
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select purity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="95%">95%</SelectItem>
                            <SelectItem value="96%">96%</SelectItem>
                            <SelectItem value="97%">97%</SelectItem>
                            <SelectItem value="98%">98%</SelectItem>
                            <SelectItem value="99%">99%</SelectItem>
                            <SelectItem value="99.5%">99.5%</SelectItem>
                            <SelectItem value="99.9%">99.9%</SelectItem>
                            <SelectItem value="99.95%">99.95%</SelectItem>
                            <SelectItem value="99.99%">99.99%</SelectItem>
                            <SelectItem value="custom">Custom value...</SelectItem>
                          </SelectContent>
                        </Select>
                        {(!newProduct.purity || !["95%", "96%", "97%", "98%", "99%", "99.5%", "99.9%", "99.95%", "99.99%"].includes(newProduct.purity)) && (
                          <Input
                            placeholder="Enter custom purity (e.g., 99.7%)"
                            value={newProduct.purity}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, purity: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Molecular Formula"
                      description="Chemical formula representation"
                    >
                      <Input
                        placeholder="e.g., C2H6O"
                        value={newProduct.molecularFormula}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, molecularFormula: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                      />
                    </FormField>

                    <FormField
                      label="Molecular Weight"
                      description="Molecular weight in grams per mole"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="e.g., 46.07"
                          value={(newProduct.molecularWeight || '').replace(' g/mol', '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewProduct(prev => ({
                              ...prev,
                              molecularWeight: value ? `${value} g/mol` : ''
                            }));
                          }}
                          className="transition-all focus:ring-2 focus:ring-primary/20 pr-16"
                          step="0.01"
                          min="0"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-sm text-muted-foreground font-medium">g/mol</span>
                        </div>
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      label="Appearance"
                      description="Physical appearance and form"
                    >
                      <Input
                        placeholder="e.g., White crystalline powder"
                        value={newProduct.appearance}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, appearance: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormField>

                    <FormField
                      label="Solubility"
                      description="Solubility characteristics"
                    >
                      <Input
                        placeholder="e.g., Soluble in water"
                        value={newProduct.solubility}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, solubility: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormField>

                    <FormField
                      label="pH Value"
                      description="pH range or specific value"
                    >
                      <div className="space-y-2">
                        <Select
                          value={newProduct.phValue || ""}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setNewProduct(prev => ({ ...prev, phValue: "" }));
                            } else {
                              setNewProduct(prev => ({ ...prev, phValue: value }));
                            }
                          }}
                        >
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select pH value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.0">1.0 (Highly Acidic)</SelectItem>
                            <SelectItem value="2.0">2.0 (Very Acidic)</SelectItem>
                            <SelectItem value="3.0">3.0 (Acidic)</SelectItem>
                            <SelectItem value="4.0">4.0 (Acidic)</SelectItem>
                            <SelectItem value="5.0">5.0 (Weakly Acidic)</SelectItem>
                            <SelectItem value="6.0">6.0 (Weakly Acidic)</SelectItem>
                            <SelectItem value="7.0">7.0 (Neutral)</SelectItem>
                            <SelectItem value="8.0">8.0 (Weakly Basic)</SelectItem>
                            <SelectItem value="9.0">9.0 (Basic)</SelectItem>
                            <SelectItem value="10.0">10.0 (Basic)</SelectItem>
                            <SelectItem value="11.0">11.0 (Very Basic)</SelectItem>
                            <SelectItem value="12.0">12.0 (Highly Basic)</SelectItem>
                            <SelectItem value="13.0">13.0 (Highly Basic)</SelectItem>
                            <SelectItem value="14.0">14.0 (Highly Basic)</SelectItem>
                            <SelectItem value="1.0-2.0">1.0-2.0 (Highly Acidic Range)</SelectItem>
                            <SelectItem value="2.0-3.0">2.0-3.0 (Very Acidic Range)</SelectItem>
                            <SelectItem value="6.5-7.5">6.5-7.5 (Near Neutral Range)</SelectItem>
                            <SelectItem value="7.0-8.0">7.0-8.0 (Neutral to Basic Range)</SelectItem>
                            <SelectItem value="8.0-9.0">8.0-9.0 (Basic Range)</SelectItem>
                            <SelectItem value="custom">Custom value...</SelectItem>
                          </SelectContent>
                        </Select>
                        {(!newProduct.phValue || !["1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0", "12.0", "13.0", "14.0", "1.0-2.0", "2.0-3.0", "6.5-7.5", "7.0-8.0", "8.0-9.0"].includes(newProduct.phValue)) && (
                          <Input
                            placeholder="Enter custom pH value (e.g., 7.2 or 6.8-7.2)"
                            value={newProduct.phValue}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, phValue: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                      </div>
                    </FormField>
                  </div>
                </FormSection>

                {/* Product Details */}
                <FormSection
                  title="Product Details"
                  description="Additional product information and specifications"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Packaging"
                      description="Available packaging options and sizes"
                    >
                      <Input
                        placeholder="e.g., 25kg HDPE bags, 500kg jumbo bags"
                        value={newProduct.packaging}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, packaging: e.target.value }))}
                        className="transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </FormField>

                    <FormField
                      label="Quantity"
                      description="Available quantity for sale (leave 0 if out of stock)"
                    >
                      <Input
                      type="number"
                      placeholder="e.g., 100"
                      value={newProduct.quantity || "0"}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                      min="0"
                      step="1"
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Features"
                    description="Key product features (separate with commas)"
                  >
                    <Textarea
                      placeholder="e.g., High purity, Fast dissolution, Stable quality"
                      value={newProduct.features}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, features: e.target.value }))}
                      rows={2}
                      className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </FormField>

                  <FormField
                    label="Applications"
                    description="Primary use cases and applications (separate with commas)"
                  >
                    <Textarea
                      placeholder="e.g., Pharmaceutical synthesis, Research, Industrial processes"
                      value={newProduct.applications}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, applications: e.target.value }))}
                      rows={2}
                      className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </FormField>
                </FormSection>



                {/* Product Settings */}
                <FormSection
                  title="Product Settings"
                  description="Configure product status and visibility options"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Status"
                      description="Current availability status"
                    >
                      <Select
                        value={newProduct.status}
                        onValueChange={(value) => setNewProduct(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending_review">Pending Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      label="Featured Product"
                      description="Highlight this product in featured sections"
                    >
                      <div className="flex items-center space-x-3 pt-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={newProduct.featured}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, featured: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all"
                        />
                        <label htmlFor="featured" className="text-sm font-normal">
                          Mark as Featured Product
                        </label>
                      </div>
                    </FormField>
                  </div>
                </FormSection>
                </div>
                )}
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isCreatingProduct}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  disabled={!newProduct.title.trim() || isCreatingProduct}
                  className="transition-all"
                >
                  {isCreatingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* View Product Details Modal */}
          <Modal
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            className="w-[95vw] max-w-6xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => setShowViewDialog(false)}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Product Details
                </ModalTitle>
                <ModalDescription>
                  View detailed information about this chemical product
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selectedProduct && (
                  <div className="space-y-8">
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
                            <label className="text-sm font-medium text-muted-foreground">Product Title</label>
                            <div className="text-base font-medium">{selectedProduct.title}</div>
                          </div>
                          {selectedProduct.chemicalName && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Chemical Name</label>
                              <div className="text-base">{selectedProduct.chemicalName}</div>
                            </div>
                          )}
                        </div>
                        {selectedProduct.description && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Description</label>
                            <div
                              className="prose prose-sm max-w-none text-base leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chemical Properties */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          Chemical Properties
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {selectedProduct.casNumber && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">CAS Number</label>
                              <div className="text-base font-mono">{selectedProduct.casNumber}</div>
                            </div>
                          )}
                          {selectedProduct.molecularFormula && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Molecular Formula</label>
                              <div className="text-base font-mono">{selectedProduct.molecularFormula}</div>
                            </div>
                          )}
                          {selectedProduct.quantity !== undefined && selectedProduct.quantity !== null && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Available Quantity</label>
                              <div className="text-base font-medium">{selectedProduct.quantity}</div>
                            </div>
                          )}
                          {selectedProduct.molecularWeight && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Molecular Weight</label>
                              <div className="text-base">{selectedProduct.molecularWeight}</div>
                            </div>
                          )}
                          {selectedProduct.purity && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Purity</label>
                              <div className="text-base">{selectedProduct.purity}</div>
                            </div>
                          )}
                          {selectedProduct.appearance && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Appearance</label>
                              <div className="text-base">{selectedProduct.appearance}</div>
                            </div>
                          )}
                          {selectedProduct.solubility && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">Solubility</label>
                              <div className="text-base">{selectedProduct.solubility}</div>
                            </div>
                          )}
                          {selectedProduct.phValue && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">pH Value</label>
                              <div className="text-base">{selectedProduct.phValue}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Images */}
                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                      <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                            Product Images
                          </h3>
                        </div>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {selectedProduct.images.map((image: any, index: number) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                <img
                                  src={image.url}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => window.open(image.url, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Collections */}
                    {selectedProduct.collections && selectedProduct.collections.length > 0 && (
                      <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                            Collections
                          </h3>
                        </div>
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.collections.map((collectionId: string) => {
                              const collection = activeCollections?.find(c => c.collectionId === collectionId);
                              return collection ? (
                                <Badge
                                  key={collectionId}
                                  variant="secondary"
                                  className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20"
                                >
                                  {collection.title}
                                </Badge>
                              ) : (
                                <Badge
                                  key={collectionId}
                                  variant="outline"
                                  className="px-3 py-1 text-sm text-muted-foreground"
                                >
                                  Unknown Collection
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
                          Status & Settings
                        </h3>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div>{getStatusBadge(selectedProduct.status)}</div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Featured</label>
                            <div>
                              {selectedProduct.featured ? (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">Not featured</span>
                              )}
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
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditProduct(selectedProduct);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Edit Product Modal */}
          <Modal
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) {
                setSelectedProduct(null);
              }
            }}
            className="w-[95vw] max-w-7xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedProduct(null);
              }}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  {isUpdatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  Edit Product
                </ModalTitle>
                <ModalDescription>
                  Update the chemical product information and properties
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {!selectedProduct ? (
                  // Skeleton loading for edit modal
                  <div className="space-y-10">
                    {/* Basic Information Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </div>

                    {/* Chemical Properties Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Collections Skeleton */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg">
                            <Skeleton className="h-4 w-4 rounded" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Basic Information */}
                    <FormSection
                      title="Basic Information"
                      description="Essential product details and identification"
                    >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="Product Title"
                        required
                        description="The main name of your chemical product"
                      >
                        <Input
                          placeholder="Enter product title"
                          value={editProduct.title || ""}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, title: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>

                      <FormField
                        label="Chemical Name"
                        description="IUPAC or common chemical name"
                      >
                        <Input
                          placeholder="Enter chemical name"
                          value={editProduct.chemicalName || ""}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, chemicalName: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>
                    </div>

                    <FormField
                      label="Description"
                      description="Detailed description of the product and its properties"
                    >
                      <RichTextEditor
                        content={editProduct.description}
                        onChange={(content) => setEditProduct(prev => ({ ...prev, description: content }))}
                        placeholder="Enter a detailed product description with formatting..."
                        className="min-h-[200px]"
                      />
                    </FormField>
                  </FormSection>

                  {/* Chemical Properties */}
                  <FormSection
                    title="Chemical Properties"
                    description="Specific chemical characteristics and identifiers"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        label="CAS Number"
                        description="Chemical Abstracts Service registry number"
                      >
                        <Input
                          placeholder="e.g., 64-17-5"
                          value={editProduct.casNumber}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, casNumber: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>

                      <FormField
                        label="Molecular Formula"
                        description="Chemical formula representation"
                      >
                        <Input
                          placeholder="e.g., C2H6O"
                          value={editProduct.molecularFormula}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, molecularFormula: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>

                      <FormField
                        label="Molecular Weight"
                        description="Molecular weight in g/mol"
                      >
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="e.g., 46.07"
                            value={(editProduct.molecularWeight || '').replace(' g/mol', '')}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditProduct(prev => ({
                                ...prev,
                                molecularWeight: value ? `${value} g/mol` : ''
                              }));
                            }}
                            className="transition-all focus:ring-2 focus:ring-primary/20 pr-16"
                            step="0.01"
                            min="0"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-sm text-muted-foreground font-medium">g/mol</span>
                          </div>
                        </div>
                      </FormField>

                      <FormField
                        label="Purity"
                        description="Chemical purity percentage"
                      >
                        <div className="space-y-2">
                          <Select
                            value={editProduct.purity || ""}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setEditProduct(prev => ({ ...prev, purity: "" }));
                              } else {
                                setEditProduct(prev => ({ ...prev, purity: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select purity level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="95%">95%</SelectItem>
                              <SelectItem value="96%">96%</SelectItem>
                              <SelectItem value="97%">97%</SelectItem>
                              <SelectItem value="98%">98%</SelectItem>
                              <SelectItem value="99%">99%</SelectItem>
                              <SelectItem value="99.5%">99.5%</SelectItem>
                              <SelectItem value="99.9%">99.9%</SelectItem>
                              <SelectItem value="99.95%">99.95%</SelectItem>
                              <SelectItem value="99.99%">99.99%</SelectItem>
                              <SelectItem value="custom">Custom value...</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!editProduct.purity || !["95%", "96%", "97%", "98%", "99%", "99.5%", "99.9%", "99.95%", "99.99%"].includes(editProduct.purity)) && (
                            <Input
                              placeholder="Enter custom purity (e.g., 99.7%)"
                              value={editProduct.purity}
                              onChange={(e) => setEditProduct(prev => ({ ...prev, purity: e.target.value }))}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )}
                        </div>
                      </FormField>

                      <FormField
                        label="Appearance"
                        description="Physical appearance description"
                      >
                        <Input
                          placeholder="e.g., Clear liquid"
                          value={editProduct.appearance}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, appearance: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>

                      <FormField
                        label="Solubility"
                        description="Solubility characteristics"
                      >
                        <Input
                          placeholder="e.g., Miscible with water"
                          value={editProduct.solubility}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, solubility: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormField>

                      <FormField
                        label="pH Value"
                        description="pH range or specific value"
                      >
                        <div className="space-y-2">
                          <Select
                            value={editProduct.phValue || ""}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setEditProduct(prev => ({ ...prev, phValue: "" }));
                              } else {
                                setEditProduct(prev => ({ ...prev, phValue: value }));
                              }
                            }}
                          >
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder="Select pH value" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.0">1.0 (Highly Acidic)</SelectItem>
                              <SelectItem value="2.0">2.0 (Very Acidic)</SelectItem>
                              <SelectItem value="3.0">3.0 (Acidic)</SelectItem>
                              <SelectItem value="4.0">4.0 (Acidic)</SelectItem>
                              <SelectItem value="5.0">5.0 (Weakly Acidic)</SelectItem>
                              <SelectItem value="6.0">6.0 (Weakly Acidic)</SelectItem>
                              <SelectItem value="7.0">7.0 (Neutral)</SelectItem>
                              <SelectItem value="8.0">8.0 (Weakly Basic)</SelectItem>
                              <SelectItem value="9.0">9.0 (Basic)</SelectItem>
                              <SelectItem value="10.0">10.0 (Basic)</SelectItem>
                              <SelectItem value="11.0">11.0 (Very Basic)</SelectItem>
                              <SelectItem value="12.0">12.0 (Highly Basic)</SelectItem>
                              <SelectItem value="13.0">13.0 (Highly Basic)</SelectItem>
                              <SelectItem value="14.0">14.0 (Highly Basic)</SelectItem>
                              <SelectItem value="1.0-2.0">1.0-2.0 (Highly Acidic Range)</SelectItem>
                              <SelectItem value="2.0-3.0">2.0-3.0 (Very Acidic Range)</SelectItem>
                              <SelectItem value="6.5-7.5">6.5-7.5 (Near Neutral Range)</SelectItem>
                              <SelectItem value="7.0-8.0">7.0-8.0 (Neutral to Basic Range)</SelectItem>
                              <SelectItem value="8.0-9.0">8.0-9.0 (Basic Range)</SelectItem>
                              <SelectItem value="custom">Custom value...</SelectItem>
                            </SelectContent>
                          </Select>
                          {(!editProduct.phValue || !["1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0", "12.0", "13.0", "14.0", "1.0-2.0", "2.0-3.0", "6.5-7.5", "7.0-8.0", "8.0-9.0"].includes(editProduct.phValue)) && (
                            <Input
                              placeholder="Enter custom pH value (e.g., 7.2 or 6.8-7.2)"
                              value={editProduct.phValue}
                              onChange={(e) => setEditProduct(prev => ({ ...prev, phValue: e.target.value }))}
                              className="transition-all focus:ring-2 focus:ring-primary/20"
                            />
                          )}
                        </div>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="Quantity"
                        description="Available quantity for sale (leave 0 if out of stock)"
                      >
                        <Input
                          type="number"
                          placeholder="e.g., 100"
                          value={editProduct.quantity || 0}
                          onChange={(e) => setEditProduct(prev => ({ ...prev, quantity: e.target.value }))}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                          min="0"
                          step="1"
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* Collections */}
                  <FormSection
                    title="Collections"
                    description="Assign this product to collections for better organization"
                  >
                    <FormField
                      label="Product Collections"
                      description="Select which collections this product belongs to"
                    >
                      <div className="space-y-3">
                        {activeCollections === undefined ? (
                          // Skeleton loading for collections
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg bg-muted/20">
                                <Skeleton className="h-4 w-4 rounded" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : activeCollections && activeCollections.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {activeCollections.map((collection) => (
                              <div
                                key={collection._id}
                                className="flex items-center space-x-3 p-3 border border-border/50 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  id={`edit-collection-${collection._id}`}
                                  checked={editProduct.collections.includes(collection.collectionId)}
                                  onChange={(e) => {
                                    const collectionId = collection.collectionId;
                                    setEditProduct(prev => ({
                                      ...prev,
                                      collections: e.target.checked
                                        ? [...prev.collections, collectionId]
                                        : prev.collections.filter(id => id !== collectionId)
                                    }));
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                                />
                                <label
                                  htmlFor={`edit-collection-${collection._id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium text-sm">{collection.title}</div>
                                  {collection.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {collection.description}
                                    </div>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No collections available</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={initializeCollections}
                              className="mt-2"
                            >
                              Create Sample Collections
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormField>
                  </FormSection>

                  {/* Status and Settings */}
                  <FormSection
                    title="Status & Settings"
                    description="Product status and visibility settings"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="Status"
                        description="Product availability status"
                      >
                        <Select
                          value={editProduct.status}
                          onValueChange={(value) => setEditProduct(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>

                      <FormField
                        label="Featured"
                        description="Mark as featured product"
                      >
                        <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg bg-muted/20">
                          <input
                            type="checkbox"
                            checked={editProduct.featured}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, featured: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">Featured Product</div>
                            <div className="text-xs text-muted-foreground">
                              Show this product prominently
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </div>
                  </FormSection>
                </div>
                )}
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedProduct(null);
                  }}
                  disabled={isUpdatingProduct}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProduct}
                  disabled={!editProduct.title.trim() || isUpdatingProduct}
                  className="transition-all"
                >
                  {isUpdatingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Edit Product Modal */}
          <Modal
            open={showEditDialog}
            onOpenChange={(open) => {
              setShowEditDialog(open);
              if (!open) {
                setSelectedProduct(null);
              }
            }}
            className="w-[95vw] max-w-7xl"
          >
            <ModalContent
              className="w-full max-h-[95vh] overflow-hidden flex flex-col"
              showCloseButton={true}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedProduct(null);
              }}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2">
                  {isUpdatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Edit className="h-5 w-5" />
                  Edit Product
                </ModalTitle>
                <ModalDescription>
                  Update product information and specifications
                </ModalDescription>
              </ModalHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selectedProduct && (
                  <div className="space-y-10">
                    {/* Basic Information */}
                    <FormSection
                      title="Basic Information"
                      description="Essential product details and identification"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="Product Title"
                          required
                          description="The main name of your chemical product"
                        >
                          <Input
                            placeholder="Enter product title"
                            value={editProduct.title || ""}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, title: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormField>

                        <FormField
                          label="Chemical Name"
                          description="IUPAC or common chemical name"
                        >
                          <Input
                            placeholder="Enter chemical name"
                            value={editProduct.chemicalName || ""}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, chemicalName: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormField>
                      </div>

                      <FormField
                        label="Description"
                        description="Detailed description of the product and its properties"
                      >
                        <RichTextEditor
                          content={editProduct.description}
                          onChange={(content) => setEditProduct(prev => ({ ...prev, description: content }))}
                          placeholder="Enter a detailed product description with formatting..."
                          className="min-h-[200px]"
                        />
                      </FormField>
                    </FormSection>

                    {/* Product Images */}
                    <FormSection
                      title="Product Images"
                      description="Upload or add images to showcase your chemical product with Remove.bg automatic background removal"
                    >
                      <RemoveBgUpload
                        images={editProduct.images}
                        onImagesChange={(images) => setEditProduct(prev => ({ ...prev, images }))}
                        maxImages={10}
                        disabled={isUpdatingProduct}
                      />
                    </FormSection>

                    {/* Chemical Properties */}
                    <FormSection
                      title="Chemical Properties"
                      description="Technical specifications and chemical characteristics"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          label="CAS Number"
                          description="Chemical Abstracts Service registry number"
                        >
                          <Input
                            placeholder="e.g., 64-17-5"
                            value={editProduct.casNumber || ""}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, casNumber: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                          />
                        </FormField>

                        <FormField
                          label="HSN Number"
                          description="Harmonized System of Nomenclature code"
                        >
                          <Input
                            placeholder="e.g., 29051100"
                            value={editProduct.hsnNumber}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, hsnNumber: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                          />
                        </FormField>

                        <FormField
                          label="Purity"
                          description="Chemical purity percentage"
                        >
                          <Input
                            placeholder="e.g., 99.5%"
                            value={editProduct.purity || ""}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, purity: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormField>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="Molecular Formula"
                          description="Chemical formula representation"
                        >
                          <Input
                            placeholder="e.g., C2H6O"
                            value={editProduct.molecularFormula}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, molecularFormula: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20 font-mono"
                          />
                        </FormField>

                        <FormField
                          label="Molecular Weight"
                          description="Molecular weight in grams per mole"
                        >
                          <Input
                            placeholder="e.g., 46.07 g/mol"
                            value={editProduct.molecularWeight || ""}
                            onChange={(e) => setEditProduct(prev => ({ ...prev, molecularWeight: e.target.value }))}
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormField>
                      </div>
                    </FormSection>

                    {/* Product Settings */}
                    <FormSection
                      title="Product Settings"
                      description="Configure product status and visibility options"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="Status"
                          description="Current availability status"
                        >
                          <Select
                            value={editProduct.status}
                            onValueChange={(value) => setEditProduct(prev => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending_review">Pending Review</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>

                        <FormField
                          label="Featured Product"
                          description="Highlight this product in featured sections"
                        >
                          <div className="flex items-center space-x-3 pt-2">
                            <input
                              type="checkbox"
                              id="edit-featured"
                              checked={editProduct.featured}
                              onChange={(e) => setEditProduct(prev => ({ ...prev, featured: e.target.checked }))}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 transition-all"
                            />
                            <label htmlFor="edit-featured" className="text-sm font-normal">
                              Mark as Featured Product
                            </label>
                          </div>
                        </FormField>
                      </div>
                    </FormSection>
                  </div>
                )}
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedProduct(null);
                  }}
                  disabled={isUpdatingProduct}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProduct}
                  disabled={!editProduct.title.trim() || isUpdatingProduct}
                  className="transition-all"
                >
                  {isUpdatingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Delete Product Confirmation Dialog */}
          <Modal
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            className="w-[95vw] max-w-md"
          >
            <ModalContent
              className="w-full"
              showCloseButton={true}
              onClose={() => {
                setShowDeleteDialog(false);
                setProductToDelete(null);
              }}
            >
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Delete Product
                </ModalTitle>
                <ModalDescription>
                  This action cannot be undone. This will permanently delete the product and remove it from all collections.
                </ModalDescription>
              </ModalHeader>

              <div className="px-6 py-4">
                {productToDelete && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {productToDelete.images && productToDelete.images.length > 0 ? (
                            <img
                              src={productToDelete.images[0].url}
                              alt={productToDelete.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {productToDelete.title}
                          </h4>
                          {productToDelete.casNumber && (
                            <p className="text-sm text-gray-600">
                              CAS: {productToDelete.casNumber}
                            </p>
                          )}
                          {productToDelete.collections && productToDelete.collections.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Collections: {productToDelete.collections.length}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">This will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Permanently delete the product from the database</li>
                        <li>Remove the product from all associated collections</li>
                        <li>Update collection product counts</li>
                        <li>Create an activity log entry</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setProductToDelete(null);
                  }}
                  disabled={isDeletingProduct}
                  className="transition-all hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteProduct}
                  disabled={isDeletingProduct}
                  className="bg-red-600 hover:bg-red-700 text-white transition-all"
                >
                  {isDeletingProduct ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
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
