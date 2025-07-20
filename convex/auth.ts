import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Plain text password validation (DEVELOPMENT ONLY - NOT SECURE!)
function verifyPassword(password: string, storedPassword: string): boolean {
  return password === storedPassword;
}

// Mutation to authenticate admin login
export const authenticateAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find admin by email
      const admin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (!admin) {
        return { success: false, error: "Invalid email or password" };
      }

      // Verify password (plain text comparison)
      if (!verifyPassword(args.password, admin.password)) {
        return { success: false, error: "Invalid email or password" };
      }

      // Return admin data (without password)
      const { password, ...adminData } = admin;
      return {
        success: true,
        admin: adminData,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "Authentication failed" };
    }
  },
});

// Mutation to create a new admin (simplified schema)
export const createAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if admin already exists
      const existingAdmin = await ctx.db
        .query("admins")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (existingAdmin) {
        return { success: false, error: "Admin with this email already exists" };
      }

      // Create admin with plain text password (DEVELOPMENT ONLY!)
      const adminId = await ctx.db.insert("admins", {
        email: args.email,
        password: args.password, // Store plain text password
        firstName: args.firstName,
        lastName: args.lastName,
      });

      return { success: true, adminId };
    } catch (error) {
      console.error("Create admin error:", error);
      return { success: false, error: "Failed to create admin" };
    }
  },
});



// Query to validate admin session (for checking if stored session is still valid)
export const validateAdminSession = query({
  args: {
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    try {
      const admin = await ctx.db.get(args.adminId);
      if (!admin) {
        return { valid: false };
      }

      // Return admin data (without password)
      const { password, ...adminData } = admin;
      return { valid: true, admin: adminData };
    } catch (error) {
      console.error("Session validation error:", error);
      return { valid: false };
    }
  },
});


