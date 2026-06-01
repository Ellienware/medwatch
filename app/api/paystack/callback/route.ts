// app/api/paystack/callback/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { paystackConfig } from "@/lib/paystack/config"
import { getSubscriptionRepository, getBranchRepository } from "@/lib/repositories"
import { emailService } from "@/lib/email/email-service"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")
    const status = searchParams.get("status")

    if (!reference) {
      return NextResponse.redirect(new URL("/clinic/billing?error=missing_reference", request.url))
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
      },
    })

    const data = await response.json()

    if (!data.status || data.data.status !== "success") {
      return NextResponse.redirect(new URL("/clinic/billing?error=payment_failed", request.url))
    }

    const metadata = data.data.metadata
    const subscriptionRepo = getSubscriptionRepository()
    const branchRepo = getBranchRepository()
    const appwrite = createServerClient()

    // Get user email from transaction
    const userEmail = data.data.customer?.email

    // Handle different payment types
    if (metadata.type === "new_subscription") {
      // Find subscription by reference
      const subscriptions = await subscriptionRepo.findByPaystackReference(reference)
      
      if (subscriptions && subscriptions.length > 0) {
        const subscription = subscriptions[0]
        
        // Update subscription
        await subscriptionRepo.update(subscription.id, {
          status: "active",
          paystack_subscription_id: data.data.id,
        })

        // Activate the branch
        const branches = await branchRepo.findByClinicId(subscription.clinic_id)
        if (branches.length > 0) {
          const branch = branches[0]
          await branchRepo.update(branch.id, {
            is_active: true,
          })
        }

        // Get clinic details for email
        const clinicResponse = await appwrite.databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.CLINICS,
          [Query.equal("$id", subscription.clinic_id)]
        )
        
        const clinic = clinicResponse.documents[0] || { name: "Your Clinic" }

        // Send payment confirmation email
        if (userEmail) {
          await emailService.sendPaymentConfirmation(userEmail, {
            clinicName: clinic.name || "Your Clinic",
            amount: data.data.amount / 100,
            reference: data.data.reference,
            date: data.data.paid_at,
            description: "New subscription payment",
            planName: subscription.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
            nextBillingDate: subscription.current_period_end,
            invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`,
          })
        }
      }
    } else if (metadata.type === "add_branch") {
      // Update subscription for added branch
      const subscription = await subscriptionRepo.findActiveByClinicId(metadata.clinic_id)
      if (subscription) {
        await subscriptionRepo.update(subscription.id, {
          status: "active",
        })
      }

      // Send payment confirmation
      const clinicResponse = await appwrite.databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.CLINICS,
        [Query.equal("$id", metadata.clinic_id)]
      )
      
      const clinic = clinicResponse.documents[0] || { name: "Your Clinic" }

      if (userEmail) {
        await emailService.sendPaymentConfirmation(userEmail, {
          clinicName: clinic.name || "Your Clinic",
          amount: data.data.amount / 100,
          reference: data.data.reference,
          date: data.data.paid_at,
          description: "Branch addition payment",
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`,
        })
      }
    } else if (metadata.type === "change_plan") {
      // Plan change payment
      const clinicResponse = await appwrite.databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.CLINICS,
        [Query.equal("$id", metadata.clinic_id)]
      )
      
      const clinic = clinicResponse.documents[0] || { name: "Your Clinic" }

      if (userEmail) {
        await emailService.sendPaymentConfirmation(userEmail, {
          clinicName: clinic.name || "Your Clinic",
          amount: data.data.amount / 100,
          reference: data.data.reference,
          date: data.data.paid_at,
          description: `Plan change to ${metadata.new_tier}`,
          planName: metadata.new_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`,
        })
      }
    }

    // Record the payment in database
    try {
      await appwrite.databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        "unique()",
        {
          clinic_id: metadata.clinic_id,
          subscription_id: metadata.subscription_id || null,
          amount: data.data.amount,
          currency: data.data.currency,
          status: "completed",
          payment_method: data.data.channel,
          payment_provider: "paystack",
          payment_provider_reference: data.data.reference,
          payment_provider_transaction_id: data.data.id,
          description: metadata.description || `${metadata.type} payment`,
          metadata: metadata,
          paid_at: data.data.paid_at,
          created_at: data.data.created_at,
        }
      )
    } catch (error) {
      console.error("Failed to record payment:", error)
      // Continue anyway - payment was successful
    }

    // Redirect to success page
    return NextResponse.redirect(new URL(`/clinic/billing/success?reference=${reference}`, request.url))
  } catch (error) {
    console.error("Paystack callback error:", error)
    return NextResponse.redirect(new URL("/clinic/billing?error=verification_failed", request.url))
  }
}
