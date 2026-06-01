// app/api/branches/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getBranchRepository, getSubscriptionRepository } from "@/lib/repositories"
import { validateTierAndBranches } from "@/lib/pricing/config"

// GET - List branches
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const branchRepo = getBranchRepository()
    const branches = await branchRepo.findByClinicId(user.clinic_id)

    return NextResponse.json({ branches })
  } catch (error) {
    console.error("Get branches error:", error)
    return NextResponse.json({ error: "Failed to load branches" }, { status: 500 })
  }
}

// POST - Add new branch
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, email, phone, address, duringTrial } = body

    const branchRepo = getBranchRepository()
    const subscriptionRepo = getSubscriptionRepository()

    // Check if branch code already exists for this clinic
    const existingBranch = await branchRepo.findByCode(code, user.clinic_id)
    if (existingBranch) {
      return NextResponse.json({ 
        error: `Branch code "${code}" already exists. Please use a different code.` 
      }, { status: 400 })
    }

    // Get current subscription (trial or active)
    const subscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id)
    
    // Create the branch as ACTIVE by default
    const newBranch = await branchRepo.create({
      clinic_id: user.clinic_id,
      name,
      code,
      email: email || null,
      phone: phone || null,
      address: address || null,
      latitude: null,
      longitude: null,
      operating_hours: {},
      is_active: true,
    })

    // If this is a trial and duringTrial flag is set, track it in metadata
    if (subscription?.status === "trial" && duringTrial) {
      const metadata = subscription.metadata || {}
      const branchesAddedDuringTrial = (metadata.branches_added_during_trial || 0) + 1
      
      await subscriptionRepo.update(subscription.id, {
        metadata: { // ← FIXED: Pass object directly, not stringified
          ...metadata,
          branches_added_during_trial: branchesAddedDuringTrial,
        },
      })
    }

    // Check subscription limits for active subscriptions
    if (subscription?.status === "active") {
      const activeBranches = await branchRepo.findByClinicId(user.clinic_id, { isActive: true })
      
      // Check if this exceeds subscription limits
      const validation = validateTierAndBranches(
        subscription.pricing_tier,
        subscription.total_branches || 1,
        activeBranches.length
      )

      if (!validation.valid) {
        // Branch was created successfully, but warn about limits
        return NextResponse.json({ 
          success: true,
          branch: newBranch,
          warning: validation.error,
          requiresSubscriptionUpdate: true,
          message: "Branch created successfully! Note: You may need to upgrade your subscription if you need more branches."
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      branch: newBranch,
      message: subscription?.status === "trial" 
        ? "Branch added successfully! It's free during your trial. You'll be billed for additional branches after trial ends."
        : "Branch created successfully"
    })
  } catch (error) {
    console.error("Add branch error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to add branch" 
    }, { status: 500 })
  }
}
