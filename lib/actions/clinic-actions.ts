// lib/actions/clinic-actions.ts
"use server"

import { getClinicRepository } from "@/lib/repositories"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

export async function updateCertificateSettings(
  clinicId: string,
  settings: Partial<CertificateSettings>
) {
  try {
    const clinicRepo = getClinicRepository()
    
    // Get current clinic with ALL fields
    const clinic = await clinicRepo.findById(clinicId)
    if (!clinic) {
      return { success: false, error: "Clinic not found" }
    }

    // Update settings while preserving all existing clinic data
    const updatedSettings = {
      ...clinic.settings,
      certificate_settings: {
        ...(clinic.settings?.certificate_settings || {}),
        ...settings
      }
    }

    // Update clinic with ALL required fields
    await clinicRepo.update(clinicId, {
      // Preserve all original clinic data
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone || null,
      address: clinic.address || null,
      registration_number: clinic.registration_number || null,
      vat_number: clinic.vat_number || null,
      logo_url: clinic.logo_url || null,
      is_active: clinic.is_active,
      subscription_plan: clinic.subscription_plan,
      subscription_status: clinic.subscription_status,
      monthly_patient_limit: clinic.monthly_patient_limit,
      current_month_patients: clinic.current_month_patients,
      max_branches: clinic.max_branches, // ← THIS IS THE REQUIRED FIELD!
      current_branches: clinic.current_branches,
      data_retention_days: clinic.data_retention_days,
      // Add the updated settings
      settings: updatedSettings,
      // Preserve other fields
      trial_started_at: clinic.trial_started_at,
      trial_ends_at: clinic.trial_ends_at,
      selected_plan: clinic.selected_plan,
      subscription_start_date: clinic.subscription_start_date,
      subscription_end_date: clinic.subscription_end_date,
      next_billing_date: clinic.next_billing_date,
      paystack_customer_id: clinic.paystack_customer_id,
      paystack_subscription_id: clinic.paystack_subscription_id,
      payment_method_id: clinic.payment_method_id,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating certificate settings:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}
