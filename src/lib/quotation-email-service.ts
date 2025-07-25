/**
 * Quotation Email Service
 * Handles sending emails for quotation status updates using Gmail API
 */

export interface QuotationProduct {
  productId: string
  productName: string
  quantity: string
  unit: string
  specifications?: string
}

export interface AdminResponse {
  quotedBy: string
  quotedAt: number
  totalAmount?: string
  validUntil?: number
  terms?: string
  notes?: string
  gstDetails?: {
    subtotal: number
    cgstRate: number
    sgstRate: number
    igstRate: number
    cgstAmount: number
    sgstAmount: number
    igstAmount: number
    totalTax: number
  }
}

export interface Quotation {
  _id: string
  userId: string
  userEmail: string
  userName: string
  userPhone?: string
  businessName?: string
  products: QuotationProduct[]
  additionalRequirements?: string
  deliveryLocation?: string
  urgency: "standard" | "urgent" | "asap"
  status: "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired"
  adminResponse?: AdminResponse
  createdAt: number
  updatedAt: number
}

export interface QuotationEmailResponse {
  success: boolean
  message: string
  emailService: string
  timestamp: string
}

/**
 * Send quotation status update email
 */
export async function sendQuotationEmail(params: {
  quotation: Quotation
  status: "pending" | "processing" | "quoted" | "accepted" | "rejected" | "expired"
  adminResponse?: AdminResponse
}): Promise<QuotationEmailResponse> {
  const { quotation, status, adminResponse } = params

  try {
    console.log(`📧 Sending ${status} quotation email to ${quotation.userEmail} via Gmail API`)
    
    const response = await fetch('/api/send-quotation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quotation',
        quotation: { ...quotation, status },
        adminResponse
      })
    })

    const result = await response.json()
    return result

  } catch (error) {
    console.error("Quotation email sending failed:", error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      emailService: "Gmail API",
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Send new quotation request notification to admin
 */
export async function sendNewQuotationNotificationEmail(params: {
  quotation: Quotation
  adminEmail: string
  adminName: string
}): Promise<QuotationEmailResponse> {
  const { quotation, adminEmail, adminName } = params

  try {
    console.log(`📧 Sending admin notification to ${adminEmail} via Gmail API`)
    
    const response = await fetch('/api/send-quotation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'admin-notification',
        quotation,
        adminEmail,
        adminName
      })
    })

    const result = await response.json()
    return result

  } catch (error) {
    console.error("Admin notification email sending failed:", error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      emailService: "Gmail API",
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Send quotation reminder email to customer
 */
export async function sendQuotationReminderEmail(params: {
  quotation: Quotation
  reminderType: "quote_pending" | "quote_expiring"
}): Promise<QuotationEmailResponse> {
  const { quotation, reminderType } = params

  try {
    console.log(`📧 Sending ${reminderType} reminder to ${quotation.userEmail} via Gmail API`)
    
    const response = await fetch('/api/send-quotation-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reminder',
        quotation,
        reminderType
      })
    })

    const result = await response.json()
    return result

  } catch (error) {
    console.error("Quotation reminder email sending failed:", error)
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      emailService: "Gmail API",
      timestamp: new Date().toISOString()
    }
  }
}
