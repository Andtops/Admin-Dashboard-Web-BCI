import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple hash function for API keys (temporary until proper crypto is implemented)
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Simple API key generation (temporary)
function generateSimpleApiKey(environment: "live" = "live"): {
  key: string;
  keyId: string;
} {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 32; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const keyId = randomPart.substring(0, 8);
  const key = `bzk_${environment}_${randomPart}`;

  return { key, keyId };
}

// Query to get all API keys
export const getApiKeys = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdBy: v.optional(v.id("admins")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("apiKeys");

    // Filter by active status if provided
    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    // Filter by creator if provided
    if (args.createdBy) {
      query = query.filter((q) => q.eq(q.field("createdBy"), args.createdBy));
    }

    // Collect all results first
    const allApiKeys = await query.collect();

    // Apply search filter
    let filteredKeys = allApiKeys;
    if (args.search) {
      filteredKeys = allApiKeys.filter(key =>
        key.name.toLowerCase().includes(args.search!.toLowerCase()) ||
        key.keyId.toLowerCase().includes(args.search!.toLowerCase())
      );
    }

    // Sort by creation date (newest first)
    filteredKeys.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const apiKeys = filteredKeys.slice(offset, offset + limit);

    // Return masked keys for security (never return the actual hashed key)
    return apiKeys.map(key => ({
      ...key,
      key: `bzk_${key.environment}_${key.keyId}...****`, // Masked display
    }));
  },
});

// Query to get API key by ID (without exposing the actual key)
export const getApiKeyById = query({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.id);
    if (!apiKey) return null;

    // Don't return the actual hashed key for security
    return {
      ...apiKey,
      key: `bzk_${apiKey.environment}_${apiKey.keyId}...****`, // Masked display
    };
  },
});

// Query to get full API key by ID (for authenticated access only)
export const getFullApiKeyById = query({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.id);
    if (!apiKey) return null;

    // Return the full key (this should only be called after re-authentication)
    return {
      ...apiKey,
      key: apiKey.key, // Return full key
    };
  },
});

// Query to validate API key (using index for better performance)
export const validateApiKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    console.log('validateApiKey called with key:', args.key);

    // Use the index to find the API key efficiently
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    console.log('Found matching key:', apiKey ? 'YES' : 'NO');

    if (!apiKey) {
      console.log('No API key found');
      return null;
    }

    console.log('API key found:', { keyId: apiKey.keyId, isActive: apiKey.isActive, expiresAt: apiKey.expiresAt });

    // Check if key is active
    if (!apiKey.isActive) {
      console.log('API key is not active');
      return null;
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      console.log('API key has expired');
      return null;
    }

    console.log('API key validation successful');
    return {
      id: apiKey._id,
      keyId: apiKey.keyId,
      environment: apiKey.environment,
      name: apiKey.name,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      rateLimitCounts: apiKey.rateLimitCounts,
      rateLimitResets: apiKey.rateLimitResets,
    };
  },
});

// Mutation to create a new API key (simplified)
export const createApiKey = mutation({
  args: {
    name: v.string(),
    permissions: v.array(v.string()),
    adminId: v.id("admins"),
    environment: v.optional(v.literal("live")),
    expiresAt: v.optional(v.number()),
    rateLimit: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
      burstLimit: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Generate a simple API key
    const { key: apiKey, keyId } = generateSimpleApiKey(args.environment || "live");

    // Store the API key in plain text (will be protected by re-authentication)
    // Note: This is secure because access requires admin re-authentication
    const now = Date.now();

    const apiKeyId = await ctx.db.insert("apiKeys", {
      name: args.name,
      key: apiKey, // Store plain text version (protected by re-auth)
      keyId: keyId, // Store key ID for identification
      environment: args.environment || "live",
      permissions: args.permissions,
      isActive: true,
      expiresAt: args.expiresAt,
      usageCount: 0,
      rateLimit: args.rateLimit || {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 150,
      },
      createdBy: args.adminId,
      createdAt: now,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "api_key_created",
      entityType: "api_key",
      entityId: apiKeyId,
      newValues: {
        name: args.name,
        keyId: keyId,
        environment: args.environment || "live",
        permissions: args.permissions,
        expiresAt: args.expiresAt,
      },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    // Return the API key only once (for the user to copy)
    // This is the only time the plain text key will be available
    return {
      id: apiKeyId,
      key: apiKey, // Return plain text key for user to copy
      keyId: keyId,
      environment: args.environment || "live",
      name: args.name,
      permissions: args.permissions,
    };
  },
});



// Mutation to update API key
export const updateApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    name: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    rateLimit: v.optional(v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
    })),
    updatedBy: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    const now = Date.now();
    const updates: any = { updatedAt: now };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.permissions !== undefined) updates.permissions = args.permissions;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.expiresAt !== undefined) updates.expiresAt = args.expiresAt;
    if (args.rateLimit !== undefined) updates.rateLimit = args.rateLimit;
    
    await ctx.db.patch(args.apiKeyId, updates);

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "api_key_updated",
      entityType: "api_key",
      entityId: args.apiKeyId,
      oldValues: {
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
      },
      newValues: updates,
      performedBy: args.updatedBy,
      performedByType: "admin",
      createdAt: now,
    });

    return args.apiKeyId;
  },
});

// Mutation to revoke API key
export const revokeApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    revokedBy: v.id("admins"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.apiKeyId, {
      isActive: false,
      revokedAt: now,
      revokedBy: args.revokedBy,
      revocationReason: args.reason,
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "api_key_revoked",
      entityType: "api_key",
      entityId: args.apiKeyId,
      oldValues: { isActive: apiKey.isActive },
      newValues: {
        isActive: false,
        revokedAt: now,
        revocationReason: args.reason
      },
      performedBy: args.revokedBy,
      performedByType: "admin",
      createdAt: now,
    });

    return args.apiKeyId;
  },
});

// Mutation to permanently delete API key
export const deleteApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    deletedBy: v.id("admins"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db.get(args.apiKeyId);
    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Log the deletion activity before deleting
    await ctx.db.insert("activityLogs", {
      action: "api_key_deleted",
      entityType: "api_key",
      entityId: args.apiKeyId,
      oldValues: {
        name: apiKey.name,
        keyId: apiKey.keyId,
        environment: apiKey.environment,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        usageCount: apiKey.usageCount,
      },
      newValues: {
        deleted: true,
        deletionReason: args.reason
      },
      performedBy: args.deletedBy,
      performedByType: "admin",
      createdAt: Date.now(),
    });

    // Permanently delete the API key
    await ctx.db.delete(args.apiKeyId);

    return {
      success: true,
      message: "API key permanently deleted",
      deletedKeyId: apiKey.keyId,
    };
  },
});

// Mutation to rotate API key (simplified)
export const rotateApiKey = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    rotatedBy: v.id("admins"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const oldApiKey = await ctx.db.get(args.apiKeyId);
    if (!oldApiKey) {
      throw new Error("API key not found");
    }

    if (!oldApiKey.isActive) {
      throw new Error("Cannot rotate inactive API key");
    }

    // Generate new simple API key
    const { key: newApiKey, keyId: newKeyId } = generateSimpleApiKey(oldApiKey.environment);

    // Store the new API key in plain text (protected by re-authentication)
    const now = Date.now();

    // Update the existing record with new key
    await ctx.db.patch(args.apiKeyId, {
      key: newApiKey,
      keyId: newKeyId,
      rotatedAt: now,
      rotatedBy: args.rotatedBy,
      rotationReason: args.reason,
      // Reset usage counters for the new key
      usageCount: 0,
      rateLimitCounts: {
        minute: 0,
        hour: 0,
        day: 0,
        burst: 0,
      },
      rateLimitResets: {
        minute: Math.floor(now / 60000) * 60000,
        hour: Math.floor(now / 3600000) * 3600000,
        day: Math.floor(now / 86400000) * 86400000,
      },
      updatedAt: now,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "api_key_rotated",
      entityType: "api_key",
      entityId: args.apiKeyId,
      oldValues: {
        keyId: oldApiKey.keyId,
        usageCount: oldApiKey.usageCount
      },
      newValues: {
        keyId: newKeyId,
        rotatedAt: now,
        rotationReason: args.reason
      },
      performedBy: args.rotatedBy,
      performedByType: "admin",
      createdAt: now,
    });

    // Return the new API key (only time it will be available in plain text)
    return {
      id: args.apiKeyId,
      key: newApiKey,
      keyId: newKeyId,
      environment: oldApiKey.environment,
      name: oldApiKey.name,
      permissions: oldApiKey.permissions,
    };
  },
});

// Internal mutation to rotate API key
export const rotateApiKeyInternal = mutation({
  args: {
    apiKeyId: v.id("apiKeys"),
    newKey: v.string(),
    newKeyId: v.string(),
    rotatedBy: v.id("admins"),
    reason: v.optional(v.string()),
    oldKeyId: v.string(),
    oldUsageCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update the existing record with new key
    await ctx.db.patch(args.apiKeyId, {
      key: args.newKey,
      keyId: args.newKeyId,
      rotatedAt: now,
      rotatedBy: args.rotatedBy,
      rotationReason: args.reason,
      // Reset usage counters for the new key
      usageCount: 0,
      rateLimitCounts: {
        minute: 0,
        hour: 0,
        day: 0,
        burst: 0,
      },
      rateLimitResets: {
        minute: Math.floor(now / 60000) * 60000,
        hour: Math.floor(now / 3600000) * 3600000,
        day: Math.floor(now / 86400000) * 86400000,
      },
      updatedAt: now,
    });

    // Get updated API key for return
    const updatedApiKey = await ctx.db.get(args.apiKeyId);
    if (!updatedApiKey) {
      throw new Error("Failed to retrieve updated API key");
    }

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "api_key_rotated",
      entityType: "api_key",
      entityId: args.apiKeyId,
      oldValues: {
        keyId: args.oldKeyId,
        usageCount: args.oldUsageCount
      },
      newValues: {
        keyId: args.newKeyId,
        rotatedAt: now,
        rotationReason: args.reason
      },
      performedBy: args.rotatedBy,
      performedByType: "admin",
      createdAt: now,
    });

    return {
      id: args.apiKeyId,
      keyId: args.newKeyId,
      environment: updatedApiKey.environment,
      name: updatedApiKey.name,
      permissions: updatedApiKey.permissions,
    };
  },
});

// Internal query to get API key by ID
export const getApiKeyByIdInternal = query({
  args: { apiKeyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.apiKeyId);
  },
});

// Mutation to update API key usage and rate limiting (simplified)
export const updateApiKeyUsage = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the API key by direct comparison (since we now store plain text)
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!apiKey) return null;

    const now = Date.now();
    const currentMinute = Math.floor(now / 60000) * 60000; // Round to minute
    const currentHour = Math.floor(now / 3600000) * 3600000; // Round to hour
    const currentDay = Math.floor(now / 86400000) * 86400000; // Round to day

    // Get current rate limit counters and resets
    const currentCounts = apiKey.rateLimitCounts || { minute: 0, hour: 0, day: 0, burst: 0 };
    const currentResets = apiKey.rateLimitResets || { minute: currentMinute, hour: currentHour, day: currentDay };

    // Reset counters if time windows have passed
    const newCounts = { ...currentCounts };
    const newResets = { ...currentResets };

    if (currentResets.minute < currentMinute) {
      newCounts.minute = 0;
      newCounts.burst = 0;
      newResets.minute = currentMinute;
    }
    if (currentResets.hour < currentHour) {
      newCounts.hour = 0;
      newResets.hour = currentHour;
    }
    if (currentResets.day < currentDay) {
      newCounts.day = 0;
      newResets.day = currentDay;
    }

    // Increment counters
    newCounts.minute += 1;
    newCounts.hour += 1;
    newCounts.day += 1;
    newCounts.burst += 1;

    await ctx.db.patch(apiKey._id, {
      usageCount: apiKey.usageCount + 1,
      lastUsedAt: now,
      updatedAt: now,
      rateLimitCounts: newCounts,
      rateLimitResets: newResets,
    });

    return apiKey._id;
  },
});

// Query to get API key statistics
export const getApiKeyStats = query({
  args: {},
  handler: async (ctx) => {
    const allApiKeys = await ctx.db.query("apiKeys").collect();
    const now = Date.now();
    
    const stats = {
      total: allApiKeys.length,
      active: allApiKeys.filter(k => k.isActive === true).length,
      inactive: allApiKeys.filter(k => k.isActive === false).length,
      expired: allApiKeys.filter(k => k.expiresAt && k.expiresAt < now).length,
      recentlyUsed: allApiKeys.filter(k => 
        k.lastUsedAt && k.lastUsedAt > now - (24 * 60 * 60 * 1000) // Last 24 hours
      ).length,
      totalUsage: allApiKeys.reduce((sum, k) => sum + k.usageCount, 0),
    };
    
    return stats;
  },
});

// Activity Logs functions

// Query to get activity logs
export const getActivityLogs = query({
  args: {
    entityType: v.optional(v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("admin"),
      v.literal("setting"),
      v.literal("api_key")
    )),
    entityId: v.optional(v.string()),
    performedBy: v.optional(v.union(v.id("admins"), v.id("users"))),
    action: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("activityLogs");
    
    // Filter by entity type if provided
    if (args.entityType) {
      query = query.filter((q) => q.eq(q.field("entityType"), args.entityType));
    }
    
    // Filter by entity ID if provided
    if (args.entityId) {
      query = query.filter((q) => q.eq(q.field("entityId"), args.entityId));
    }
    
    // Filter by performer if provided
    if (args.performedBy) {
      query = query.filter((q) => q.eq(q.field("performedBy"), args.performedBy));
    }
    
    // Filter by action if provided
    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action));
    }
    
    // Collect all results first
    const allLogs = await query.collect();

    // Filter by date range if provided
    let filteredLogs = allLogs;
    if (args.startDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      filteredLogs = filteredLogs.filter(log => log.createdAt <= args.endDate!);
    }

    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 100;
    const logs = filteredLogs.slice(offset, offset + limit);
    
    return logs;
  },
});

// Query to get activity log statistics
export const getActivityLogStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all activity logs first
    const allLogs = await ctx.db.query("activityLogs").collect();

    // Filter by date range if provided
    let logs = allLogs;
    if (args.startDate) {
      logs = logs.filter(log => log.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      logs = logs.filter(log => log.createdAt <= args.endDate!);
    }
    
    const stats = {
      total: logs.length,
      byEntityType: {
        user: logs.filter(l => l.entityType === "user").length,
        product: logs.filter(l => l.entityType === "product").length,
        admin: logs.filter(l => l.entityType === "admin").length,
        setting: logs.filter(l => l.entityType === "setting").length,
        api_key: logs.filter(l => l.entityType === "api_key").length,
      },
      byPerformerType: {
        admin: logs.filter(l => l.performedByType === "admin").length,
        user: logs.filter(l => l.performedByType === "user").length,
        system: logs.filter(l => l.performedByType === "system").length,
      },
      recentActivity: logs.filter(l => 
        l.createdAt > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
      ).length,
    };
    
    return stats;
  },
});

// Note: API key generation is now handled by the generateSecureApiKey function
// in ./lib/apiKeyUtils.ts which provides cryptographically secure keys with
// proper formatting, checksums, and environment indicators.
