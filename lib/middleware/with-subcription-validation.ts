// lib/middleware/with-subscription-validation.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getBranchRepository, getClinicRepository } from "@/lib/repositories"

export async function validateClinicSubscription(
  req: NextRequest,
  actionType?: 'patient' | 'appointment' | 'test'
) {
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return { 
      valid: false, 
      error: "Unauthorized", 
      status: 401 
    }
  }
  
  const clinicRepo = getClinicRepository()
  const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
    throw new Error("Clinic not found")
    }
  // Check subscription status
  const allowedStatuses = ['active', 'trial']
  if (!allowedStatuses.includes(clinic.subscription_status)) {
    return { 
      valid: false, 
      error: `Clinic subscription is ${clinic.subscription_status}. Please contact support.`,
      status: 402 // Payment Required
    }
  }
  
  // Check patient limits for patient creation
  if (actionType === 'patient') {
    if (clinic.current_month_patients >= clinic.monthly_patient_limit) {
      return {
        valid: false,
        error: `Clinic has reached patient limit (${clinic.monthly_patient_limit}). Please upgrade your subscription.`,
        status: 403
      }
    }
  }
  
  // Check branch limits for appointment creation
  if (actionType === 'appointment' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}))
    if (body.branch_id) {
      const branchRepo = getBranchRepository()
      const branch = await branchRepo.findById(body.branch_id)
      
      if (!branch?.is_active) {
        return {
          valid: false,
          error: "Selected branch is not active",
          status: 400
        }
      }
    }
  }
  
  return { valid: true, clinic }
}

// Usage in API routes:
export function withSubscriptionValidation(
  handler: Function,
  actionType?: 'patient' | 'appointment' | 'test'
) {
  return async (req: NextRequest, context: any) => {
    const validation = await validateClinicSubscription(req, actionType)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status || 403 }
      )
    }
    return handler(req, { ...context, clinic: validation.clinic })
  }
}