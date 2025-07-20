import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation to log security events
export const logSecurityEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("invalid_api_key"),
      v.literal("rate_limit_exceeded"),
      v.literal("suspicious_usage_pattern"),
      v.literal("multiple_failed_attempts"),
      v.literal("unusual_ip_activity"),
      v.literal("permission_violation"),
      v.literal("key_rotation_required"),
      v.literal("potential_key_compromise")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    description: v.string(),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    requestUrl: v.optional(v.string()),
    requestMethod: v.optional(v.string()),
    apiKeyId: v.optional(v.string()),
    apiKeyEnvironment: v.optional(v.literal("live")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const eventId = await ctx.db.insert("securityEvents", {
      ...args,
      status: "open",
      alertSent: false,
      createdAt: now,
      updatedAt: now,
    });

    // Check if this event should trigger an alert
    const shouldAlert = await shouldTriggerAlert(ctx, args.eventType, args.severity, args.details);
    
    if (shouldAlert) {
      // Mark alert as sent (in a real implementation, you would send the actual alert)
      await ctx.db.patch(eventId, {
        alertSent: true,
        alertSentAt: now,
      });
      
      // Log the alert action
      console.log(`SECURITY ALERT: ${args.eventType} - ${args.description}`, {
        severity: args.severity,
        details: args.details,
        timestamp: new Date(now).toISOString()
      });
    }

    return eventId;
  },
});

// Query to get security events
export const getSecurityEvents = query({
  args: {
    eventType: v.optional(v.union(
      v.literal("invalid_api_key"),
      v.literal("rate_limit_exceeded"),
      v.literal("suspicious_usage_pattern"),
      v.literal("multiple_failed_attempts"),
      v.literal("unusual_ip_activity"),
      v.literal("permission_violation"),
      v.literal("key_rotation_required"),
      v.literal("potential_key_compromise")
    )),
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    status: v.optional(v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("false_positive")
    )),
    apiKeyId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("securityEvents");

    // Apply filters
    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), args.eventType));
    }
    if (args.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    }
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.apiKeyId) {
      query = query.filter((q) => q.eq(q.field("apiKeyId"), args.apiKeyId));
    }
    if (args.ipAddress) {
      query = query.filter((q) => q.eq(q.field("ipAddress"), args.ipAddress));
    }

    // Collect all results first
    const allEvents = await query.collect();

    // Filter by date range if provided
    let filteredEvents = allEvents;
    if (args.startDate) {
      filteredEvents = filteredEvents.filter(event => event.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      filteredEvents = filteredEvents.filter(event => event.createdAt <= args.endDate!);
    }

    // Sort by creation date (newest first)
    filteredEvents.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 100;
    const events = filteredEvents.slice(offset, offset + limit);

    return events;
  },
});

// Query to get security event statistics
export const getSecurityEventStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all security events first
    const allEvents = await ctx.db.query("securityEvents").collect();

    // Filter by date range if provided
    let events = allEvents;
    if (args.startDate) {
      events = events.filter(event => event.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter(event => event.createdAt <= args.endDate!);
    }

    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: events.length,
      byEventType: {
        invalid_api_key: events.filter(e => e.eventType === "invalid_api_key").length,
        rate_limit_exceeded: events.filter(e => e.eventType === "rate_limit_exceeded").length,
        suspicious_usage_pattern: events.filter(e => e.eventType === "suspicious_usage_pattern").length,
        multiple_failed_attempts: events.filter(e => e.eventType === "multiple_failed_attempts").length,
        unusual_ip_activity: events.filter(e => e.eventType === "unusual_ip_activity").length,
        permission_violation: events.filter(e => e.eventType === "permission_violation").length,
        key_rotation_required: events.filter(e => e.eventType === "key_rotation_required").length,
        potential_key_compromise: events.filter(e => e.eventType === "potential_key_compromise").length,
      },
      bySeverity: {
        low: events.filter(e => e.severity === "low").length,
        medium: events.filter(e => e.severity === "medium").length,
        high: events.filter(e => e.severity === "high").length,
        critical: events.filter(e => e.severity === "critical").length,
      },
      byStatus: {
        open: events.filter(e => e.status === "open").length,
        investigating: events.filter(e => e.status === "investigating").length,
        resolved: events.filter(e => e.status === "resolved").length,
        false_positive: events.filter(e => e.status === "false_positive").length,
      },
      recent: {
        last24Hours: events.filter(e => e.createdAt > last24Hours).length,
        last7Days: events.filter(e => e.createdAt > last7Days).length,
      },
      alerts: {
        total: events.filter(e => e.alertSent === true).length,
        pending: events.filter(e => e.alertSent === false && (e.severity === "high" || e.severity === "critical")).length,
      }
    };

    return stats;
  },
});

// Mutation to update security event status
export const updateSecurityEventStatus = mutation({
  args: {
    eventId: v.id("securityEvents"),
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("false_positive")
    ),
    resolvedBy: v.optional(v.id("admins")),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Security event not found");
    }

    const now = Date.now();
    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "resolved" || args.status === "false_positive") {
      updates.resolvedBy = args.resolvedBy;
      updates.resolvedAt = now;
      updates.resolutionNotes = args.resolutionNotes;
    }

    await ctx.db.patch(args.eventId, updates);

    return args.eventId;
  },
});

// Helper function to determine if an event should trigger an alert
async function shouldTriggerAlert(
  ctx: any,
  eventType: string,
  severity: string,
  details: any
): Promise<boolean> {
  // Always alert on critical events
  if (severity === "critical") {
    return true;
  }

  // Alert on high severity events
  if (severity === "high") {
    return true;
  }

  // Alert on medium severity events if they're part of a pattern
  if (severity === "medium") {
    // Check for recent similar events
    const recentEvents = await ctx.db
      .query("securityEvents")
      .filter((q: any) => q.eq(q.field("eventType"), eventType))
      .collect();

    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentSimilarEvents = recentEvents.filter((e: any) => e.createdAt > last24Hours);

    // Alert if there are 3 or more similar events in the last 24 hours
    if (recentSimilarEvents.length >= 3) {
      return true;
    }
  }

  // Special cases for specific event types
  switch (eventType) {
    case "multiple_failed_attempts":
      // Alert if more than 10 failed attempts from the same IP
      if (details.attemptCount && details.attemptCount > 10) {
        return true;
      }
      break;
    
    case "unusual_ip_activity":
      // Alert if requests from unusual geographic location
      if (details.isUnusualLocation) {
        return true;
      }
      break;
    
    case "potential_key_compromise":
      // Always alert on potential key compromise
      return true;
  }

  return false;
}
