// app/api/subscriptions/change-plan/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getSubscriptionRepository, getBranchRepository } from "@/lib/repositories"
import { calculateMonthlyPrice, validateTierAndBranches } from "@/lib/pricing/config"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { newTier, newBranchCount, currentPlan } = body

    const subscriptionRepo = getSubscriptionRepository()
    const branchRepo = getBranchRepository()

    // Get current active subscription
    const subscription = await subscriptionRepo.findActiveByClinicId(user.clinic_id)
    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    // Validate the new plan
    const validation = validateTierAndBranches(newTier, 0, newBranchCount)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Calculate new price
    const newMonthlyPrice = calculateMonthlyPrice(newTier, newBranchCount)
    const priceDifference = newMonthlyPrice - subscription.amount

    // Check if downgrading from multi-branch to single branch
    if (subscription.pricing_tier === "multi_branch" && newTier === "single_branch") {
      // Check if clinic has more than 1 branch
      const branches = await branchRepo.findByClinicId(user.clinic_id)
      const activeBranches = branches.filter(b => b.is_active)
      
      if (activeBranches.length > 1) {
        return NextResponse.json({ 
          error: "Cannot switch to Single Branch plan while you have multiple active branches. Please deactivate extra branches first."
        }, { status: 400 })
      }
    }

    // Check if increasing branches beyond current count
    if (newBranchCount > subscription.total_branches) {
      // Check if we have enough existing branches
      const branches = await branchRepo.findByClinicId(user.clinic_id)
      const activeBranches = branches.filter(b => b.is_active)
      
      if (newBranchCount > activeBranches.length) {
        return NextResponse.json({ 
          requiresPayment: true,
          amount: Math.abs(priceDifference),
          email: user.email,
          message: `You need to create ${newBranchCount - activeBranches.length} more branch(es) before switching to this plan.`,
          nextSteps: "add_branches_first"
        })
      }
    }

    // If price is increasing, require payment
    if (priceDifference > 0) {
      return NextResponse.json({
        requiresPayment: true,
        amount: priceDifference,
        email: user.email,
        message: `Your monthly subscription will increase by ${formatCurrency(priceDifference)}`,
        newMonthlyPrice,
        priceDifference,
      })
    }

    // If price is decreasing or same, update immediately
    await subscriptionRepo.update(subscription.id, {
      pricing_tier: newTier,
      total_branches: newBranchCount,
      amount: newMonthlyPrice,
    })

    // If downgrading to single branch, ensure we only have one branch
    if (newTier === "single_branch" && newBranchCount === 1) {
      const branches = await branchRepo.findByClinicId(user.clinic_id)
      const activeBranches = branches.filter(b => b.is_active)
      
      // Keep only the first branch active, deactivate others
      for (let i = 1; i < activeBranches.length; i++) {
        await branchRepo.update(activeBranches[i].id, {
          is_active: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      message: priceDifference < 0 
        ? `Your plan has been updated. You'll receive a credit of ${formatCurrency(Math.abs(priceDifference))} on your next invoice.`
        : "Your plan has been updated successfully.",
      newMonthlyPrice,
      priceDifference,
    })
  } catch (error) {
    console.error("Change plan error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to change plan" },
      { status: 500 }
    )
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `R${(amount / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
