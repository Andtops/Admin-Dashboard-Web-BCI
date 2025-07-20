import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to get all messages for a specific quotation
export const getQuotationMessages = query({
  args: { 
    quotationId: v.id("quotations"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("quotationMessages")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
      .collect();
    
    // Sort by creation date (oldest first for chat-like display)
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    // Apply pagination if specified
    if (args.limit !== undefined || args.offset !== undefined) {
      const offset = args.offset || 0;
      const limit = args.limit || 50;
      return messages.slice(offset, offset + limit);
    }
    
    return messages;
  },
});

// Mutation to create a new message
export const createQuotationMessage = mutation({
  args: {
    quotationId: v.id("quotations"),
    authorId: v.string(),
    authorName: v.string(),
    authorRole: v.union(v.literal("user"), v.literal("admin")),
    content: v.string(),
    messageType: v.optional(v.union(
      v.literal("message"),
      v.literal("system_notification"),
      v.literal("closure_request"),
      v.literal("closure_permission_granted"),
      v.literal("closure_permission_rejected"),
      v.literal("thread_closed")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify the quotation exists
    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    // Check if thread is still active
    if (quotation.threadStatus === "closed") {
      throw new Error("Cannot send message to closed thread");
    }
    
    const messageId = await ctx.db.insert("quotationMessages", {
      quotationId: args.quotationId,
      authorId: args.authorId,
      authorName: args.authorName,
      authorRole: args.authorRole,
      content: args.content,
      messageType: args.messageType || "message",
      isReadByUser: args.authorRole === "user", // Mark as read by sender
      isReadByAdmin: args.authorRole === "admin", // Mark as read by sender
      createdAt: now,
      updatedAt: now,
    });

    // Update quotation's updatedAt timestamp
    await ctx.db.patch(args.quotationId, {
      updatedAt: now,
    });

    // Create notification for the recipient
    if (args.messageType === "message") {
      const recipientType = args.authorRole === "user" ? "all_admins" : "specific_user";
      let recipientId: Id<"users"> | undefined;

      if (recipientType === "specific_user") {
        // Find the user by userId
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("userId", quotation.userId))
          .first();
        recipientId = user?._id;
      }

      await ctx.db.insert("notifications", {
        type: "order_notification",
        title: "New Message in Quotation",
        message: `New message from ${args.authorName} in quotation thread`,
        recipientType,
        recipientId,
        isRead: false,
        priority: "medium",
        relatedEntityType: "order",
        relatedEntityId: args.quotationId,
        createdAt: now,
      });
    }
    
    return messageId;
  },
});

// Mutation to mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    quotationId: v.id("quotations"),
    readerRole: v.union(v.literal("user"), v.literal("admin")),
    messageIds: v.optional(v.array(v.id("quotationMessages"))), // If not provided, marks all unread messages
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let messagesToUpdate;

    if (args.messageIds && args.messageIds.length > 0) {
      // Mark specific messages as read
      messagesToUpdate = args.messageIds;
    } else {
      // Mark all unread messages in the quotation as read
      const allMessages = await ctx.db
        .query("quotationMessages")
        .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
        .collect();

      messagesToUpdate = allMessages
        .filter(msg => {
          if (args.readerRole === "user") {
            return !msg.isReadByUser && msg.authorRole !== "user";
          } else {
            return !msg.isReadByAdmin && msg.authorRole !== "admin";
          }
        })
        .map(msg => msg._id);
    }

    // Update read status for each message
    for (const messageId of messagesToUpdate) {
      const updateData: any = { updatedAt: now };
      
      if (args.readerRole === "user") {
        updateData.isReadByUser = true;
        updateData.readByUserAt = now;
      } else {
        updateData.isReadByAdmin = true;
        updateData.readByAdminAt = now;
      }

      await ctx.db.patch(messageId, updateData);
    }

    return messagesToUpdate.length;
  },
});

// Query to get unread message count for a quotation
export const getUnreadMessageCount = query({
  args: {
    quotationId: v.id("quotations"),
    readerRole: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("quotationMessages")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
      .collect();

    const unreadCount = messages.filter(msg => {
      if (args.readerRole === "user") {
        return !msg.isReadByUser && msg.authorRole !== "user";
      } else {
        return !msg.isReadByAdmin && msg.authorRole !== "admin";
      }
    }).length;

    return unreadCount;
  },
});

// Mutation to request thread closure (admin only)
export const requestThreadClosure = mutation({
  args: {
    quotationId: v.id("quotations"),
    adminId: v.string(),
    adminName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify the quotation exists and is not already closed
    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    if (quotation.threadStatus === "closed") {
      throw new Error("Thread is already closed");
    }

    // Update quotation status to awaiting user permission
    await ctx.db.patch(args.quotationId, {
      threadStatus: "awaiting_user_permission",
      closureRequestedBy: args.adminId,
      closureRequestedAt: now,
      closureReason: args.reason,
      updatedAt: now,
    });

    // Create system message about closure request
    await ctx.db.insert("quotationMessages", {
      quotationId: args.quotationId,
      authorId: args.adminId,
      authorName: args.adminName,
      authorRole: "admin",
      content: `Admin has requested to close this thread. ${args.reason ? `Reason: ${args.reason}` : ''}`,
      messageType: "closure_request",
      isReadByUser: false,
      isReadByAdmin: true,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  },
});

// Mutation to grant permission for thread closure (user only)
export const grantClosurePermission = mutation({
  args: {
    quotationId: v.id("quotations"),
    userId: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify the quotation exists and is awaiting permission
    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    if (quotation.threadStatus !== "awaiting_user_permission") {
      throw new Error("Thread closure permission not requested");
    }

    // Update quotation with user permission
    await ctx.db.patch(args.quotationId, {
      threadStatus: "user_approved_closure",
      userPermissionToClose: true,
      userPermissionGrantedAt: now,
      updatedAt: now,
    });

    // Create system message about permission granted
    await ctx.db.insert("quotationMessages", {
      quotationId: args.quotationId,
      authorId: args.userId,
      authorName: args.userName,
      authorRole: "user",
      content: "User has approved the thread closure request.",
      messageType: "closure_permission_granted",
      isReadByUser: true,
      isReadByAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  },
});

// Mutation to reject thread closure (user only)
export const rejectClosureRequest = mutation({
  args: {
    quotationId: v.id("quotations"),
    userId: v.string(),
    userName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify the quotation exists and is awaiting permission
    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    if (quotation.threadStatus !== "awaiting_user_permission") {
      throw new Error("Thread closure permission not requested");
    }

    // Update quotation to reject closure and revert to active
    await ctx.db.patch(args.quotationId, {
      threadStatus: "active",
      userPermissionToClose: false,
      closureRejectedAt: now,
      closureRejectionReason: args.reason,
      updatedAt: now,
    });

    // Create system message about permission rejected
    const content = args.reason 
      ? `User has rejected the thread closure request. Reason: ${args.reason}`
      : "User has rejected the thread closure request.";

    await ctx.db.insert("quotationMessages", {
      quotationId: args.quotationId,
      authorId: args.userId,
      authorName: args.userName,
      authorRole: "user",
      content,
      messageType: "closure_permission_rejected",
      isReadByUser: true,
      isReadByAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  },
});

// Mutation to close thread (admin only, after user permission)
export const closeThread = mutation({
  args: {
    quotationId: v.id("quotations"),
    adminId: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verify the quotation exists and user has approved closure
    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    if (quotation.threadStatus !== "user_approved_closure") {
      throw new Error("User permission required to close thread");
    }

    // Close the thread
    await ctx.db.patch(args.quotationId, {
      threadStatus: "closed",
      closedBy: args.adminId,
      closedAt: now,
      updatedAt: now,
    });

    // Create system message about thread closure
    await ctx.db.insert("quotationMessages", {
      quotationId: args.quotationId,
      authorId: args.adminId,
      authorName: args.adminName,
      authorRole: "admin",
      content: "Thread has been closed by admin.",
      messageType: "thread_closed",
      isReadByUser: false,
      isReadByAdmin: true,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  },
});

// Query to get quotations with unread messages (for admin dashboard)
export const getQuotationsWithUnreadMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get all active quotations
    const quotations = await ctx.db
      .query("quotations")
      .withIndex("by_thread_status", (q) => q.eq("threadStatus", "active"))
      .take(limit * 2); // Get more to filter

    const quotationsWithUnread = [];

    for (const quotation of quotations) {
      // Check for unread messages from users
      const unreadMessages = await ctx.db
        .query("quotationMessages")
        .withIndex("by_quotationId", (q) => q.eq("quotationId", quotation._id))
        .filter((q) => q.and(
          q.eq(q.field("authorRole"), "user"),
          q.eq(q.field("isReadByAdmin"), false)
        ))
        .collect();

      if (unreadMessages.length > 0) {
        quotationsWithUnread.push({
          ...quotation,
          unreadCount: unreadMessages.length,
          lastMessage: unreadMessages[unreadMessages.length - 1],
        });
      }

      if (quotationsWithUnread.length >= limit) break;
    }

    return quotationsWithUnread;
  },
});