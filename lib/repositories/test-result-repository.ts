import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { TestResult } from "@/lib/types/database"

export class TestResultRepository extends BaseRepository<TestResult> {
  protected collectionId = COLLECTIONS.TEST_RESULTS

  constructor() {
    super("test_result")
  }

  async create(data: Partial<TestResult>): Promise<TestResult> {
    // Map test_code to test_id for database
    const dbData = {
      ...data,
      test_id: data.test_code,  // ✅ Map test_code to test_id
      results: JSON.stringify(data.results ?? {}),
      attachments: JSON.stringify(data.attachments ?? []),
    }
    
    // Remove test_code to avoid duplicate field
    delete dbData.test_code
    
    return super.create(dbData as any)
  }

  async update(id: string, data: Partial<TestResult>): Promise<TestResult> {
    const payload: any = { ...data }

    // Map test_code to test_id if provided
    if (payload.test_code) {
      payload.test_id = payload.test_code
      delete payload.test_code
    }

    if (payload.results) {
      payload.results = JSON.stringify(payload.results)
    }

    if (payload.attachments !== undefined) {
      payload.attachments = JSON.stringify(payload.attachments ?? [])
    }

    return super.update(id, payload)
  }

  protected mapToEntity(doc: any): TestResult {
    let results: Record<string, any> = {}
    let attachments: any[] = []

    try {
      results = doc.results ? JSON.parse(doc.results) : {}
    } catch {
      results = {}
    }

    try {
      attachments = doc.attachments ? JSON.parse(doc.attachments) : []
    } catch {
      attachments = []
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      appointment_id: doc.appointment_id,
      patient_id: doc.patient_id,
      test_code: doc.test_id,  // ✅ Map database test_id to application test_code
      performed_by: doc.performed_by || null,
      performed_at: doc.performed_at,

      results,
      attachments,

      is_normal: doc.is_normal ?? null,
      findings: doc.findings || null,
      recommendations: doc.recommendations || null,
      reviewed_by: doc.reviewed_by || null,
      reviewed_at: doc.reviewed_at || null,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }
  }

  async findByAppointmentId(appointmentId: string) {
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
