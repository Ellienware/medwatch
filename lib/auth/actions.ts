// lib/auth/actions.ts
"use server"

import {
  getAccount,
  createAccount,
  createEmailSession as createSession,
  deleteSession,
  createPasswordRecovery,
} from "@/lib/appwrite/auth"

import type { Models } from "appwrite"
import type { UserRole } from "@/lib/types/database"

import { redirect } from "next/navigation"
import { withRetry } from "@/lib/utils/retry"

import {
  DatabaseError,
  ValidationError,
  AuthenticationError,
} from "@/lib/errors"

import { invalidateUserCache } from "@/lib/appwrite/helpers"

import {
  getUserRepository,
  getClinicRepository,
} from "@/lib/repositories"
import { emailService } from "../email/email-service"



/* --------------------------------------------------------
 * AUTH HELPERS
 * ------------------------------------------------------ */

/**
 * Returns the Appwrite authenticated user (Account)
 */
export async function getAuthUser(): Promise<Models.User<Models.Preferences> | null> {
  try {
    return await getAccount()
  } catch {
    return null
  }
}

/**
 * Returns the application-level user from the database
 */
export async function getCurrentUser() {
  try {
    // First get Appwrite account info
    const account = await getAuthUser()
    if (!account) return null

    // Then get database user
    const userRepo = getUserRepository()
    return await userRepo.findByAuthId(account.$id)
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function getUserProfile() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }
    return { success: true, user }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return { 
      success: false, 
      error: "Failed to get user profile" 
    }
  }
}

/**
 * Check auth status
 */
export async function checkAuthStatus() {
  const account = await getAuthUser()
  const user = await getCurrentUser()
  
  return {
    isAuthenticated: !!account,
    needsOnboarding: !!account && !user,
    user: user,
    account: account,
  }
}

/* --------------------------------------------------------
 * AUTH ACTIONS
 * ------------------------------------------------------ */

export async function createEmailSession(email: string, password: string) {
  return await createSession(email, password)
}

/**
 * Initial sign up - creates Appwrite account AND auto-logs in
 */
export async function signUp(email: string, password: string, fullName: string) {
  if (!email || !password || !fullName) {
    throw new ValidationError("Email, password, and full name are required")
  }

  // Step 1: Create Appwrite account
  const { user: authUser, error: authError } = await createAccount(email, password, fullName)

  if (authError || !authUser) {
    return {
      success: false,
      error: authError || "Failed to create account",
    }
  }

  try {
    // Step 2: Auto-login immediately after signup
    const { session, error: sessionError } = await createSession(email, password)
    
    if (sessionError || !session) {
      return {
        success: false,
        error: sessionError || "Account created but failed to sign in",
      }
    }

    return {
      success: true,
      message: "Account created successfully. Redirecting to onboarding...",
      userId: authUser.$id,
      email: authUser.email,
      name: authUser.name,
    }
  } catch (error) {
    throw new DatabaseError(
      "Failed to create account or sign in",
      error instanceof Error ? error : undefined,
    )
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { session, error } = await createSession(email, password)

  if (error || !session) {
    return { success: false, error }
  }

  // Check if user has a profile
  try {
    const user = await getCurrentUser()
    if (user) {
      // User has profile, update last login
      await updateLastLogin()
    }
    
    return { 
      success: true, 
      hasProfile: !!user,
      userId: user?.id 
    }
  } catch (error) {
    console.log("Sign in completed, user may need onboarding")
    return { 
      success: true, 
      hasProfile: false,
      userId: null 
    }
  }
}

/**
 * Create user profile only (for onboarding)
 */
export async function createUserProfile(
  role: UserRole = "clinic_admin",
  additionalData?: {
    clinicId?: string
    branchId?: string
    specialization?: string
    professionalRegNumber?: string
  },
) {
  // Get current authenticated user
  const account = await getAuthUser()
  if (!account) {
    throw new AuthenticationError("User not authenticated")
  }

  if (!account.email || !account.name || !role) {
    throw new ValidationError("Email, name, and role are required")
  }

  try {
    return await withRetry(
      async () => {
        let clinicId: string | null = additionalData?.clinicId ?? null

        // Auto-create clinic for clinic admins
        if (role === "clinic_admin") {
          const clinicRepo = getClinicRepository()

          const clinic = await clinicRepo.create({
            name: `${account.name}'s Clinic`,
            email: account.email,
            phone: null,
            address: null,
            logo_url: null,
            settings: {},
            is_active: true,
            data_retention_days: 730,

            subscription_plan: "trial",
            subscription_status: "trial",
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
            selected_plan: null,
            subscription_start_date: null,
            subscription_end_date: null,
            next_billing_date: null,
            monthly_patient_limit: 100,
            current_month_patients: 0,
            paystack_customer_id: null,
            paystack_subscription_id: null,
            payment_method_id: null,
            max_branches: 1,
            current_branches: 0,
          })

          clinicId = clinic.id
        }

        if (role !== "clinic_admin" && role !== "super_admin" && !clinicId) {
          throw new ValidationError(`${role} role requires a clinic_id`)
        }

        const userRepo = getUserRepository()

        // Check if user already has a profile
        const existingUser = await userRepo.findByAuthId(account.$id)
        if (existingUser) {
          return {
            success: true,
            message: "Profile already exists",
            clinicId: existingUser.clinic_id,
          }
        }

        const userData: any = {
          auth_user_id: account.$id,
          email: account.email,
          full_name: account.name,
          role,
          clinic_id: clinicId,
          branch_id: additionalData?.branchId ?? null,
          is_active: true,
          last_login: new Date().toISOString(),
        }

        if (role === "doctor" || role === "nurse") {
          userData.specialization = additionalData?.specialization ?? null
          userData.professional_registration_number = additionalData?.professionalRegNumber ?? null
        }

        await userRepo.create(userData)

        // Update last login after profile creation
        await updateLastLogin()

        return {
          success: true,
          message: "Profile created successfully",
          clinicId,
        }
      },
      {
        maxAttempts: 3,
        shouldRetry: (error) =>
          error instanceof Error &&
          (error.message.includes("network") || error.message.includes("timeout")),
      },
    )
  } catch (error) {
    throw new DatabaseError(
      "Failed to create user profile",
      error instanceof Error ? error : undefined,
    )
  }
}

export async function signOut() {
  await deleteSession()
  redirect("/auth/sign-in")
}

export async function updateLastLogin() {
  const account = await getAuthUser()
  if (!account) throw new AuthenticationError()

  try {
    const userRepo = getUserRepository()
    const user = await userRepo.findByAuthId(account.$id)

    if (user) {
      await userRepo.updateLastLogin(user.id)
      invalidateUserCache(account.$id)
    }

    return { success: true }
  } catch (error) {
    throw new DatabaseError(
      "Failed to update last login",
      error instanceof Error ? error : undefined,
    )
  }
}



export async function resetPassword(email: string) {
  const { success, error } = await createPasswordRecovery(email)

  if (error) {
    return { success: false, error }
  }

  return {
    success: true,
    message: "Password reset email sent",
  }
}

export async function inviteStaffMember(
  email: string,
  fullName: string,
  role: "receptionist" | "nurse" | "doctor",
  branchId?: string,
  specialization?: string,
  professionalRegNumber?: string,
) {
  const account = await getAuthUser()
  if (!account) throw new AuthenticationError()

  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "clinic_admin") {
    throw new AuthenticationError("Only clinic admins can invite staff")
  }

  if (!currentUser.clinic_id) {
    throw new ValidationError("Clinic not found")
  }

  const clinicRepo = getClinicRepository()
  const clinic = await clinicRepo.findById(currentUser.clinic_id)

  if (!clinic) {
    throw new ValidationError("Clinic not found")
  }

  const payload = Buffer.from(
    JSON.stringify({
      clinicId: currentUser.clinic_id,
      role,
      branchId,
      specialization,
      professionalRegNumber,
      invitedBy: currentUser.full_name,
    }),
  ).toString("base64")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const invitationLink = `${appUrl}/auth/sign-up?invitation=${payload}`

  const result = await emailService.sendInvitation(email, {
    recipientName: fullName,
    invitedBy: currentUser.full_name,
    role,
    clinicName: clinic.name,
    invitationLink,
  })

  if (!result.success) {
    throw new DatabaseError(
      "Failed to send invitation email",
      result.error ? new Error(result.error) : undefined,
    )
  }

  return {
    success: true,
    message: `Invitation sent to ${email}`,
  }
}

