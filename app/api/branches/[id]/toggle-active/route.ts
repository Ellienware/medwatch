// app/api/branches/[id]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getBranchRepository, getSubscriptionRepository } from "@/lib/repositories"
import { validateTierAndBranches } from "@/lib/pricing/config"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isActive } = body
    const branchId = params.id

    const branchRepo = getBranchRepository()
    const subscriptionRepo = getSubscriptionRepository()

    // Get the branch
    const branch = await branchRepo.findById(branchId)
    if (!branch || branch.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 })
    }

    // Get current subscription
    const subscription = await subscriptionRepo.findActiveByClinicId(user.clinic_id)
    
    if (isActive && subscription) {
      // Check if activating would exceed subscription limits
      const activeBranches = await branchRepo.findByClinicId(user.clinic_id, { isActive: true })
      const newActiveCount = activeBranches.filter(b => b.id !== branchId).length + 1

      const validation = validateTierAndBranches(
        subscription.pricing_tier,
        subscription.total_branches,
        newActiveCount
      )

      if (!validation.valid) {
        return NextResponse.json({ 
          error: `Cannot activate branch: ${validation.error} Please update your subscription first.`
        }, { status: 400 })
      }
    }

    // Update branch
    const updatedBranch = await branchRepo.update(branchId, {
      is_active: isActive,
    })

    return NextResponse.json({ 
      branch: updatedBranch,
      message: `Branch ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error("Toggle branch active error:", error)
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 })
  }
}
