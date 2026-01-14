import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { TestResult } from "@/lib/types/database"

export class TestResultRepository extends BaseRepository<TestResult> {
  protected collectionId = COLLECTIONS.TEST_RESULTS

  constructor() {
    super("test_result")
  }

protected mapToEntity(doc: any): TestResult {
  return {
    id: doc.$id,
    clinic_id: doc.clinic_id,
    appointment_id: doc.appointment_id,
    patient_id: doc.patient_id,
    test_id: doc.test_id,
    performed_by: doc.performed_by || null,
    performed_at: doc.performed_at,
    results: doc.results || {},
    is_normal: doc.is_normal ?? null,
    findings: doc.findings || null,
    recommendations: doc.recommendations || null,
    attachments: doc.attachments || [],
    reviewed_by: doc.reviewed_by || null,
    reviewed_at: doc.reviewed_at || null,
    created_at: doc.created_at, // Use created_at from schema
    updated_at: doc.updated_at, // Use updated_at from schema
  }
}

  async findByAppointmentId(appointmentId: string): Promise<TestResult[]> {
    return this.find([Query.equal("appointment_id", appointmentId)])
  }

  async findByPatientId(patientId: string): Promise<TestResult[]> {
    return this.find([Query.equal("patient_id", patientId), Query.orderDesc("performed_at")])
  }

  async findByClinicId(clinicId: string, options?: { patientId?: string; testId?: string }): Promise<TestResult[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.patientId) {
      queries.push(Query.equal("patient_id", options.patientId))
    }

    if (options?.testId) {
      queries.push(Query.equal("test_id", options.testId))
    }

    queries.push(Query.orderDesc("performed_at"))

    return this.find(queries)
  }

  async findUnreviewed(clinicId: string): Promise<TestResult[]> {
    return this.find([Query.equal("clinic_id", clinicId), Query.isNull("reviewed_by"), Query.orderAsc("performed_at")])
  }

  async markAsReviewed(id: string, reviewedBy: string): Promise<TestResult> {
    return this.update(id, {
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    } as Partial<TestResult>)
  }

  async countAbnormal(clinicId: string, startDate?: string, endDate?: string): Promise<number> {
    const queries = [Query.equal("clinic_id", clinicId), Query.equal("is_normal", false)]

    if (startDate) {
      queries.push(Query.greaterThanEqual("performed_at", startDate))
    }

    if (endDate) {
      queries.push(Query.lessThanEqual("performed_at", endDate))
    }

    return this.count(queries)
  }
}
