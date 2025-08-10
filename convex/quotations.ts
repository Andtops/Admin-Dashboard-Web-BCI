import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to generate quotation number
function generateQuotationNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `QT-${year}-${timestamp}`;
}

// Helper function to calculate financial summary
function calculateFinancialSummary(lineItems: any[], currency: string = "INR") {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  lineItems.forEach(item => {
    const itemTotal = (item.unitPrice || 0) * item.quantity;
    subtotal += itemTotal;

    // Calculate discount
    if (item.discount) {
      const discountAmount = item.discount.type === "percentage"
        ? (itemTotal * item.discount.value) / 100
        : item.discount.value;
      totalDiscount += discountAmount;
    }

    // Calculate tax
    if (item.taxRate) {
      const taxableAmount = itemTotal - (item.discount ?
        (item.discount.type === "percentage" ? (itemTotal * item.discount.value) / 100 : item.discount.value) : 0);
      totalTax += (taxableAmount * item.taxRate) / 100;
    }
  });

  const taxableAmount = subtotal - totalDiscount;
  const grandTotal = taxableAmount + totalTax;

  return {
    subtotal,
    totalDiscount,
    taxableAmount,
    totalTax,
    grandTotal,
    currency,
    shippingCharges: 0,
    otherCharges: 0,
  };
}

// Query to get quotations by user ID
export const getQuotationsByUserId = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    includeUnreadCount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const quotations = await ctx.db
      .query("quotations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by creation date (newest first)
    quotations.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginatedQuotations = quotations.slice(offset, offset + limit);

    // Add unread message count if requested
    let quotationsWithUnread = paginatedQuotations;
    if (args.includeUnreadCount) {
      quotationsWithUnread = await Promise.all(
        paginatedQuotations.map(async (quotation) => {
          const unreadMessages = await ctx.db
            .query("quotationMessages")
            .withIndex("by_quotationId", (q) => q.eq("quotationId", quotation._id))
            .filter((q) => q.and(
              q.eq(q.field("authorRole"), "admin"),
              q.eq(q.field("isReadByUser"), false)
            ))
            .collect();

          return {
            ...quotation,
            unreadMessageCount: unreadMessages.length,
          };
        })
      );
    }

    return {
      quotations: quotationsWithUnread,
      total: quotations.length,
      hasMore: offset + limit < quotations.length,
    };
  },
});

// Query to get current draft quotation for a user
export const getCurrentDraftQuotation = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const draftQuotations = await ctx.db
      .query("quotations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "draft"))
      .collect();

    // Sort by creation date (newest first) and return the most recent draft
    draftQuotations.sort((a, b) => b.createdAt - a.createdAt);

    return draftQuotations.length > 0 ? draftQuotations[0] : null;
  },
});

// Query to get all quotations (admin view)
export const getAllQuotations = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    let quotationsQuery;

    // Filter by status if provided
    if (args.status) {
      quotationsQuery = ctx.db
        .query("quotations")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      quotationsQuery = ctx.db.query("quotations");
    }

    const allQuotations = await quotationsQuery.collect();

    // Sort by creation date (newest first)
    allQuotations.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const quotations = allQuotations.slice(offset, offset + limit);

    return quotations;
  },
});

// Mutation to create a new professional quotation
export const createProfessionalQuotation = mutation({
  args: {
    // Customer Information
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    userPhone: v.optional(v.string()),
    businessName: v.optional(v.string()),

    // Line items
    lineItems: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      description: v.optional(v.string()),
      specifications: v.optional(v.string()),
      quantity: v.number(),
      unit: v.string(),
      notes: v.optional(v.string()),
    })),

    // Addresses
    billingAddress: v.optional(v.object({
      companyName: v.optional(v.string()),
      contactPerson: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    })),

    shippingAddress: v.optional(v.object({
      companyName: v.optional(v.string()),
      contactPerson: v.string(),
      street: v.string(),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    })),

    // Delivery requirements
    deliveryTerms: v.optional(v.object({
      deliveryLocation: v.optional(v.string()),
      estimatedDeliveryDays: v.optional(v.number()),
      shippingMethod: v.optional(v.string()),
      specialInstructions: v.optional(v.string()),
    })),

    // Additional requirements (legacy support)
    additionalRequirements: v.optional(v.string()),
    urgency: v.optional(v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("asap")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotationNumber = generateQuotationNumber();

    // Default vendor information (should be configurable in production)
    const vendorInfo = {
      companyName: "Benzochem Industries",
      address: {
        street: "Industrial Area, Phase-1",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
      contactPerson: {
        name: "Sales Manager",
        designation: "Sales Manager",
        email: "sales@benzochem.com",
        phone: "+91-9876543210",
      },
      taxRegistration: {
        gstNumber: "27ABCDE1234F1Z5",
        panNumber: "ABCDE1234F",
      },
    };

    // Convert line items to include itemId
    const processedLineItems = args.lineItems.map((item, index) => ({
      ...item,
      itemId: `item_${index + 1}`,
      unitPrice: 0, // Will be filled by admin
      taxRate: 18, // Default GST rate
      lineTotal: 0,
    }));

    const quotationId = await ctx.db.insert("quotations", {
      quotationNumber,
      version: 1,
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      userPhone: args.userPhone,
      businessName: args.businessName,
      vendorInfo,
      billingAddress: args.billingAddress,
      shippingAddress: args.shippingAddress,
      lineItems: processedLineItems,
      deliveryTerms: args.deliveryTerms,
      status: "pending",
      threadStatus: "active",
      // Audit trail removed for simplicity
      additionalRequirements: args.additionalRequirements,
      urgency: args.urgency || "standard",
      createdAt: now,
      updatedAt: now,
      createdBy: args.userId,
    });

    // Create notification for new quotation request
    await ctx.db.insert("notifications", {
      type: "order_notification",
      title: "New Professional Quotation Request",
      message: `New quotation request ${quotationNumber} from ${args.userName} (${args.userEmail}) for ${args.lineItems.length} item(s).`,
      recipientType: "all_admins",
      isRead: false,
      priority: args.urgency === "asap" ? "urgent" : args.urgency === "urgent" ? "high" : "medium",
      relatedEntityType: "order",
      relatedEntityId: quotationId,
      createdAt: now,
    });

    return { quotationId, quotationNumber };
  },
});

// Legacy mutation for backward compatibility
export const createQuotation = mutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    userPhone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    products: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.string(),
      unit: v.string(),
      specifications: v.optional(v.string()),
    })),
    additionalRequirements: v.optional(v.string()),
    deliveryLocation: v.optional(v.string()),
    urgency: v.optional(v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("asap")
    )),
  },
  handler: async (ctx, args) => {
    // Convert legacy products to new line items format
    const lineItems = args.products.map((product, index) => ({
      itemId: `item_${index + 1}`,
      productId: product.productId,
      productName: product.productName,
      description: undefined,
      specifications: product.specifications,
      quantity: parseFloat(product.quantity) || 1,
      unit: product.unit,
      unitPrice: 0,
      taxRate: 18,
      lineTotal: 0,
      notes: undefined,
    }));

    const now = Date.now();
    const quotationNumber = generateQuotationNumber();

    // Default vendor information (should be configurable in production)
    const vendorInfo = {
      companyName: "Benzochem Industries",
      address: {
        street: "Industrial Area, Phase-1",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
      contactPerson: {
        name: "Sales Manager",
        designation: "Sales Manager",
        email: "sales@benzochem.com",
        phone: "+91-9876543210",
      },
      taxRegistration: {
        gstNumber: "27ABCDE1234F1Z5",
        panNumber: "ABCDE1234F",
      },
    };

    const quotationId = await ctx.db.insert("quotations", {
      quotationNumber,
      version: 1,
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      userPhone: args.userPhone,
      businessName: args.businessName,
      vendorInfo,
      lineItems,
      deliveryTerms: args.deliveryLocation ? {
        deliveryLocation: args.deliveryLocation,
      } : undefined,
      status: "pending",
      threadStatus: "active",
      // Audit trail removed for simplicity
      additionalRequirements: args.additionalRequirements,
      urgency: args.urgency || "standard",
      createdAt: now,
      updatedAt: now,
      createdBy: args.userId,
    });

    // Create notification for new quotation request
    await ctx.db.insert("notifications", {
      type: "order_notification",
      title: "New Quotation Request",
      message: `New quotation request ${quotationNumber} from ${args.userName} (${args.userEmail}) for ${args.products.length} product(s).`,
      recipientType: "all_admins",
      isRead: false,
      priority: args.urgency === "asap" ? "urgent" : args.urgency === "urgent" ? "high" : "medium",
      relatedEntityType: "order",
      relatedEntityId: quotationId,
      createdAt: now,
    });

    return { quotationId, quotationNumber };
  },
});

// Query to get quotation by ID
export const getQuotationById = query({
  args: { quotationId: v.id("quotations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.quotationId);
  },
});

// Mutation to update professional quotation with pricing and terms
export const updateProfessionalQuotation = mutation({
  args: {
    quotationId: v.id("quotations"),
    lineItems: v.optional(v.array(v.object({
      itemId: v.string(),
      productId: v.string(),
      productName: v.string(),
      description: v.optional(v.string()),
      specifications: v.optional(v.string()),
      quantity: v.number(),
      unit: v.string(),
      unitPrice: v.number(),
      discount: v.optional(v.object({
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        value: v.number(),
      })),
      taxRate: v.number(),
      lineTotal: v.number(),
      notes: v.optional(v.string()),
      productImage: v.optional(v.string()), // Product image URL
    }))),
    paymentTerms: v.optional(v.object({
      paymentMethod: v.optional(v.string()),
      creditDays: v.optional(v.number()),
      advancePayment: v.optional(v.object({
        required: v.boolean(),
        percentage: v.optional(v.number()),
        amount: v.optional(v.number()),
      })),
      bankDetails: v.optional(v.object({
        bankName: v.string(),
        accountNumber: v.string(),
        ifscCode: v.string(),
        accountHolderName: v.string(),
      })),
    })),
    deliveryTerms: v.optional(v.object({
      incoterms: v.optional(v.string()),
      deliveryLocation: v.optional(v.string()),
      estimatedDeliveryDays: v.optional(v.number()),
      shippingMethod: v.optional(v.string()),
      packagingType: v.optional(v.string()),
      specialInstructions: v.optional(v.string()),
    })),
    termsAndConditions: v.optional(v.object({
      generalTerms: v.optional(v.string()),
      specificTerms: v.optional(v.array(v.string())),
      cancellationPolicy: v.optional(v.string()),
      disputeResolution: v.optional(v.string()),
    })),
    warrantyInfo: v.optional(v.object({
      warrantyPeriod: v.optional(v.string()),
      warrantyTerms: v.optional(v.string()),
      replacementPolicy: v.optional(v.string()),
    })),
    validUntil: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
    performedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const updateData: any = {
      updatedAt: now,
      lastModifiedBy: args.performedBy,
    };

    // Update line items and calculate financial summary
    if (args.lineItems) {
      updateData.lineItems = args.lineItems;
      updateData.financialSummary = calculateFinancialSummary(args.lineItems);

      // Calculate tax details
      const taxDetails: Array<{
        taxType: string;
        taxRate: number;
        taxableAmount: number;
        taxAmount: number;
      }> = [];
      let totalTax = 0;

      args.lineItems.forEach(item => {
        const taxableAmount = item.lineTotal - (item.discount ?
          (item.discount.type === "percentage" ? (item.lineTotal * item.discount.value) / 100 : item.discount.value) : 0);
        const taxAmount = (taxableAmount * item.taxRate) / 100;
        totalTax += taxAmount;

        const existingTax = taxDetails.find(t => t.taxRate === item.taxRate);
        if (existingTax) {
          existingTax.taxableAmount += taxableAmount;
          existingTax.taxAmount += taxAmount;
        } else {
          taxDetails.push({
            taxType: item.taxRate === 18 ? "GST" : "TAX",
            taxRate: item.taxRate,
            taxableAmount,
            taxAmount,
          });
        }
      });

      updateData.taxDetails = taxDetails;
    }

    // Update other fields
    if (args.paymentTerms) updateData.paymentTerms = args.paymentTerms;
    if (args.deliveryTerms) updateData.deliveryTerms = args.deliveryTerms;
    if (args.termsAndConditions) updateData.termsAndConditions = args.termsAndConditions;
    if (args.warrantyInfo) updateData.warrantyInfo = args.warrantyInfo;
    if (args.validUntil) updateData.validUntil = args.validUntil;

    // Update admin response
    updateData.adminResponse = {
      quotedBy: args.performedBy,
      quotedAt: now,
      processingNotes: args.adminNotes,
    };

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, updateData);

    return args.quotationId;
  },
});

// Mutation to update quotation status with professional features
export const updateQuotationStatus = mutation({
  args: {
    quotationId: v.id("quotations"),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("processing"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
      v.literal("closed"),
      v.literal("revised")
    ),
    performedBy: v.string(),
    notes: v.optional(v.string()),
    totalAmount: v.optional(v.string()),
    validUntil: v.optional(v.string()),
    terms: v.optional(v.string()),
    gstDetails: v.optional(v.object({
      subtotal: v.number(),
      cgstRate: v.number(),
      sgstRate: v.number(),
      igstRate: v.number(),
      cgstAmount: v.number(),
      sgstAmount: v.number(),
      igstAmount: v.number(),
      totalTax: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: now,
      lastModifiedBy: args.performedBy,
    };

    // Handle admin response with proper schema fields
    if (args.status === "quoted") {
      updateData.adminResponse = {
        quotedBy: args.performedBy,
        quotedAt: now,
        totalAmount: args.totalAmount,
        validUntil: args.validUntil ? new Date(args.validUntil).getTime() : undefined,
        terms: args.terms,
        notes: args.notes,
        gstDetails: args.gstDetails,
      };

      // Set validity dates for quoted status
      if (args.validUntil) {
        updateData.validFrom = now;
        updateData.validUntil = new Date(args.validUntil).getTime();
      } else if (!quotation.validUntil) {
        updateData.validFrom = now;
        updateData.validUntil = now + (30 * 24 * 60 * 60 * 1000); // 30 days validity
      }
    } else if (args.notes) {
      updateData.adminResponse = {
        quotedBy: args.performedBy,
        quotedAt: now,
        processingNotes: args.notes,
      };
    }

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, updateData);

    // Create notification for status update
    let notificationMessage = "";
    let notificationType: "order_notification" = "order_notification";

    switch (args.status) {
      case "processing":
        notificationMessage = `Your quotation ${quotation.quotationNumber} is being processed.`;
        break;
      case "quoted":
        notificationMessage = `Your quotation ${quotation.quotationNumber} is ready! Please check your account for details.`;
        break;
      case "accepted":
        notificationMessage = `Your quotation ${quotation.quotationNumber} has been accepted. We will contact you soon.`;
        break;
      case "rejected":
        notificationMessage = `Your quotation request ${quotation.quotationNumber} has been declined.`;
        break;
      case "expired":
        notificationMessage = `Your quotation ${quotation.quotationNumber} has expired. Please submit a new request if still interested.`;
        break;
    }

    if (notificationMessage) {
      // Find user by userId to get the database ID
      const user = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("userId", quotation.userId))
        .first();

      if (user) {
        await ctx.db.insert("notifications", {
          type: notificationType,
          title: "Quotation Status Update",
          message: notificationMessage,
          recipientType: "specific_user",
          recipientId: user._id,
          isRead: false,
          priority: args.status === "quoted" ? "high" : "medium",
          relatedEntityType: "order",
          relatedEntityId: args.quotationId,
          createdAt: now,
        });
      }
    }

    return args.quotationId;
  },
});

// Query to get quotation by quotation number
export const getQuotationByNumber = query({
  args: { quotationNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotations")
      .withIndex("by_quotation_number", (q) => q.eq("quotationNumber", args.quotationNumber))
      .first();
  },
});

// Mutation to generate PDF for quotation
export const generateQuotationPDF = mutation({
  args: {
    quotationId: v.id("quotations"),
    performedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Update document info
    const updateData: any = {
      documentInfo: {
        pdfGenerated: true,
        pdfUrl: `/api/quotations/${quotation.quotationNumber}/pdf`, // This would be implemented separately
        digitalSignature: {
          signed: false,
        },
        attachments: quotation.documentInfo?.attachments || [],
      },
      updatedAt: now,
      lastModifiedBy: args.performedBy,
    };

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, updateData);

    return { success: true, pdfUrl: updateData.documentInfo.pdfUrl };
  },
});

// Mutation to add digital signature
export const addDigitalSignature = mutation({
  args: {
    quotationId: v.id("quotations"),
    signedBy: v.string(),
    signatureHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const updateData: any = {
      documentInfo: {
        ...quotation.documentInfo,
        pdfGenerated: quotation.documentInfo?.pdfGenerated || false,
        digitalSignature: {
          signed: true,
          signedBy: args.signedBy,
          signedAt: now,
          signatureHash: args.signatureHash,
        },
      },
      updatedAt: now,
      lastModifiedBy: args.signedBy,
    };

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, updateData);

    return { success: true };
  },
});

// Query to get expiring quotations
export const getExpiringQuotations = query({
  args: {
    daysAhead: v.optional(v.number()), // Default 7 days
  },
  handler: async (ctx, args) => {
    const daysAhead = args.daysAhead || 7;
    const expiryThreshold = Date.now() + (daysAhead * 24 * 60 * 60 * 1000);

    const quotations = await ctx.db
      .query("quotations")
      .withIndex("by_valid_until")
      .filter((q) => q.and(
        q.eq(q.field("status"), "quoted"),
        q.lt(q.field("validUntil"), expiryThreshold),
        q.gt(q.field("validUntil"), Date.now())
      ))
      .collect();

    return quotations;
  },
});

// Query to get quotation statistics with professional metrics
export const getQuotationStats = query({
  args: {},
  handler: async (ctx) => {
    const allQuotations = await ctx.db.query("quotations").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Calculate total value of accepted quotations
    const acceptedQuotations = allQuotations.filter(q => q.status === "accepted");
    const totalValue = acceptedQuotations.reduce((sum, q) => {
      return sum + (q.financialSummary?.grandTotal || 0);
    }, 0);

    const stats = {
      total: allQuotations.length,
      draft: allQuotations.filter(q => q.status === "draft").length,
      pending: allQuotations.filter(q => q.status === "pending").length,
      processing: allQuotations.filter(q => q.status === "processing").length,
      quoted: allQuotations.filter(q => q.status === "quoted").length,
      accepted: allQuotations.filter(q => q.status === "accepted").length,
      rejected: allQuotations.filter(q => q.status === "rejected").length,
      expired: allQuotations.filter(q => q.status === "expired").length,
      closed: allQuotations.filter(q => q.status === "closed").length,
      revised: allQuotations.filter(q => q.status === "revised").length,

      // Time-based metrics
      recentRequests: allQuotations.filter(q => q.createdAt > sevenDaysAgo).length,
      monthlyRequests: allQuotations.filter(q => q.createdAt > thirtyDaysAgo).length,

      // Financial metrics
      totalValue,
      averageValue: acceptedQuotations.length > 0 ? totalValue / acceptedQuotations.length : 0,

      // Conversion metrics
      conversionRate: allQuotations.length > 0 ? (acceptedQuotations.length / allQuotations.length) * 100 : 0,

      // Expiring quotations
      expiringQuotations: allQuotations.filter(q =>
        q.status === "quoted" &&
        q.validUntil &&
        q.validUntil > now &&
        q.validUntil < now + (7 * 24 * 60 * 60 * 1000)
      ).length,
    };

    return stats;
  },
});

// Mutation to create a draft quotation for user cart functionality
export const createDraftQuotation = mutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    userPhone: v.optional(v.string()),
    businessName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotationNumber = generateQuotationNumber();

    // Default vendor information (should be configurable in production)
    const vendorInfo = {
      companyName: "Benzochem Industries",
      address: {
        street: "Industrial Area, Phase-1",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
      contactPerson: {
        name: "Sales Manager",
        designation: "Sales Manager",
        email: "sales@benzochem.com",
        phone: "+91-9876543210",
      },
      taxRegistration: {
        gstNumber: "27ABCDE1234F1Z5",
        panNumber: "ABCDE1234F",
      },
    };

    const quotationId = await ctx.db.insert("quotations", {
      quotationNumber,
      version: 1,
      userId: args.userId,
      userEmail: args.userEmail,
      userName: args.userName,
      userPhone: args.userPhone,
      businessName: args.businessName,
      vendorInfo,
      lineItems: [], // Empty draft
      status: "draft", // This is the key difference - creating as draft
      threadStatus: "active",
      // Audit trail removed for simplicity
      additionalRequirements: '',
      urgency: "standard",
      createdAt: now,
      updatedAt: now,
      createdBy: args.userId,
    });

    return { quotationId, quotationNumber };
  },
});

// Mutation to create quotation revision
export const createQuotationRevision = mutation({
  args: {
    originalQuotationId: v.id("quotations"),
    performedBy: v.string(),
    revisionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const originalQuotation = await ctx.db.get(args.originalQuotationId);

    if (!originalQuotation) {
      throw new Error("Original quotation not found");
    }

    // Create new quotation with incremented version
    const newVersion = (originalQuotation.version || 1) + 1;
    const { _id, _creationTime, ...quotationData } = originalQuotation;
    const revisionQuotationId = await ctx.db.insert("quotations", {
      ...quotationData,
      version: newVersion,
      status: "draft",
      validFrom: undefined,
      validUntil: undefined,
      // Audit trail removed for simplicity
      createdAt: now,
      updatedAt: now,
      lastModifiedBy: args.performedBy,
    });

    // Update original quotation status to revised
    await ctx.db.patch(args.originalQuotationId, {
      status: "revised",
      updatedAt: now,
      // Audit trail removed for simplicity
    });

    return { revisionQuotationId, version: newVersion };
  },
});

// Mutation to update quotation urgency
export const updateQuotationUrgency = mutation({
  args: {
    quotationId: v.id("quotations"),
    urgency: v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("asap")
    ),
    performedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const oldUrgency = quotation.urgency || "standard";

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, {
      urgency: args.urgency,
      updatedAt: now,
      lastModifiedBy: args.performedBy,
    });

    return args.quotationId;
  },
});

// General mutation to update quotation fields
export const updateQuotation = mutation({
  args: {
    quotationId: v.id("quotations"),
    updates: v.any(), // Flexible updates object
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quotation = await ctx.db.get(args.quotationId);

    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Prepare the update object
    const updateData = {
      ...args.updates,
      updatedAt: now,
      lastModifiedBy: args.updatedBy,
    };

    // Audit trail removed for simplicity - using simple updatedAt and lastModifiedBy tracking

    await ctx.db.patch(args.quotationId, updateData);

    return args.quotationId;
  },
});