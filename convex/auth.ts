"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Action to authenticate admin login
export const authenticateAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; admin?: any }> => {
    try {
      // Find admin by email
      const admin: any = await ctx.runQuery(api.admins.getByEmail, { email: args.email });

      if (!admin) {
        return { success: false, error: "Invalid email or password" };
      }

      // Verify password (plain text comparison)
      if (args.password !== admin.password) {
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

// Action to create a new admin (simplified schema)
export const createAdmin = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; adminId?: Id<"admins"> }> => {
    try {
      // Check if admin already exists
      const existingAdmin = await ctx.runQuery(api.admins.getByEmail, { email: args.email });

      if (existingAdmin) {
        return { success: false, error: "Admin with this email already exists" };
      }

      // Create admin with plain text password
      const adminId: Id<"admins"> = await ctx.runMutation(api.admins.create, {
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

// Action to validate admin session (for checking if stored session is still valid)
export const validateAdminSession = action({
  args: {
    adminId: v.id("admins"),
  },
  handler: async (ctx, args): Promise<{ valid: boolean; admin?: any }> => {
    try {
      const admin: any = await ctx.runQuery(api.admins.getById, { adminId: args.adminId });
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