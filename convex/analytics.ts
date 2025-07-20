import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Track visitor sessions
export const trackVisitor = mutation({
  args: {
    sessionId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    page: v.string(),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if session already exists
    const existingSession = await ctx.db
      .query("visitor_sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingSession) {
      // Only update if it's been more than 30 seconds since last update
      const timeSinceLastUpdate = now - existingSession.lastSeen;
      if (timeSinceLastUpdate > 30000) {
        await ctx.db.patch(existingSession._id, {
          lastSeen: now,
          currentPage: args.page,
          pageViews: (existingSession.pageViews || 0) + 1,
          isActive: true,
        });
      }
      return existingSession._id;
    } else {
      // Create new session
      return await ctx.db.insert("visitor_sessions", {
        sessionId: args.sessionId,
        ipAddress: args.ipAddress || "unknown",
        userAgent: args.userAgent,
        country: args.country || "Unknown",
        city: args.city || "Unknown",
        latitude: args.latitude,
        longitude: args.longitude,
        currentPage: args.page,
        referrer: args.referrer,
        startTime: now,
        lastSeen: now,
        pageViews: 1,
        isActive: true,
      });
    }
  },
});

// Get live visitors count
export const getLiveVisitors = query({
  args: {},
  handler: async (ctx) => {
    // Consider visitors active if they were seen in the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    const activeVisitors = await ctx.db
      .query("visitor_sessions")
      .withIndex("by_last_seen", (q) => q.gte("lastSeen", fiveMinutesAgo))
      .collect();

    return {
      count: activeVisitors.length,
      visitors: activeVisitors.map(visitor => ({
        id: visitor._id,
        country: visitor.country,
        city: visitor.city,
        latitude: visitor.latitude,
        longitude: visitor.longitude,
        currentPage: visitor.currentPage,
        startTime: visitor.startTime,
        lastSeen: visitor.lastSeen,
        pageViews: visitor.pageViews,
      })),
    };
  },
});

// Get visitor analytics data
export const getVisitorAnalytics = query({
  args: {
    timeRange: v.optional(v.string()), // "24h", "7d", "30d", "90d"
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    let startTime: number;

    switch (timeRange) {
      case "24h":
        startTime = Date.now() - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        startTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        startTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        startTime = Date.now() - 90 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = Date.now() - 24 * 60 * 60 * 1000;
    }

    const visitors = await ctx.db
      .query("visitor_sessions")
      .withIndex("by_start_time", (q) => q.gte("startTime", startTime))
      .collect();

    // Group by country
    const countryStats = visitors.reduce((acc, visitor) => {
      const country = visitor.country || "Unknown";
      if (!acc[country]) {
        acc[country] = {
          count: 0,
          pageViews: 0,
          cities: new Set(),
        };
      }
      acc[country].count++;
      acc[country].pageViews += visitor.pageViews || 1;
      if (visitor.city) {
        acc[country].cities.add(visitor.city);
      }
      return acc;
    }, {} as Record<string, { count: number; pageViews: number; cities: Set<string> }>);

    // Convert to array and sort by count
    const topCountries = Object.entries(countryStats)
      .map(([country, stats]) => ({
        country,
        visitors: stats.count,
        pageViews: stats.pageViews,
        cities: Array.from(stats.cities),
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Calculate hourly data for the last 24 hours
    const hourlyData = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourVisitors = visitors.filter(
        v => v.startTime >= hourStart.getTime() && v.startTime < hourEnd.getTime()
      );
      
      hourlyData.push({
        hour: hourStart.getHours(),
        visitors: hourVisitors.length,
        pageViews: hourVisitors.reduce((sum, v) => sum + (v.pageViews || 1), 0),
      });
    }

    return {
      totalVisitors: visitors.length,
      totalPageViews: visitors.reduce((sum, v) => sum + (v.pageViews || 1), 0),
      topCountries,
      hourlyData,
      timeRange,
    };
  },
});

// Clean up old visitor sessions (run periodically)
export const cleanupOldSessions = mutation({
  args: {},
  handler: async (ctx) => {
    // Remove sessions older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const oldSessions = await ctx.db
      .query("visitor_sessions")
      .withIndex("by_last_seen", (q) => q.lt("lastSeen", oneDayAgo))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    return { deletedSessions: oldSessions.length };
  },
});

// Get real-time visitor locations for the globe
export const getVisitorLocations = query({
  args: {},
  handler: async (ctx) => {
    // Get visitors from the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const recentVisitors = await ctx.db
      .query("visitor_sessions")
      .withIndex("by_last_seen", (q) => q.gte("lastSeen", oneHourAgo))
      .collect();

    // Group by location and count
    const locationMap = new Map();
    
    recentVisitors.forEach(visitor => {
      if (visitor.latitude && visitor.longitude) {
        const key = `${visitor.latitude},${visitor.longitude}`;
        const existing = locationMap.get(key);
        
        if (existing) {
          existing.count++;
          existing.visitors.push({
            country: visitor.country,
            city: visitor.city,
            lastSeen: visitor.lastSeen,
          });
        } else {
          locationMap.set(key, {
            lat: visitor.latitude,
            lng: visitor.longitude,
            count: 1,
            country: visitor.country,
            city: visitor.city,
            visitors: [{
              country: visitor.country,
              city: visitor.city,
              lastSeen: visitor.lastSeen,
            }],
          });
        }
      }
    });

    return Array.from(locationMap.values());
  },
});