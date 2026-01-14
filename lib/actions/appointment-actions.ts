// lib/actions/appointment-actions.ts
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

/* -------------------------------------------------------------------------- */
/* CREATE                                                                      */
/* -------------------------------------------------------------------------- */

export async function createAppointment(
  data: Omit<Partial<Appointment>, "status"> & {
    status?: AppointmentStatus | null
  }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) throw new Error("Unauthorized - No clinic access")
    if (!data.patient_id) throw new Error("Patient ID is required")

    const appointmentRepo = getAppointmentRepository()

    const appointmentData: Partial<Appointment> = {
      ...data,
      clinic_id: user.clinic_id,
      created_by: user.id,
      status: isValidAppointmentStatus(data.status)
        ? data.status
        : "scheduled",
      appointment_date:
        data.appointment_date ??
        new Date().toISOString().split("T")[0],
      appointment_time:
        data.appointment_time ??
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      appointment_type: data.appointment_type ?? "general_checkup",
      branch_id: data.branch_id ?? user.branch_id ?? "",
    }

    const appointment = await appointmentRepo.create(appointmentData)

    await notificationService.createNotification(
      user.id,
      user.clinic_id,
      "appointment_confirmed",
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

    if (!appointment || appointment.clinic_id !== user.clinic_id) {
      return {
        success: false,
        appointment: null,
        error: "Appointment not found or access denied",
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
        updateData[key] = value
      }
    }

    const appointment = await appointmentRepo.update(id, updateData)

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
  return updateAppointment(id, {
    status: "checked_in",
    checked_in_at: now,
  })
}

export async function markAsNoShow(id: string) {
  return updateAppointment(id, { status: "no_show" })
}

export async function cancelAppointment(id: string, reason?: string) {
  return updateAppointment(id, {
    status: "cancelled",
    reception_notes: reason
      ? `[CANCELLED ${new Date().toLocaleString()}] ${reason}`
      : undefined,
  })
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
