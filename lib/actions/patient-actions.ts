"use server"

import { getCurrentUser } from "@/lib/auth/actions"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { revalidatePath } from "next/cache"
import type { Patient } from "@/lib/types/database"
import { activityLogger } from "@/lib/utils/activity-logger"

export async function createPatient(data: Partial<Patient>) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Check if user has permission to create patients
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You don't have permission to create patients")
    }

    // Add clinic_id to the patient data
    const patientData: Partial<Patient> = {
      ...data,
      clinic_id: user.clinic_id,
      is_active: data.is_active !== undefined ? data.is_active : true,
      consent_given: data.consent_given !== undefined ? data.consent_given : false,
      created_by: user.id,
    }

    // Use secure service (auto-encrypts sensitive fields)
    const patient = await securePatientService.create(patientData)

    // Log the activity
    if (patient && patient.first_name && patient.last_name) {
      const patientName = `${patient.first_name} ${patient.last_name}`
      await activityLogger.patientRegistered(patient.id, patientName)
    }

    revalidatePath("/clinic/patients")

    return { 
      success: true, 
      patient, 
      error: null,
      message: "Patient registered securely"
    }
  } catch (error: any) {
    console.error("Error creating patient:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to create patients"
    } else if (errorMessage.includes("encryption")) {
      errorMessage = "Security error: Could not encrypt patient data"
    }
    
    return { 
      success: false, 
      patient: null, 
      error: errorMessage 
    }
  }
}

export async function deactivatePatient(patientId: string, reason?: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Only clinic admins and doctors can deactivate patients
    if (!['clinic_admin', 'doctor'].includes(user.role)) {
      throw new Error("Only clinic admins and doctors can deactivate patients")
    }

    // Get current patient data
    const patient = await securePatientService.read(patientId)
    
    // Deactivate patient using secure service
    const updates = {
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: user.id,
      deactivation_reason: reason
    }
    
    const updatedPatient = await securePatientService.update(patientId, updates)

    // Log the action with MedicalAudit
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: patientId,
      action: "STATUS_CHANGE",
      changes: {
        is_active: { from: true, to: false },
        deactivation_reason: reason
      },
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_name: `${patient.first_name} ${patient.last_name}`,
        deactivated_by_email: user.email
      }
    })

    revalidatePath("/clinic/patients")
    revalidatePath(`/clinic/patients/${patientId}`)

    return { 
      success: true, 
      patient: updatedPatient, 
      cancelledAppointments: 0, // You'll need to implement appointment cancellation separately
      error: null 
    }
  } catch (error: any) {
    console.error("Error deactivating patient:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to deactivate this patient"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Patient not found"
    }
    
    return { 
      success: false, 
      patient: null, 
      error: errorMessage 
    }
  }
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Check if user has permission to update patients
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You don't have permission to update patients")
    }

    // Use secure service for update
    const patient = await securePatientService.update(id, data)

    revalidatePath("/clinic/patients")
    revalidatePath(`/clinic/patients/${id}`)

    return { success: true, patient, error: null }
  } catch (error: any) {
    console.error("Error updating patient:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to update this patient"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Patient not found"
    }
    
    return { success: false, patient: null, error: errorMessage }
  }
}

export async function deletePatient(id: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Only clinic admins can delete patients
    if (user.role !== 'clinic_admin') {
      throw new Error("Only clinic admins can delete patients")
    }

    // Use secure service for delete
    await securePatientService.delete(id)

    revalidatePath("/clinic/patients")

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting patient:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to delete patients"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Patient not found"
    }
    
    return { success: false, error: errorMessage }
  }
}

export async function getPatient(patientId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Use secure service to get patient
    const patient = await securePatientService.read(patientId)

    return { success: true, patient, error: null }
  } catch (error: any) {
    console.error("Error fetching patient:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to view this patient"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Patient not found"
    }
    
    return { success: false, patient: null, error: errorMessage }
  }
}

export async function listPatients(filters?: any) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Check if user has permission to list patients
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You don't have permission to view patients")
    }

    // Use secure service to list patients
    const result = await securePatientService.list(filters || {})

    return { 
      success: true, 
      patients: result.documents || [],
      total: result.total || 0,
      error: null 
    }
  } catch (error: any) {
    console.error("Error listing patients:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to view patients"
    }
    
    return { 
      success: false, 
      patients: [], 
      total: 0,
      error: errorMessage 
    }
  }
}