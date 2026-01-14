import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { User as DatabaseUser, UserRole } from "@/lib/types/database"

export type User = DatabaseUser // Use the database type directly

export class UserRepository extends BaseRepository<User> {
  protected collectionId = COLLECTIONS.USERS

  constructor() {
    super("user")
  }

  protected mapToEntity(doc: any): User {
    // Parse permissions from JSON string if it exists
    let permissions: Record<string, any> = {}
    
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
      updated_at: doc.$updatedAt,
    }
  }
  

  async findByEmail(email: string): Promise<User[]> {
    const users = await this.find([
      Query.equal("email", email),
    ])
    return users
  }

  // Alternative: findByEmail returns single user
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

