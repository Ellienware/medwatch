// app/api/cron/trial-management/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionRepository, getClinicRepository } from "@/lib/repositories"
import { emailService } from "@/lib/email/email-service"
import { Query } from "appwrite"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { paystackConfig } from "@/lib/paystack/config"
import type { Subscription } from "@/lib/types/billing"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptionRepo = getSubscriptionRepository()
    const clinicRepo = getClinicRepository()
    const appwrite = createServerClient()
    
    // Get all active trials
    const trials = await subscriptionRepo.find([
      Query.equal("status", "trial"),
      Query.greaterThan("trial_ends_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]) as Subscription[]

    const now = new Date()
    
    let remindersSent = 0
    let trialsProcessed = 0
    let errors = []

    for (const trial of trials) {
      try {
        if (!trial.trial_ends_at) continue
        
        const trialEnd = new Date(trial.trial_ends_at)
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Get clinic details
        const clinic = await clinicRepo.findById(trial.clinic_id)
        
        if (!clinic) continue
        
        // Get user email
        const users = await appwrite.databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.USERS,
          [Query.equal("clinic_id", trial.clinic_id), Query.limit(1)]
        )
        
        if (users.documents.length === 0) continue
        
        const user = users.documents[0]
        const userEmail = user.email
        
        if (!userEmail) continue

        // Send reminders at specific intervals
        if (daysRemaining > 0 && daysRemaining <= 7) {
          const monthlyPrice = calculateMonthlyPrice(
            trial.pricing_tier,
            trial.total_branches
          ) / 100 // Convert from cents to Rands

          await emailService.sendTrialReminder(userEmail, {
            clinicName: clinic.name,
            daysRemaining,
            trialEndDate: trial.trial_ends_at,
            planName: trial.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
            monthlyPrice,
            billingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/payment-methods`,
          })
          
          remindersSent++
        }
        
        // Check if trial ended today or yesterday (give 1 day grace)
        const daysSinceEnd = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceEnd >= 0 && daysSinceEnd <= 1) {
          await processTrialExpiration(trial, clinic, userEmail)
          trialsProcessed++
        }
      } catch (error) {
        errors.push({
          trialId: trial.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`Error processing trial ${trial.id}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalTrials: trials.length,
        remindersSent,
        trialsProcessed,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      message: "Trial management completed"
    })
  } catch (error) {
    console.error("Trial management cron error:", error)
    return NextResponse.json({ 
      error: "Failed to process trials",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function processTrialExpiration(trial: Subscription, clinic: any, userEmail: string) {
  const subscriptionRepo = getSubscriptionRepository()
  const appwrite = createServerClient()
  
  try {
    // Check if user has a payment method
    const paymentMethods = await appwrite.databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PAYMENT_METHODS,
      [Query.equal("clinic_id", trial.clinic_id), Query.limit(1)]
    )
    
    const hasPaymentMethod = paymentMethods.documents.length > 0
    
    if (hasPaymentMethod) {
      // Try to charge the user
      const paymentMethod = paymentMethods.documents[0]
      const monthlyPrice = calculateMonthlyPrice(
        trial.pricing_tier,
        trial.total_branches
      )
      
      const chargeResult = await chargeSubscription(
        userEmail,
        paymentMethod.authorization_code,
        monthlyPrice,
        `Subscription for ${clinic.name} - ${trial.pricing_tier} plan`
      )
      
      if (chargeResult.success && chargeResult.reference) {
        // Update subscription to active
        const nextBillingDate = new Date()
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
        
        await subscriptionRepo.update(trial.id, {
          status: "active",
          amount: monthlyPrice,
          current_period_start: new Date().toISOString(),
          current_period_end: nextBillingDate.toISOString(),
        })
        
        // Record payment
        await recordPayment(trial, monthlyPrice, chargeResult.reference)
        
        // Send success email
        await emailService.sendTrialConverted(userEmail, {
          clinicName: clinic.name,
          amount: monthlyPrice / 100,
          reference: chargeResult.reference,
          date: new Date().toISOString(),
          description: `Subscription for ${clinic.name} - ${trial.pricing_tier} plan`,
          planName: trial.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
          nextBillingDate: nextBillingDate.toISOString(),
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`,
        })
      } else {
        // Payment failed, set to past_due
        await subscriptionRepo.update(trial.id, {
          status: "past_due",
        })
        
        // Send payment failure email
        await emailService.sendPaymentFailed(userEmail, {
          clinicName: clinic.name,
          planName: trial.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
          monthlyPrice: monthlyPrice / 100,
          retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/payment-methods`,
          supportEmail: process.env.SUPPORT_EMAIL || "support@medicalsurveilance.com",
        })
      }
    } else {
      // No payment method, set to suspended
      await subscriptionRepo.update(trial.id, {
        status: "suspended",
      })
      
      // Send no payment method email
      const monthlyPrice = calculateMonthlyPrice(
        trial.pricing_tier,
        trial.total_branches
      ) / 100
      
      await emailService.sendNoPaymentMethod(userEmail, {
        clinicName: clinic.name,
        daysRemaining: 0,
        trialEndDate: trial.trial_ends_at!,
        planName: trial.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
        monthlyPrice,
        billingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing`,
      })
    }
  } catch (error) {
    console.error(`Error processing trial expiration for ${trial.id}:`, error)
    
    // Mark as suspended if error occurs
    await subscriptionRepo.update(trial.id, {
      status: "suspended",
    })
    
    // Send error notification
    await emailService.sendNoPaymentMethod(userEmail, {
      clinicName: clinic.name,
      daysRemaining: 0,
      trialEndDate: trial.trial_ends_at!,
      planName: trial.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch",
      monthlyPrice: 0,
      billingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing`,
    })
  }
}

async function chargeSubscription(email: string, authorizationCode: string, amount: number, description: string): Promise<{ success: boolean; reference?: string }> {
  try {
    const response = await fetch("https://api.paystack.co/transaction/charge_authorization", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorization_code: authorizationCode,
        email: email,
        amount: amount,
        metadata: {
          description: description,
          type: "subscription_renewal",
        },
      }),
    })
    
    const data = await response.json()
    
    if (data.status && data.data?.status === "success") {
      return {
        success: true,
        reference: data.data.reference,
      }
    } else {
      console.error("Paystack charge failed:", data.message)
      return { success: false }
    }
  } catch (error) {
    console.error("Charge subscription error:", error)
    return { success: false }
  }
}

async function recordPayment(subscription: Subscription, amount: number, reference: string) {
  const appwrite = createServerClient()
  
  try {
    await appwrite.databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.PAYMENTS,
      "unique()",
      {
        clinic_id: subscription.clinic_id,
        subscription_id: subscription.id,
        amount: amount,
        currency: "ZAR",
        status: "completed",
        payment_method: "card",
        payment_provider: "paystack",
        payment_provider_reference: reference,
        description: "Monthly subscription payment",
        paid_at: new Date().toISOString(),
      }
    )
  } catch (error) {
    console.error("Error recording payment:", error)
  }
}

function calculateMonthlyPrice(pricingTier: string, branchCount: number): number {
  const BASE_PRICE = 650000 // R6,500 in cents
  const PER_BRANCH_PRICE = 500000 // R5,000 in cents
  
  if (pricingTier === "single_branch") {
    return BASE_PRICE
  } else {
    return BASE_PRICE + ((branchCount - 1) * PER_BRANCH_PRICE)
  }
}