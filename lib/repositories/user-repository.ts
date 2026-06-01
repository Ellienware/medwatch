import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { User as DatabaseUser, UserRole } from "@/lib/types/database"
import { serverDatabases } from "@/lib/appwrite/server-client"
import { ID } from "appwrite"
import { withRetry } from "@/lib/utils/retry"
import { DatabaseError } from "@/lib/errors"
import logger from "@/lib/logging/logger"

export type User = DatabaseUser

export class UserRepository extends BaseRepository<User> {
  protected collectionId = COLLECTIONS.USERS

  constructor() {
    super("user")
  }

  protected mapToEntity(doc: any): User {
    // Parse permissions from JSON string if it exists
    let permissions: Record<string, any> = {}
    let settings: Record<string, any> = {}
    
    if (doc.permissions) {
      try {
        if (typeof doc.permissions === 'string') {
          permissions = JSON.parse(doc.permissions)
        } else if (typeof doc.permissions === 'object') {
          permissions = doc.permissions
        }
      } catch (error) {
        console.error('Error parsing permissions:', error)
        permissions = {}
      }
    }


    // Parse invitation status
    let invitationStatus: User["invitation_status"] = null
    if (doc.invitation_status) {
      const validStatuses: User["invitation_status"][] = ["pending", "sent", "accepted", "expired"]
      if (validStatuses.includes(doc.invitation_status as any)) {
        invitationStatus = doc.invitation_status as User["invitation_status"]
      }
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id || null,
      branch_id: doc.branch_id || null,
      auth_user_id: doc.auth_user_id || null,
      email: doc.email,
      full_name: doc.full_name,
      phone: doc.phone || null,
      role: doc.role as UserRole,
      permissions: permissions,
      professional_registration_number: doc.professional_registration_number || null,
      specialization: doc.specialization || null,
      avatar_url: doc.avatar_url || null,
      is_active: doc.is_active !== undefined ? doc.is_active : true,
      last_login: doc.last_login || null,
      first_login_required: doc.first_login_required !== undefined ? doc.first_login_required : false,
      temporary_password_set: doc.temporary_password_set !== undefined ? doc.temporary_password_set : false,
      invitation_token: doc.invitation_token || null,
      invitation_sent_at: doc.invitation_sent_at || null,
      invited_at: doc.invited_at || null,
      invitation_status: invitationStatus,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt || null,
    }
  }

  /**
   * Override create method to handle object-to-string conversion
   */
  async create(data: Partial<User>): Promise<User> {
    logger.info(`Creating user`, { data: { ...data, auth_user_id: data.auth_user_id } })
    
    try {
      return await withRetry(async () => {
        const now = new Date().toISOString()
        const dataForAppwrite: any = { ...data }
        
        // Add timestamps
        if (!dataForAppwrite.created_at) {
          dataForAppwrite.created_at = now
        }
        dataForAppwrite.updated_at = now
        
        // Convert objects to JSON strings for Appwrite
        this.convertObjectsToStrings(dataForAppwrite)
        
        logger.debug(`Creating user document`, {
          dataKeys: Object.keys(dataForAppwrite),
          hasPermissions: !!dataForAppwrite.permissions,
          hasSettings: !!dataForAppwrite.settings,
          permissionsLength: typeof dataForAppwrite.permissions === 'string' ? dataForAppwrite.permissions.length : 'N/A'
        })
        
        const doc = await serverDatabases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          ID.unique(),
          dataForAppwrite
        )
        
        return this.mapToEntity(doc)
      })
    } catch (error) {
      logger.error(`Failed to create user`, error, { data: { ...data, auth_user_id: data.auth_user_id } })
      throw new DatabaseError(`Failed to create user`, error as Error)
    }
  }

  /**
   * Override update method to handle object-to-string conversion
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    logger.info(`Updating user`, { id, data })
    
    try {
      return await withRetry(async () => {
        const dataToUpdate: any = { ...data }
        
        // Add updated_at timestamp
        dataToUpdate.updated_at = new Date().toISOString()
        
        // Convert objects to JSON strings for Appwrite
        this.convertObjectsToStrings(dataToUpdate)
        
        logger.debug(`Updating user document`, {
          id,
          dataKeys: Object.keys(dataToUpdate),
          permissionsType: typeof dataToUpdate.permissions,
          settingsType: typeof dataToUpdate.settings,
          permissionsLength: typeof dataToUpdate.permissions === 'string' ? dataToUpdate.permissions.length : 'N/A'
        })
        
        const doc = await serverDatabases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          id,
          dataToUpdate
        )
        
        // Invalidate cache
        this.invalidateCache(id)
        return this.mapToEntity(doc)
      })
    } catch (error) {
      logger.error(`Failed to update user`, error, { id, data })
      throw new DatabaseError(`Failed to update user`, error as Error)
    }
  }

  /**
   * Helper method to convert object fields to JSON strings
   */
private convertObjectsToStrings(data: any): void {
  // Convert permissions object to JSON string
  if (data.permissions && typeof data.permissions === 'object') {
    data.permissions = JSON.stringify(data.permissions)
    logger.debug(`Converted permissions to string`, {
      length: data.permissions.length,
      preview: data.permissions.substring(0, 100) + '...'
    })
  } else if (!data.permissions) {
    data.permissions = "{}" // Default empty object
  }
  
  if (data.settings !== undefined) {
    logger.warn(`Found top-level settings field in data. This field should be nested inside permissions. Removing it.`, {
      settingsType: typeof data.settings,
      dataKeys: Object.keys(data)
    })
    delete data.settings
  }
}

  async findByEmail(email: string): Promise<User[]> {
    const users = await this.find([
      Query.equal("email", email),
    ])
    return users
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const users = await this.find([
      Query.equal("email", email),
      Query.limit(1),
    ])
    return users[0] || null
  }

  async findByAuthId(authUserId: string): Promise<User | null> {
    const users = await this.find([
      Query.equal("auth_user_id", authUserId),
      Query.limit(1),
    ])
    return users[0] || null
  }

async updateUserSettings(userId: string, settings: Record<string, any>) {
  const user = await this.findById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const currentPermissions = user.permissions || {}
  
  // Create the permissions object with settings nested inside
  const updatedPermissions = {
    ...currentPermissions,
    settings: {
      ...((currentPermissions as any)?.settings || {}),
      ...settings,
    }
  }
  
  // Only pass permissions to update, not settings separately
  return this.update(userId, {
    permissions: updatedPermissions
    // DO NOT include settings field here
  })
}

  async findByClinicId(clinicId: string, options?: { role?: UserRole; isActive?: boolean }): Promise<User[]> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.orderAsc("full_name"),
    ]

    if (options?.role) {
      queries.push(Query.equal("role", options.role))
    }

    if (options?.isActive !== undefined) {
      queries.push(Query.equal("is_active", options.isActive))
    }

    return this.find(queries)
  }

  async findByEmailAndClinic(email: string, clinicId: string): Promise<User | null> {
    const users = await this.find([
      Query.equal("email", email),
      Query.equal("clinic_id", clinicId),
    ])
    return users[0] || null
  }

  async findByRole(clinicId: string, role: UserRole): Promise<User[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("role", role),
      Query.orderAsc("full_name"),
    ])
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.update(userId, {
      last_login: new Date().toISOString(),
      first_login_required: false,
      temporary_password_set: false,
    })
  }

  async updateInvitationStatus(userId: string, status: User["invitation_status"]): Promise<User> {
    const updateData: Partial<User> = {
      invitation_status: status,
    }

    if (status === "sent") {
      updateData.invitation_sent_at = new Date().toISOString()
    } else if (status === "accepted") {
      updateData.invited_at = new Date().toISOString()
    }

    return this.update(userId, updateData)
  }

  async createWithInvitation(data: Partial<User> & {
    email: string
    full_name: string
    role: UserRole
    clinic_id: string
  }): Promise<User> {
    const userData: Partial<User> = {
      ...data,
      is_active: false,
      first_login_required: true,
      temporary_password_set: true,
      invitation_status: "pending",
      invited_at: new Date().toISOString(),
      permissions: this.getDefaultPermissions(data.role),
    }

    return this.create(userData)
  }

  private getDefaultPermissions(role: UserRole): Record<string, any> {
    const basePermissions = {
      can_view_patients: true,
      can_view_appointments: true,
      settings: {
        email_notifications: true,
        push_notifications: true,
        two_factor_enabled: false,
        language: "en",
        timezone: "UTC",
      }
    }

    switch (role) {
      case "clinic_admin":
        return {
          ...basePermissions,
          can_manage_staff: true,
          can_manage_settings: true,
          can_view_reports: true,
          can_issue_certificates: true,
          can_conduct_tests: true,
        }
      case "doctor":
        return {
          ...basePermissions,
          can_issue_certificates: true,
          can_view_test_results: true,
          can_complete_appointments: true,
        }
      case "nurse":
        return {
          ...basePermissions,
          can_conduct_tests: true,
          can_record_test_results: true,
          can_update_appointment_status: true,
        }
      case "receptionist":
        return {
          ...basePermissions,
          can_schedule_appointments: true,
          can_check_in_patients: true,
          can_register_patients: true,
          can_print_certificates: true,
        }
      case "employer":
        return {
          can_view_employees: true,
          can_view_certificates: true,
          can_download_reports: true,
        }
      default:
        return basePermissions
    }
  }
}
