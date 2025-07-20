/**
 * Draft Quotation Storage
 * 
 * Temporary in-memory storage for draft quotations.
 * In production, this should be replaced with a proper database or cache like Redis.
 * 
 * This is a simple solution to handle the draft quotation functionality
 * without requiring additional infrastructure setup.
 */

declare global {
  var draftQuotations: Map<string, DraftQuotation> | undefined;
}

interface QuotationItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unit: string;
  specifications?: string;
  notes?: string;
  category?: string;
  image?: string;
  price?: number;
}

interface DraftQuotation {
  id: string;
  items: QuotationItem[];
  status: "draft";
  submittedAt?: number;
  notes?: string;
}

// In-memory storage for draft quotations
// Key format: `draft_${userId}`
// Using a global object to ensure persistence across requests
const draftQuotations = global.draftQuotations || new Map<string, DraftQuotation>();
if (!global.draftQuotations) {
  global.draftQuotations = draftQuotations;
}

export class DraftStorage {
  /**
   * Get draft quotation for a user
   * If createIfNotExists is true, it will create a new draft if one doesn't exist
   */
  static getDraft(userId: string, createIfNotExists: boolean = false): DraftQuotation | null {
    const draftKey = `draft_${userId}`;
    const existingDraft = draftQuotations.get(draftKey);
    
    if (!existingDraft && createIfNotExists) {
      return this.createEmptyDraft(userId);
    }
    
    return existingDraft || null;
  }

  /**
   * Create or update draft quotation for a user
   */
  static setDraft(userId: string, draft: DraftQuotation): void {
    const draftKey = `draft_${userId}`;
    draftQuotations.set(draftKey, draft);
  }

  /**
   * Delete draft quotation for a user
   */
  static deleteDraft(userId: string): boolean {
    const draftKey = `draft_${userId}`;
    return draftQuotations.delete(draftKey);
  }

  /**
   * Create a new empty draft quotation
   */
  static createEmptyDraft(userId: string): DraftQuotation {
    const draft: DraftQuotation = {
      id: `draft_${userId}_${Date.now()}`,
      items: [],
      status: "draft",
      submittedAt: undefined,
      notes: undefined,
    };

    this.setDraft(userId, draft);
    return draft;
  }

  /**
   * Add item to draft quotation
   */
  static addItem(userId: string, item: Omit<QuotationItem, "id">): QuotationItem {
    let draft = this.getDraft(userId);
    
    if (!draft) {
      draft = this.createEmptyDraft(userId);
    }

    const newItem: QuotationItem = {
      ...item,
      id: item.productId ? `${item.productId}_${Date.now()}` : `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    draft.items.push(newItem);
    this.setDraft(userId, draft);
    
    return newItem;
  }

  /**
   * Remove item from draft quotation
   */
  static removeItem(userId: string, itemId: string): boolean {
    const draft = this.getDraft(userId);
    
    if (!draft) {
      return false;
    }

    const itemIndex = draft.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }

    draft.items.splice(itemIndex, 1);
    this.setDraft(userId, draft);
    
    return true;
  }

  /**
   * Update item in draft quotation
   */
  static updateItem(userId: string, itemId: string, updates: Partial<QuotationItem>): QuotationItem | null {
    const draft = this.getDraft(userId);
    
    if (!draft) {
      return null;
    }

    const itemIndex = draft.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return null;
    }

    // Update item with new values, preserving the original ID
    draft.items[itemIndex] = {
      ...draft.items[itemIndex],
      ...updates,
      id: itemId, // Preserve the original ID
    };

    this.setDraft(userId, draft);
    
    return draft.items[itemIndex];
  }

  /**
   * Get all draft quotations (for debugging/admin purposes)
   */
  static getAllDrafts(): Map<string, DraftQuotation> {
    return new Map(draftQuotations);
  }

  /**
   * Clear all draft quotations (for cleanup/testing purposes)
   */
  static clearAll(): void {
    draftQuotations.clear();
  }
}

export type { QuotationItem, DraftQuotation };