import { mutation } from "./_generated/server";

// Note: Demo data and seed functions removed for production.
// Admins should be created through proper registration or admin invitation process.

// This file is kept for potential future seeding needs but all demo data has been removed.
export const seedSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    return {
      message: "Demo data seeding has been disabled for production",
      note: "Use proper admin registration process instead"
    };
  },
});