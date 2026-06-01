// app/api/clinic/employers/[id]/reset-password/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { EmployerRepository } from '@/lib/repositories'
import { sendPasswordReset, ensureEmployerAccount } from '@/lib/auth/appwrite-auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: employerId } = await context.params
    
    console.log('Password reset API called for employer ID:', employerId)
    
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
        { error: "Employer not found or unauthorized" },
        { status: 404 }
      )
    }

    if (!employer.portal_enabled || !employer.email) {
      return NextResponse.json(
        { 
          error: "Employer portal is not enabled or email not found",
          suggestion: "Enable portal access and add an email address first"
        },
        { status: 400 }
      )
    }

    console.log('Processing password reset for:', employer.email)
    
    // Check if employer has portal_user_id
    if (!employer.portal_user_id) {
      // Create user account first
      try {
        console.log('No portal_user_id found, creating Appwrite account...')
        
        const authUserId = await ensureEmployerAccount(
          employer.email,
          employer.company_name || employer.email.split('@')[0],
          employer.id,
          employer.clinic_id
        )
        
        // Update employer with portal_user_id only (since auth_user_id doesn't exist in DB)
        await employerRepo.update(employerId, {
          portal_user_id: authUserId,
          portal_enabled: true
        })
        
        console.log(`Created Appwrite account ${authUserId} for employer`)
        
      } catch (accountError: any) {
        console.error('Failed to create Appwrite account:', accountError)
        return NextResponse.json(
          { 
            error: "Failed to create user account",
            details: accountError.message,
            suggestion: "Please try creating portal access first via the employer management page"
          },
          { status: 500 }
        )
      }
    }

    // Now send password reset
    try {
      await sendPasswordReset(employer.email)
      
      console.log('Password reset email sent successfully')
      
      return NextResponse.json(
        { 
          message: "Password reset email sent successfully",
          email: employer.email,
          note: "Check the email inbox for password reset instructions"
        },
        { status: 200 }
      )
      
    } catch (resetError: any) {
      console.error('Password reset failed:', resetError)
      
      // Provide helpful error messages
      let errorMessage = resetError.message
      let statusCode = 500
      
      if (resetError.message.includes('No user account found')) {
        errorMessage = "No user account exists. The account may have been deleted."
        statusCode = 404
      } else if (resetError.message.includes('Too many reset attempts')) {
        errorMessage = resetError.message
        statusCode = 429
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          email: employer.email
        },
        { status: statusCode }
      )
    }
    
  } catch (error: any) {
    console.error("Error in password reset endpoint:", error)
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        suggestion: "Please try again or contact support"
      },
      { status: 500 }
    )
  }
}
