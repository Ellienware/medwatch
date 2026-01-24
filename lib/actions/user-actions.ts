"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser as getAuthCurrentUser, getAuthUser as getAppwriteUser } from "@/lib/auth/actions"
import { getUserRepository } from "@/lib/repositories"
import { ValidationError, DatabaseError } from "@/lib/errors"
import { activityLogger } from "@/lib/monitoring/activity-logger"
import type { User as UserType } from "@/lib/types/database"

// Get current user profile from database
export async function getCurrentUserProfile() {
  try {
    // Get the database user, not the Appwrite user
    const user = await getAuthCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated", data: null }
    }

    const userRepo = getUserRepository()
    
    // The user object from getAuthCurrentUser() is already your database User type
    // So we can just return it
    return {
      success: true,
      data: user,
      error: null
    }
  } catch (error: any) {
    console.error("Error getting user profile:", error)
    return {
      success: false,
      error: error.message || "Failed to get user profile",
      data: null
    }
  }
}

// Update user profile
export async function updateUserProfile(data: {
  full_name?: string
  phone?: string | null
  specialization?: string | null
  professional_registration_number?: string | null
  avatar_url?: string | null
}) {
  try {
    const user = await getAuthCurrentUser()
    if (!user) {
      throw new ValidationError("User not authenticated")
    }

    const userRepo = getUserRepository()
    const updatedUser = await userRepo.update(user.id, data)

    // Log activity
    await activityLogger.profileUpdated(user.id, {
      full_name: data.full_name,
      phone: data.phone,
      specialization: data.specialization,
      professional_registration_number: data.professional_registration_number,
    })

    revalidatePath("/profile")
    revalidatePath("/settings")
    
    return {
      success: true,
      data: updatedUser,
      message: "Profile updated successfully"
    }
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return {
      success: false,
      error: error.message || "Failed to update profile"
    }
  }
}


export async function changePassword(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  try {
    const { currentPassword, newPassword, confirmPassword } = data

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError("All password fields are required")
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError("New passwords do not match")
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      throw new ValidationError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      )
    }

    // Get current user
    const user = await getAuthCurrentUser()
    if (!user) {
      throw new ValidationError("User not authenticated")
    }

    // Get Appwrite account for email
    const account = await getAppwriteUser()
    if (!account) {
      throw new ValidationError("User account not found")
    }

    // Import appwrite auth functions
    const { sendPasswordReset } = await import("@/lib/auth/appwrite-auth")
    
    // Send password reset email
    await sendPasswordReset(user.email)
    
    // Update user's temporary password flag if needed
    const userRepo = getUserRepository()
    await userRepo.update(user.id, {
      temporary_password_set: false,
      first_login_required: false
    })

    // Log activity
    await activityLogger.passwordChanged(user.id)

    return {
      success: true,
      message: "Password reset email sent. Please check your email to set a new password."
    }
  } catch (error: any) {
    console.error("Error changing password:", error)
    return {
      success: false,
      error: error.message || "Failed to change password"
    }
  }
}

export async function uploadAvatar(formData: FormData) {
  try {
    const user = await getAuthCurrentUser()
    if (!user) {
      throw new ValidationError("User not authenticated")
    }

    const file = formData.get("avatar") as File
    if (!file) {
      throw new ValidationError("No file uploaded")
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError("Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP)")
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new ValidationError("File too large. Maximum size is 5MB")
    }

    // TODO: Implement file upload to storage
    // This would typically upload to Appwrite Storage or another service
    const avatarUrl = `/uploads/avatars/${user.id}-${Date.now()}-${file.name}`

    // Update user with new avatar URL
    const userRepo = getUserRepository()
    await userRepo.update(user.id, { avatar_url: avatarUrl })

    // Log activity
    await activityLogger.avatarUpdated(user.id)

    revalidatePath("/profile")
    
    return {
      success: true,
      data: { avatar_url: avatarUrl },
      message: "Avatar updated successfully"
    }
  } catch (error: any) {
    console.error("Error uploading avatar:", error)
    return {
      success: false,
      error: error.message || "Failed to upload avatar"
    }
  }
}

// Helper function to get user settings
// In your server actions file
export async function getUserSettings() {
  try {
    const user = await getAuthCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated", data: null }
    }

    // Settings are stored inside permissions.settings
    const permissions = user.permissions || {}
    const settings = (permissions as any)?.settings || {}
    
    return {
      success: true,
      data: {
        email_notifications: settings.email_notifications ?? true,
        push_notifications: settings.push_notifications ?? true,
        two_factor_enabled: settings.two_factor_enabled ?? false,
        language: settings.language || "en",
        timezone: settings.timezone || "UTC",
      },
      error: null
    }
  } catch (error: any) {
    console.error("Error getting user settings:", error)
    return {
      success: false,
      error: error.message || "Failed to get user settings",
      data: null
    }
  }
}

// In your server actions file (user-actions.ts)
export async function updateUserSettings(data: {
  email_notifications?: boolean
  push_notifications?: boolean
  two_factor_enabled?: boolean
  language?: string
  timezone?: string
}) {
  try {
    const user = await getAuthCurrentUser()
    if (!user) {
      throw new ValidationError("User not authenticated")
    }

    const userRepo = getUserRepository()
    
    // Get current permissions
    const currentPermissions = user.permissions || {}
    
    // Create updated permissions object with settings inside
    const updatedPermissions = {
      ...currentPermissions,
      settings: {
        ...((currentPermissions as any)?.settings || {}),
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        two_factor_enabled: data.two_factor_enabled,
        language: data.language,
        timezone: data.timezone,
      }
    }
    
    // ONLY update permissions field - do NOT include a separate settings field
    const updatedUser = await userRepo.update(user.id, {
      permissions: updatedPermissions
    })

    // Log activity
    await activityLogger.settingsUpdated(user.id, "preferences")

    revalidatePath("/settings")
    
    return {
      success: true,
      data: updatedUser,
      message: "Settings updated successfully"
    }
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return {
      success: false,
      error: error.message || "Failed to update settings"
    }
  }
}

// Enhanced version for employers
export async function getCurrentUserProfileWithEmployerData() {
  try {
    const user = await getAuthCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated", data: null }
    }

    // If user is an employer, fetch additional employer data
    if (user.role === "employer" && user.clinic_id) {
      try {
        const { EmployerRepository } = await import("@/lib/repositories/employer-repository")
        const employerRepo = new EmployerRepository()
        
        // Try to find employer by auth_user_id or portal_user_id
        const employer = await employerRepo.findByPortalUserId(user.id)
        
        if (employer) {
          // Merge employer data with user data
          return {
            success: true,
            data: {
              ...user,
              company_name: employer.company_name,
              registration_number: employer.registration_number,
              industry: employer.industry,
              billing_email: employer.billing_email,
              payment_terms: employer.payment_terms,
              portal_enabled: employer.portal_enabled,
              auto_receive_certificates: employer.auto_receive_certificates,
              notification_preferences: employer.notification_preferences,
            } as UserType,
            error: null
          }
        }
      } catch (employerError) {
        console.error("Error fetching employer data:", employerError)
        // Continue with just user data if employer fetch fails
      }
    }

    return {
      success: true,
      data: user,
      error: null
    }
  } catch (error: any) {
    console.error("Error getting user profile:", error)
    return {
      success: false,
      error: error.message || "Failed to get user profile",
      data: null
    }
  }
}