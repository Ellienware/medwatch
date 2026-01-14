// app/api/clinic/employers/[id]/create-portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { EmployerRepository } from '@/lib/repositories'
import { ensureEmployerAccount, sendPasswordReset } from '@/lib/auth/appwrite-auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: employerId } = await context.params
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const employerRepo = new EmployerRepository()
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 }
      )
    }

    if (!employer.email) {
      return NextResponse.json(
        { error: "Employer email is required" },
        { status: 400 }
      )
    }

    // Check if user already has an account
    const currentAuthId = employer.auth_user_id || employer.portal_user_id
    if (currentAuthId) {
      return NextResponse.json(
        { 
          error: "Portal access already exists",
          auth_user_id: currentAuthId,
          message: "This employer already has portal access. Use 'Reset Password' instead."
        },
        { status: 400 }
      )
    }

    // Create/ensure Appwrite account exists
    const authUserId = await ensureEmployerAccount(
      employer.email,
      employer.company_name || employer.email.split('@')[0],
      employer.id,
      employer.clinic_id
    )
    
    // Update employer record with both fields for compatibility
    await employerRepo.update(employerId, {
      auth_user_id: authUserId,
      portal_user_id: authUserId, // Set both
      portal_enabled: true
    })
    
    // Optionally send password reset (uncomment if you want to send reset on creation)
    // await sendPasswordReset(employer.email)
    
    return NextResponse.json({
      success: true,
      message: "Portal access created successfully",
      auth_user_id: authUserId,
      email: employer.email,
      note: "User account has been created. Use 'Reset Password' to send login instructions."
    })
    
  } catch (error: any) {
    console.error("Error creating portal access:", error)
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to create portal access",
        suggestion: "Check if user already exists with this email"
      },
      { status: 500 }
    )
  }
}