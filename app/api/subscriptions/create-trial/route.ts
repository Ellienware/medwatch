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
    const { name, code, email, phone, address, pricingTier } = body // Removed branchCount

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

    // Validate tier - always start with 1 branch
    const validation = validateTierAndBranches(pricingTier, 0, 1)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create the first branch
    const branch = await branchRepo.create({
      clinic_id: user.clinic_id,
      name,
      code,
      email,
      phone,
      address,
      is_active: true,
    })

    // Create trial subscription with 1 branch
    const trialSubscription = await subscriptionRepo.createTrial(
      user.clinic_id,
      pricingTier,
      1 // Always start with 1 branch
    )

    return NextResponse.json({
      success: true,
      branch,
      subscription: trialSubscription,
      trialEndsAt: trialSubscription.trial_ends_at,
      message: "30-day free trial started successfully with 1 branch. You can add more branches anytime during your trial!",
    })
  } catch (error) {
    console.error("Create trial error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start trial" },
      { status: 500 }
    )
  }
}
