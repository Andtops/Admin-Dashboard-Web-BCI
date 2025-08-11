import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get notifications for a specific recipient
export const getNotifications = query({
  args: {
    search: v.optional(v.string()),
    recipientType: v.optional(v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("all_admins"),
      v.literal("specific_user")
    )),
    recipientId: v.optional(v.union(v.id("admins"), v.id("users"))),
    isRead: v.optional(v.boolean()),
    type: v.optional(v.union(
      v.literal("user_registration"),
      v.literal("user_approval"),
      v.literal("user_rejection"),
      v.literal("product_update"),
      v.literal("system_alert"),
      v.literal("gst_verification"),
      v.literal("order_notification")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("notifications");

    // Filter by recipient
    if (args.recipientType === "all_admins") {
      query = query.filter((q) => q.eq(q.field("recipientType"), "all_admins"));
    } else if (args.recipientType === "specific_user" && args.recipientId) {
      query = query.filter((q) =>
        q.and(
          q.eq(q.field("recipientType"), "specific_user"),
          q.eq(q.field("recipientId"), args.recipientId)
        )
      );
    }

    // Filter by read status if provided
    if (args.isRead !== undefined) {
      query = query.filter((q) => q.eq(q.field("isRead"), args.isRead));
    }

    // Filter by type if provided
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    // Filter by priority if provided
    if (args.priority) {
      query = query.filter((q) => q.eq(q.field("priority"), args.priority));
    }

    // Collect all results first
    const allNotifications = await query.collect();

    // Filter out expired notifications
    const now = Date.now();
    let activeNotifications = allNotifications.filter(notification =>
      !notification.expiresAt || notification.expiresAt > now
    );

    // Apply search filter
    if (args.search) {
      activeNotifications = activeNotifications.filter(notification =>
        notification.title.toLowerCase().includes(args.search!.toLowerCase()) ||
        notification.message.toLowerCase().includes(args.search!.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    activeNotifications.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const notifications = activeNotifications.slice(offset, offset + limit);

    return notifications;
  },
});

// Query to get unread notification count
export const getUnreadCount = query({
  args: {
    recipientType: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("all_admins"),
      v.literal("specific_user")
    ),
    recipientId: v.optional(v.union(v.id("admins"), v.id("users"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("notifications");
    
    // Filter by recipient
    if (args.recipientType === "all_admins") {
      query = query.filter((q) => q.eq(q.field("recipientType"), "all_admins"));
    } else if (args.recipientType === "specific_user" && args.recipientId) {
      query = query.filter((q) => 
        q.and(
          q.eq(q.field("recipientType"), "specific_user"),
          q.eq(q.field("recipientId"), args.recipientId)
        )
      );
    }
    
    // Filter unread notifications
    query = query.filter((q) => q.eq(q.field("isRead"), false));
    
    // Filter out expired notifications
    const now = Date.now();
    query = query.filter((q) => 
      q.or(
        q.eq(q.field("expiresAt"), undefined),
        q.gt(q.field("expiresAt"), now)
      )
    );
    
    const notifications = await query.collect();
    return notifications.length;
  },
});

// Mutation to create a new notification
export const createNotification = mutation({
  args: {
    type: v.union(
      v.literal("user_registration"),
      v.literal("user_approval"),
      v.literal("user_rejection"),
      v.literal("product_update"),
      v.literal("system_alert"),
      v.literal("gst_verification"),
      v.literal("order_notification")
    ),
    title: v.string(),
    message: v.string(),
    recipientType: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("all_admins"),
      v.literal("specific_user")
    ),
    recipientId: v.optional(v.union(v.id("admins"), v.id("users"))),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    relatedEntityType: v.optional(v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("order")
    )),
    relatedEntityId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdBy: v.optional(v.id("admins")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const notificationId = await ctx.db.insert("notifications", {
      type: args.type,
      title: args.title,
      message: args.message,
      recipientType: args.recipientType,
      recipientId: args.recipientId,
      isRead: false,
      priority: args.priority || "medium",
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      createdAt: now,
      expiresAt: args.expiresAt,
      createdBy: args.createdBy,
    });

    return notificationId;
  },
});

// Mutation to mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: now,
      readBy: args.adminId,
    });

    return args.notificationId;
  },
});

// Mutation to mark multiple notifications as read
export const markMultipleAsRead = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
    readBy: v.union(v.id("admins"), v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updatedIds = [];

    for (const notificationId of args.notificationIds) {
      const notification = await ctx.db.get(notificationId);
      if (notification && !notification.isRead) {
        await ctx.db.patch(notificationId, {
          isRead: true,
          readAt: now,
          readBy: args.readBy,
        });
        updatedIds.push(notificationId);
      }
    }

    return updatedIds;
  },
});

// Mutation to mark all notifications as read for a recipient
export const markAllAsRead = mutation({
  args: {
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("notifications");

    // Get all unread notifications for admins
    query = query.filter((q) => q.eq(q.field("isRead"), false));

    const unreadNotifications = await query.collect();
    const now = Date.now();
    const updatedIds = [];

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
        readBy: args.adminId,
      });
      updatedIds.push(notification._id);
    }

    return updatedIds;
  },
});

// Mutation to delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});

// Mutation to delete expired notifications (cleanup)
export const deleteExpiredNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredNotifications = await ctx.db
      .query("notifications")
      .filter((q) => 
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    const deletedIds = [];
    for (const notification of expiredNotifications) {
      await ctx.db.delete(notification._id);
      deletedIds.push(notification._id);
    }

    return deletedIds;
  },
});

// Query to get notification statistics
export const getNotificationStats = query({
  args: {},
  handler: async (ctx) => {
    const allNotifications = await ctx.db.query("notifications").collect();
    const now = Date.now();
    
    // Filter out expired notifications
    const activeNotifications = allNotifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );
    
    const stats = {
      total: activeNotifications.length,
      unread: activeNotifications.filter(n => !n.isRead).length,
      read: activeNotifications.filter(n => n.isRead).length,
      byType: {
        user_registration: activeNotifications.filter(n => n.type === "user_registration").length,
        user_approval: activeNotifications.filter(n => n.type === "user_approval").length,
        user_rejection: activeNotifications.filter(n => n.type === "user_rejection").length,
        product_update: activeNotifications.filter(n => n.type === "product_update").length,
        system_alert: activeNotifications.filter(n => n.type === "system_alert").length,
        gst_verification: activeNotifications.filter(n => n.type === "gst_verification").length,
        order_notification: activeNotifications.filter(n => n.type === "order_notification").length,
      },
      byPriority: {
        low: activeNotifications.filter(n => n.priority === "low").length,
        medium: activeNotifications.filter(n => n.priority === "medium").length,
        high: activeNotifications.filter(n => n.priority === "high").length,
        urgent: activeNotifications.filter(n => n.priority === "urgent").length,
      },
      recentNotifications: activeNotifications.filter(n => 
        n.createdAt > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
      ).length,
    };
    
    return stats;
  },
});

// FCM Token Management

// Mutation to register FCM token
export const registerFCMToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    deviceInfo: v.object({
      platform: v.optional(v.string()),
      version: v.optional(v.any()),
      model: v.optional(v.string()),
      appVersion: v.optional(v.string()),
    }),
    userId: v.optional(v.union(v.id("users"), v.id("admins"))),
    registeredAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if token already exists
    const existingToken = await ctx.db
      .query("fcmTokens")
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();

    if (existingToken) {
      // Update existing token
      await ctx.db.patch(existingToken._id, {
        platform: args.platform,
        deviceInfo: args.deviceInfo,
        userId: args.userId,
        lastUpdated: args.registeredAt,
        isActive: true,
      });
      return existingToken._id;
    } else {
      // Create new token record
      return await ctx.db.insert("fcmTokens", {
        token: args.token,
        platform: args.platform,
        deviceInfo: args.deviceInfo,
        userId: args.userId,
        registeredAt: args.registeredAt,
        lastUpdated: args.registeredAt,
        isActive: true,
      });
    }
  },
});

// Mutation to unregister FCM token
export const unregisterFCMToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("fcmTokens")
      .filter((q) => q.eq(q.field("token"), args.token))
      .first();

    if (tokenRecord) {
      await ctx.db.patch(tokenRecord._id, {
        isActive: false,
        unregisteredAt: Date.now(),
      });
    }
  },
});

// Query to get FCM tokens for specific users
export const getFCMTokensForUsers = query({
  args: {
    userIds: v.array(v.union(v.id("users"), v.id("admins"))),
  },
  handler: async (ctx, args) => {
    const tokens = [];

    for (const userId of args.userIds) {
      const userTokens = await ctx.db
        .query("fcmTokens")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("isActive"), true)
          )
        )
        .collect();

      tokens.push(...userTokens);
    }

    return tokens;
  },
});

// Query to get all active FCM tokens
export const getAllActiveFCMTokens = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("fcmTokens")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Mutation to log push notification
export const logPushNotification = mutation({
  args: {
    target: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.any(),
    result: v.object({
      success: v.boolean(),
      message: v.string(),
      successCount: v.number(),
      failureCount: v.number(),
    }),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pushNotificationLogs", {
      target: args.target,
      title: args.title,
      body: args.body,
      data: args.data,
      result: args.result,
      sentAt: args.sentAt,
    });
  },
});

// Query to get all push notification logs
export const getAllPushNotificationLogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const offset = args.offset || 0;
    
    const logs = await ctx.db
      .query("pushNotificationLogs")
      .order("desc")
      .collect();
    
    // Apply pagination
    return logs.slice(offset, offset + limit);
  },
});
