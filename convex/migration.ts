import { mutation, query } from "./_generated/server";

// Migration to update existing data from Shopify fields to new field names
export const migrateShopifyFields = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration from Shopify fields...");
    
    // Migrate users table
    const users = await ctx.db.query("users").collect();
    console.log("Found users:", users.length);
    let usersMigrated = 0;
    
    for (const user of users) {
      const updates: any = {};

      console.log("Processing user:", user._id, "userId:", (user as any).userId);

      // Check if user doesn't have userId
      if (!(user as any).userId) {
        // Use shopifyCustomerId if it exists and is not empty, otherwise generate a new ID
        if ((user as any).shopifyCustomerId && (user as any).shopifyCustomerId.trim() !== '') {
          updates.userId = (user as any).shopifyCustomerId;
        } else {
          // Generate a new userId based on email or a unique identifier
          const emailPrefix = user.email && user.email.trim() !== '' ? user.email.split('@')[0] : 'user';
          updates.userId = `user_${emailPrefix}_${Date.now()}`;
        }
        usersMigrated++;
      }

      // If there are updates to make
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
      }
    }
    
    // Migrate products table
    const products = await ctx.db.query("products").collect();
    let productsMigrated = 0;
    
    for (const product of products) {
      const updates: any = {};

      // Check if product doesn't have productId
      if (!(product as any).productId) {
        // Use shopifyProductId if it exists and is not empty, otherwise generate a new ID
        if ((product as any).shopifyProductId && (product as any).shopifyProductId.trim() !== '') {
          updates.productId = (product as any).shopifyProductId;
        } else {
          // Generate a new productId based on title or a unique identifier
          const titleSlug = (product as any).title?.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20) || 'product';
          updates.productId = `${titleSlug}_${Date.now()}`;
        }
        productsMigrated++;
      }

      // If there are updates to make
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(product._id, updates);
      }
    }
    
    console.log(`Migration completed: ${usersMigrated} users, ${productsMigrated} products migrated`);
    
    return {
      message: "Migration completed successfully",
      usersMigrated,
      productsMigrated,
    };
  },
});

// Simple function to fix the specific user that's missing userId
export const fixExistingUser = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (!(user as any).userId) {
        await ctx.db.patch(user._id, {
          userId: `user_${user.firstName.toLowerCase()}_${Date.now()}`,
        });
        console.log(`Fixed user ${user._id} with userId`);
      }
    }

    const products = await ctx.db.query("products").collect();

    for (const product of products) {
      if (!(product as any).productId) {
        const titleSlug = (product as any).title?.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20) || 'product';
        await ctx.db.patch(product._id, {
          productId: `${titleSlug}_${Date.now()}`,
        });
        console.log(`Fixed product ${product._id} with productId`);
      }
    }

    return { message: "Fixed existing records" };
  },
});

// Function to remove old Shopify fields by recreating records
export const removeShopifyFields = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Removing old Shopify fields...");

    // Get all users
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if ((user as any).shopifyCustomerId !== undefined) {
        // Create a new user object without the shopifyCustomerId field
        const cleanUser = {
          userId: (user as any).userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          businessName: user.businessName,
          gstNumber: user.gstNumber,
          isGstVerified: user.isGstVerified,
          status: user.status,
          role: user.role,
          approvedBy: user.approvedBy,
          approvedAt: user.approvedAt,
          rejectedBy: user.rejectedBy,
          rejectedAt: user.rejectedAt,
          rejectionReason: user.rejectionReason,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          legalNameOfBusiness: user.legalNameOfBusiness,
          tradeName: user.tradeName,
          constitutionOfBusiness: user.constitutionOfBusiness,
          taxpayerType: user.taxpayerType,
          gstStatus: user.gstStatus,
          principalPlaceOfBusiness: user.principalPlaceOfBusiness,
          agreedToEmailMarketing: user.agreedToEmailMarketing,
          agreedToSmsMarketing: user.agreedToSmsMarketing,
        };

        // Delete the old record and create a new one
        await ctx.db.delete(user._id);
        await ctx.db.insert("users", cleanUser);
        console.log(`Cleaned user ${user._id}`);
      }
    }

    return { message: "Removed old Shopify fields from users" };
  },
});

// Migration to convert legacy quotations from products to lineItems structure
export const migrateQuotationsToLineItems = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting migration from products to lineItems...");
    
    const quotations = await ctx.db.query("quotations").collect();
    console.log("Found quotations:", quotations.length);
    let quotationsMigrated = 0;
    let quotationsSkipped = 0;
    
    for (const quotation of quotations) {
      const quotationData = quotation as any;
      
      try {
        // Check if quotation doesn't have lineItems or has empty lineItems
        if (!quotationData.lineItems || !Array.isArray(quotationData.lineItems) || quotationData.lineItems.length === 0) {
          console.log(`Migrating quotation ${quotation._id}`);
          
          let lineItems = [];
          
          // If quotation has products, convert them to lineItems
          if (quotationData.products && Array.isArray(quotationData.products) && quotationData.products.length > 0) {
            console.log(`Converting ${quotationData.products.length} products to lineItems`);
            lineItems = quotationData.products.map((product: any, index: number) => {
              // Ensure all required fields are present
              const lineItem: any = {
                itemId: `item_${Date.now()}_${index + 1}`,
                productId: product.productId || product.id || `product_${Date.now()}_${index + 1}`,
                productName: product.productName || product.title || product.name || 'Unknown Product',
                description: product.description || undefined,
                specifications: product.specifications || "",
                quantity: typeof product.quantity === 'string' ? parseFloat(product.quantity) || 1 : (typeof product.quantity === 'number' ? product.quantity : 1),
                unit: product.unit || 'PCS',
                unitPrice: typeof product.unitPrice === 'number' ? product.unitPrice : (typeof product.unitPrice === 'string' ? parseFloat(product.unitPrice) || 0 : 0),
                taxRate: typeof product.taxRate === 'number' ? product.taxRate : (typeof product.taxRate === 'string' ? parseFloat(product.taxRate) || 18 : 18),
                lineTotal: typeof product.lineTotal === 'number' ? product.lineTotal : (typeof product.lineTotal === 'string' ? parseFloat(product.lineTotal) || 0 : 0),
                notes: product.notes || undefined,
              };
              
              // Add optional fields only if they exist
              if (product.discount) {
                lineItem.discount = {
                  type: product.discount.type || "percentage",
                  value: typeof product.discount.value === 'number' ? product.discount.value : parseFloat(product.discount.value) || 0
                };
              }
              
              return lineItem;
            });
          } else {
            // Create a default lineItems array with at least one item if no products exist
            console.log(`No products found, creating default lineItems array`);
            lineItems = [{
              itemId: `item_${Date.now()}_1`,
              productId: `product_${Date.now()}_1`,
              productName: 'Product Inquiry',
              specifications: "",
              quantity: 1,
              unit: 'PCS',
            }];
          }
          
          // Prepare update object
          const updateData: any = {
            lineItems,
            updatedAt: Date.now(),
          };
          
          // Add required fields if missing
          if (!quotationData.quotationNumber) {
            updateData.quotationNumber = `QT-${Date.now()}`;
          }
          
          if (!quotationData.version) {
            updateData.version = 1;
          }
          
          if (!quotationData.vendorInfo) {
            updateData.vendorInfo = {
              companyName: "Benzochem Industries",
              address: {
                street: "Industrial Area",
                city: "Mumbai",
                state: "Maharashtra",
                postalCode: "400001",
                country: "India",
              },
              contactPerson: {
                name: "Sales Team",
                designation: "Sales Manager",
                email: "sales@benzochem.com",
                phone: "+91-9876543210",
              },
              taxRegistration: {
                gstNumber: "27XXXXX1234X1ZX",
                panNumber: "XXXXX1234X",
              },
            };
          }
          
          // Update the quotation with lineItems field and other required fields
          await ctx.db.patch(quotation._id, updateData);
          
          quotationsMigrated++;
          console.log(`Successfully migrated quotation ${quotation._id}`);
        } else {
          console.log(`Quotation ${quotation._id} already has lineItems, skipping`);
          quotationsSkipped++;
        }
      } catch (error) {
        console.error(`Error migrating quotation ${quotation._id}:`, error);
        // Continue with next quotation instead of failing the entire migration
      }
    }
    
    console.log(`Migration completed: ${quotationsMigrated} quotations migrated, ${quotationsSkipped} skipped`);
    
    return {
      message: "Quotations migration completed successfully",
      quotationsMigrated,
      quotationsSkipped,
      totalQuotations: quotations.length,
    };
  },
});
