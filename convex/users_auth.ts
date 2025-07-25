"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Action to authenticate user login
export const authenticateUser = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; status?: string; code?: string; user?: any }> => {
    try {
      // Password hashing and verification functions
      function hashPassword(password: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
      }

      function verifyPassword(password: string, storedPassword: string): boolean {
        // First try direct comparison (for plain text passwords)
        if (password === storedPassword) {
          console.log('🔐 Password verification: plain text match');
          return true;
        }
        
        // Then try hashed comparison (for hashed passwords)
        const hashedPassword = hashPassword(password);
        const isHashedMatch = hashedPassword === storedPassword;
        
        console.log('🔐 Password verification: hashed comparison', { match: isHashedMatch });
        
        return isHashedMatch;
      }

      // Find user by email
      const user = await ctx.runQuery(api.users.getUserByEmail, { email: args.email });

      // If user doesn't exist, return specific error
      if (!user) {
        // Perform a dummy hash operation to maintain consistent timing
        hashPassword(args.password);
        return { 
          success: false, 
          error: "Account not found. Please register first or check your email address.",
          code: "USER_NOT_FOUND"
        };
      }

      // Verify password for existing user
      const isValidPassword = verifyPassword(args.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: "Invalid email or password" };
      }

      // If password was stored as plain text, hash it for security
      if (args.password === user.password) {
        console.log('🔐 Migrating plain text password to hashed for user:', args.email);
        const hashedPassword = hashPassword(args.password);
        await ctx.runMutation(api.users.updateUserPassword, { 
          userId: user._id, 
          password: hashedPassword 
        });
      }

      // Check if user is approved
      if (user.status !== "approved") {
        return { 
          success: false, 
          error: "Invalid email or password",
          status: user.status,
          code: "ACCOUNT_STATUS_ISSUE"
        };
      }

      // Return user data (without password)
      const { password, ...userData } = user;
      
      // Update last login timestamp
      await ctx.runMutation(api.users.updateLastLogin, { userId: user._id });

      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "Authentication failed" };
    }
  },
});

// Action to register a new user
export const registerUser = action({
  args: {
    userId: v.string(),
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    legalNameOfBusiness: v.optional(v.string()),
    tradeName: v.optional(v.string()),
    dateOfRegistration: v.optional(v.string()),
    constitutionOfBusiness: v.optional(v.string()),
    taxpayerType: v.optional(v.string()),
    principalPlaceOfBusiness: v.optional(v.string()),
    natureOfCoreBusinessActivity: v.optional(v.string()),
    gstStatus: v.optional(v.string()),
    agreedToEmailMarketing: v.optional(v.boolean()),
    agreedToSmsMarketing: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; userId?: Id<"users"> }> => {
    try {
      // Password hashing function
      function hashPassword(password: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
      }

      // Check if user already exists
      const existingUser = await ctx.runQuery(api.users.getUserByEmail, { email: args.email });

      if (existingUser) {
        return { success: false, error: "User with this email already exists" };
      }

      // Hash the password before storing it
      const hashedPassword: string = hashPassword(args.password);
      
      // Create user with hashed password using the upsertUser mutation
      const userId: Id<"users"> = await ctx.runMutation(api.users.upsertUser, {
        userId: args.userId,
        email: args.email,
        password: hashedPassword, // Store hashed password
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        businessName: args.businessName,
        gstNumber: args.gstNumber,
        legalNameOfBusiness: args.legalNameOfBusiness,
        tradeName: args.tradeName,
        constitutionOfBusiness: args.constitutionOfBusiness,
        taxpayerType: args.taxpayerType,
        principalPlaceOfBusiness: args.principalPlaceOfBusiness,
        gstStatus: args.gstStatus,
        agreedToEmailMarketing: args.agreedToEmailMarketing,
        agreedToSmsMarketing: args.agreedToSmsMarketing,
      });

      return { success: true, userId };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Failed to register user" };
    }
  },
});