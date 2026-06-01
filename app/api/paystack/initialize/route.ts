// app/api/paystack/initialize/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { paystackConfig } from "@/lib/paystack/config"
import { getSubscriptionRepository, getBranchRepository } from "@/lib/repositories"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, amount, reference, metadata } = body

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo (cents)
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/callback`,
        metadata: {
          ...metadata,
          clinic_id: user.clinic_id || "",
          user_id: user.id,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 })
    }

    // If this is a new subscription, create a pending subscription record
    if (metadata.type === "new_subscription") {
      const subscriptionRepo = getSubscriptionRepository()
      
      await subscriptionRepo.create({
        clinic_id: user.clinic_id || "",
        pricing_tier: metadata.pricing_tier,
        total_branches: metadata.branch_count,
        amount: amount,
        status: "pending",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paystack_reference: reference,
      })

      // Also create the branch if specified
      if (metadata.branch_name && metadata.branch_code) {
        const branchRepo = getBranchRepository()
        await branchRepo.create({
          clinic_id: user.clinic_id || "",
          name: metadata.branch_name,
          code: metadata.branch_code,
          email: email,
          phone: metadata.phone || "",
          address: metadata.address || "",
          is_active: false, // Will be activated after payment
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Paystack initialization error:", error)
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
