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
    const dbData: any = {
      ...data,
      // ✅ CRITICAL: Store both test_code and test_id for compatibility
      test_id: data.test_id || data.test_code,
      test_code: data.test_code || data.test_id,
      results: JSON.stringify(data.results || {}),
      attachments: JSON.stringify(data.attachments || []),
      validation_warnings: data.validation_warnings 
        ? JSON.stringify(data.validation_warnings)
        : "[]",
    }
    
    return super.create(dbData)
  }

  async update(id: string, data: Partial<TestResult>): Promise<TestResult> {
    const payload: any = { ...data }
    
    // Handle test_code/test_id mapping
    if (payload.test_code && !payload.test_id) {
      payload.test_id = payload.test_code
    }
    
    if (payload.test_id && !payload.test_code) {
      payload.test_code = payload.test_id
    }
    
    // Stringify JSON fields
    if (payload.results) {
      payload.results = JSON.stringify(payload.results)
    }
    
    if (payload.attachments !== undefined) {
      payload.attachments = JSON.stringify(payload.attachments || [])
    }
    
    if (payload.validation_warnings) {
      payload.validation_warnings = JSON.stringify(payload.validation_warnings)
    }
    
    return super.update(id, payload)
  }

   protected mapToEntity(doc: any): TestResult {
    // Parse results safely
    let results: any = {}
    try {
      results = doc.results ? JSON.parse(doc.results) : {}
    } catch {
      results = {}
    }
    
    // Parse attachments safely
    let attachments: any[] = []
    try {
      attachments = doc.attachments ? JSON.parse(doc.attachments) : []
    } catch {
      attachments = []
    }

    // ✅ CRITICAL FIX: Support both test_code and test_id
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      appointment_id: doc.appointment_id,
      patient_id: doc.patient_id,
      // Map database fields to application interface
      test_id: doc.test_id,
      test_code: doc.test_code || doc.test_id, // Support both!
      performed_by: doc.performed_by || null,
      performed_at: doc.performed_at,
      results: results,
      is_normal: doc.is_normal ?? null,
      findings: doc.findings || null,
      recommendations: doc.recommendations || null,
      reviewed_by: doc.reviewed_by || null,
      reviewed_at: doc.reviewed_at || null,
      attachments: attachments,
      // New fields for validation
      validation_warnings: doc.validation_warnings 
        ? JSON.parse(doc.validation_warnings)
        : [],
      is_sensitive: doc.is_sensitive || false,
      test_price: doc.test_price || 0,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
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
