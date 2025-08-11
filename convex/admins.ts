import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";

// Query to get admin by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Query to get admin by ID
export const getById = query({
    args: { adminId: v.id("admins") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.adminId);
    },
});

// Query to get all admins
export const getAdmins = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;
    
    const allAdmins = await ctx.db.query("admins").collect();
    
    // Sort by creation date (newest first)
    allAdmins.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0));
    
    // Apply pagination
    return allAdmins.slice(offset, offset + limit);
  },
});

// Query to get admin statistics
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const allAdmins = await ctx.db.query("admins").collect();
    
    return {
      total: allAdmins.length,
      active: allAdmins.filter(a => a.isActive !== false).length,
      inactive: allAdmins.filter(a => a.isActive === false).length,
      superAdmins: allAdmins.filter(a => a.role === "super_admin").length,
      regularAdmins: allAdmins.filter(a => a.role === "admin" || !a.role).length,
    };
  },
});

// Mutation to create a new admin (plain text password)
export const create = mutation({
    args: {
        email: v.string(),
        password: v.string(), // Plain text password
        firstName: v.string(),
        lastName: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("admins", {
            email: args.email,
            password: args.password, // Store plain text password
            firstName: args.firstName,
            lastName: args.lastName,
            role: "admin",
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Mutation to create admin with full details
export const createAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(), // Plain text password
    firstName: v.string(),
    lastName: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.literal("super_admin"))),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingAdmin) {
      throw new Error("Admin with this email already exists");
    }

    const now = Date.now();
    
    return await ctx.db.insert("admins", {
      email: args.email,
      password: args.password, // Store plain text password
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role || "admin",
      permissions: args.permissions || [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to get or create admin (for demo purposes)
export const getOrCreateAdmin = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First try to find existing admin
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingAdmin) {
      return existingAdmin._id;
    }

    // Create new admin with default values
    const now = Date.now();
    const firstName = args.firstName || "Demo";
    const lastName = args.lastName || "Admin";
    const password = args.password || "admin123"; // Default plain text password for demo
    
    const adminId = await ctx.db.insert("admins", {
      email: args.email,
      password: password, // Store plain text password (no hashing for admin accounts)
      firstName,
      lastName,
      role: "admin",
      permissions: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return adminId;
  },
});

// Mutation to update admin status
export const updateAdminStatus = mutation({
  args: {
    adminId: v.id("admins"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return args.adminId;
  },
});

// Mutation to update admin role
export const updateAdminRole = mutation({
  args: {
    adminId: v.id("admins"),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      role: args.role,
      updatedAt: Date.now(),
    });
    return args.adminId;
  },
});

// Mutation to verify admin password (for re-authentication) - accepts email
export const verifyAdminPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
      
    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    // Plain text password comparison for admin accounts (no hashing)
    const isValid = admin.password === args.password;
    
    return { success: isValid };
  },
});

// Mutation to verify admin password by ID (for backward compatibility)
export const verifyAdminPasswordById = mutation({
  args: {
    adminId: v.id("admins"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      return { success: false, error: "Admin not found" };
    }

    // Plain text password comparison for admin accounts (no hashing)
    const isValid = admin.password === args.password;
    
    return { success: isValid };
  },
});

// internal query to get all admins
export const internalGetAllAdmins = internalQuery({
    handler: async (ctx) => {
        return await ctx.db.query("admins").collect();
    },
});

// Internal mutation to update admin password
export const internalUpdatePassword = internalMutation({
    args: {
        adminId: v.id("admins"),
        password: v.string(),
    },
    handler: async (ctx, { adminId, password }) => {
        await ctx.db.patch(adminId, { password });
    },
});