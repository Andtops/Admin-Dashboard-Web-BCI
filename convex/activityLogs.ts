import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get activity logs
export const getActivityLogs = query({
  args: {
    search: v.optional(v.string()),
    entityType: v.optional(v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("admin"),
      v.literal("setting"),
      v.literal("api_key"),
      v.literal("notification")
    )),
    action: v.optional(v.string()),
    performedByType: v.optional(v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("system")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("activityLogs");
    
    // Filter by entity type if provided
    if (args.entityType) {
      query = query.filter((q) => q.eq(q.field("entityType"), args.entityType));
    }
    
    // Filter by action if provided
    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action));
    }
    
    // Filter by performer type if provided
    if (args.performedByType) {
      query = query.filter((q) => q.eq(q.field("performedByType"), args.performedByType));
    }
    
    // Collect all results first
    const allLogs = await query.collect();

    // Apply search filter
    let filteredLogs = allLogs;
    if (args.search) {
      filteredLogs = allLogs.filter(log =>
        log.action.toLowerCase().includes(args.search!.toLowerCase()) ||
        log.entityType.toLowerCase().includes(args.search!.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(args.search!.toLowerCase())) ||
        (log.performedBy && log.performedBy.toLowerCase().includes(args.search!.toLowerCase()))
      );
    }

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const logs = filteredLogs.slice(offset, offset + limit);
    
    return logs;
  },
});

// Query to get activity statistics
export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("activityLogs").collect();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: allLogs.length,
      today: allLogs.filter(log => log.createdAt > oneDayAgo).length,
      thisWeek: allLogs.filter(log => log.createdAt > oneWeekAgo).length,
      byEntityType: {
        user: allLogs.filter(log => log.entityType === "user").length,
        product: allLogs.filter(log => log.entityType === "product").length,
        admin: allLogs.filter(log => log.entityType === "admin").length,
        setting: allLogs.filter(log => log.entityType === "setting").length,
        api_key: allLogs.filter(log => log.entityType === "api_key").length,
      },
      byAction: {
        create: allLogs.filter(log => log.action.includes("create")).length,
        update: allLogs.filter(log => log.action.includes("update")).length,
        delete: allLogs.filter(log => log.action.includes("delete")).length,
        approve: allLogs.filter(log => log.action.includes("approve")).length,
        reject: allLogs.filter(log => log.action.includes("reject")).length,
      },
      byPerformer: {
        admin: allLogs.filter(log => log.performedByType === "admin").length,
        user: allLogs.filter(log => log.performedByType === "user").length,
        system: allLogs.filter(log => log.performedByType === "system").length,
      },
    };
    
    return stats;
  },
});

// Mutation to create an activity log
export const createActivityLog = mutation({
  args: {
    action: v.string(),
    entityType: v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("admin"),
      v.literal("setting"),
      v.literal("api_key"),
      v.literal("notification")
    ),
    entityId: v.string(),
    oldValues: v.optional(v.any()),
    newValues: v.optional(v.any()),
    performedBy: v.union(v.id("admins"), v.id("users")),
    performedByType: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("system")
    ),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const logId = await ctx.db.insert("activityLogs", {
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      oldValues: args.oldValues,
      newValues: args.newValues,
      performedBy: args.performedBy,
      performedByType: args.performedByType,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
    });

    return logId;
  },
});

// Mutation to delete old activity logs (cleanup)
export const deleteOldActivityLogs = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);
    
    const oldLogs = await ctx.db
      .query("activityLogs")
      .filter((q) => q.lt(q.field("createdAt"), cutoffDate))
      .collect();

    const deletedIds = [];
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deletedIds.push(log._id);
    }

    return deletedIds;
  },
});
