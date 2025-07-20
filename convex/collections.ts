import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all collections with pagination and filtering
export const getCollections = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive")
    )),
    search: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Collect all results first
    let allCollections;

    if (args.status) {
      allCollections = await ctx.db
        .query("collections")
        .withIndex("by_status", (q) => q.eq("status", args.status as "active" | "inactive"))
        .collect();
    } else {
      allCollections = await ctx.db.query("collections").collect();
    }

    // Filter by search term if provided
    let filteredCollections = allCollections;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredCollections = allCollections.filter(collection =>
        collection.title.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower) ||
        collection.handle.toLowerCase().includes(searchLower)
      );
    }

    // Filter by visibility if provided
    if (args.isVisible !== undefined) {
      filteredCollections = filteredCollections.filter(collection =>
        collection.isVisible === args.isVisible
      );
    }

    // Sort by sort order, then by creation date
    filteredCollections.sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.sortOrder !== undefined) return -1;
      if (b.sortOrder !== undefined) return 1;
      return b.createdAt - a.createdAt;
    });

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const collections = filteredCollections.slice(offset, offset + limit);
    
    return collections;
  },
});

// Query to get collection by ID
export const getCollectionById = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get collection by handle
export const getCollectionByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
  },
});

// Query to get collection by collection ID
export const getCollectionByCollectionId = query({
  args: { collectionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_collection_id", (q) => q.eq("collectionId", args.collectionId))
      .first();
  },
});

// Query to get active collections for dropdown/selection
export const getActiveCollections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Mutation to create a new collection
export const createCollection = mutation({
  args: {
    collectionId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    handle: v.string(),
    image: v.optional(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    sortOrder: v.optional(v.number()),
    isVisible: v.boolean(),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    // Check if collection with same handle already exists
    const existingByHandle = await ctx.db
      .query("collections")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();

    if (existingByHandle) {
      throw new Error(`Collection with handle "${args.handle}" already exists`);
    }

    // Check if collection with same collectionId already exists
    const existingById = await ctx.db
      .query("collections")
      .withIndex("by_collection_id", (q) => q.eq("collectionId", args.collectionId))
      .first();

    if (existingById) {
      throw new Error(`Collection with ID "${args.collectionId}" already exists`);
    }

    const now = Date.now();

    const collectionId = await ctx.db.insert("collections", {
      collectionId: args.collectionId,
      title: args.title,
      description: args.description,
      handle: args.handle,
      image: args.image,
      seoTitle: args.seoTitle,
      seoDescription: args.seoDescription,
      status: args.status,
      sortOrder: args.sortOrder,
      isVisible: args.isVisible,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: args.adminId,
      updatedBy: args.adminId,
    });

    return collectionId;
  },
});

// Mutation to update a collection
export const updateCollection = mutation({
  args: {
    id: v.id("collections"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    handle: v.optional(v.string()),
    image: v.optional(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    sortOrder: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if handle is being changed and if it conflicts
    if (args.handle && args.handle !== collection.handle) {
      const existingByHandle = await ctx.db
        .query("collections")
        .withIndex("by_handle", (q) => q.eq("handle", args.handle as string))
        .first();

      if (existingByHandle && existingByHandle._id !== args.id) {
        throw new Error(`Collection with handle "${args.handle}" already exists`);
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
      updatedBy: args.adminId,
    };

    // Only update provided fields
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.handle !== undefined) updateData.handle = args.handle;
    if (args.image !== undefined) updateData.image = args.image;
    if (args.seoTitle !== undefined) updateData.seoTitle = args.seoTitle;
    if (args.seoDescription !== undefined) updateData.seoDescription = args.seoDescription;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.sortOrder !== undefined) updateData.sortOrder = args.sortOrder;
    if (args.isVisible !== undefined) updateData.isVisible = args.isVisible;

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Mutation to delete a collection
export const deleteCollection = mutation({
  args: {
    id: v.id("collections"),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if any products are using this collection
    const allProducts = await ctx.db.query("products").collect();
    const productsInCollection = allProducts.filter(product =>
      product.collections.includes(collection.collectionId)
    );

    if (productsInCollection.length > 0) {
      throw new Error(`Cannot delete collection "${collection.title}" because it contains ${productsInCollection.length} product(s). Please remove products from this collection first.`);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Mutation to update product count for a collection (called when products are added/removed)
export const updateCollectionProductCount = mutation({
  args: {
    collectionId: v.string(),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_collection_id", (q) => q.eq("collectionId", args.collectionId))
      .first();

    if (!collection) {
      return; // Collection doesn't exist, skip update
    }

    // Count products in this collection
    const allProducts = await ctx.db.query("products").collect();
    const productCount = allProducts.filter(product =>
      product.collections.includes(args.collectionId)
    ).length;

    await ctx.db.patch(collection._id, {
      productCount,
      updatedAt: Date.now(),
    });

    return productCount;
  },
});

// Query to get collection statistics
export const getCollectionStats = query({
  args: {},
  handler: async (ctx) => {
    const allCollections = await ctx.db.query("collections").collect();
    const activeCollections = allCollections.filter(c => c.status === "active");
    const visibleCollections = allCollections.filter(c => c.isVisible);

    const stats = {
      total: allCollections.length,
      active: activeCollections.length,
      inactive: allCollections.length - activeCollections.length,
      visible: visibleCollections.length,
      totalProducts: allCollections.reduce((sum, c) => sum + (c.productCount || 0), 0),
      avgProductsPerCollection: allCollections.length > 0 
        ? Math.round(allCollections.reduce((sum, c) => sum + (c.productCount || 0), 0) / allCollections.length)
        : 0,
    };

    return stats;
  },
});

// Mutation to create sample collections (for demo purposes)
export const createSampleCollections = mutation({
  args: {
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sampleCollections = [
      {
        collectionId: "organic-chemicals",
        title: "Organic Chemicals",
        description: "Organic compounds and derivatives for various applications",
        handle: "organic-chemicals",
        status: "active" as const,
        sortOrder: 1,
        isVisible: true,
      },
      {
        collectionId: "inorganic-chemicals",
        title: "Inorganic Chemicals",
        description: "Inorganic compounds, salts, and minerals",
        handle: "inorganic-chemicals",
        status: "active" as const,
        sortOrder: 2,
        isVisible: true,
      },
      {
        collectionId: "pharmaceutical-intermediates",
        title: "Pharmaceutical Intermediates",
        description: "Chemical intermediates for pharmaceutical synthesis",
        handle: "pharmaceutical-intermediates",
        status: "active" as const,
        sortOrder: 3,
        isVisible: true,
      },
      {
        collectionId: "research-chemicals",
        title: "Research Chemicals",
        description: "High-purity chemicals for research and development",
        handle: "research-chemicals",
        status: "active" as const,
        sortOrder: 4,
        isVisible: true,
      },
      {
        collectionId: "industrial-chemicals",
        title: "Industrial Chemicals",
        description: "Bulk chemicals for industrial processes",
        handle: "industrial-chemicals",
        status: "active" as const,
        sortOrder: 5,
        isVisible: true,
      },
    ];

    const createdCollections = [];

    for (const collection of sampleCollections) {
      // Check if collection already exists
      const existing = await ctx.db
        .query("collections")
        .withIndex("by_collection_id", (q) => q.eq("collectionId", collection.collectionId))
        .first();

      if (!existing) {
        const collectionId = await ctx.db.insert("collections", {
          ...collection,
          productCount: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: args.adminId,
          updatedBy: args.adminId,
        });
        createdCollections.push(collectionId);
      }
    }

    return createdCollections;
  },
});
