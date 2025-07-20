import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all products with pagination and filtering
export const getProducts = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    )),
    search: v.optional(v.string()),
    collection: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("products");
    
    // Filter by status if provided
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    // Filter by featured if provided
    if (args.featured !== undefined) {
      query = query.filter((q) => q.eq(q.field("featured"), args.featured));
    }
    
    // Collect all results first
    const allProducts = await query.collect();

    // Apply search if provided (using partial matching)
    let filteredProducts = allProducts;
    if (args.search) {
      const searchTerm = args.search.toLowerCase();
      filteredProducts = allProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.casNumber && product.casNumber.toLowerCase().includes(searchTerm)) ||
        (product.chemicalName && product.chemicalName.toLowerCase().includes(searchTerm)) ||
        (product.molecularFormula && product.molecularFormula.toLowerCase().includes(searchTerm)) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Filter by collection if provided
    if (args.collection) {
      filteredProducts = filteredProducts.filter(product =>
        product.collections.includes(args.collection!)
      );
    }

    // Sort by creation date (newest first)
    filteredProducts.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const products = filteredProducts.slice(offset, offset + limit);
    
    return products;
  },
});

// Query to get product by ID
export const getProductById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get product by product ID
export const getProductByProductId = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();
  },
});

// Query to get featured products
export const getFeaturedProducts = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("status"), "active"));

    const allFeaturedProducts = await query.collect();

    // Apply search if provided
    let filteredProducts = allFeaturedProducts;
    if (args.search) {
      filteredProducts = allFeaturedProducts.filter(product =>
        product.title.toLowerCase().includes(args.search!.toLowerCase()) ||
        product.description.toLowerCase().includes(args.search!.toLowerCase()) ||
        (product.casNumber && product.casNumber.toLowerCase().includes(args.search!.toLowerCase())) ||
        (product.chemicalName && product.chemicalName.toLowerCase().includes(args.search!.toLowerCase()))
      );
    }

    // Sort by creation date (newest first)
    filteredProducts.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const products = filteredProducts.slice(offset, offset + limit);

    return products;
  },
});

// Query to get products by CAS number
export const getProductByCasNumber = query({
  args: { casNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_cas_number", (q) => q.eq("casNumber", args.casNumber))
      .first();
  },
});

// Mutation to create or update product data
export const upsertProduct = mutation({
  args: {
    productId: v.string(),
    title: v.string(),
    description: v.string(),
    descriptionHtml: v.optional(v.string()),
    tags: v.array(v.string()),
    collections: v.array(v.string()),
    images: v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),
    priceRange: v.optional(v.object({
      minVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
      maxVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
    })),
    // Chemical-specific fields
    purity: v.optional(v.string()),
    packaging: v.optional(v.string()),
    casNumber: v.optional(v.string()),
    hsnNumber: v.optional(v.string()),
    molecularFormula: v.optional(v.string()),
    molecularWeight: v.optional(v.string()),
    appearance: v.optional(v.string()),
    solubility: v.optional(v.string()),
    phValue: v.optional(v.string()),
    chemicalName: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    applications: v.optional(v.array(v.string())),
    applicationDetails: v.optional(v.array(v.string())),
    totalInventory: v.optional(v.number()),
    quantity: v.optional(v.number()), // Available quantity for sale
    // Admin fields
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    )),
    featured: v.optional(v.boolean()),
    adminId: v.optional(v.id("admins")),
  },
  handler: async (ctx, args) => {
    // Check if product already exists
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("by_product_id", (q) => q.eq("productId", args.productId))
      .first();

    const now = Date.now();

    if (existingProduct) {
      // Update existing product
      await ctx.db.patch(existingProduct._id, {
        title: args.title,
        description: args.description,
        descriptionHtml: args.descriptionHtml,
        tags: args.tags,
        collections: args.collections,
        images: args.images,
        priceRange: args.priceRange || existingProduct.priceRange || {
          minVariantPrice: { amount: "0", currencyCode: "INR" },
          maxVariantPrice: { amount: "0", currencyCode: "INR" },
        },
        purity: args.purity,
        packaging: args.packaging,
        casNumber: args.casNumber,
        hsnNumber: args.hsnNumber,
        molecularFormula: args.molecularFormula,
        molecularWeight: args.molecularWeight,
        appearance: args.appearance,
        solubility: args.solubility,
        phValue: args.phValue,
        chemicalName: args.chemicalName,
        features: args.features,
        applications: args.applications,
        applicationDetails: args.applicationDetails,
        totalInventory: args.totalInventory,
        quantity: args.quantity,
        status: args.status || existingProduct.status,
        featured: args.featured !== undefined ? args.featured : existingProduct.featured,
        updatedAt: now,
        lastSyncedAt: now,
        updatedBy: args.adminId,
      });
      return existingProduct._id;
    } else {
      // Create new product
      const newProductId = await ctx.db.insert("products", {
        productId: args.productId,
        title: args.title,
        description: args.description,
        descriptionHtml: args.descriptionHtml,
        tags: args.tags,
        collections: args.collections,
        images: args.images,
        priceRange: args.priceRange || {
          minVariantPrice: { amount: "0", currencyCode: "INR" },
          maxVariantPrice: { amount: "0", currencyCode: "INR" },
        },
        purity: args.purity,
        packaging: args.packaging,
        casNumber: args.casNumber,
        hsnNumber: args.hsnNumber,
        molecularFormula: args.molecularFormula,
        molecularWeight: args.molecularWeight,
        appearance: args.appearance,
        solubility: args.solubility,
        phValue: args.phValue,
        chemicalName: args.chemicalName,
        features: args.features,
        applications: args.applications,
        applicationDetails: args.applicationDetails,
        totalInventory: args.totalInventory,
        quantity: args.quantity,
        status: args.status || "active", // New products start as active
        featured: args.featured || false,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
        createdBy: args.adminId,
      });

      return newProductId;
    }
  },
});

// Mutation to update product status
export const updateProductStatus = mutation({
  args: {
    productId: v.id("products"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    ),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const now = Date.now();
    
    await ctx.db.patch(args.productId, {
      status: args.status,
      updatedAt: now,
      updatedBy: args.adminId,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "product_status_updated",
      entityType: "product",
      entityId: args.productId,
      oldValues: { status: product.status },
      newValues: { status: args.status },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    return args.productId;
  },
});

// Mutation to toggle product featured status
export const toggleProductFeatured = mutation({
  args: {
    productId: v.id("products"),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const now = Date.now();
    const newFeaturedStatus = !product.featured;
    
    await ctx.db.patch(args.productId, {
      featured: newFeaturedStatus,
      updatedAt: now,
      updatedBy: args.adminId,
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "product_featured_toggled",
      entityType: "product",
      entityId: args.productId,
      oldValues: { featured: product.featured },
      newValues: { featured: newFeaturedStatus },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    return args.productId;
  },
});

// Mutation to bulk update product status
export const bulkUpdateProductStatus = mutation({
  args: {
    productIds: v.array(v.id("products")),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    ),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updatedIds = [];

    for (const productId of args.productIds) {
      const product = await ctx.db.get(productId);
      if (product) {
        await ctx.db.patch(productId, {
          status: args.status,
          updatedAt: now,
          updatedBy: args.adminId,
        });

        // Log the activity
        await ctx.db.insert("activityLogs", {
          action: "product_bulk_status_update",
          entityType: "product",
          entityId: productId,
          oldValues: { status: product.status },
          newValues: { status: args.status },
          performedBy: args.adminId,
          performedByType: "admin",
          createdAt: now,
        });

        updatedIds.push(productId);
      }
    }

    return updatedIds;
  },
});

// Query to get collections
export const getCollections = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allProducts = await ctx.db.query("products").collect();

    // Extract unique collections with product counts
    const collectionMap = new Map();

    allProducts.forEach(product => {
      product.collections.forEach(collection => {
        if (!collectionMap.has(collection)) {
          collectionMap.set(collection, {
            name: collection,
            productCount: 0,
            products: []
          });
        }
        const collectionData = collectionMap.get(collection);
        collectionData.productCount++;
        collectionData.products.push(product._id);
      });
    });

    let collections = Array.from(collectionMap.values());

    // Apply search filter
    if (args.search) {
      collections = collections.filter(collection =>
        collection.name.toLowerCase().includes(args.search!.toLowerCase())
      );
    }

    // Sort by product count (descending)
    collections.sort((a, b) => b.productCount - a.productCount);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;

    return collections.slice(offset, offset + limit);
  },
});

// Query to get collection statistics
export const getCollectionStats = query({
  args: {},
  handler: async (ctx) => {
    const allProducts = await ctx.db.query("products").collect();
    const allCollections = [...new Set(allProducts.flatMap(p => p.collections))];

    const stats = {
      total: allCollections.length,
      totalProducts: allProducts.length,
      avgProductsPerCollection: allCollections.length > 0 ? Math.round(allProducts.length / allCollections.length) : 0,
      mostPopular: allCollections.length > 0 ? allCollections[0] : null,
    };

    return stats;
  },
});

// Query to get featured product statistics
export const getFeaturedStats = query({
  args: {},
  handler: async (ctx) => {
    const allProducts = await ctx.db.query("products").collect();
    const featuredProducts = allProducts.filter(p => p.featured === true);

    const stats = {
      total: featuredProducts.length,
      active: featuredProducts.filter(p => p.status === "active").length,
      avgViews: 0, // Will be calculated from real analytics data
      performance: "Unknown", // Will be calculated from real performance metrics
    };

    return stats;
  },
});

// Mutation to delete a product
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const now = Date.now();

    // Update collection product counts for collections this product was in
    if (product.collections && product.collections.length > 0) {
      for (const collectionId of product.collections) {
        const collection = await ctx.db
          .query("collections")
          .withIndex("by_collection_id", (q) => q.eq("collectionId", collectionId))
          .first();

        if (collection) {
          // Recalculate product count after deletion
          const allProducts = await ctx.db.query("products").collect();
          const productCount = allProducts.filter(p =>
            p._id !== args.productId && p.collections.includes(collectionId)
          ).length;

          await ctx.db.patch(collection._id, {
            productCount,
            updatedAt: now,
          });
        }
      }
    }

    // Delete the product
    await ctx.db.delete(args.productId);

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "product_deleted",
      entityType: "product",
      entityId: args.productId,
      oldValues: {
        title: product.title,
        productId: product.productId,
        status: product.status,
        collections: product.collections,
      },
      newValues: null,
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    return args.productId;
  },
});

// Mutation to create a new product
export const createProduct = mutation({
  args: {
    productId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    casNumber: v.optional(v.string()),
    molecularFormula: v.optional(v.string()),
    molecularWeight: v.optional(v.string()),
    purity: v.optional(v.string()),
    hsnNumber: v.optional(v.string()),
    appearance: v.optional(v.string()),
    solubility: v.optional(v.string()),
    phValue: v.optional(v.string()),
    chemicalName: v.optional(v.string()),
    packaging: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    applications: v.optional(v.array(v.string())),
    collections: v.optional(v.array(v.string())), // Array of collection IDs
    images: v.optional(v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    }))),
    priceRange: v.optional(v.object({
      minVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
      maxVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
    })),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    ),
    featured: v.optional(v.boolean()),
    quantity: v.optional(v.number()), // Available quantity for sale
    adminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create new product
    const productId = await ctx.db.insert("products", {
      productId: args.productId,
      title: args.title,
      description: args.description || "",
      casNumber: args.casNumber,
      hsnNumber: args.hsnNumber,
      molecularFormula: args.molecularFormula,
      molecularWeight: args.molecularWeight,
      purity: args.purity,
      appearance: args.appearance,
      solubility: args.solubility,
      phValue: args.phValue,
      chemicalName: args.chemicalName,
      packaging: args.packaging,
      features: args.features,
      applications: args.applications,
      priceRange: args.priceRange || {
        minVariantPrice: { amount: "0", currencyCode: "INR" },
        maxVariantPrice: { amount: "0", currencyCode: "INR" },
      },
      status: args.status,
      featured: args.featured || false,
      quantity: args.quantity,
      collections: args.collections || [],
      images: args.images || [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      createdBy: args.adminId,
      updatedBy: args.adminId,
    });

    // Update collection product counts
    if (args.collections && args.collections.length > 0) {
      for (const collectionId of args.collections) {
        const collection = await ctx.db
          .query("collections")
          .withIndex("by_collection_id", (q) => q.eq("collectionId", collectionId))
          .first();

        if (collection) {
          const allProducts = await ctx.db.query("products").collect();
          const productCount = allProducts.filter(product =>
            product.collections.includes(collectionId)
          ).length;

          await ctx.db.patch(collection._id, {
            productCount,
            updatedAt: now,
          });
        }
      }
    }

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "product_created",
      entityType: "product",
      entityId: productId,
      oldValues: {},
      newValues: {
        title: args.title,
        status: args.status,
        featured: args.featured || false,
        collections: args.collections || [],
      },
      performedBy: args.adminId,
      performedByType: "admin",
      createdAt: now,
    });

    return productId;
  },
});

// Query to get product statistics
export const getProductStats = query({
  args: {},
  handler: async (ctx) => {
    const allProducts = await ctx.db.query("products").collect();

    const stats = {
      total: allProducts.length,
      active: allProducts.filter(p => p.status === "active").length,
      inactive: allProducts.filter(p => p.status === "inactive").length,
      discontinued: allProducts.filter(p => p.status === "discontinued").length,
      pendingReview: allProducts.filter(p => p.status === "pending_review").length,
      featured: allProducts.filter(p => p.featured === true).length,
      recentlyAdded: allProducts.filter(p =>
        p.createdAt > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      ).length,
      collections: [...new Set(allProducts.flatMap(p => p.collections))].length,
    };

    return stats;
  },
});
