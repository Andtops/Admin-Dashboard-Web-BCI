import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all settings
export const getSettings = query({
  args: {
    category: v.optional(v.union(
      v.literal("general"),
      v.literal("api"),
      v.literal("notifications"),
      v.literal("security"),
      v.literal("integrations")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("settings");
    
    // Filter by category if provided
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const settings = await query.collect();
    
    // Convert to key-value object for easier access
    const settingsObject: Record<string, any> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
      };
    });
    
    return settingsObject;
  },
});

// Query to get a specific setting by key
export const getSetting = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();
    
    return setting;
  },
});

// Mutation to update a setting
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    category: v.union(
      v.literal("general"),
      v.literal("api"),
      v.literal("notifications"),
      v.literal("security"),
      v.literal("integrations")
    ),
    adminId: v.id("admins"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingSetting = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    const now = Date.now();

    if (existingSetting) {
      // Update existing setting
      const oldValue = existingSetting.value;
      
      await ctx.db.patch(existingSetting._id, {
        value: args.value,
        category: args.category,
        description: args.description || existingSetting.description,
        updatedAt: now,
        updatedBy: args.adminId,
      });

      // Log the activity
      await ctx.db.insert("activityLogs", {
        action: "setting_updated",
        entityType: "setting",
        entityId: args.key,
        oldValues: { value: oldValue },
        newValues: { value: args.value },
        performedBy: args.adminId,
        performedByType: "admin",
        createdAt: now,
      });

      return existingSetting._id;
    } else {
      // Create new setting
      const settingId = await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        category: args.category,
        description: args.description || "",
        isPublic: false, // Default to private
        createdAt: now,
        updatedAt: now,
        updatedBy: args.adminId,
      });

      // Log the activity
      await ctx.db.insert("activityLogs", {
        action: "setting_created",
        entityType: "setting",
        entityId: args.key,
        oldValues: null,
        newValues: { value: args.value },
        performedBy: args.adminId,
        performedByType: "admin",
        createdAt: now,
      });

      return settingId;
    }
  },
});

// Mutation to delete a setting
export const deleteSetting = mutation({
  args: {
    key: v.string(),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("key"), args.key))
      .first();

    if (!setting) {
      throw new Error("Setting not found");
    }

    const now = Date.now();

    await ctx.db.delete(setting._id);

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "setting_deleted",
      entityType: "setting",
      entityId: args.key,
      oldValues: { value: setting.value },
      newValues: null,
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    return setting._id;
  },
});

// Mutation to reset settings to defaults
export const resetToDefaults = mutation({
  args: {
    category: v.optional(v.union(
      v.literal("general"),
      v.literal("api"),
      v.literal("notifications"),
      v.literal("security"),
      v.literal("integrations")
    )),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("settings");
    
    // Filter by category if provided
    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    
    const settings = await query.collect();
    const now = Date.now();
    const resetIds = [];

    // Default values for different settings
    const defaults: Record<string, any> = {
      // General
      site_name: "Benzochem Industries",
      site_description: "Leading chemical supplier",
      contact_email: "contact@benzochem.com",
      maintenance_mode: false,
      timezone: "UTC",
      
      // API
      api_rate_limit: 1000,
      api_timeout: 30,
      enable_api_logging: true,
      api_version: "v1",
      
      // Notifications
      email_notifications: true,
      sms_notifications: false,
      notification_retention: 30,
      admin_email_alerts: true,
      
      // Security
      password_min_length: 8,
      session_timeout: 24,
      enable_2fa: false,
      max_login_attempts: 5,
      
      // Integrations
      payment_gateway: "stripe",
      analytics_tracking_id: "GA-XXXXXXXXX",
      email_service: "sendgrid",
      sms_service: "twilio",
    };

    for (const setting of settings) {
      const defaultValue = defaults[setting.key];
      if (defaultValue !== undefined) {
        const oldValue = setting.value;
        
        await ctx.db.patch(setting._id, {
          value: defaultValue,
          updatedAt: now,
          updatedBy: args.adminId,
        });

        // Log the activity
        await ctx.db.insert("activityLogs", {
          action: "setting_reset",
          entityType: "setting",
          entityId: setting.key,
          oldValues: { value: oldValue },
          newValues: { value: defaultValue },
          performedBy: args.adminId,
          performedByType: "admin",
          createdAt: now,
        });

        resetIds.push(setting._id);
      }
    }

    return resetIds;
  },
});

// Query to get settings statistics
export const getSettingsStats = query({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db.query("settings").collect();
    
    const stats = {
      total: allSettings.length,
      byCategory: {
        general: allSettings.filter(s => s.category === "general").length,
        api: allSettings.filter(s => s.category === "api").length,
        notifications: allSettings.filter(s => s.category === "notifications").length,
        security: allSettings.filter(s => s.category === "security").length,
        integrations: allSettings.filter(s => s.category === "integrations").length,
      },
      recentlyUpdated: allSettings.filter(s => 
        s.updatedAt > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      ).length,
    };
    
    return stats;
  },
});
