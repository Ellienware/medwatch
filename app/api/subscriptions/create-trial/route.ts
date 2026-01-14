// app/api/subscriptions/create-trial/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getSubscriptionRepository, getBranchRepository } from "@/lib/repositories"
import { validateTierAndBranches } from "@/lib/pricing/config"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, email, phone, address, pricingTier, branchCount } = body

    const subscriptionRepo = getSubscriptionRepository()
    const branchRepo = getBranchRepository()

    // Check if clinic already has a subscription
    const existingSubscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id)
    
    if (existingSubscription) {
      return NextResponse.json({ 
        error: "Clinic already has a subscription or trial",
        existingSubscription
      }, { status: 400 })
    }

    // Validate tier and branches
    const validation = validateTierAndBranches(pricingTier, 0, branchCount)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create the branch
    const branch = await branchRepo.create({
      clinic_id: user.clinic_id,
      name,
      code,
      email,
      phone,
      address,
      is_active: true,
    })

    // Create trial subscription
    const trialSubscription = await subscriptionRepo.createTrial(
      user.clinic_id,
      pricingTier,
      branchCount
    )

    return NextResponse.json({
      success: true,
      branch,
      subscription: trialSubscription,
      trialEndsAt: trialSubscription.trial_ends_at,
      message: "30-day free trial started successfully",
    })
  } catch (error) {
    console.error("Create trial error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start trial" },
      { status: 500 }
    )
  }
}