import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get active cookie consent for a user (by email or anonymous ID)
export const getActiveConsent = query({
  args: { 
    email: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let consent = null;

    if (args.email) {
      // Look for consent by email first
      consent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else if (args.anonymousId) {
      // Look for consent by anonymous ID
      consent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    }

    if (!consent) {
      return null;
    }

    // Check if consent has expired (1 year)
    const now = Date.now();
    if (consent.expiresAt < now) {
      // Return null for expired consent - expiration will be handled by mutation
      return null;
    }

    return {
      preferences: consent.preferences,
      timestamp: consent.consentTimestamp,
      consentMethod: consent.consentMethod,
      expiresAt: consent.expiresAt,
      isAnonymous: consent.isAnonymous || false,
    };
  },
});

// Check and expire old consents
export const expireOldConsents = mutation({
  args: { 
    email: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let expiredConsents: any[] = [];
    
    if (args.email) {
      // Find expired active consents by email
      expiredConsents = await ctx.db
        .query("cookieConsents")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .filter((q) => q.and(
          q.eq(q.field("isActive"), true),
          q.lt(q.field("expiresAt"), now)
        ))
        .collect();
    } else if (args.anonymousId) {
      // Find expired active consents by anonymous ID
      expiredConsents = await ctx.db
        .query("cookieConsents")
        .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId!))
        .filter((q) => q.and(
          q.eq(q.field("isActive"), true),
          q.lt(q.field("expiresAt"), now)
        ))
        .collect();
    }

    // Mark expired consents as inactive
    for (const consent of expiredConsents) {
      await ctx.db.patch(consent._id, {
        isActive: false,
        revokedAt: now,
        changeReason: "expired",
        updatedAt: now,
      });
    }

    return { expiredCount: expiredConsents.length };
  },
});

// Save new cookie consent (supports anonymous users)
export const saveConsent = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    preferences: v.object({
      essential: v.boolean(),
      analytics: v.boolean(),
      marketing: v.boolean(),
      functional: v.boolean(),
    }),
    consentMethod: v.union(
      v.literal("banner_accept_all"),
      v.literal("banner_essential_only"),
      v.literal("banner_custom"),
      v.literal("settings_page")
    ),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now
    const updateWindow = 5 * 60 * 1000; // 5 minutes window for updates

    // Determine if this is an anonymous user
    const isAnonymous = args.email.includes('@temp.local') || Boolean(args.anonymousId);

    // Find any existing active consent for this user
    let existingConsent = null;
    if (isAnonymous && args.anonymousId) {
      existingConsent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else {
      existingConsent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    }

    const newPreferences = {
      essential: true, // Always true for essential cookies
      analytics: Boolean(args.preferences.analytics),
      marketing: Boolean(args.preferences.marketing),
      functional: Boolean(args.preferences.functional),
    };

    // If existing consent exists and was created recently (within update window),
    // update it instead of creating a new record to avoid clutter
    if (existingConsent && (now - existingConsent.createdAt) < updateWindow) {
      // Check if preferences are actually different
      const prefsChanged = 
        existingConsent.preferences.analytics !== newPreferences.analytics ||
        existingConsent.preferences.marketing !== newPreferences.marketing ||
        existingConsent.preferences.functional !== newPreferences.functional;

      if (prefsChanged) {
        // Update the existing record instead of creating a new one
        await ctx.db.patch(existingConsent._id, {
          firstName: args.firstName,
          lastName: args.lastName,
          preferences: newPreferences,
          consentMethod: args.consentMethod,
          ipAddress: args.ipAddress,
          userAgent: args.userAgent,
          updatedAt: now,
          expiresAt: expiresAt,
        });

        console.log(`🍪 Cookie consent updated for ${isAnonymous ? 'anonymous user' : args.email}:`, {
          consentId: existingConsent._id,
          preferences: newPreferences,
          method: args.consentMethod,
          isAnonymous,
          action: 'updated_existing',
        });

        return {
          success: true,
          consentId: existingConsent._id,
          preferences: newPreferences,
          timestamp: now,
          expiresAt,
          isAnonymous,
        };
      } else {
        // No changes, just return existing consent
        console.log(`🍪 Cookie consent unchanged for ${isAnonymous ? 'anonymous user' : args.email}:`, {
          consentId: existingConsent._id,
          preferences: existingConsent.preferences,
          method: existingConsent.consentMethod,
          isAnonymous,
          action: 'no_changes',
        });

        return {
          success: true,
          consentId: existingConsent._id,
          preferences: existingConsent.preferences,
          timestamp: existingConsent.consentTimestamp,
          expiresAt: existingConsent.expiresAt,
          isAnonymous,
        };
      }
    }

    // For older consents or first-time consent, create a new record
    let previousConsentId = undefined;
    if (existingConsent) {
      await ctx.db.patch(existingConsent._id, {
        isActive: false,
        revokedAt: now,
        changeReason: "updated",
        updatedAt: now,
      });
      previousConsentId = existingConsent._id;
    }

    // Create new consent record
    const consentId = await ctx.db.insert("cookieConsents", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      anonymousId: args.anonymousId,
      isAnonymous: isAnonymous,
      preferences: newPreferences,
      consentVersion: "1.0",
      consentTimestamp: now,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      gdprCompliant: true,
      consentMethod: args.consentMethod,
      isActive: true,
      updatedAt: now,
      expiresAt: expiresAt,
      previousConsentId: previousConsentId,
      createdAt: now,
    });

    console.log(`🍪 Cookie consent saved for ${isAnonymous ? 'anonymous user' : args.email}:`, {
      consentId,
      preferences: newPreferences,
      method: args.consentMethod,
      isAnonymous,
      action: existingConsent ? 'created_new_version' : 'created_first_time',
    });

    return {
      success: true,
      consentId,
      preferences: newPreferences,
      timestamp: now,
      expiresAt,
      isAnonymous,
    };
  },
});

// Clear/revoke cookie consent
export const clearConsent = mutation({
  args: { 
    email: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let activeConsent = null;

    if (args.email) {
      // Find and deactivate active consent by email
      activeConsent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    } else if (args.anonymousId) {
      // Find and deactivate active consent by anonymous ID
      activeConsent = await ctx.db
        .query("cookieConsents")
        .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
    }

    if (activeConsent) {
      await ctx.db.patch(activeConsent._id, {
        isActive: false,
        revokedAt: now,
        changeReason: args.reason || "user_revoked",
        updatedAt: now,
      });

      console.log(`🍪 Cookie consent cleared for ${args.email || 'anonymous user'}`);
      return { success: true };
    }

    return { success: false, error: "No active consent found" };
  },
});

// Get consent history for a user
export const getConsentHistory = query({
  args: { 
    email: v.optional(v.string()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let consents: any[] = [];

    if (args.email) {
      consents = await ctx.db
        .query("cookieConsents")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .order("desc")
        .take(10); // Last 10 consent records
    } else if (args.anonymousId) {
      consents = await ctx.db
        .query("cookieConsents")
        .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId!))
        .order("desc")
        .take(10); // Last 10 consent records
    }

    return consents.map((consent) => ({
      id: consent._id,
      preferences: consent.preferences,
      consentMethod: consent.consentMethod,
      consentTimestamp: consent.consentTimestamp,
      isActive: consent.isActive,
      revokedAt: consent.revokedAt,
      changeReason: consent.changeReason,
      expiresAt: consent.expiresAt,
      isAnonymous: consent.isAnonymous || false,
    }));
  },
});

// Link anonymous consent to a real user when they register/login
export const linkAnonymousConsent = mutation({
  args: {
    anonymousId: v.string(),
    userId: v.string(),
    userEmail: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find active anonymous consent
    const anonymousConsent = await ctx.db
      .query("cookieConsents")
      .withIndex("by_anonymous_id", (q) => q.eq("anonymousId", args.anonymousId))
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.eq(q.field("isAnonymous"), true)
      ))
      .first();

    if (!anonymousConsent) {
      return { success: false, error: "No active anonymous consent found" };
    }

    // Check if user already has consent
    const existingUserConsent = await ctx.db
      .query("cookieConsents")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existingUserConsent) {
      // User already has consent, just mark anonymous as linked
      await ctx.db.patch(anonymousConsent._id, {
        linkedToUserId: args.userId,
        linkedAt: now,
        updatedAt: now,
      });

      console.log(`🍪 Anonymous consent linked to existing user consent: ${args.userEmail}`);
      return { success: true, action: "linked_to_existing" };
    }

    // Update anonymous consent to real user data
    await ctx.db.patch(anonymousConsent._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.userEmail,
      isAnonymous: false,
      linkedToUserId: args.userId,
      linkedAt: now,
      updatedAt: now,
    });

    console.log(`🍪 Anonymous consent converted to user consent: ${args.userEmail}`);
    return { success: true, action: "converted_to_user" };
  },
});

// Admin: Get all cookie consents with pagination
export const getAllConsents = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    includeAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeAnonymous = args.includeAnonymous !== false; // Default to true
    
    let query = ctx.db
      .query("cookieConsents")
      .withIndex("by_created_at")
      .order("desc");

    if (args.cursor) {
      const cursorValue = parseInt(args.cursor);
      if (!isNaN(cursorValue)) {
        query = query.filter((q) => q.lt(q.field("createdAt"), cursorValue));
      }
    }

    // Filter out anonymous users if requested
    if (!includeAnonymous) {
      query = query.filter((q) => q.neq(q.field("isAnonymous"), true));
    }

    const consents = await query.take(limit + 1);
    
    const hasMore = consents.length > limit;
    const results = hasMore ? consents.slice(0, -1) : consents;
    const nextCursor = hasMore ? results[results.length - 1].createdAt.toString() : null;

    return {
      consents: results.map((consent) => ({
        id: consent._id,
        firstName: consent.firstName,
        lastName: consent.lastName,
        email: consent.email,
        preferences: consent.preferences,
        consentMethod: consent.consentMethod,
        consentTimestamp: consent.consentTimestamp,
        isActive: consent.isActive,
        revokedAt: consent.revokedAt,
        changeReason: consent.changeReason,
        expiresAt: consent.expiresAt,
        ipAddress: consent.ipAddress,
        createdAt: consent.createdAt,
        isAnonymous: consent.isAnonymous || false,
        anonymousId: consent.anonymousId,
      })),
      hasMore,
      nextCursor,
    };
  },
});

// Admin: Get consent statistics
export const getConsentStats = query({
  args: {},
  handler: async (ctx, args) => {
    // For backward compatibility, we'll default includeAnonymous to true
    const includeAnonymous = true;
    const now = Date.now();
    
    // Get all active consents
    let activeConsents = await ctx.db
      .query("cookieConsents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter out anonymous users if requested
    if (!includeAnonymous) {
      activeConsents = activeConsents.filter(c => !c.isAnonymous);
    }

    // Calculate statistics
    const totalActive = activeConsents.length;
    const totalAnonymous = activeConsents.filter(c => c.isAnonymous).length;
    const totalRegistered = totalActive - totalAnonymous;
    const analyticsEnabled = activeConsents.filter(c => c.preferences.analytics).length;
    const marketingEnabled = activeConsents.filter(c => c.preferences.marketing).length;
    const functionalEnabled = activeConsents.filter(c => c.preferences.functional).length;
    
    // Consent methods breakdown
    const methodStats = activeConsents.reduce((acc, consent) => {
      acc[consent.consentMethod] = (acc[consent.consentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const expiringSoon = activeConsents.filter(c => c.expiresAt <= thirtyDaysFromNow).length;

    return {
      totalActive,
      totalAnonymous,
      totalRegistered,
      preferences: {
        analytics: {
          enabled: analyticsEnabled,
          percentage: totalActive > 0 ? Math.round((analyticsEnabled / totalActive) * 100) : 0,
        },
        marketing: {
          enabled: marketingEnabled,
          percentage: totalActive > 0 ? Math.round((marketingEnabled / totalActive) * 100) : 0,
        },
        functional: {
          enabled: functionalEnabled,
          percentage: totalActive > 0 ? Math.round((functionalEnabled / totalActive) * 100) : 0,
        },
      },
      consentMethods: methodStats,
      expiringSoon,
    };
  },
});

// Admin: Get consent statistics with filtering options
export const getConsentStatsFiltered = query({
  args: {
    includeAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const includeAnonymous = args.includeAnonymous !== false; // Default to true
    
    // Get all active consents
    let activeConsents = await ctx.db
      .query("cookieConsents")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter out anonymous users if requested
    if (!includeAnonymous) {
      activeConsents = activeConsents.filter(c => !c.isAnonymous);
    }

    // Calculate statistics
    const totalActive = activeConsents.length;
    const totalAnonymous = activeConsents.filter(c => c.isAnonymous).length;
    const totalRegistered = totalActive - totalAnonymous;
    const analyticsEnabled = activeConsents.filter(c => c.preferences.analytics).length;
    const marketingEnabled = activeConsents.filter(c => c.preferences.marketing).length;
    const functionalEnabled = activeConsents.filter(c => c.preferences.functional).length;
    
    // Consent methods breakdown
    const methodStats = activeConsents.reduce((acc, consent) => {
      acc[consent.consentMethod] = (acc[consent.consentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    const expiringSoon = activeConsents.filter(c => c.expiresAt <= thirtyDaysFromNow).length;

    return {
      totalActive,
      totalAnonymous,
      totalRegistered,
      preferences: {
        analytics: {
          enabled: analyticsEnabled,
          percentage: totalActive > 0 ? Math.round((analyticsEnabled / totalActive) * 100) : 0,
        },
        marketing: {
          enabled: marketingEnabled,
          percentage: totalActive > 0 ? Math.round((marketingEnabled / totalActive) * 100) : 0,
        },
        functional: {
          enabled: functionalEnabled,
          percentage: totalActive > 0 ? Math.round((functionalEnabled / totalActive) * 100) : 0,
        },
      },
      consentMethods: methodStats,
      expiringSoon,
    };
  },
});

// Admin: Cleanup old inactive consent records (keep only the latest 3 per user)
export const cleanupOldConsents = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    keepPerUser: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const keepPerUser = args.keepPerUser || 3; // Keep latest 3 records per user
    const dryRun = args.dryRun || false;
    
    // Get all users with consent records
    const allConsents = await ctx.db
      .query("cookieConsents")
      .collect();
    
    // Group by user (email or anonymousId)
    const userGroups = new Map<string, any[]>();
    
    for (const consent of allConsents) {
      const userKey = consent.email || consent.anonymousId || 'unknown';
      if (!userGroups.has(userKey)) {
        userGroups.set(userKey, []);
      }
      userGroups.get(userKey)!.push(consent);
    }
    
    let totalToDelete = 0;
    const deletedRecords: string[] = [];
    
    // For each user, keep only the latest records
    for (const [userKey, consents] of userGroups) {
      // Sort by creation time (newest first)
      consents.sort((a, b) => b.createdAt - a.createdAt);
      
      // Keep the first N records (newest), mark the rest for deletion
      const toDelete = consents.slice(keepPerUser);
      
      for (const consent of toDelete) {
        // Only delete inactive records (never delete active consent)
        if (!consent.isActive) {
          totalToDelete++;
          if (!dryRun) {
            await ctx.db.delete(consent._id);
          }
          deletedRecords.push(`${userKey}:${consent._id}`);
        }
      }
    }
    
    console.log(`🧹 Consent cleanup: ${dryRun ? 'Would delete' : 'Deleted'} ${totalToDelete} old records`);
    
    return {
      success: true,
      totalProcessed: userGroups.size,
      totalDeleted: totalToDelete,
      dryRun,
      deletedRecords: dryRun ? deletedRecords : [],
    };
  },
});