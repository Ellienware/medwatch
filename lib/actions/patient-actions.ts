"use server"

import { getCurrentUser } from "@/lib/auth/actions"
import { getPatientRepository } from "@/lib/repositories"
import { activityLogger } from "@/lib/utils/activity-logger" // Add this import
import { revalidatePath } from "next/cache"
import type { Patient } from "@/lib/types/database"

export async function createPatient(data: Partial<Patient>) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    const patientRepo = getPatientRepository()
    
    // Check if patient with same ID number already exists in this clinic
    if (data.id_number) {
      const existingPatient = await patientRepo.findByIdNumber(
        data.id_number, 
        user.clinic_id
      )
      
      if (existingPatient) {
        throw new Error("A patient with this ID number already exists")
      }
    }
    
    // Add clinic_id to the patient data
    const patientData: Partial<Patient> = {
      ...data,
      clinic_id: user.clinic_id,
      is_active: data.is_active !== undefined ? data.is_active : true,
      consent_given: data.consent_given !== undefined ? data.consent_given : false,
    }

    const patient = await patientRepo.create(patientData)

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
      message: "Patient registered successfully"
    }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { 
      success: false, 
      patient: null, 
      error: (error as Error).message 
    }
  }
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  try {
    const patientRepo = getPatientRepository()
    const patient = await patientRepo.update(id, data)

    revalidatePath("/clinic/patients")
    revalidatePath(`/clinic/patients/${id}`)

    return { success: true, patient, error: null }
  } catch (error) {
    console.error("[v0] Error updating patient:", error)
    return { success: false, patient: null, error: (error as Error).message }
  }
}

export async function deletePatient(id: string) {
  try {
    const patientRepo = getPatientRepository()
    await patientRepo.delete(id)

    revalidatePath("/clinic/patients")

    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting patient:", error)
    return { success: false, error: (error as Error).message }
  }
}