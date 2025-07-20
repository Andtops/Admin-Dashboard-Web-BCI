import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all admins (simplified)
export const getAdmins = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all admins
    const allAdmins = await ctx.db.query("admins").collect();

    // Apply search filter
    let filteredAdmins = allAdmins;
    if (args.search) {
      filteredAdmins = allAdmins.filter(admin =>
        admin.firstName.toLowerCase().includes(args.search!.toLowerCase()) ||
        admin.lastName.toLowerCase().includes(args.search!.toLowerCase()) ||
        admin.email.toLowerCase().includes(args.search!.toLowerCase())
      );
    }

    // Sort by creation time (newest first)
    filteredAdmins.sort((a, b) => b._creationTime - a._creationTime);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedAdmins = filteredAdmins.slice(offset, offset + limit);

    // Remove passwords from response
    const adminsWithoutPasswords = paginatedAdmins.map(admin => {
      const { password, ...adminData } = admin;
      return adminData;
    });

    return {
      admins: adminsWithoutPasswords,
      total: filteredAdmins.length,
      hasMore: offset + limit < filteredAdmins.length,
    };
  },
});

// Query to get admin by ID (without password)
export const getAdminById = query({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    if (!admin) return null;

    const { password, ...adminData } = admin;
    return adminData;
  },
});

// Query to get admin by email (without password)
export const getAdminByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!admin) return null;

    const { password, ...adminData } = admin;
    return adminData;
  },
});

// Simple admin statistics query
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const allAdmins = await ctx.db.query("admins").collect();
    return {
      total: allAdmins.length,
    };
  },
});

// Mutation to update admin role and permissions (for development setup)
export const updateAdminRoleAndPermissions = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("super_admin")),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!admin) {
      throw new Error("Admin not found");
    }

    await ctx.db.patch(admin._id, {
      role: args.role,
      permissions: args.permissions || [],
      isActive: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to get or create admin (for operations)
export const getOrCreateAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Try to find existing admin
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingAdmin) {
      return existingAdmin._id;
    }

    // If not found, create a basic admin entry
    // Note: In production, this should use proper password hashing and secure password generation
    const adminId = await ctx.db.insert("admins", {
      email: args.email,
      firstName: "Admin",
      lastName: "User",
      password: "", // Empty password - admin should set proper password through admin registration
      role: "admin",
      isActive: true,
      permissions: ["users.approve", "users.reject"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return adminId;
  },
});

// Mutation to verify admin password for re-authentication
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
      throw new Error("Admin not found");
    }

    // In production, this should use proper password hashing (bcrypt, etc.)
    const isValidPassword = admin.password === args.password;

    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    return {
      success: true,
      adminId: admin._id,
      email: admin.email,
      verifiedAt: Date.now(),
    };
  },
});