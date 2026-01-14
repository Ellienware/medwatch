/// lib/repositories/staff-repository.ts - UPDATED
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { User as DatabaseUser, UserRole } from "@/lib/types/database"

export type User = DatabaseUser

export class StaffRepository extends BaseRepository<User> {
  protected collectionId = COLLECTIONS.USERS

  constructor() {
    super("user")
  }

  protected mapToEntity(doc: any): User {
    // Parse permissions from JSON string if it exists
    let permissions: Record<string, any> = {}
    
    if (doc.permissions) {
      try {
        permissions = typeof doc.permissions === 'string' 
          ? JSON.parse(doc.permissions)
          : doc.permissions
      } catch (error) {
        console.error('Error parsing permissions:', error)
        permissions = {}
      }
    }

    // Parse invitation status
    let invitationStatus: DatabaseUser["invitation_status"] = null
    if (doc.invitation_status) {
      const validStatuses: DatabaseUser["invitation_status"][] = ["pending", "sent", "accepted", "expired"]
      if (validStatuses.includes(doc.invitation_status as any)) {
        invitationStatus = doc.invitation_status as DatabaseUser["invitation_status"]
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
      updated_at: doc.$updatedAt,
    }
  }

  // Override the create method to handle permissions and set defaults
  async create(data: Partial<User>): Promise<User> {
    // Convert permissions to JSON string if it's an object
    const processedData: any = { ...data }
    
    if (processedData.permissions && 
        typeof processedData.permissions === 'object') {
      processedData.permissions = JSON.stringify(processedData.permissions)
    }

    // Set defaults for new users
    const defaults = {
      is_active: true,
      first_login_required: false,
      temporary_password_set: false,
      invitation_status: null,
    }

    // Apply defaults for missing fields
    for (const [key, value] of Object.entries(defaults)) {
      if (processedData[key] === undefined || processedData[key] === null) {
        processedData[key] = value
      }
    }

    return super.create(processedData)
  }

  // Override the update method as well
  async update(id: string, data: Partial<User>): Promise<User> {
    const processedData: any = { ...data }
    
    if (processedData.permissions && 
        typeof processedData.permissions === 'object') {
      processedData.permissions = JSON.stringify(processedData.permissions)
    }

    return super.update(id, processedData)
  }

  async findByClinicId(clinicId: string): Promise<User[]> {
    const users = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.notEqual("role", "employer"), // Exclude employer portal users
      Query.orderAsc("full_name"),
    ])
    return users
  }

  async findByEmailAndClinic(email: string, clinicId: string): Promise<User | null> {
    const users = await this.find([
      Query.equal("email", email),
      Query.equal("clinic_id", clinicId),
      Query.notEqual("role", "employer"), // Exclude employer portal users
    ])
    return users[0] || null
  }

  async findByAuthId(authUserId: string): Promise<User | null> {
    const users = await this.find([
      Query.equal("auth_user_id", authUserId),
    ])
    return users[0] || null
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.update(userId, {
      last_login: new Date().toISOString(),
    })
  }

  async findByRole(clinicId: string, role: UserRole): Promise<User[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("role", role),
      Query.equal("is_active", true),
      Query.orderAsc("full_name"),
    ])
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
    }

    return this.create(userData)
  }
}