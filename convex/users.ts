import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all users with pagination and filtering
export const getUsers = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    )),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users");
    
    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    // Apply search if provided
    if (args.search) {
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("email"), args.search),
          q.eq(q.field("firstName"), args.search),
          q.eq(q.field("lastName"), args.search),
          q.eq(q.field("businessName"), args.search),
          q.eq(q.field("gstNumber"), args.search)
        )
      );
    }
    
    // Collect all results first, then apply pagination and ordering
    const allUsers = await query.collect();

    // Sort by creation date (newest first)
    allUsers.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const users = allUsers.slice(offset, offset + limit);
    
    return users;
  },
});

// Query to get user by ID
export const getUserById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Query to get user by user ID
export const getUserByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Query to get users pending approval
export const getPendingUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Sort by creation date (newest first) and apply limit
    pendingUsers.sort((a, b) => b.createdAt - a.createdAt);
    return pendingUsers.slice(0, limit);
  },
});

// Mutation to create or update user data
export const upsertUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    isGstVerified: v.optional(v.boolean()),
    legalNameOfBusiness: v.optional(v.string()),
    tradeName: v.optional(v.string()),
    constitutionOfBusiness: v.optional(v.string()),
    taxpayerType: v.optional(v.string()),
    gstStatus: v.optional(v.string()),
    principalPlaceOfBusiness: v.optional(v.string()),
    agreedToEmailMarketing: v.optional(v.boolean()),
    agreedToSmsMarketing: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        businessName: args.businessName,
        gstNumber: args.gstNumber,
        isGstVerified: args.isGstVerified,
        legalNameOfBusiness: args.legalNameOfBusiness,
        tradeName: args.tradeName,
        constitutionOfBusiness: args.constitutionOfBusiness,
        taxpayerType: args.taxpayerType,
        gstStatus: args.gstStatus,
        principalPlaceOfBusiness: args.principalPlaceOfBusiness,
        agreedToEmailMarketing: args.agreedToEmailMarketing,
        agreedToSmsMarketing: args.agreedToSmsMarketing,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const newUserId = await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        businessName: args.businessName,
        gstNumber: args.gstNumber,
        isGstVerified: args.isGstVerified,
        status: "pending", // New users start as pending
        role: "user",
        legalNameOfBusiness: args.legalNameOfBusiness,
        tradeName: args.tradeName,
        constitutionOfBusiness: args.constitutionOfBusiness,
        taxpayerType: args.taxpayerType,
        gstStatus: args.gstStatus,
        principalPlaceOfBusiness: args.principalPlaceOfBusiness,
        agreedToEmailMarketing: args.agreedToEmailMarketing,
        agreedToSmsMarketing: args.agreedToSmsMarketing,
        createdAt: now,
        updatedAt: now,
      });

      // Create notification for new user registration
      await ctx.db.insert("notifications", {
        type: "user_registration",
        title: "New User Registration",
        message: `New user ${args.firstName} ${args.lastName} (${args.email}) has registered and is pending approval.`,
        recipientType: "all_admins",
        isRead: false,
        priority: "medium",
        relatedEntityType: "user",
        relatedEntityId: newUserId,
        createdAt: now,
      });

      return newUserId;
    }
  },
});

// Mutation to approve user
export const approveUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("admins"),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    
    await ctx.db.patch(args.userId, {
      status: "approved",
      approvedBy: args.adminId,
      approvedAt: now,
      updatedAt: now,
    });

    // Create notification for user approval
    const defaultMessage = "Your account has been approved and you can now access all features.";
    const notificationMessage = args.customMessage || defaultMessage;

    await ctx.db.insert("notifications", {
      type: "user_approval",
      title: "Account Approved",
      message: notificationMessage,
      recipientType: "specific_user",
      recipientId: args.userId,
      isRead: false,
      priority: "high",
      relatedEntityType: "user",
      relatedEntityId: args.userId,
      createdAt: now,
      createdBy: args.adminId,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "user_approved",
      entityType: "user",
      entityId: args.userId,
      oldValues: { status: user.status },
      newValues: { status: "approved", customMessage: args.customMessage },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    // Send email notification
    try {
      await ctx.db.insert("emailLogs", {
        to: user.email,
        subject: "🎉 Your Benzochem Industries Account Has Been Approved!",
        type: "USER_APPROVED",
        htmlContent: `Account approved for ${user.firstName} ${user.lastName}`,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          businessName: user.businessName,
        },
        customMessage: args.customMessage,
        status: "sent",
        sentAt: now,
        createdAt: now,
      });
    } catch (emailError) {
      console.error("Failed to log email notification:", emailError);
      // Don't fail the approval if email logging fails
    }

    return args.userId;
  },
});

// Mutation to reject user
export const rejectUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("admins"),
    reason: v.string(),
    customMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    
    await ctx.db.patch(args.userId, {
      status: "rejected",
      rejectedBy: args.adminId,
      rejectedAt: now,
      rejectionReason: args.reason,
      updatedAt: now,
    });

    // Create notification for user rejection
    const defaultMessage = `Your account has been rejected. Reason: ${args.reason}`;
    const notificationMessage = args.customMessage || defaultMessage;

    await ctx.db.insert("notifications", {
      type: "user_rejection",
      title: "Account Application Declined",
      message: notificationMessage,
      recipientType: "specific_user",
      recipientId: args.userId,
      isRead: false,
      priority: "high",
      relatedEntityType: "user",
      relatedEntityId: args.userId,
      createdAt: now,
      createdBy: args.adminId,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "user_rejected",
      entityType: "user",
      entityId: args.userId,
      oldValues: { status: user.status },
      newValues: { status: "rejected", rejectionReason: args.reason, customMessage: args.customMessage },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    // Send email notification
    try {
      await ctx.db.insert("emailLogs", {
        to: user.email,
        subject: "Update on Your Benzochem Industries Account Application",
        type: "USER_REJECTED",
        htmlContent: `Account rejected for ${user.firstName} ${user.lastName}`,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          businessName: user.businessName,
        },
        reason: args.reason,
        customMessage: args.customMessage,
        status: "sent",
        sentAt: now,
        createdAt: now,
      });
    } catch (emailError) {
      console.error("Failed to log email notification:", emailError);
      // Don't fail the rejection if email logging fails
    }

    return args.userId;
  },
});

// Mutation to update user login timestamp
export const updateLastLogin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      lastLoginAt: now,
      updatedAt: now,
    });
    return args.userId;
  },
});



// Query to get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();

    const stats = {
      total: allUsers.length,
      pending: allUsers.filter(u => u.status === "pending").length,
      approved: allUsers.filter(u => u.status === "approved").length,
      rejected: allUsers.filter(u => u.status === "rejected").length,
      suspended: allUsers.filter(u => u.status === "suspended").length,
      recentRegistrations: allUsers.filter(u =>
        u.createdAt > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      ).length,
    };

    return stats;
  },
});
