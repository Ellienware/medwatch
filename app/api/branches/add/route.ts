// app/api/branches/add/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getSubscriptionRepository, getBranchRepository } from "@/lib/repositories"
import { calculateMonthlyPrice, validateTierAndBranches } from "@/lib/pricing/config"
import { createServerClient } from "@/lib/appwrite/server-client"
import { v4 as uuidv4 } from "uuid"

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

    // Get current subscription
    const subscription = await subscriptionRepo.findActiveByClinicId(user.clinic_id)

    if (!subscription) {
      // Create new subscription with initial branch
      const monthlyPrice = calculateMonthlyPrice(pricingTier, branchCount)

      // First create the branch
      const newBranch = await branchRepo.create({
        clinic_id: user.clinic_id,
        name,
        code,
        email,
        phone,
        address,
        is_active: true,
      })

      // Then create subscription
      const newSubscription = await subscriptionRepo.create({
        clinic_id: user.clinic_id,
        pricing_tier: pricingTier,
        total_branches: branchCount,
        amount: monthlyPrice,
        status: "pending", // Will be activated after payment
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        paystack_reference: `PENDING-${uuidv4()}`,
      })

      return NextResponse.json({
        success: true,
        branch: newBranch,
        subscription: newSubscription,
        monthlyPrice,
        requiresPayment: true,
        message: "New subscription created",
      })
    }

    // Add branch to existing subscription
    const currentBranches = subscription.total_branches || 1
    const newTotalBranches = currentBranches + 1

    // Validate the new total branches against current tier
    const validation = validateTierAndBranches(
      subscription.pricing_tier,
      currentBranches,
      newTotalBranches
    )

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate new price
    const currentPrice = subscription.amount
    const newMonthlyPrice = calculateMonthlyPrice(subscription.pricing_tier, newTotalBranches)
    const additionalAmount = newMonthlyPrice - currentPrice

    // Create the new branch
    const newBranch = await branchRepo.create({
      clinic_id: user.clinic_id,
      name,
      code,
      email,
      phone,
      address,
      is_active: true,
    })

    // Update subscription (will be confirmed after payment)
    await subscriptionRepo.update(subscription.id, {
      total_branches: newTotalBranches,
      amount: newMonthlyPrice,
    })

    return NextResponse.json({
      success: true,
      branch: newBranch,
      additionalAmount,
      newMonthlyPrice,
      requiresPayment: additionalAmount > 0,
      message: additionalAmount > 0 
        ? `Your monthly subscription will increase by ${formatCurrency(additionalAmount)} starting next billing cycle.` 
        : "Branch added successfully.",
    })
  } catch (error) {
    console.error("Add branch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add branch" },
      { status: 500 }
    )
  }
}

// Helper function to format currency (should be imported from your config)
function formatCurrency(amount: number): string {
  return `R${(amount / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
