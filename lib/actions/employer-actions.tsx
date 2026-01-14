"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/actions"
import { EmployerRepository, getClinicRepository, getUserRepository } from "@/lib/repositories"
import { activityLogger } from "../utils/activity-logger"
import { emailService } from "@/lib/email/email-service"
import { generatePassword } from "../utils/password"
import { createAppwriteAccount } from "@/lib/auth/appwrite-auth"
import { EmployerUserSyncService } from "@/lib/services/employer-user-sync"

export async function createEmployer(data: {
  company_name: string
  registration_number?: string
  email: string
  phone?: string
  address?: string
  industry?: string
  billing_email?: string | null
  payment_terms?: number
  portal_enabled?: boolean
  auto_receive_certificates?: boolean
  contact_person_name?: string
}) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const userRepo = getUserRepository()
    
    // Check if employer/user already exists
    const existingUsers = await userRepo.findByEmail(data.email)
    const existingUser = existingUsers.find(usr => usr.email === data.email)
    
    if (existingUser) {
      return { success: false, error: "An account with this email already exists" }
    }

    let authUserId = null
    let tempPassword = null

    // Create Appwrite account if portal is enabled
    if (data.portal_enabled) {
      try {
        tempPassword = generatePassword(12)
        
        // Create Appwrite account
        authUserId = await createAppwriteAccount(
          data.email,
          tempPassword,
          data.contact_person_name || data.company_name
        )
      } catch (authError) {
        console.error("Failed to create Appwrite account:", authError)
        return { 
          success: false, 
          error: "Failed to create user account. Please try again." 
        }
      }
    }

    // **FIX: First create user entry WITH auth_user_id**
    const employerUser = await EmployerUserSyncService.createUserForEmployer({
      clinic_id: user.clinic_id,
      company_name: data.company_name,
      email: data.email,
      phone: data.phone || null,
      registration_number: data.registration_number,
      industry: data.industry,
      auth_user_id: authUserId, // This is the key - pass auth_user_id here
      is_active: true,
      first_login_required: false,
      temporary_password_set: data.portal_enabled ? true : false,
      portal_enabled: data.portal_enabled
    })

    if (!employerUser) {
      return { success: false, error: "Failed to create user account" }
    }

    // **FIX: Get the created user's ID to link back to employer**
    const linkedUserId = employerUser.id

    // Create employer record - link to user
    const employer = await employerRepo.create({
      clinic_id: user.clinic_id,
      company_name: data.company_name,
      registration_number: data.registration_number || null,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      industry: data.industry || null,
      billing_email: data.billing_email || null,
      payment_terms: data.payment_terms || 30,
      portal_enabled: data.portal_enabled || false,
      portal_user_id: authUserId,
      auth_user_id: authUserId,
      linked_user_id: linkedUserId, // Link to user collection
      auto_receive_certificates: data.auto_receive_certificates || false,
      notification_preferences: {
        email: true,
        certificate_issued: true,
        certificate_expiring: true,
      },
      is_active: true,
      first_login_required: false,
      temporary_password_set: data.portal_enabled ? true : false,
    })

    // Send welcome email if portal is enabled
    if (data.portal_enabled && tempPassword) {
      try {
        const clinicRepo = getClinicRepository()
        const clinic = await clinicRepo.findById(user.clinic_id)
        const clinicName = clinic?.name || "Medical Clinic"

        await emailService.sendEmployerInvitation(data.email, {
          companyName: data.company_name,
          contactName: data.contact_person_name || data.company_name,
          clinicName: clinicName,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/sign-in`,
          temporaryPassword: tempPassword,
          email: data.email,
        })
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
        // Don't fail the whole creation, just log it
      }
    }

    revalidatePath("/clinic/employers")
    
    return { 
      success: true, 
      data: {
        employer,
        user: employerUser
      },
      message: data.portal_enabled 
        ? "Employer created successfully. User account created and welcome email sent."
        : "Employer created successfully. Portal not enabled."
    }
  } catch (error: any) {
    console.error("Error creating employer:", error)
    return { success: false, error: error.message || "Failed to create employer" }
  }
}

export async function updateEmployer(id: string, data: Partial<Parameters<typeof createEmployer>[0]>) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const employer = await employerRepo.findById(id)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return { success: false, error: "Employer not found or unauthorized" }
    }

    // Update employer
    const updatedEmployer = await employerRepo.update(id, data)
    
    // Sync changes to user
    if (employer.linked_user_id) {
      await EmployerUserSyncService.updateUserForEmployer(id, data)
    }

    revalidatePath("/clinic/employers")
    revalidatePath(`/clinic/employers/${id}`)
    
    return { success: true, data: updatedEmployer }
  } catch (error: any) {
    console.error("Error updating employer:", error)
    return { success: false, error: error.message || "Failed to update employer" }
  }
}

export async function deleteEmployer(id: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const employer = await employerRepo.findById(id)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return { success: false, error: "Employer not found or unauthorized" }
    }

    // Soft delete - mark as inactive
    await employerRepo.update(id, { is_active: false })
    
    revalidatePath("/clinic/employers")
    
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting employer:", error)
    return { success: false, error: error.message || "Failed to delete employer" }
  }
}


export async function resetEmployerPassword(employerId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return { success: false, error: "Employer not found or unauthorized" }
    }

    if (!employer.portal_enabled || !employer.email) {
      return { success: false, error: "Employer portal is not enabled or email not found" }
    }

    // Import dynamically to avoid circular dependencies
    const { sendPasswordReset, ensureEmployerAccount } = await import("@/lib/auth/appwrite-auth")
    
    // Check if portal_user_id exists
    if (!employer.portal_user_id) {
      // Create user account first
      const authUserId = await ensureEmployerAccount(
        employer.email,
        employer.company_name || employer.email.split('@')[0],
        employer.id,
        employer.clinic_id
      )
      
      // Update employer with portal_user_id
      await employerRepo.update(employerId, {
        portal_user_id: authUserId,
        portal_enabled: true
      })
    }

    // Send password reset email
    await sendPasswordReset(employer.email)
    
    // Log activity (if you have activity logging)
    try {
      const { activityLogger } = await import("@/lib/monitoring/activity-logger")
      await activityLogger.custom(
        "settings_updated",
        `Reset password for employer: ${employer.company_name}`,
        "employer",
        employer.id,
        { email: employer.email }
      )
    } catch (logError) {
      console.error("Failed to log activity:", logError)
    }
    
    revalidatePath(`/clinic/employers/${employerId}`)
    
    return { 
      success: true, 
      message: "Password reset email sent successfully" 
    }
  } catch (error: any) {
    console.error("Error resetting employer password:", error)
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to reset password"
    
    if (error.message.includes('No user account found')) {
      errorMessage = "No user account exists. Please send a welcome email first."
    } else if (error.message.includes('Too many reset attempts')) {
      errorMessage = "Too many reset attempts. Please wait before trying again."
    }
    
    return { success: false, error: errorMessage }
  }
}
export async function sendEmployerWelcomeEmail(employerId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const clinicRepo = getClinicRepository()
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return { success: false, error: "Employer not found or unauthorized" }
    }

    if (!employer.email) {
      return { success: false, error: "Employer email is required" }
    }

    // Generate a temporary password
    const tempPassword = generatePassword(12)
    
    let authUserId = employer.portal_user_id
    
    // Create Appwrite account if doesn't exist
    if (!authUserId) {
      authUserId = await createAppwriteAccount(
        employer.email,
        tempPassword,
        employer.company_name || employer.email.split('@')[0]
      )
      
      // Update employer with auth_user_id
      await employerRepo.update(employerId, {
        portal_user_id: authUserId,
        portal_enabled: true,
        first_login_required: false // ADD THIS
      })
    }

    // Get clinic name
    const clinic = await clinicRepo.findById(user.clinic_id)
    const clinicName = clinic?.name || "Medical Clinic"

    // Send invitation email using Brevo
    const result = await emailService.sendEmployerInvitation(employer.email, {
      companyName: employer.company_name,
      contactName: employer.company_name,
      clinicName: clinicName,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/sign-in`,
      temporaryPassword: tempPassword,
      email: employer.email,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to send email via Brevo")
    }

    revalidatePath("/clinic/employers")
    
    return { 
      success: true, 
      message: "Welcome email sent successfully with temporary password",
      email: employer.email
    }

  } catch (error: any) {
    console.error("Failed to send welcome email:", error)
    return {
      success: false,
      error: error.message || "Failed to send welcome email"
    }
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one uppercase, one lowercase, one number, and one special char
  password += chars.charAt(Math.floor(Math.random() * 26)) // uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)) // lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)) // number
  password += chars.charAt(62 + Math.floor(Math.random() * 8)) // special char
  
  // Add 4 more random characters
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function toggleEmployerStatus(employerId: string, isActive: boolean) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized" }
    }

    const employerRepo = new EmployerRepository()
    const employer = await employerRepo.findById(employerId)
    
    if (!employer || employer.clinic_id !== user.clinic_id) {
      return { success: false, error: "Employer not found or unauthorized" }
    }

    // Update employer status
    await employerRepo.update(employerId, { is_active: isActive })

    // Also update linked user status
    if (employer.linked_user_id) {
      const userRepo = getUserRepository()
      await userRepo.update(employer.linked_user_id, { is_active: isActive })
    }

    // Log activity
    try {
      
      const action = isActive ? "activated" : "deactivated"
      await activityLogger.custom(
        "settings_updated",
        `${action} employer: ${employer.company_name}`,
        "employer",
        employer.id,
        { 
          previous_status: employer.is_active,
          new_status: isActive
        }
      )
    } catch (logError) {
      console.error("Failed to log activity:", logError)
    }

    return { 
      success: true, 
      message: `Employer ${isActive ? 'activated' : 'deactivated'} successfully`
    }

  } catch (error: any) {
    console.error("Failed to update employer status:", error)
    return {
      success: false,
      error: error.message || "Failed to update employer status"
    }
  }
}

export async function getActiveEmployers() {
  try {
    // Use the getCurrentUser from your auth actions
    const { getCurrentUser: getAuthCurrentUser } = await import("@/lib/auth/actions")
    const user = await getAuthCurrentUser()
    
    if (!user || !user.clinic_id) {
      return { success: false, error: "Unauthorized", data: [] }
    }

    const employerRepo = new EmployerRepository()
    const employers = await employerRepo.findByClinicId(user.clinic_id, { isActive: true })
    
    // Return only the fields needed for the dropdown
    const simplifiedEmployers = employers.map(emp => ({
      id: emp.id,
      company_name: emp.company_name
    }))

    return { success: true, data: simplifiedEmployers }
  } catch (error: any) {
    console.error("Error fetching employers:", error)
    return { success: false, error: error.message || "Failed to fetch employers", data: [] }
  }
}

