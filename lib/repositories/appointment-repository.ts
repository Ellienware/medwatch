// lib/repositories/appointment-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"

import type { Appointment, AppointmentStatus, Patient } from "@/lib/types/database"
import { getPatientRepository } from "./index"
import { isValidAppointmentStatus } from "@/lib/utils/type-guards"

export class AppointmentRepository extends BaseRepository<Appointment> {
  protected collectionId = COLLECTIONS.APPOINTMENTS

  constructor() {
    super("appointment")
  }

  /* -------------------------------------------------------------------------- */
  /* MAPPING                                                                     */
  /* -------------------------------------------------------------------------- */

  protected mapToEntity(doc: any): Appointment {
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      branch_id: doc.branch_id,
      patient_id: doc.patient_id,

      employer_id: doc.employer_id ?? null,

      appointment_date: doc.appointment_date,
      appointment_time: doc.appointment_time,
      appointment_type: doc.appointment_type,
      reason: doc.reason ?? null,

      status: doc.status as AppointmentStatus,

      checked_in_at: doc.checked_in_at ?? null,
      checked_in_by: doc.checked_in_by ?? null,

      nurse_assigned_id: doc.nurse_assigned_id ?? null,
      nurse_started_at: doc.nurse_started_at ?? null,
      nurse_completed_at: doc.nurse_completed_at ?? null,

      doctor_assigned_id: doc.doctor_assigned_id ?? null,
      doctor_started_at: doc.doctor_started_at ?? null,
      doctor_completed_at: doc.doctor_completed_at ?? null,

      completed_at: doc.completed_at ?? null,

      reception_notes: doc.reception_notes ?? null,
      nurse_notes: doc.nurse_notes ?? null,
      doctor_notes: doc.doctor_notes ?? null,

      created_by: doc.created_by,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  /* -------------------------------------------------------------------------- */
  /* FIND                                                                        */
  /* -------------------------------------------------------------------------- */

  async findByClinicId(
    clinicId: string,
    options?: {
      status?: AppointmentStatus
      date?: string
      branchId?: string
    }
  ): Promise<Appointment[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.status) {
      queries.push(Query.equal("status", options.status))
    }

    if (options?.date) {
      queries.push(Query.equal("appointment_date", options.date))
    }

    if (options?.branchId) {
      queries.push(Query.equal("branch_id", options.branchId))
    }

    queries.push(Query.orderDesc("appointment_date"))

    return this.find(queries)
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return this.find([
      Query.equal("patient_id", patientId),
      Query.orderDesc("appointment_date"),
    ])
  }

  async findTodayAppointments(
    clinicId: string,
    date: string
  ): Promise<Appointment[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("appointment_date", date),
    ])
  }

  async findByDoctorId(
    doctorId: string,
    date?: string
  ): Promise<Appointment[]> {
    const queries = [Query.equal("doctor_assigned_id", doctorId)]

    if (date) {
      queries.push(Query.equal("appointment_date", date))
    }

    queries.push(Query.orderAsc("appointment_time"))

    return this.find(queries)
  }

  async findByNurseId(
    nurseId: string,
    date?: string
  ): Promise<Appointment[]> {
    const queries = [Query.equal("nurse_assigned_id", nurseId)]

    if (date) {
      queries.push(Query.equal("appointment_date", date))
    }

    queries.push(Query.orderAsc("appointment_time"))

    return this.find(queries)
  }

  /* -------------------------------------------------------------------------- */
  /* SAFE UPDATE                                                                 */
  /* -------------------------------------------------------------------------- */

  async updateAppointmentDetails(
  id: string,
  data: Partial<Appointment>
): Promise<Appointment> {
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

  const updateData: Record<string, any> = {} // ✅ Use Record<string, any> instead of Partial<Appointment>

  for (const key of allowedFields) {
    if (!(key in data)) continue

    if (key === "status") {
      if (isValidAppointmentStatus(data.status)) {
        updateData[key] = data.status
      }
      continue
    }

    const value = data[key]
    if (value !== undefined && value !== null) {
      updateData[key] = value
    }
  }

  // ✅ FIX: Cast updateData to Partial<Appointment> when passing to update method
  return this.update(id, updateData as Partial<Appointment>)
}

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    userId?: string
  ): Promise<Appointment> {
    if (!isValidAppointmentStatus(status)) {
      throw new Error("Invalid appointment status")
    }

    const now = new Date().toISOString()
    const updateData: Partial<Appointment> = { status }

    switch (status) {
      case "checked_in":
        updateData.checked_in_at = now
        if (userId) updateData.checked_in_by = userId
        break
      case "with_nurse":
        updateData.nurse_started_at = now
        break
      case "with_doctor":
        updateData.doctor_started_at = now
        break
      case "completed":
        updateData.completed_at = now
        break
    }

    return this.update(id, updateData)
  }

  async cancelAppointment(
    id: string,
    reason?: string
  ): Promise<Appointment> {
    return this.update(id, {
      status: "cancelled",
      ...(reason
        ? {
            reception_notes: `[CANCELLED ${new Date().toLocaleString()}]: ${reason}`,
          }
        : {}),
    })
  }

  async assignStaff(
    id: string,
    staffType: "nurse" | "doctor",
    staffId: string
  ): Promise<Appointment> {
    return this.update(id, {
      ...(staffType === "nurse"
        ? { nurse_assigned_id: staffId }
        : { doctor_assigned_id: staffId }),
    })
  }

  /* -------------------------------------------------------------------------- */
  /* AGGREGATES                                                                  */
  /* -------------------------------------------------------------------------- */

  async countByStatus(
    clinicId: string,
    status: AppointmentStatus
  ): Promise<number> {
    if (!isValidAppointmentStatus(status)) return 0

    return this.count([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", status),
    ])
  }

  async countByDateRange(
    clinicId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    return this.count([
      Query.equal("clinic_id", clinicId),
      Query.greaterThanEqual("appointment_date", startDate),
      Query.lessThanEqual("appointment_date", endDate),
    ])
  }


  /* -------------------------------------------------------------------------- */
  /* BATCH WITH PATIENT                                                         */
  /* -------------------------------------------------------------------------- */

  async findAppointmentsWithPatientInfoBatch(
    clinicId: string,
    options?: {
      status?: AppointmentStatus
      date?: string
      limit?: number
    }
  ): Promise<Array<Appointment & { patient?: Patient }>> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.status) {
      queries.push(Query.equal("status", options.status))
    }

    if (options?.date) {
      queries.push(Query.equal("appointment_date", options.date))
    }

    if (options?.limit) {
      queries.push(Query.limit(options.limit))
    }

    queries.push(Query.orderAsc("appointment_time"))

    const appointments = await this.find(queries)
    if (!appointments.length) return []

    const patientIds = [...new Set(appointments.map(a => a.patient_id))]
    const patientRepo = getPatientRepository()

    const patients = await Promise.all(
      patientIds.map(id => patientRepo.findById(id).catch(() => null))
    )

    const patientMap = new Map<string, Patient>()
    patients.forEach(p => p && patientMap.set(p.id, p))

    return appointments.map(apt => ({
      ...apt,
      patient: patientMap.get(apt.patient_id),
    }))
  }

  async findReadyForAssessment(clinicId: string): Promise<Appointment[]> {
  return this.find([
    Query.equal("clinic_id", clinicId),
    Query.equal("status", "tests_completed"), // Or whatever status indicates ready for assessment
    Query.orderAsc("appointment_date")
  ])
}
}


