// app/api/emails/send-payment-confirmation/route.ts
import { NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email/email-service"
import { getCurrentUser } from "@/lib/auth/actions"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, email } = body

    if (!paymentId && !email) {
      return NextResponse.json({ error: "Payment ID or email is required" }, { status: 400 })
    }

    const { databases } = createServerClient()
    let paymentData
    let clinicData

    if (paymentId) {
      // Get payment details
      const payment = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.PAYMENTS, paymentId)
      
      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      }

      // Get clinic details
      const clinic = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.CLINICS, payment.clinic_id)
      
      paymentData = {
        clinicName: clinic.name,
        amount: payment.amount / 100,
        reference: payment.payment_provider_reference || payment.id,
        date: payment.paid_at || payment.created_at,
        description: payment.description,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`,
      }
      
      // Send to clinic email or specific email
      const targetEmail = email || user.email
      
      const result = await emailService.sendPaymentConfirmation(targetEmail, paymentData)

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Payment confirmation sent successfully" })
    } else if (email) {
      // Manual email sending for specific email
      const { clinicName, amount, reference, description } = body
      
      if (!clinicName || !amount || !reference) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }

      const result = await emailService.sendPaymentConfirmation(email, {
        clinicName,
        amount: typeof amount === 'number' ? amount : parseFloat(amount),
        reference,
        date: body.date || new Date().toISOString(),
        description: description || "Payment received",
        invoiceUrl: body.invoiceUrl,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Payment confirmation sent successfully" })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Send payment confirmation error:", error)
    return NextResponse.json({ error: "Failed to send confirmation" }, { status: 500 })
  }
}
