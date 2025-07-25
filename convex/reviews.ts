import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get reviews for a specific product
export const getProductReviews = query({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { productId, limit = 20, offset = 0 } = args;

    // Only get approved/published reviews
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_product_status", (q) => 
        q.eq("productId", productId).eq("status", "approved")
      )
      .order("desc")
      .collect();

    // Get product details for each review
    const reviewsWithProducts = await Promise.all(
      reviews.slice(offset, offset + limit).map(async (review) => {
        const product = await ctx.db
          .query("products")
          .withIndex("by_product_id", (q) => q.eq("productId", review.productId))
          .first();

        return {
          ...review,
          product: product ? {
            title: product.title,
            images: product.images,
          } : null,
        };
      })
    );

    return {
      reviews: reviewsWithProducts,
      hasMore: offset + limit < reviews.length,
      totalCount: reviews.length,
    };
  },
});

// Get product review summary
export const getProductReviewSummary = query({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_product_status", (q) => 
        q.eq("productId", args.productId).eq("status", "approved")
      )
      .collect();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution,
    };
  },
});

// Create a new review (auto-approved)
export const createReview = mutation({
  args: {
    productId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    rating: v.number(),
    title: v.string(),
    content: v.string(),
    isVerifiedPurchase: v.optional(v.boolean()),
    orderReference: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if user already reviewed this product
    const existingReview = await ctx.db
      .query("productReviews")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const review = await ctx.db.insert("productReviews", {
      reviewId,
      productId: args.productId,
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      rating: args.rating,
      title: args.title.trim(),
      content: args.content.trim(),
      isVerifiedPurchase: args.isVerifiedPurchase || false,
      orderReference: args.orderReference,
      status: "approved", // Auto-approve all reviews
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      totalVotes: 0,
      isHighlighted: false,
      qualityScore: 50, // Default quality score
      isSpam: false,
      spamScore: 0,
      reportedCount: 0,
      isVisible: true, // Immediately visible
      createdAt: now,
      updatedAt: now,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return review;
  },
});

// Vote on review helpfulness
export const voteOnReview = mutation({
  args: {
    reviewId: v.id("productReviews"),
    userId: v.string(),
    userEmail: v.string(),
    voteType: v.union(v.literal("helpful"), v.literal("unhelpful")),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already voted on this review
    const existingVote = await ctx.db
      .query("reviewVotes")
      .withIndex("by_review_user", (q) => 
        q.eq("reviewId", args.reviewId).eq("userId", args.userId)
      )
      .first();

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.voteType !== args.voteType) {
        await ctx.db.patch(existingVote._id, {
          voteType: args.voteType,
        });

        // Update review vote counts
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          const helpfulVotes = args.voteType === "helpful" 
            ? (review.helpfulVotes || 0) + 1 
            : Math.max(0, (review.helpfulVotes || 0) - 1);
          
          const unhelpfulVotes = args.voteType === "unhelpful" 
            ? (review.unhelpfulVotes || 0) + 1 
            : Math.max(0, (review.unhelpfulVotes || 0) - 1);

          await ctx.db.patch(args.reviewId, {
            helpfulVotes,
            unhelpfulVotes,
            totalVotes: helpfulVotes + unhelpfulVotes,
            updatedAt: Date.now(),
          });
        }
      }
      return { success: true };
    }

    // Create new vote
    await ctx.db.insert("reviewVotes", {
      reviewId: args.reviewId,
      userId: args.userId,
      userEmail: args.userEmail,
      voteType: args.voteType,
      createdAt: Date.now(),
      ipAddress: args.ipAddress,
    });

    // Update review vote counts
    const review = await ctx.db.get(args.reviewId);
    if (review) {
      const helpfulVotes = args.voteType === "helpful" 
        ? (review.helpfulVotes || 0) + 1 
        : (review.helpfulVotes || 0);
      
      const unhelpfulVotes = args.voteType === "unhelpful" 
        ? (review.unhelpfulVotes || 0) + 1 
        : (review.unhelpfulVotes || 0);

      await ctx.db.patch(args.reviewId, {
        helpfulVotes,
        unhelpfulVotes,
        totalVotes: helpfulVotes + unhelpfulVotes,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Report review for abuse
export const reportReview = mutation({
  args: {
    reviewId: v.id("productReviews"),
    reportedBy: v.string(),
    reporterEmail: v.string(),
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate_content"),
      v.literal("fake_review"),
      v.literal("offensive_language"),
      v.literal("irrelevant"),
      v.literal("personal_information"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already reported this review
    const existingReport = await ctx.db
      .query("reviewReports")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .filter((q) => q.eq(q.field("reportedBy"), args.reportedBy))
      .first();

    if (existingReport) {
      throw new Error("You have already reported this review");
    }

    const now = Date.now();

    // Create report
    await ctx.db.insert("reviewReports", {
      reviewId: args.reviewId,
      reportedBy: args.reportedBy,
      reporterEmail: args.reporterEmail,
      reason: args.reason,
      description: args.description?.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ipAddress: args.ipAddress,
    });

    // Update review reported count
    const review = await ctx.db.get(args.reviewId);
    if (review) {
      await ctx.db.patch(args.reviewId, {
        reportedCount: (review.reportedCount || 0) + 1,
        updatedAt: now,
      });

      // Auto-hide review if it has multiple reports (5 or more)
      if ((review.reportedCount || 0) >= 5) {
        await ctx.db.patch(args.reviewId, {
          status: "hidden",
          isVisible: false,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

// ADMIN FUNCTIONS

// Get all reviews for admin management
export const getAllReviews = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { status, search, limit = 20, offset = 0 } = args;

    let reviews;

    // Apply status filter if provided
    if (status && status !== "all") {
      reviews = await ctx.db
        .query("productReviews")
        .withIndex("by_status", (q) => q.eq("status", status as any))
        .order("desc")
        .collect();
    } else {
      reviews = await ctx.db
        .query("productReviews")
        .order("desc")
        .collect();
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      reviews = reviews.filter(review => 
        review.title.toLowerCase().includes(searchTerm) ||
        review.content.toLowerCase().includes(searchTerm) ||
        review.userName.toLowerCase().includes(searchTerm) ||
        review.userEmail.toLowerCase().includes(searchTerm)
      );
    }

    // Get product details for each review
    const reviewsWithProducts = await Promise.all(
      reviews.slice(offset, offset + limit).map(async (review) => {
        const product = await ctx.db
          .query("products")
          .withIndex("by_product_id", (q) => q.eq("productId", review.productId))
          .first();

        return {
          ...review,
          product: product ? {
            title: product.title,
            images: product.images,
          } : null,
        };
      })
    );

    return {
      reviews: reviewsWithProducts,
      hasMore: offset + limit < reviews.length,
      totalCount: reviews.length,
    };
  },
});

// Get review statistics for admin dashboard
export const getReviewStats = query({
  args: {},
  handler: async (ctx) => {
    const allReviews = await ctx.db.query("productReviews").collect();

    const stats = {
      total: allReviews.length,
      pending: allReviews.filter(r => r.status === "pending").length,
      approved: allReviews.filter(r => r.status === "approved").length,
      rejected: allReviews.filter(r => r.status === "rejected").length,
      flagged: allReviews.filter(r => r.status === "flagged").length,
      hidden: allReviews.filter(r => r.status === "hidden").length,
      averageRating: allReviews.length > 0 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
        : 0,
    };

    return stats;
  },
});

// Update review status (admin only)
export const updateReviewStatus = mutation({
  args: {
    reviewId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("flagged"),
      v.literal("hidden")
    ),
    moderationReason: v.optional(v.string()),
    moderatedBy: v.string(),
    moderationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("productReviews")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .first();

    if (!review) {
      throw new Error("Review not found");
    }

    const now = Date.now();

    await ctx.db.patch(review._id, {
      status: args.status,
      moderatedAt: now,
      moderationReason: args.moderationReason,
      moderationNotes: args.moderationNotes,
      isVisible: args.status === "approved",
      updatedAt: now,
    });

    return { success: true };
  },
});

// Toggle review highlight status (admin only)
export const toggleReviewHighlight = mutation({
  args: {
    reviewId: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("productReviews")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .first();

    if (!review) {
      throw new Error("Review not found");
    }

    await ctx.db.patch(review._id, {
      isHighlighted: !review.isHighlighted,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Add admin response to review
export const addAdminResponse = mutation({
  args: {
    reviewId: v.string(),
    content: v.string(),
    isPublic: v.boolean(),
    respondedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("productReviews")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .first();

    if (!review) {
      throw new Error("Review not found");
    }

    const now = Date.now();

    await ctx.db.patch(review._id, {
      adminResponse: {
        content: args.content.trim(),
        isPublic: args.isPublic,
        respondedAt: now,
        respondedBy: args.respondedBy as any,
      },
      updatedAt: now,
    });

    return { success: true };
  },
});

// Delete admin response from review
export const deleteAdminResponse = mutation({
  args: {
    reviewId: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("productReviews")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .first();

    if (!review) {
      throw new Error("Review not found");
    }

    await ctx.db.patch(review._id, {
      adminResponse: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete review (admin only)
export const deleteReview = mutation({
  args: {
    reviewId: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db
      .query("productReviews")
      .withIndex("by_review_id", (q) => q.eq("reviewId", args.reviewId))
      .first();

    if (!review) {
      throw new Error("Review not found");
    }

    // Delete associated votes
    const votes = await ctx.db
      .query("reviewVotes")
      .withIndex("by_review_id", (q) => q.eq("reviewId", review._id))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete associated reports
    const reports = await ctx.db
      .query("reviewReports")
      .withIndex("by_review_id", (q) => q.eq("reviewId", review._id))
      .collect();

    for (const report of reports) {
      await ctx.db.delete(report._id);
    }

    // Delete the review
    await ctx.db.delete(review._id);

    return { success: true };
  },
});