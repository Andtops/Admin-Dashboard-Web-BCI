import { NextRequest, NextResponse } from 'next/server'
import { sendQuotationEmailGmail, sendNewQuotationNotificationGmail, sendQuotationReminderGmail } from '@/lib/gmail-quotation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, quotation, adminResponse, adminEmail, adminName, reminderType } = body

    let result
    
    switch (type) {
      case 'quotation':
        result = await sendQuotationEmailGmail({
          quotation,
          status: quotation.status,
          adminResponse
        })
        break
        
      case 'admin-notification':
        result = await sendNewQuotationNotificationGmail({
          quotation,
          adminEmail,
          adminName
        })
        break
        
      case 'reminder':
        result = await sendQuotationReminderGmail({
          quotation,
          reminderType
        })
        break
        
      default:
        return NextResponse.json({ success: false, error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}