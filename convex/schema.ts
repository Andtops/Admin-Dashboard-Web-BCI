import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - customer and business user data
  users: defineTable({
    // User identification
    userId: v.string(), // Unique user identifier
    email: v.string(),
    password: v.string(), // Plain text password (DEVELOPMENT ONLY - NOT SECURE!)
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    gstNumber: v.optional(v.string()),
    isGstVerified: v.optional(v.boolean()),
    
    // Admin-specific fields
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    role: v.union(
      v.literal("user"),
      v.literal("admin"),
      v.literal("super_admin")
    ),
    
    // Approval workflow
    approvedBy: v.optional(v.id("admins")),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.id("admins")),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    
    // Additional business info
    legalNameOfBusiness: v.optional(v.string()),
    tradeName: v.optional(v.string()),
    dateOfRegistration: v.optional(v.string()),
    constitutionOfBusiness: v.optional(v.string()),
    taxpayerType: v.optional(v.string()),
    gstStatus: v.optional(v.string()),
    principalPlaceOfBusiness: v.optional(v.string()),
    natureOfCoreBusinessActivity: v.optional(v.string()),
    
    // Marketing preferences
    agreedToEmailMarketing: v.optional(v.boolean()),
    agreedToSmsMarketing: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_role", ["role"])
    .index("by_created_at", ["createdAt"]),

  // Admin users table (simplified for development/testing)
  admins: defineTable({
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    password: v.string(), // Plain text password (DEVELOPMENT ONLY - NOT SECURE!)
    role: v.optional(v.union(v.literal("admin"), v.literal("super_admin"))),
    permissions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Collections table - product categories and groupings
  collections: defineTable({
    // Collection identification
    collectionId: v.string(), // Unique collection identifier
    title: v.string(),
    description: v.optional(v.string()),
    handle: v.string(), // URL-friendly identifier

    // Collection metadata
    image: v.optional(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),

    // SEO and display
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),

    // Collection settings
    status: v.union(
      v.literal("active"),
      v.literal("inactive")
    ),
    sortOrder: v.optional(v.number()), // For ordering collections
    isVisible: v.boolean(), // Whether to show in navigation

    // Product count (denormalized for performance)
    productCount: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("admins")),
    updatedBy: v.optional(v.id("admins")),
  })
    .index("by_collection_id", ["collectionId"])
    .index("by_handle", ["handle"])
    .index("by_status", ["status"])
    .index("by_sort_order", ["sortOrder"])
    .index("by_created_at", ["createdAt"]),

  // Products table - chemical products and inventory data
  products: defineTable({
    // Product identification
    productId: v.string(), // Unique product identifier
    title: v.string(),
    description: v.string(),
    descriptionHtml: v.optional(v.string()),
    tags: v.array(v.string()),
    collections: v.array(v.string()),
    images: v.array(v.object({
      url: v.string(),
      altText: v.optional(v.string()),
    })),
    
    // Pricing
    priceRange: v.object({
      minVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
      maxVariantPrice: v.object({
        amount: v.string(),
        currencyCode: v.string(),
      }),
    }),
    
    // Chemical-specific metafields
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
    
    // Admin fields
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("discontinued"),
      v.literal("pending_review")
    ),
    featured: v.boolean(),
    totalInventory: v.optional(v.number()),
    quantity: v.optional(v.number()), // Available quantity for sale
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSyncedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("admins")),
    updatedBy: v.optional(v.id("admins")),
  })
    .index("by_product_id", ["productId"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"])
    .index("by_created_at", ["createdAt"])
    .index("by_cas_number", ["casNumber"]),

  // Notifications table
  notifications: defineTable({
    type: v.union(
      v.literal("user_registration"),
      v.literal("user_approval"),
      v.literal("user_rejection"),
      v.literal("product_update"),
      v.literal("system_alert"),
      v.literal("gst_verification"),
      v.literal("order_notification")
    ),
    title: v.string(),
    message: v.string(),
    
    // Recipients
    recipientType: v.union(
      v.literal("admin"),
      v.literal("user"),
      v.literal("all_admins"),
      v.literal("specific_user")
    ),
    recipientId: v.optional(v.union(v.id("admins"), v.id("users"))),
    
    // Status
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    readBy: v.optional(v.union(v.id("admins"), v.id("users"))),
    
    // Priority
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Related data
    relatedEntityType: v.optional(v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("order")
    )),
    relatedEntityId: v.optional(v.string()),
    
    // Metadata
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    createdBy: v.optional(v.id("admins")),
  })
    .index("by_recipient", ["recipientType", "recipientId"])
    .index("by_type", ["type"])
    .index("by_priority", ["priority"])
    .index("by_read_status", ["isRead"])
    .index("by_created_at", ["createdAt"]),

  // System settings table
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("general"),
      v.literal("api"),
      v.literal("notifications"),
      v.literal("security"),
      v.literal("integrations")
    ),
    isPublic: v.boolean(), // Whether this setting can be accessed by non-admin users
    updatedBy: v.optional(v.id("admins")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"]),

  // API keys table for external access
  apiKeys: defineTable({
    name: v.string(),
    key: v.string(), // Hashed API key (SHA-256)
    keyId: v.string(), // First 8 characters of the key for identification
    environment: v.literal("live"),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(),
    rateLimit: v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
      burstLimit: v.optional(v.number()),
    }),
    // Rate limiting tracking
    rateLimitResets: v.optional(v.object({
      minute: v.number(),
      hour: v.number(),
      day: v.number(),
    })),
    rateLimitCounts: v.optional(v.object({
      minute: v.number(),
      hour: v.number(),
      day: v.number(),
      burst: v.number(),
    })),
    // Revocation tracking
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("admins")),
    revocationReason: v.optional(v.string()),
    // Rotation tracking
    rotatedAt: v.optional(v.number()),
    rotatedBy: v.optional(v.id("admins")),
    rotationReason: v.optional(v.string()),
    createdBy: v.id("admins"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_key_id", ["keyId"])
    .index("by_environment", ["environment"])
    .index("by_active", ["isActive"])
    .index("by_created_by", ["createdBy"]),

  // Activity logs table
  activityLogs: defineTable({
    action: v.string(),
    entityType: v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("admin"),
      v.literal("setting"),
      v.literal("api_key"),
      v.literal("notification")
    ),
    entityId: v.string(),
    oldValues: v.optional(v.any()),
    newValues: v.optional(v.any()),
    performedBy: v.union(v.id("admins"), v.id("users")),
    performedByType: v.union(v.literal("admin"), v.literal("user"), v.literal("system")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_performed_by", ["performedBy"])
    .index("by_action", ["action"])
    .index("by_created_at", ["createdAt"]),

  // Professional Quotations table with comprehensive business fields
  quotations: defineTable({
    // Quotation identification (temporarily optional for migration)
    quotationNumber: v.optional(v.string()), // Professional quotation number (e.g., QT-2024-001)
    version: v.optional(v.number()), // Version control for quotation revisions
    
    // Customer Information
    userId: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    userPhone: v.optional(v.string()),
    businessName: v.optional(v.string()),
    
    // Company Information - Vendor/Supplier details (temporarily optional for migration)
    vendorInfo: v.optional(v.object({
      companyName: v.string(),
      address: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        postalCode: v.string(),
        country: v.string(),
      }),
      contactPerson: v.object({
        name: v.string(),
        designation: v.string(),
        email: v.string(),
        phone: v.string(),
      }),
      taxRegistration: v.object({
        gstNumber: v.optional(v.string()),
        vatNumber: v.optional(v.string()),
        panNumber: v.optional(v.string()),
      }),
    })),
    
    // Customer billing and shipping addresses
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
    
    // Line items with detailed pricing (temporarily optional for migration)
    lineItems: v.optional(v.array(v.object({
      itemId: v.string(),
      productId: v.string(),
      productName: v.string(),
      description: v.optional(v.string()),
      specifications: v.optional(v.string()),
      quantity: v.number(),
      unit: v.string(),
      unitPrice: v.optional(v.number()),
      discount: v.optional(v.object({
        type: v.union(v.literal("percentage"), v.literal("fixed")),
        value: v.number(),
      })),
      taxRate: v.optional(v.number()), // Tax rate as percentage
      lineTotal: v.optional(v.number()),
      notes: v.optional(v.string()),
      productImage: v.optional(v.string()), // Product image URL
    }))),
    
    // Financial calculations
    financialSummary: v.optional(v.object({
      subtotal: v.number(),
      totalDiscount: v.number(),
      taxableAmount: v.number(),
      totalTax: v.number(),
      shippingCharges: v.optional(v.number()),
      otherCharges: v.optional(v.number()),
      grandTotal: v.number(),
      currency: v.string(), // ISO currency code (e.g., "INR", "USD")
    })),
    
    // Tax calculations (GST, VAT)
    taxDetails: v.optional(v.array(v.object({
      taxType: v.string(), // "GST", "VAT", "IGST", "CGST", "SGST"
      taxRate: v.number(),
      taxableAmount: v.number(),
      taxAmount: v.number(),
    }))),
    
    // Payment terms
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
    
    // Delivery and operational details
    deliveryTerms: v.optional(v.object({
      incoterms: v.optional(v.string()), // "FOB", "CIF", "EXW", etc.
      deliveryLocation: v.optional(v.string()),
      estimatedDeliveryDays: v.optional(v.number()),
      shippingMethod: v.optional(v.string()),
      packagingType: v.optional(v.string()),
      specialInstructions: v.optional(v.string()),
    })),
    
    // Quality and compliance
    qualityStandards: v.optional(v.object({
      certifications: v.optional(v.array(v.string())),
      qualityAssurance: v.optional(v.string()),
      testingRequirements: v.optional(v.string()),
      complianceNotes: v.optional(v.string()),
    })),
    
    // Warranty information
    warrantyInfo: v.optional(v.object({
      warrantyPeriod: v.optional(v.string()),
      warrantyTerms: v.optional(v.string()),
      replacementPolicy: v.optional(v.string()),
    })),
    
    // Terms and conditions
    termsAndConditions: v.optional(v.object({
      generalTerms: v.optional(v.string()),
      specificTerms: v.optional(v.array(v.string())),
      cancellationPolicy: v.optional(v.string()),
      disputeResolution: v.optional(v.string()),
    })),
    
    // Status tracking
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
    
    // Validity and expiration
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    
    // Thread management
    threadStatus: v.union(
      v.literal("active"),
      v.literal("awaiting_user_permission"),
      v.literal("user_approved_closure"),
      v.literal("closed")
    ),
    userPermissionToClose: v.optional(v.boolean()),
    userPermissionGrantedAt: v.optional(v.number()),
    closureRequestedBy: v.optional(v.string()),
    closureRequestedAt: v.optional(v.number()),
    closureRejectedAt: v.optional(v.number()),
    closureRejectionReason: v.optional(v.string()),
    closedBy: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    closureReason: v.optional(v.string()),
    
    // Admin response and processing
    adminResponse: v.optional(v.object({
      quotedBy: v.string(),
      quotedAt: v.number(),
      processingNotes: v.optional(v.string()),
      internalNotes: v.optional(v.string()),
      notes: v.optional(v.string()),
      terms: v.optional(v.string()),
      totalAmount: v.optional(v.string()),
      validUntil: v.optional(v.number()),
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
    })),
    
    // Document management
    documentInfo: v.optional(v.object({
      pdfGenerated: v.boolean(),
      pdfUrl: v.optional(v.string()),
      digitalSignature: v.optional(v.object({
        signed: v.boolean(),
        signedBy: v.optional(v.string()),
        signedAt: v.optional(v.number()),
        signatureHash: v.optional(v.string()),
      })),
      attachments: v.optional(v.array(v.object({
        fileName: v.string(),
        fileUrl: v.string(),
        fileType: v.string(),
        uploadedAt: v.number(),
      }))),
    })),
    
    // Audit trail
    auditTrail: v.optional(v.array(v.object({
      action: v.string(),
      performedBy: v.string(),
      performedAt: v.number(),
      details: v.optional(v.string()),
      oldValues: v.optional(v.any()),
      newValues: v.optional(v.any()),
    }))),
    
    // Additional requirements (legacy support)
    additionalRequirements: v.optional(v.string()),
    urgency: v.optional(v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("asap")
    )),
    
    // Legacy products field (temporary for migration)
    products: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.string(),
      unit: v.string(),
      specifications: v.optional(v.string()),
    }))),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.string()),
    lastModifiedBy: v.optional(v.string()),
  })
    .index("by_quotation_number", ["quotationNumber"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_thread_status", ["threadStatus"])
    .index("by_created_at", ["createdAt"])
    .index("by_valid_until", ["validUntil"])
    .index("by_version", ["quotationNumber", "version"]),

  // Email logs table for tracking sent emails
  emailLogs: defineTable({
    to: v.string(),
    subject: v.string(),
    type: v.union(v.literal("USER_APPROVED"), v.literal("USER_REJECTED")),
    htmlContent: v.string(),
    user: v.object({
      firstName: v.string(),
      lastName: v.string(),
      email: v.string(),
      businessName: v.optional(v.string()),
    }),
    reason: v.optional(v.string()),
    customMessage: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_to", ["to"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  quotationMessages: defineTable({
    quotationId: v.id("quotations"),
    authorId: v.string(),
    authorName: v.string(),
    authorRole: v.union(v.literal("user"), v.literal("admin")),
    content: v.string(),
    
    // Message metadata
    messageType: v.union(
      v.literal("message"),
      v.literal("system_notification"),
      v.literal("closure_request"),
      v.literal("closure_permission_granted"),
      v.literal("closure_permission_rejected"),
      v.literal("thread_closed")
    ),
    
    // Read status tracking
    isReadByUser: v.optional(v.boolean()),
    isReadByAdmin: v.optional(v.boolean()),
    readByUserAt: v.optional(v.number()),
    readByAdminAt: v.optional(v.number()),
    
    // Message status
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_quotationId", ["quotationId"])
    .index("by_author", ["authorId", "authorRole"])
    .index("by_message_type", ["messageType"])
    .index("by_created_at", ["createdAt"])
    .index("by_read_status_user", ["isReadByUser"])
    .index("by_read_status_admin", ["isReadByAdmin"]),

  // Security events table for monitoring suspicious activity
  securityEvents: defineTable({
    eventType: v.union(
      v.literal("invalid_api_key"),
      v.literal("rate_limit_exceeded"),
      v.literal("suspicious_usage_pattern"),
      v.literal("multiple_failed_attempts"),
      v.literal("unusual_ip_activity"),
      v.literal("permission_violation"),
      v.literal("key_rotation_required"),
      v.literal("potential_key_compromise")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    description: v.string(),
    details: v.any(), // JSON object with event-specific details

    // Request context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    requestUrl: v.optional(v.string()),
    requestMethod: v.optional(v.string()),

    // API key context (if applicable)
    apiKeyId: v.optional(v.string()),
    apiKeyEnvironment: v.optional(v.literal("live")),

    // Status and resolution
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("false_positive")
    ),
    resolvedBy: v.optional(v.id("admins")),
    resolvedAt: v.optional(v.number()),
    resolutionNotes: v.optional(v.string()),

    // Alerting
    alertSent: v.optional(v.boolean()),
    alertSentAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event_type", ["eventType"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_api_key", ["apiKeyId"])
    .index("by_ip", ["ipAddress"])
    .index("by_created_at", ["createdAt"]),

  // Visitor sessions table for analytics tracking
  visitor_sessions: defineTable({
    sessionId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    currentPage: v.string(),
    referrer: v.optional(v.string()),
    startTime: v.number(),
    lastSeen: v.number(),
    pageViews: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  })
    .index("by_session_id", ["sessionId"])
    .index("by_start_time", ["startTime"])
    .index("by_last_seen", ["lastSeen"])
    .index("by_country", ["country"])
    .index("by_ip_address", ["ipAddress"]),

  
  // Product reviews table with star rating system
  productReviews: defineTable({
    // Review identification
    reviewId: v.string(), // Unique review identifier
    
    // Product and user association
    productId: v.string(), // Product being reviewed
    userId: v.string(), // User who wrote the review
    userEmail: v.string(),
    userName: v.string(),
    
    // Review content
    rating: v.number(), // Star rating (1-5)
    title: v.string(), // Review title/summary
    content: v.string(), // Detailed review content
    
    // Review metadata
    isVerifiedPurchase: v.optional(v.boolean()), // Whether user purchased the product
    orderReference: v.optional(v.string()), // Reference to order if verified purchase
    
    // Moderation and status
    status: v.union(
      v.literal("pending"), // Awaiting moderation
      v.literal("approved"), // Approved and visible
      v.literal("rejected"), // Rejected by moderator
      v.literal("flagged"), // Flagged for review
      v.literal("hidden") // Hidden by admin
    ),
    
    // Moderation details
    moderatedBy: v.optional(v.id("admins")),
    moderatedAt: v.optional(v.number()),
    moderationReason: v.optional(v.string()),
    moderationNotes: v.optional(v.string()),
    
    // Review helpfulness
    helpfulVotes: v.optional(v.number()), // Number of helpful votes
    unhelpfulVotes: v.optional(v.number()), // Number of unhelpful votes
    totalVotes: v.optional(v.number()), // Total votes received
    
    // Review quality indicators
    isHighlighted: v.optional(v.boolean()), // Featured/highlighted review
    qualityScore: v.optional(v.number()), // Calculated quality score (0-100)
    
    // Response from business
    adminResponse: v.optional(v.object({
      content: v.string(),
      respondedBy: v.id("admins"),
      respondedAt: v.number(),
      isPublic: v.boolean(), // Whether response is visible to public
    })),
    
    // Review updates
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    editHistory: v.optional(v.array(v.object({
      previousContent: v.string(),
      previousTitle: v.string(),
      editedAt: v.number(),
      editReason: v.optional(v.string()),
    }))),
    
    // Spam and abuse detection
    isSpam: v.optional(v.boolean()),
    spamScore: v.optional(v.number()), // Calculated spam probability (0-100)
    reportedCount: v.optional(v.number()), // Number of times reported
    
    // SEO and display
    isVisible: v.boolean(), // Whether review is visible on frontend
    displayOrder: v.optional(v.number()), // Custom display ordering
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_review_id", ["reviewId"])
    .index("by_product_id", ["productId"])
    .index("by_user_id", ["userId"])
    .index("by_user_email", ["userEmail"])
    .index("by_status", ["status"])
    .index("by_rating", ["rating"])
    .index("by_created_at", ["createdAt"])
    .index("by_moderated_by", ["moderatedBy"])
    .index("by_is_verified", ["isVerifiedPurchase"])
    .index("by_is_visible", ["isVisible"])
    .index("by_product_status", ["productId", "status"])
    .index("by_product_rating", ["productId", "rating"])
    .index("by_quality_score", ["qualityScore"]),

  // Review votes table for tracking helpful/unhelpful votes
  reviewVotes: defineTable({
    reviewId: v.id("productReviews"),
    userId: v.string(), // User who voted
    userEmail: v.string(),
    voteType: v.union(
      v.literal("helpful"),
      v.literal("unhelpful")
    ),
    
    // Metadata
    createdAt: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_review_id", ["reviewId"])
    .index("by_user_id", ["userId"])
    .index("by_vote_type", ["voteType"])
    .index("by_review_user", ["reviewId", "userId"]) // Prevent duplicate votes
    .index("by_created_at", ["createdAt"]),

  // Review reports table for abuse reporting
  reviewReports: defineTable({
    reviewId: v.id("productReviews"),
    reportedBy: v.string(), // User who reported
    reporterEmail: v.string(),
    
    // Report details
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate_content"),
      v.literal("fake_review"),
      v.literal("offensive_language"),
      v.literal("irrelevant"),
      v.literal("personal_information"),
      v.literal("other")
    ),
    description: v.optional(v.string()), // Additional details
    
    // Report status
    status: v.union(
      v.literal("pending"), // Awaiting review
      v.literal("investigating"), // Under investigation
      v.literal("resolved"), // Action taken
      v.literal("dismissed") // No action needed
    ),
    
    // Resolution
    resolvedBy: v.optional(v.id("admins")),
    resolvedAt: v.optional(v.number()),
    resolutionAction: v.optional(v.union(
      v.literal("review_removed"),
      v.literal("review_edited"),
      v.literal("user_warned"),
      v.literal("no_action"),
      v.literal("false_report")
    )),
    resolutionNotes: v.optional(v.string()),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_review_id", ["reviewId"])
    .index("by_reported_by", ["reportedBy"])
    .index("by_reason", ["reason"])
    .index("by_status", ["status"])
    .index("by_resolved_by", ["resolvedBy"])
    .index("by_created_at", ["createdAt"]),

  // FCM Tokens table - for push notifications
  fcmTokens: defineTable({
    token: v.string(), // FCM token
    platform: v.union(v.literal("ios"), v.literal("android")), // Device platform
    deviceInfo: v.object({
      platform: v.optional(v.string()),
      version: v.optional(v.any()),
      model: v.optional(v.string()),
      appVersion: v.optional(v.string()),
    }),
    userId: v.optional(v.union(v.id("users"), v.id("admins"))), // Associated user
    registeredAt: v.number(),
    lastUpdated: v.number(),
    unregisteredAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_user_id", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_is_active", ["isActive"])
    .index("by_registered_at", ["registeredAt"]),

  // Push Notification Logs table - for tracking sent notifications
  pushNotificationLogs: defineTable({
    target: v.string(), // 'single', 'multiple', 'all_users'
    title: v.string(),
    body: v.string(),
    data: v.object({}), // Additional data sent with notification
    result: v.object({
      success: v.boolean(),
      message: v.string(),
      successCount: v.number(),
      failureCount: v.number(),
    }),
    sentAt: v.number(),
  })
    .index("by_target", ["target"])
    .index("by_sent_at", ["sentAt"])
    .index("by_success", ["result.success"]),
});