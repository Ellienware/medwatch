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
    
    // Get current clinic
    const clinic = await clinicRepo.findById(clinicId)
    if (!clinic) {
      return { success: false, error: "Clinic not found" }
    }

    // Update settings
    const updatedSettings = {
      ...clinic.settings,
      certificate_settings: {
        ...(clinic.settings?.certificate_settings || {}),
        ...settings
      }
    }

    // Update clinic
    await clinicRepo.update(clinicId, {
      settings: updatedSettings
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