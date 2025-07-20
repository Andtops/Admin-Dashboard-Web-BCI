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
  Star,
  StarOff,
  Package,
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  Grid3X3
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function FeaturedProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const pageSize = 20;

  const { admin } = useAuth();

  // Queries
  const featuredProducts = useQuery(api.products.getFeaturedProducts, {
    search: searchTerm || undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  const allProducts = useQuery(api.products.getProducts, {
    search: searchTerm || undefined,
    status: "active",
    limit: 50,
  });

  const featuredStats = useQuery(api.products.getFeaturedStats);

  // Mutations
  const toggleFeatured = useMutation(api.products.toggleProductFeatured);
  const getOrCreateAdmin = useMutation(api.admins.getOrCreateAdmin);

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    if (!admin) return;

    try {
      // Get or create the demo admin in Convex
      const adminId = await getOrCreateAdmin({ email: admin.email });

      await toggleFeatured({
        productId: productId as any,
        adminId: adminId,
      });
      toast.success(`Product ${currentFeatured ? 'removed from' : 'added to'} featured list`);
    } catch (error) {
      toast.error("Failed to update featured status");
      console.error(error);
    }
  };

  const formatPrice = (priceRange: any) => {
    if (!priceRange) return "N/A";
    const min = parseFloat(priceRange.minVariantPrice.amount);
    const max = parseFloat(priceRange.maxVariantPrice.amount);
    const currency = priceRange.minVariantPrice.currencyCode;
    
    if (min === max) {
      return `${currency} ${min.toFixed(2)}`;
    }
    return `${currency} ${min.toFixed(2)} - ${max.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openDetailsDialog = (product: any) => {
    setSelectedProduct(product);
    setShowDetailsDialog(true);
  };

  return (
    <ProtectedRoute requiredPermission="products.read">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Featured Products</h1>
              <p className="text-muted-foreground">
                Manage featured products displayed prominently on your platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Featured
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Featured
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Featured Product</DialogTitle>
                    <DialogDescription>
                      Select products to feature from your active catalog
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search products to feature..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {allProducts?.filter(p => !p.featured).map((product) => (
                        <div key={product._id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm">{product.title}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleFeatured(product._id, false)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Feature
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{featuredStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{featuredStats?.active || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{featuredStats?.avgViews || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  <TrendingUp className="h-5 w-5 inline mr-1" />
                  {featuredStats?.performance || "Good"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Products</CardTitle>
              <CardDescription>
                Products currently featured on your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search featured products..."
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
                      <TableHead>Product</TableHead>
                      <TableHead>Chemical Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured Since</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredProducts?.map((product) => (
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
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600 mt-1">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500">Active</Badge>
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
                              <DropdownMenuItem onClick={() => openDetailsDialog(product)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleFeatured(product._id, true)}
                                className="text-red-600"
                              >
                                <StarOff className="mr-2 h-4 w-4" />
                                Remove from Featured
                              </DropdownMenuItem>
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
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, featuredProducts?.length || 0)} of {featuredProducts?.length || 0} featured products
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
                    disabled={!featuredProducts || featuredProducts.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Featured Product Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedProduct?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-start gap-4">
                  {selectedProduct?.images && selectedProduct?.images.length > 0 ? (
                    <img
                      src={selectedProduct?.images[0].url}
                      alt={selectedProduct?.title}
                      className="w-20 h-20 rounded object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedProduct?.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{selectedProduct?.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Chemical Information</h4>
                    <div className="space-y-1 text-sm">
                      {selectedProduct?.casNumber && <div>CAS Number: {selectedProduct?.casNumber}</div>}
                      {selectedProduct?.molecularFormula && <div>Molecular Formula: {selectedProduct?.molecularFormula}</div>}
                      {selectedProduct?.molecularWeight && <div>Molecular Weight: {selectedProduct?.molecularWeight}</div>}
                      {selectedProduct?.purity && <div>Purity: {selectedProduct?.purity}</div>}
                      {selectedProduct?.appearance && <div>Appearance: {selectedProduct?.appearance}</div>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Product Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>Price: {formatPrice(selectedProduct?.priceRange)}</div>
                      {selectedProduct?.packaging && <div>Packaging: {selectedProduct?.packaging}</div>}
                      {selectedProduct?.totalInventory && <div>Inventory: {selectedProduct?.totalInventory}</div>}
                      <div>Featured Since: {selectedProduct?.updatedAt ? formatDate(selectedProduct?.updatedAt) : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {selectedProduct?.features && selectedProduct?.features.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct?.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct?.applications && selectedProduct?.applications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Applications</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct?.applications.map((app: string, index: number) => (
                        <Badge key={index} variant="outline">{app}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (selectedProduct) {
                      handleToggleFeatured(selectedProduct._id, true);
                      setShowDetailsDialog(false);
                    }
                  }}
                >
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove from Featured
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
