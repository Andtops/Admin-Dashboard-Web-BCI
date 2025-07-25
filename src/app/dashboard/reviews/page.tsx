"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
  EyeOff,
  Star,
  MessageSquare,
  RefreshCw,
  Download,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Trash2,
  Reply,
  Highlighter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// Types
interface Review {
  _id: string;
  reviewId: string;
  productId: string;
  userId: string;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged' | 'hidden';
  isVerifiedPurchase: boolean;
  isHighlighted: boolean;
  helpfulVotes: number;
  unhelpfulVotes: number;
  createdAt: number;
  moderatedAt?: number;
  moderationReason?: string;
  moderationNotes?: string;
  adminResponse?: {
    content: string;
    isPublic: boolean;
    respondedAt: number;
    respondedBy: string;
  };
  product?: {
    title: string;
    images?: Array<{ url: string }>;
  };
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  flagged: number;
  hidden: number;
  averageRating: number;
}

interface ReviewsResponse {
  reviews: Review[];
  totalCount: number;
  hasMore: boolean;
}

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isAddingResponse, setIsAddingResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;

  // Data state
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  // Admin response form state
  const [adminResponse, setAdminResponse] = useState({
    content: "",
    isPublic: true,
  });

  const { admin } = useAuth();

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter === "all" ? "" : statusFilter,
        search: searchTerm || "",
        limit: pageSize.toString(),
        offset: (currentPage * pageSize).toString(),
      });

      const response = await fetch(`/api/reviews/admin?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    }
  }, [statusFilter, searchTerm, pageSize, currentPage]);

  // Fetch review stats
  const fetchReviewStats = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch review stats');
      
      const data = await response.json();
      setReviewStats(data);
    } catch (error) {
      console.error('Error fetching review stats:', error);
      toast.error('Failed to fetch review statistics');
    }
  }, []);

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReviews(), fetchReviewStats()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [searchTerm, statusFilter, currentPage, fetchReviews, fetchReviewStats]);

  const handleUpdateStatus = async (reviewId: string, status: string, reason?: string) => {
    if (!admin) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/reviews/admin/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          moderationReason: reason,
          moderatedBy: admin.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to update review status');

      toast.success(`Review ${status} successfully`);
      await fetchReviews(); // Refresh the reviews list
    } catch (error) {
      toast.error("Failed to update review status");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleHighlight = async (reviewId: string) => {
    if (!admin) return;

    try {
      const response = await fetch(`/api/reviews/admin/${reviewId}/highlight`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: admin.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to update highlight status');

      toast.success("Review highlight status updated");
      await fetchReviews(); // Refresh the reviews list
    } catch (error) {
      toast.error("Failed to update highlight status");
      console.error(error);
    }
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setShowViewDialog(true);
  };

  const handleAddResponse = (review: Review) => {
    setSelectedReview(review);
    setAdminResponse({
      content: review.adminResponse?.content || "",
      isPublic: review.adminResponse?.isPublic ?? true,
    });
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!admin || !selectedReview || !adminResponse.content.trim()) return;

    setIsAddingResponse(true);
    try {
      const response = await fetch(`/api/reviews/admin/${selectedReview.reviewId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: adminResponse.content,
          isPublic: adminResponse.isPublic,
          respondedBy: admin.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to add response');

      toast.success("Admin response added successfully");
      setShowResponseDialog(false);
      setAdminResponse({ content: "", isPublic: true });
      await fetchReviews(); // Refresh the reviews list
    } catch (error) {
      toast.error("Failed to add response");
      console.error(error);
    } finally {
      setIsAddingResponse(false);
    }
  };

  const handleDeleteResponse = async (reviewId: string) => {
    if (!admin) return;

    try {
      const response = await fetch(`/api/reviews/admin/${reviewId}/response`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: admin.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete response');

      toast.success("Admin response deleted");
      await fetchReviews(); // Refresh the reviews list
    } catch (error) {
      toast.error("Failed to delete response");
      console.error(error);
    }
  };

  const handleDeleteReview = (review: Review) => {
    setReviewToDelete(review);
    setShowDeleteDialog(true);
  };

  const confirmDeleteReview = async () => {
    if (!admin || !reviewToDelete) return;

    setIsDeletingReview(true);
    try {
      const response = await fetch(`/api/reviews/admin/${reviewToDelete.reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: admin.email,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete review');

      toast.success("Review deleted successfully");
      setShowDeleteDialog(false);
      setReviewToDelete(null);

      if (selectedReview?._id === reviewToDelete._id) {
        setShowViewDialog(false);
        setSelectedReview(null);
      }

      await fetchReviews(); // Refresh the reviews list
    } catch (error) {
      toast.error("Failed to delete review");
      console.error(error);
    } finally {
      setIsDeletingReview(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchReviews(), fetchReviewStats()]);
      toast.success("Reviews refreshed");
    } catch (error) {
      toast.error("Failed to refresh reviews");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!reviews || reviews.reviews.length === 0) {
      toast.error("No reviews to export");
      return;
    }

    setIsExporting(true);
    try {
      const csvHeaders = [
        "Review ID",
        "Product",
        "User",
        "Email",
        "Rating",
        "Title",
        "Content",
        "Status",
        "Verified Purchase",
        "Helpful Votes",
        "Unhelpful Votes",
        "Created Date",
        "Moderated Date"
      ];

      const csvData = reviews.reviews.map(review => [
        review.reviewId,
        review.product?.title || "Unknown Product",
        review.userName,
        review.userEmail,
        review.rating,
        review.title,
        review.content.replace(/"/g, '""'), // Escape quotes
        review.status,
        review.isVerifiedPurchase ? "Yes" : "No",
        review.helpfulVotes || 0,
        review.unhelpfulVotes || 0,
        formatDate(review.createdAt),
        review.moderatedAt ? formatDate(review.moderatedAt) : ""
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `reviews_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Reviews exported successfully");
    } catch (error) {
      toast.error("Failed to export reviews");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "flagged":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Flagged</Badge>;
      case "hidden":
        return <Badge variant="secondary">Hidden</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Review Management</h1>
              <p className="text-muted-foreground">
                Manage product reviews and customer feedback
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || !reviews || reviews.reviews.length === 0}
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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reviewStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{reviewStats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reviewStats?.approved || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{reviewStats?.flagged || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{reviewStats?.rejected || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <div className="text-2xl font-bold">
                    {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : "0.0"}
                  </div>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>
                Manage customer reviews and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading || !reviews ? (
                // Skeleton loading state
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Review</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-3 w-12" />
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
              ) : reviews.reviews.length === 0 ? (
                // Empty state
                <div className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/5">
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="space-y-3 mb-8">
                      <h3 className="text-xl font-semibold text-foreground">
                        No Reviews Found
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                        {statusFilter === "all" 
                          ? "No customer reviews have been submitted yet. Reviews will appear here once customers start leaving feedback on your products."
                          : `No reviews found with status "${statusFilter}". Try adjusting your filters or check other status categories.`
                        }
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>💡 <strong>Tip:</strong> Encourage customers to leave reviews after purchase</p>
                      <p>⭐ Reviews help build trust and improve product visibility</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Reviews table with data
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Review</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.reviews.map((review) => (
                        <TableRow key={review._id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                {review.title}
                                {review.isHighlighted && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    <Highlighter className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                {review.isVerifiedPurchase && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                by {review.userName}
                              </div>
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {review.content}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {review.product?.images?.[0] && (
                                <img
                                  src={review.product.images[0].url}
                                  alt={review.product.title || "Product image"}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <div className="text-sm font-medium max-w-xs truncate">
                                {review.product?.title || "Unknown Product"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getRatingStars(review.rating)}
                              <span className="text-sm font-medium ml-1">
                                {review.rating}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(review.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-green-600" />
                                <span>{review.helpfulVotes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3 text-red-600" />
                                <span>{review.unhelpfulVotes || 0}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDate(review.createdAt)}
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
                                <DropdownMenuItem onClick={() => handleViewReview(review)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {review.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(review.reviewId, "approved")}
                                      disabled={isUpdatingStatus}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(review.reviewId, "rejected", "Does not meet quality standards")}
                                      disabled={isUpdatingStatus}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {review.status === "approved" && (
                                  <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(review.reviewId, "hidden")}
                                    disabled={isUpdatingStatus}
                                  >
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Hide
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(review.reviewId, "flagged", "Flagged for review")}
                                  disabled={isUpdatingStatus}
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Flag
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleHighlight(review.reviewId)}
                                >
                                  <Highlighter className="mr-2 h-4 w-4" />
                                  {review.isHighlighted ? "Remove Highlight" : "Highlight"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddResponse(review)}>
                                  <Reply className="mr-2 h-4 w-4" />
                                  {review.adminResponse ? "Edit Response" : "Add Response"}
                                </DropdownMenuItem>
                                {review.adminResponse && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteResponse(review.reviewId)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Delete Response
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteReview(review)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Review
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

              {/* Pagination */}
              {reviews && reviews.reviews.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, reviews.totalCount)} of {reviews.totalCount} reviews
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
                      disabled={!reviews.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* View Review Modal */}
          <Dialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
          >
            <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Review Details
                </DialogTitle>
                <DialogDescription>
                  View detailed information about this customer review
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {selectedReview && (
                  <div className="space-y-6">
                    {/* Review Header */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{selectedReview.title}</h3>
                          <div className="flex items-center gap-2">
                            {getRatingStars(selectedReview.rating)}
                            <span className="font-medium">{selectedReview.rating} out of 5</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedReview.status)}
                          {selectedReview.isHighlighted && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              <Highlighter className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {selectedReview.isVerifiedPurchase && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Customer:</span> {selectedReview.userName}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {selectedReview.userEmail}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(selectedReview.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Product:</span> {selectedReview.product?.title || "Unknown"}
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Review Content</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="whitespace-pre-wrap">{selectedReview.content}</p>
                      </div>
                    </div>

                    {/* Helpfulness Votes */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Helpfulness Votes</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <span>{selectedReview.helpfulVotes || 0} helpful</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          <span>{selectedReview.unhelpfulVotes || 0} unhelpful</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {selectedReview.adminResponse && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Admin Response</h4>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-900">
                              Response from Business
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={selectedReview.adminResponse.isPublic ? "default" : "secondary"}>
                                {selectedReview.adminResponse.isPublic ? "Public" : "Private"}
                              </Badge>
                              <span className="text-xs text-blue-700">
                                {formatDate(selectedReview.adminResponse.respondedAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-blue-900 whitespace-pre-wrap">
                            {selectedReview.adminResponse.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Moderation Info */}
                    {selectedReview.moderatedAt && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Moderation Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Moderated:</span> {formatDate(selectedReview.moderatedAt)}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {selectedReview.status}
                          </div>
                          {selectedReview.moderationReason && (
                            <div className="col-span-2">
                              <span className="font-medium">Reason:</span> {selectedReview.moderationReason}
                            </div>
                          )}
                          {selectedReview.moderationNotes && (
                            <div className="col-span-2">
                              <span className="font-medium">Notes:</span> {selectedReview.moderationNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    if (selectedReview) {
                      handleAddResponse(selectedReview);
                    }
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {selectedReview?.adminResponse ? "Edit Response" : "Add Response"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Admin Response Modal */}
          <Dialog
            open={showResponseDialog}
            onOpenChange={setShowResponseDialog}
          >
            <DialogContent className="w-[95vw] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {isAddingResponse && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Reply className="h-5 w-5" />
                  {selectedReview?.adminResponse ? "Edit Admin Response" : "Add Admin Response"}
                </DialogTitle>
                <DialogDescription>
                  Respond to this customer review on behalf of your business
                </DialogDescription>
              </DialogHeader>

              <div className="px-8 py-6 space-y-4">
                {selectedReview && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getRatingStars(selectedReview.rating)}
                      <span className="font-medium">{selectedReview.rating}/5</span>
                    </div>
                    <h4 className="font-medium mb-1">{selectedReview.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {selectedReview.content}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="response-content">Response Content</Label>
                  <Textarea
                    id="response-content"
                    placeholder="Write your response to this review..."
                    value={adminResponse.content}
                    onChange={(e) => setAdminResponse(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={adminResponse.isPublic}
                    onChange={(e) => setAdminResponse(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is-public" className="text-sm">
                    Make this response visible to customers
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowResponseDialog(false)}
                  disabled={isAddingResponse}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!adminResponse.content.trim() || isAddingResponse}
                >
                  {isAddingResponse ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Reply className="h-4 w-4 mr-2" />
                      {selectedReview?.adminResponse ? "Update Response" : "Add Response"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Review Modal */}
          <Dialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete Review
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this review? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {reviewToDelete && (
                <div className="px-8 py-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getRatingStars(reviewToDelete.rating)}
                      <span className="font-medium">{reviewToDelete.rating}/5</span>
                    </div>
                    <h4 className="font-medium mb-1">{reviewToDelete.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      by {reviewToDelete.userName}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeletingReview}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteReview}
                  disabled={isDeletingReview}
                >
                  {isDeletingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Review
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