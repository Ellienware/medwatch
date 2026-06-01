import { getUserRepository, getEmployerRepository } from "@/lib/repositories"
import type { User, Employer } from "@/lib/types/database"
import { Query } from "appwrite"

export class EmployerUserSyncService {
  /**
   * Create a user entry when creating an employer
   */
  static async createUserForEmployer(employerData: Partial<Employer>): Promise<User | null> {
    try {
      if (!employerData.email || !employerData.company_name) {
        throw new Error("Email and company name are required")
      }

      const userRepo = getUserRepository()
      const employerRepo = getEmployerRepository()
      
      // Check if user already exists with same auth_user_id
      if (employerData.auth_user_id) {
        const existingUser = await userRepo.findByAuthId(employerData.auth_user_id)
        if (existingUser) {
          console.log(`User already exists for auth ID ${employerData.auth_user_id}`)
          return existingUser
        }
      }
      
      // Also check by email
      const existingUsers = await userRepo.findByEmail(employerData.email)
      const existingUserByEmail = existingUsers.find(u => u.email === employerData.email)
      
      if (existingUserByEmail) {
        console.log(`User already exists for employer ${employerData.email}`)
        
        // Update the existing user with auth_user_id if needed
        if (employerData.auth_user_id && !existingUserByEmail.auth_user_id) {
          await userRepo.update(existingUserByEmail.id, {
            auth_user_id: employerData.auth_user_id,
            first_login_required: employerData.first_login_required || false,
            temporary_password_set: employerData.temporary_password_set || false
          })
          
          // Re-fetch the updated user
          return await userRepo.findById(existingUserByEmail.id)
        }
        return existingUserByEmail
      }

      // Create user entry with STRINGIFIED permissions
      const userData: any = {
        clinic_id: employerData.clinic_id!,
        branch_id: null,
        auth_user_id: employerData.auth_user_id || null, // This is critical!
        email: employerData.email,
        full_name: employerData.company_name,
        phone: employerData.phone || null,
        role: 'employer',
        permissions: JSON.stringify({
          can_view_employees: true,
          can_view_certificates: true,
          can_download_reports: true,
        }),
        professional_registration_number: null,
        specialization: null,
        avatar_url: null,
        is_active: employerData.is_active ?? true,
        last_login: null,
        first_login_required: employerData.first_login_required ?? false,
        temporary_password_set: employerData.temporary_password_set ?? false,
        invitation_token: null,
        invitation_sent_at: employerData.portal_enabled ? new Date().toISOString() : null,
        invited_at: null,
        invitation_status: employerData.portal_enabled ? 'sent' : null,
        // Store employer-specific fields
        company_name: employerData.company_name,
        registration_number: employerData.registration_number,
        industry: employerData.industry,
        billing_email: employerData.billing_email || null,
        payment_terms: employerData.payment_terms || 30,
        portal_enabled: employerData.portal_enabled || false,
        auto_receive_certificates: employerData.auto_receive_certificates || false,
        notification_preferences: JSON.stringify({
          email: true,
          certificate_issued: true,
          certificate_expiring: true,
        }),
      }

      const user = await userRepo.create(userData)
      console.log(`Created user ${user.id} for employer ${employerData.email} with auth ID: ${employerData.auth_user_id || 'none'}`)
      return user

    } catch (error) {
      console.error("Failed to create user for employer:", error)
      return null
    }
  }

  /**
   * Update user when employer is updated
   */
  static async updateUserForEmployer(
    employerId: string, 
    employerUpdates: Partial<Employer>
  ): Promise<User | null> {
    try {
      const employerRepo = getEmployerRepository()
      const userRepo = getUserRepository()
      
      const employer = await employerRepo.findById(employerId)
      if (!employer || !employer.linked_user_id) {
        console.log(`No linked user found for employer ${employerId}`)
        return null
      }

      // Prepare user updates - include auth_user_id if it's being updated
      const userUpdates: any = {
        email: employerUpdates.email,
        full_name: employerUpdates.company_name,
        phone: employerUpdates.phone,
        is_active: employerUpdates.is_active,
        first_login_required: employerUpdates.first_login_required,
        temporary_password_set: employerUpdates.temporary_password_set,
        company_name: employerUpdates.company_name,
        registration_number: employerUpdates.registration_number,
        industry: employerUpdates.industry,
        billing_email: employerUpdates.billing_email,
        payment_terms: employerUpdates.payment_terms,
        portal_enabled: employerUpdates.portal_enabled,
        auto_receive_certificates: employerUpdates.auto_receive_certificates,
        updated_at: new Date().toISOString()
      }

      // **FIX: Update auth_user_id if provided**
      if (employerUpdates.auth_user_id !== undefined) {
        userUpdates.auth_user_id = employerUpdates.auth_user_id
      }

      // Handle notification_preferences
      if (employerUpdates.notification_preferences) {
        userUpdates.notification_preferences = typeof employerUpdates.notification_preferences === 'string'
          ? employerUpdates.notification_preferences
          : JSON.stringify(employerUpdates.notification_preferences)
      }

      // Remove undefined values
      Object.keys(userUpdates).forEach(key => {
        if (userUpdates[key] === undefined) {
          delete userUpdates[key]
        }
      })

      const updatedUser = await userRepo.update(employer.linked_user_id, userUpdates)
      console.log(`Updated user ${updatedUser.id} for employer ${employerId}`)
      
      return updatedUser

    } catch (error) {
      console.error("Failed to update user for employer:", error)
      return null
    }
  }

  /**
   * Get the linked user for an employer
   */
  static async getLinkedUser(employerId: string): Promise<User | null> {
    try {
      const employerRepo = getEmployerRepository()
      const userRepo = getUserRepository()
      
      const employer = await employerRepo.findById(employerId)
      if (!employer?.linked_user_id) {
        return null
      }
      
      return await userRepo.findById(employer.linked_user_id)
      
    } catch (error) {
      console.error("Failed to get linked user:", error)
      return null
    }
  }

  /**
   * Get employer from user ID
   */
  static async getEmployerFromUser(userId: string): Promise<Employer | null> {
    try {
      const employerRepo = getEmployerRepository()
      
      // Try by linked_user_id first (most reliable)
      const employersByLink = await employerRepo.find([
        Query.equal("linked_user_id", userId),
        Query.limit(1)
      ])
      
      if (employersByLink.length > 0) {
        return employersByLink[0]
      }
      
      // Fallback: try by auth_user_id
      const userRepo = getUserRepository()
      const user = await userRepo.findById(userId)
      
      if (user?.auth_user_id) {
        const employersByAuth = await employerRepo.find([
          Query.or([
            Query.equal("auth_user_id", user.auth_user_id),
            Query.equal("portal_user_id", user.auth_user_id)
          ]),
          Query.limit(1)
        ])
        
        if (employersByAuth.length > 0) {
          // Update the employer with the correct linked_user_id
          await employerRepo.update(employersByAuth[0].id, {
            linked_user_id: userId
          })
          return employersByAuth[0]
        }
      }
      
      return null
      
    } catch (error) {
      console.error("Failed to get employer from user:", error)
      return null
    }
  }

  /**
   * Sync auth_user_id from employer to user (for existing records)
   */
  static async syncAuthUserId(employerId: string): Promise<boolean> {
    try {
      const employerRepo = getEmployerRepository()
      const userRepo = getUserRepository()
      
      const employer = await employerRepo.findById(employerId)
      if (!employer || !employer.linked_user_id) {
        console.log(`No linked user found for employer ${employerId}`)
        return false
      }

      // If employer has auth_user_id but user doesn't, sync it
      if (employer.auth_user_id) {
        const user = await userRepo.findById(employer.linked_user_id)
        
        if (user && !user.auth_user_id) {
          await userRepo.update(employer.linked_user_id, {
            auth_user_id: employer.auth_user_id
          })
          console.log(`Synced auth_user_id ${employer.auth_user_id} from employer to user`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error("Failed to sync auth_user_id:", error)
      return false
    }
  }
}
