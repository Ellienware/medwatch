// lib/repositories/clinic-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Clinic } from "@/lib/types/database"

export class ClinicRepository extends BaseRepository<Clinic> {
  protected collectionId = COLLECTIONS.CLINICS

  constructor() {
    super("clinic")
  }

  protected mapToEntity(doc: any): Clinic {
    // Parse settings from JSON string if it exists
    let settings: Record<string, any> = {}
    
    if (doc.settings) {
      try {
        if (typeof doc.settings === 'string') {
          settings = JSON.parse(doc.settings)
        } else if (typeof doc.settings === 'object') {
          settings = doc.settings
        }
      } catch (error) {
        console.error('Error parsing settings:', error)
        settings = {}
      }
    }

    // Helper function to safely parse dates
    const parseDate = (dateString: string | null): string | null => {
      if (!dateString) return null
      try {
        const date = new Date(dateString)
        return isNaN(date.getTime()) ? null : date.toISOString()
      } catch {
        return null
      }
    }

    return {
      id: doc.$id,
      name: doc.name,
      registration_number: doc.registration_number || null,
      email: doc.email,
      phone: doc.phone || null,
      address: doc.address || null,
      logo_url: doc.logo_url || null,
      settings: settings,
      is_active: doc.is_active !== undefined ? doc.is_active : true,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
      data_retention_days: doc.data_retention_days || 730,
      
      // Billing fields
      subscription_plan: doc.subscription_plan || "trial",
      subscription_status: doc.subscription_status || "trial",
      trial_started_at: parseDate(doc.trial_started_at),
      trial_ends_at: parseDate(doc.trial_ends_at),
      selected_plan: doc.selected_plan || null,
      subscription_start_date: parseDate(doc.subscription_start_date),
      subscription_end_date: parseDate(doc.subscription_end_date),
      next_billing_date: parseDate(doc.next_billing_date),
      monthly_patient_limit: doc.monthly_patient_limit || 100,
      current_month_patients: doc.current_month_patients || 0,
      paystack_customer_id: doc.paystack_customer_id || null,
      paystack_subscription_id: doc.paystack_subscription_id || null,
      payment_method_id: doc.payment_method_id || null,
      max_branches: doc.max_branches || 1,
      current_branches: doc.current_branches || 0,
    }
  }

  async create(data: Partial<Clinic>): Promise<Clinic> {
    // Convert settings object to JSON string if needed
    const processedData: any = { ...data }
    
    if (processedData.settings && typeof processedData.settings === 'object') {
      processedData.settings = JSON.stringify(processedData.settings)
    }
    
    // Set defaults for required fields
    const defaults = {
      subscription_plan: "trial",
      subscription_status: "trial",
      monthly_patient_limit: 100,
      current_month_patients: 0,
      max_branches: 1,
      current_branches: 0,
      data_retention_days: 730,
      is_active: true,
    }
    
    // Apply defaults for missing fields
    for (const [key, value] of Object.entries(defaults)) {
      if (processedData[key] === undefined || processedData[key] === null) {
        processedData[key] = value
      }
    }
    
    return super.create(processedData)
  }

  async update(id: string, data: Partial<Clinic>): Promise<Clinic> {
    // Convert settings object to JSON string
    const processedData: any = { ...data }
    
    if (processedData.settings && typeof processedData.settings === 'object') {
      processedData.settings = JSON.stringify(processedData.settings)
    }
    
    return super.update(id, processedData)
  }

  async findActive(): Promise<Clinic[]> {
    return this.find([Query.equal("is_active", true)])
  }

  async findBySubscriptionStatus(status: string): Promise<Clinic[]> {
    return this.find([Query.equal("subscription_status", status)])
  }

  async incrementPatientCount(clinicId: string): Promise<Clinic> {
    const clinic = await this.findById(clinicId)
    if (!clinic) {
      throw new Error(`Clinic not found: ${clinicId}`)
    }
    
    return this.update(clinicId, {
      current_month_patients: (clinic.current_month_patients || 0) + 1,
    })
  }

  async getUsageSummary(clinicId: string): Promise<{
    patients: number
    branches: number
    limit: number
    percentage: number
  }> {
    const clinic = await this.findById(clinicId)
    if (!clinic) {
      throw new Error(`Clinic not found: ${clinicId}`)
    }
    
    const patients = clinic.current_month_patients || 0
    const branches = clinic.current_branches || 0
    const limit = clinic.monthly_patient_limit || 100
    
    return {
      patients,
      branches,
      limit,
      percentage: Math.round((patients / limit) * 100),
    }
  }
}