// lib/repositories/employer-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Employer } from "@/lib/types/database"

export class EmployerRepository extends BaseRepository<Employer> {
  protected collectionId = COLLECTIONS.EMPLOYERS

  constructor() {
    super("employer")
  }

  protected mapToEntity(doc: any): Employer {
    // Parse notification preferences
    let notificationPreferences: Record<string, any> | string = {}
    
    if (doc.notification_preferences) {
      try {
        if (typeof doc.notification_preferences === 'string') {
          notificationPreferences = JSON.parse(doc.notification_preferences)
        } else if (typeof doc.notification_preferences === 'object') {
          notificationPreferences = doc.notification_preferences
        }
      } catch (error) {
        console.error('Error parsing notification preferences:', error)
        notificationPreferences = {}
      }
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      company_name: doc.company_name,
      registration_number: doc.registration_number || null,
      industry: doc.industry || null,
      email: doc.email,
      phone: doc.phone || null,
      address: doc.address || null,
      billing_email: doc.billing_email || null,
      payment_terms: doc.payment_terms || 30,
      portal_user_id: doc.portal_user_id || doc.auth_user_id || null, // Support both fields
      auth_user_id: doc.auth_user_id || doc.portal_user_id || null,   // Support both fields
      linked_user_id: doc.linked_user_id || null, // Add this
      portal_enabled: doc.portal_enabled || false,
      auto_receive_certificates: doc.auto_receive_certificates || false,
      notification_preferences: notificationPreferences,
      is_active: doc.is_active !== undefined ? doc.is_active : true,
      first_login_required: doc.first_login_required || false,
      temporary_password_set: doc.temporary_password_set || false,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  async create(data: Partial<Employer>): Promise<Employer> {
    // Convert notification_preferences to JSON string if it's an object
    const processedData: any = { ...data }
    
    if (processedData.notification_preferences && 
        typeof processedData.notification_preferences === 'object') {
      processedData.notification_preferences = JSON.stringify(processedData.notification_preferences)
    }
    
    // Set defaults for optional fields
    const defaults = {
      portal_enabled: false,
      auto_receive_certificates: false,
      is_active: true,
      payment_terms: 30,
      portal_user_id: processedData.auth_user_id || null,
    }
    
    // Apply defaults for missing fields
    for (const [key, value] of Object.entries(defaults)) {
      if (processedData[key] === undefined || processedData[key] === null) {
        processedData[key] = value
      }
    }

    return super.create(processedData)
  }

  async update(id: string, data: Partial<Employer>): Promise<Employer> {
    const processedData: any = { ...data }
    
    if (processedData.notification_preferences && 
        typeof processedData.notification_preferences === 'object') {
      processedData.notification_preferences = JSON.stringify(processedData.notification_preferences)
    }

    return super.update(id, processedData)
  }

  async findByClinicId(clinicId: string, options?: { isActive?: boolean }): Promise<Employer[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.isActive !== undefined) {
      queries.push(Query.equal("is_active", options.isActive))
    }

    queries.push(Query.orderAsc("company_name"))

    return this.find(queries)
  }

  async findByEmailAndClinic(email: string, clinicId: string): Promise<Employer | null> {
    const employers = await this.find([
      Query.equal("email", email),
      Query.equal("clinic_id", clinicId),
    ])
    return employers[0] || null
  }

  async findByPortalUserId(portalUserId: string): Promise<Employer | null> {
    const employers = await this.find([
      Query.or([
        Query.equal("portal_user_id", portalUserId),
        Query.equal("auth_user_id", portalUserId),
      ]),
      Query.limit(1),
    ])
    return employers[0] || null
  }

  async markAsInvited(employerId: string, authUserId?: string): Promise<Employer> {
    const updateData: Partial<Employer> = {
      portal_enabled: true,
      first_login_required: true,
      temporary_password_set: true,
    }
    
    if (authUserId) {
      updateData.auth_user_id = authUserId
      updateData.portal_user_id = authUserId
    }
    
    return this.update(employerId, updateData)
  }

  async updatePortalStatus(employerId: string, enabled: boolean): Promise<Employer> {
    return this.update(employerId, {
      portal_enabled: enabled,
    })
  }

  async search(clinicId: string, searchTerm: string): Promise<Employer[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    queries.push(
      Query.or([
        Query.search("company_name", searchTerm),
        Query.search("registration_number", searchTerm),
        Query.search("email", searchTerm),
      ]),
    )

    return this.find(queries)
  }

  async findWithPortalEnabled(clinicId: string): Promise<Employer[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("portal_enabled", true),
      Query.orderAsc("company_name"),
    ])
  }

  async countByClinicId(clinicId: string): Promise<number> {
    return this.count([
      Query.equal("clinic_id", clinicId),
      Query.equal("is_active", true),
    ])
  }
}