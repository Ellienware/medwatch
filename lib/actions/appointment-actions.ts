// lib/actions/appointment-actions.ts - CORRECTED VERSION
"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"

import { getCurrentUser } from "@/lib/auth/actions"
import {
  getAppointmentRepository,
  getBranchRepository,
  getClinicRepository,
  getPatientRepository,
  getUserRepository,
} from "@/lib/repositories"

import type { Appointment, AppointmentStatus } from "@/lib/types/database"
import { isValidAppointmentStatus } from "@/lib/utils/type-guards"
import { notificationService } from "@/lib/notifications/notification-service"
import { emailService } from "@/lib/email/email-service"
import { MedicalAudit } from "@/lib/audit/medical-audit" // ✅ ADD THIS IMPORT
import { Query } from "node-appwrite"

/* -------------------------------------------------------------------------- */
/* CREATE                                                                      */
/* -------------------------------------------------------------------------- */

export async function createAppointment(data: Partial<Appointment>) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) throw new Error("Unauthorized - No clinic access")
    if (!data.patient_id) throw new Error("Patient ID is required")
    
    // Validate clinic subscription
    const clinicRepo = getClinicRepository()
    const clinic = await clinicRepo.findById(user.clinic_id)
    
    if (!clinic) {
      throw new Error("Clinic not found")
    }

    const allowedStatuses = ['active', 'trial']
    if (!allowedStatuses.includes(clinic.subscription_status)) {
      throw new Error("Clinic subscription is not active")
    }
    
    // Validate branch if provided
    if (data.branch_id) {
      const branchRepo = getBranchRepository()
      const branch = await branchRepo.findById(data.branch_id)
      
      if (!branch || branch.clinic_id !== user.clinic_id) {
        throw new Error("Invalid branch selected")
      }
      
      if (!branch.is_active) {
        throw new Error("Selected branch is not active")
      }
    }
    
    // Verify patient belongs to clinic
    const patientRepo = getPatientRepository()
    const patient = await patientRepo.findById(data.patient_id)
    
    if (!patient || patient.clinic_id !== user.clinic_id) {
      throw new Error("Patient not found or access denied")
    }
    
    const appointmentRepo = getAppointmentRepository()
    
    const appointmentData: Partial<Appointment> = {
      ...data,
      clinic_id: user.clinic_id,
      created_by: user.id,
      status: isValidAppointmentStatus(data.status)
        ? data.status
        : "scheduled",
      appointment_date: data.appointment_date || new Date().toISOString().split("T")[0],
      appointment_time: data.appointment_time || new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      appointment_type: data.appointment_type || "general_checkup",
      branch_id: data.branch_id || user.branch_id || "",
    }
    
    const appointment = await appointmentRepo.create(appointmentData)
    
    // ✅ FIXED: Use MedicalAudit.logAction
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "appointment",
      entityId: appointment.id,
      action: "CREATE",
      changes: appointmentData,
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_id: data.patient_id,
        branch_id: data.branch_id,
        appointment_type: appointmentData.appointment_type
      }
    })
    
    await notificationService.createNotification(
      user.id,
      user.clinic_id,
      "appointment_scheduled",
      "Appointment Created",
      "You have created a new appointment",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointment.id}`,
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patient_id,
        },
      }
    )
    
    revalidatePath("/clinic/appointments")
    
    return { success: true, appointment, error: null }
  } catch (error) {
    console.error("Error creating appointment:", error)
    return { success: false, appointment: null, error: (error as Error).message }
  }
}

/* -------------------------------------------------------------------------- */
/* READ                                                                        */
/* -------------------------------------------------------------------------- */

export async function getAppointmentWithPatientInfo(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id)
      return { success: false, appointment: null, error: "Unauthorized" }

    const appointmentRepo = getAppointmentRepository()
    const appointment = await appointmentRepo.findById(id)

    // ✅ FIXED: Proper authorization logic
    if (!appointment || appointment.clinic_id !== user.clinic_id) {
      return {
        success: false,
        appointment: null,
        error: "Appointment not found or access denied",
      }
    }
    
    // ✅ FIXED: Branch-based access control
    if (user.branch_id && appointment.branch_id !== user.branch_id) {
      // Only clinic admins can view appointments from other branches
      if (user.role !== 'clinic_admin') {
        return {
          success: false,
          appointment: null,
          error: "You don't have permission to view appointments from other branches",
        }
      }
    }

    const patientRepo = getPatientRepository()
    const patient = appointment.patient_id
      ? await patientRepo.findById(appointment.patient_id).catch(() => null)
      : null

    const branch = appointment.branch_id
      ? await getBranchRepository()
          .findById(appointment.branch_id)
          .catch(() => null)
      : null

    const userRepo = getUserRepository()

    const nurse = appointment.nurse_assigned_id
      ? await userRepo.findById(appointment.nurse_assigned_id).catch(() => null)
      : null

    const doctor = appointment.doctor_assigned_id
      ? await userRepo.findById(appointment.doctor_assigned_id).catch(() => null)
      : null

    // ✅ AUDIT: Log the read action
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "appointment",
      entityId: id,
      action: "READ",
      changes: undefined,
      ipAddress: null,
      userAgent: null,
      metadata: {
        viewed_by_role: user.role,
        has_patient_data: !!patient
      }
    })

    return {
      success: true,
      appointment: { ...appointment, patient, branch, nurse, doctor },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching appointment:", error)
    return { success: false, appointment: null, error: (error as Error).message }
  }
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                      */
/* -------------------------------------------------------------------------- */

export async function updateAppointment(
  id: string,
  data: Partial<Appointment>
) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) throw new Error("Unauthorized")

    const appointmentRepo = getAppointmentRepository()
    const existing = await appointmentRepo.findById(id)

    if (!existing || existing.clinic_id !== user.clinic_id)
      throw new Error("Appointment not found or access denied")
    
    // ✅ ADD: Branch authorization for updates
    if (user.branch_id && existing.branch_id !== user.branch_id) {
      if (user.role !== 'clinic_admin') {
        throw new Error("You don't have permission to update appointments from other branches")
      }
    }

    const allowedFields: (keyof Appointment)[] = [
      "appointment_date",
      "appointment_time",
      "appointment_type",
      "reason",
      "status",
      "reception_notes",
      "nurse_notes",
      "doctor_notes",
      "branch_id",
      "nurse_assigned_id",
      "doctor_assigned_id",
      "checked_in_at",
      "checked_in_by",
      "nurse_started_at",
      "nurse_completed_at",
      "doctor_started_at",
      "doctor_completed_at",
      "completed_at",
      "employer_id",
    ]

    const updateData: Partial<Appointment> = {}

    for (const key of allowedFields) {
      if (!(key in data)) continue

      if (key === "status") {
        if (isValidAppointmentStatus(data.status)) {
          updateData.status = data.status
        }
        continue
      }

      const value = data[key]
      if (value !== undefined && value !== null) {
        // ✅ FIX: Cast to appropriate type to avoid type issues
        updateData[key] = value as any
      }
    }

    const appointment = await appointmentRepo.update(id, updateData)

    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "appointment",
      entityId: id,
      action: "UPDATE",
      changes: JSON.stringify(updateData),
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_id: existing.patient_id,
        previous_status: existing.status,
        new_status: updateData.status,
        updated_by_role: user.role
      }
    })

    await notificationService.createNotification(
      user.id,
      user.clinic_id,
      "appointment_updated",
      "Appointment Updated",
      `Appointment ${id} updated`,
      {
        priority: "medium",
        link: `/clinic/appointments/${id}`,
        data: {
          appointmentId: id,
          patientId: existing.patient_id,
          updatedFields: Object.keys(updateData),
        },
      }
    )

    revalidatePath("/clinic/appointments")
    revalidatePath(`/clinic/appointments/${id}`)

    return { success: true, appointment, error: null }
  } catch (error) {
    console.error("Error updating appointment:", error)
    return { success: false, appointment: null, error: (error as Error).message }
  }
}

/* -------------------------------------------------------------------------- */
/* STATUS HELPERS                                                              */
/* -------------------------------------------------------------------------- */

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
) {
  if (!isValidAppointmentStatus(status))
    return { success: false, appointment: null, error: "Invalid status" }

  return updateAppointment(id, { status })
}

export async function checkInAppointment(id: string) {
  const now = new Date().toISOString()
  const result = await updateAppointment(id, {
    status: "checked_in",
    checked_in_at: now,
    checked_in_by: "user.id" // You should get this from context
  })
  
  if (result.success) {
    const user = await getCurrentUser()
    if (user) {
      await MedicalAudit.logAction({
        userId: user.id,
        userRole: user.role,
        clinicId: user.clinic_id!,
        entityType: "appointment",
        entityId: id,
        action: "STATUS_CHANGE",
        changes: { status: { from: "scheduled", to: "checked_in" } },
        ipAddress: null,
        userAgent: null,
        metadata: {
          checked_in_at: now,
          checked_in_by: user.id
        }
      })
    }
  }
  
  return result
}

export async function markAsNoShow(id: string) {
  const result = await updateAppointment(id, { status: "no_show" })
  
  if (result.success) {
    const user = await getCurrentUser()
    if (user) {
      await MedicalAudit.logAction({
        userId: user.id,
        userRole: user.role,
        clinicId: user.clinic_id!,
        entityType: "appointment",
        entityId: id,
        action: "STATUS_CHANGE",
        changes: { status: { from: "scheduled", to: "no_show" } },
        ipAddress: null,
        userAgent: null
      })
    }
  }
  
  return result
}

export async function cancelAppointment(id: string, reason?: string) {
  const result = await updateAppointment(id, {
    status: "cancelled",
    reception_notes: reason
      ? `[CANCELLED ${new Date().toLocaleString()}] ${reason}`
      : undefined,
  })
  
  if (result.success) {
    const user = await getCurrentUser()
    if (user) {
      await MedicalAudit.logAction({
        userId: user.id,
        userRole: user.role,
        clinicId: user.clinic_id!,
        entityType: "appointment",
        entityId: id,
        action: "STATUS_CHANGE",
        changes: { 
          status: { from: "scheduled", to: "cancelled" },
          cancellation_reason: reason 
        },
        ipAddress: null,
        userAgent: null
      })
    }
  }
  
  return result
}

/* -------------------------------------------------------------------------- */
/* CREATE + EMAIL                                                              */
/* -------------------------------------------------------------------------- */

export async function createAppointmentAndNotify(
  data: Partial<Appointment>
) {
  try {
    const result = await createAppointment(data)
    if (!result.success || !result.appointment) return result

    const user = await getCurrentUser()
    if (!user?.clinic_id) return result

    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()

    const patient = data.patient_id
      ? await patientRepo.findById(data.patient_id).catch(() => null)
      : null

    const clinic = await clinicRepo.findById(user.clinic_id)

    if (patient?.email && clinic) {
      await emailService.sendAppointmentConfirmation(patient.email, {
        patientName: `${patient.first_name} ${patient.last_name}`,
        appointmentDate: result.appointment.appointment_date,
        appointmentTime: result.appointment.appointment_time,
        appointmentType:
          result.appointment.appointment_type ?? "general_checkup",
        clinicName: clinic.name,
        clinicAddress: clinic.address ?? undefined,
        clinicPhone: clinic.phone ?? undefined,
        doctorName: user.full_name,
        appointmentId: result.appointment.id,
      })
    }

    return result
  } catch (error) {
    console.error("Error creating appointment and notifying:", error)
    return {
      success: false,
      appointment: null,
      error: (error as Error).message,
    }
  }
}

export async function getAppointmentsForTestRecording(options?: {
  date?: string
  status?: AppointmentStatus
  limit?: number
}) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return { 
        success: false, 
        appointments: [], 
        error: "Unauthorized - No clinic access" 
      }
    }

    const appointmentRepo = getAppointmentRepository()
    
    // Use today's date by default
    const today = options?.date || new Date().toISOString().split('T')[0]
    
    // Fetch appointments with patient info using batch method
    const appointments = await appointmentRepo.findAppointmentsWithPatientInfoBatch(
      user.clinic_id,
      {
        date: today,
        status: options?.status || "checked_in",
        limit: options?.limit || 50
      }
    )

    // Format for dropdown display
    const formattedAppointments = appointments.map((apt) => {
      const patientName = apt.patient 
        ? `${apt.patient.first_name} ${apt.patient.last_name}`
        : `Patient ${apt.patient_id.substring(0, 8)}...`
      
      // Format time nicely (remove seconds if present)
      const time = apt.appointment_time 
        ? apt.appointment_time.split(':').slice(0, 2).join(':')
        : "Time not set"
      
      // Check if appointment is today
      const isToday = apt.appointment_date === today
      const dateLabel = isToday ? "Today" : new Date(apt.appointment_date).toLocaleDateString()
      
      // Include additional info
      const additionalInfo = []
      if (apt.employer_id) additionalInfo.push("Employer")
      if (apt.appointment_type) additionalInfo.push(apt.appointment_type)
      
      const infoSuffix = additionalInfo.length > 0 
        ? ` - ${additionalInfo.join(', ')}`
        : ''
      
      return {
        id: apt.id,
        display: `${patientName} - ${time}${infoSuffix} (${dateLabel})`,
        appointment_time: time,
        appointment_date: apt.appointment_date,
        patient_id: apt.patient_id,
        patient_name: patientName,
        status: apt.status,
        appointment_type: apt.appointment_type,
        employer_id: apt.employer_id
      }
    })

    return { 
      success: true, 
      appointments: formattedAppointments, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return { 
      success: false, 
      appointments: [], 
      error: error instanceof Error ? error.message : "Failed to fetch appointments" 
    }
  }
}

export async function getCompletedAppointments() {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, appointments: [], error: "User not associated with a clinic" }
    }

    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()

    // Use the correct query format for your repository
    const appointments = await appointmentRepo.find([
      Query.equal("clinic_id", user.clinic_id),
      Query.equal("status", "completed"),
      Query.orderDesc("appointment_date")
    ])
    
    // Enrich with patient details
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const patient = await patientRepo.findById(appointment.patient_id)
          return {
            id: appointment.id,
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            patient_name: patient 
              ? `${patient.first_name} ${patient.last_name}`
              : "Unknown Patient",
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            completed_at: appointment.completed_at || appointment.updated_at || appointment.created_at,
            display: `${patient?.first_name || "Patient"} ${patient?.last_name || ""} - ${appointment.appointment_date} ${appointment.appointment_time}`
          }
        } catch (error) {
          console.error("Error fetching patient:", error)
          return {
            id: appointment.id,
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            patient_name: "Unknown Patient",
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            completed_at: appointment.completed_at || appointment.updated_at || appointment.created_at,
            display: `Patient - ${appointment.appointment_date} ${appointment.appointment_time}`
          }
        }
      })
    )

    return { 
      success: true, 
      appointments: enrichedAppointments, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching completed appointments:", error)
    return { 
      success: false, 
      appointments: [], 
      error: (error as Error).message 
    }
  }
}
