// lib/repositories/assessment-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { 
  ClinicalAssessment, 
  AssessmentStatus, 
  ClinicalFinding,
  RulesEngineSummary 
} from "@/lib/types/database"

export class AssessmentRepository extends BaseRepository<ClinicalAssessment> {
  protected collectionId = COLLECTIONS.CLINICAL_ASSESSMENTS

  constructor() {
    super("clinical_assessment")
  }

  protected mapToEntity(doc: any): ClinicalAssessment {
    // Parse JSON fields
    let clinicalFindings: ClinicalFinding[] = []
    let physicalExamination: Record<string, string> = {}
    let rulesEngineSummary: RulesEngineSummary | null = null
    let restrictions: string[] = []
    let referrals: any[] = []

    try {
      clinicalFindings = doc.clinical_findings 
        ? (typeof doc.clinical_findings === "string" 
            ? JSON.parse(doc.clinical_findings) 
            : doc.clinical_findings)
        : []
    } catch {
      clinicalFindings = []
    }

    try {
      physicalExamination = doc.physical_examination 
        ? (typeof doc.physical_examination === "string" 
            ? JSON.parse(doc.physical_examination) 
            : doc.physical_examination)
        : {}
    } catch {
      physicalExamination = {}
    }

    try {
      rulesEngineSummary = doc.rules_engine_summary 
        ? (typeof doc.rules_engine_summary === "string" 
            ? JSON.parse(doc.rules_engine_summary) 
            : doc.rules_engine_summary)
        : null
    } catch {
      rulesEngineSummary = null
    }

    try {
      restrictions = doc.restrictions 
        ? (typeof doc.restrictions === "string" 
            ? JSON.parse(doc.restrictions) 
            : doc.restrictions)
        : []
    } catch {
      restrictions = []
    }

    try {
      referrals = doc.referrals 
        ? (typeof doc.referrals === "string" 
            ? JSON.parse(doc.referrals) 
            : doc.referrals)
        : []
    } catch {
      referrals = []
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      appointment_id: doc.appointment_id,
      patient_id: doc.patient_id,
      doctor_id: doc.doctor_id,
      doctor_name: doc.doctor_name,
      started_at: doc.started_at,
      completed_at: doc.completed_at || null,
      status: doc.status as AssessmentStatus,
      clinical_findings: clinicalFindings,
      physical_examination: physicalExamination,
      medical_history_notes: doc.medical_history_notes || undefined,
      current_medications: doc.current_medications || undefined,
      allergies_confirmed: doc.allergies_confirmed || undefined,
      rules_engine_summary: rulesEngineSummary ?? undefined,
      doctor_decision: doc.doctor_decision || null,
      doctor_reasoning: doc.doctor_reasoning || null,
      override_rules_engine: doc.override_rules_engine ?? false,
      override_reason: doc.override_reason || undefined,
      restrictions,
      restriction_duration: doc.restriction_duration || undefined,
      referrals,
      follow_up_required: doc.follow_up_required ?? false,
      follow_up_date: doc.follow_up_date || undefined,
      follow_up_notes: doc.follow_up_notes || undefined,
      additional_notes: doc.additional_notes || undefined,
      certificate_id: doc.certificate_id || null,
    }
  }

  /**
   * Override create to stringify JSON fields
   */
  async create(data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> {
    const dbData = {
      ...data,
      clinical_findings: JSON.stringify(data.clinical_findings ?? []),
      physical_examination: JSON.stringify(data.physical_examination ?? {}),
      rules_engine_summary: data.rules_engine_summary 
        ? JSON.stringify(data.rules_engine_summary) 
        : null,
      restrictions: JSON.stringify(data.restrictions ?? []),
      referrals: JSON.stringify(data.referrals ?? []),
    }
    
    return super.create(dbData as any)
  }

  /**
   * Override update to stringify JSON fields
   */
  async update(id: string, data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> {
    const payload: any = { ...data }

    if (payload.clinical_findings !== undefined) {
      payload.clinical_findings = JSON.stringify(payload.clinical_findings)
    }

    if (payload.physical_examination !== undefined) {
      payload.physical_examination = JSON.stringify(payload.physical_examination)
    }

    if (payload.rules_engine_summary !== undefined) {
      payload.rules_engine_summary = payload.rules_engine_summary 
        ? JSON.stringify(payload.rules_engine_summary) 
        : null
    }

    if (payload.restrictions !== undefined) {
      payload.restrictions = JSON.stringify(payload.restrictions)
    }

    if (payload.referrals !== undefined) {
      payload.referrals = JSON.stringify(payload.referrals)
    }

    return super.update(id, payload)
  }

  /**
   * Find assessment by appointment ID
   */
  async findByAppointmentId(appointmentId: string): Promise<ClinicalAssessment | null> {
    const results = await this.find([
      Query.equal("appointment_id", appointmentId),
      Query.limit(1)
    ])
    return results.length > 0 ? results[0] : null
  }

  /**
   * Find assessments by patient ID
   */
  async findByPatientId(patientId: string): Promise<ClinicalAssessment[]> {
    return this.find([
      Query.equal("patient_id", patientId),
      Query.orderDesc("started_at")
    ])
  }

  /**
   * Find assessments by doctor ID
   */
  async findByDoctorId(doctorId: string, options?: { 
    status?: AssessmentStatus
    date?: string 
  }): Promise<ClinicalAssessment[]> {
    const queries = [Query.equal("doctor_id", doctorId)]

    if (options?.status) {
      queries.push(Query.equal("status", options.status))
    }

    if (options?.date) {
      queries.push(Query.greaterThanEqual("started_at", `${options.date}T00:00:00`))
      queries.push(Query.lessThanEqual("started_at", `${options.date}T23:59:59`))
    }

    queries.push(Query.orderDesc("started_at"))

    return this.find(queries)
  }

  /**
   * Find assessments by clinic ID
   */
  async findByClinicId(clinicId: string, options?: {
    status?: AssessmentStatus
    limit?: number
    offset?: number
  }): Promise<ClinicalAssessment[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.status) {
      queries.push(Query.equal("status", options.status))
    }

    queries.push(Query.orderDesc("started_at"))

    return this.find(queries, { 
      limit: options?.limit, 
      offset: options?.offset 
    })
  }

  /**
   * Find in-progress assessments for a clinic
   */
  async findInProgress(clinicId: string): Promise<ClinicalAssessment[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", "in_progress"),
      Query.orderAsc("started_at")
    ])
  }

  /**
   * Complete an assessment
   */
  async completeAssessment(id: string, data: {
    doctor_decision: ClinicalAssessment["doctor_decision"]
    doctor_reasoning: string
    restrictions?: string[]
    restriction_duration?: string
    referrals?: ClinicalAssessment["referrals"]
    follow_up_required?: boolean
    follow_up_date?: string
    follow_up_notes?: string
    additional_notes?: string
    override_rules_engine?: boolean
    override_reason?: string
  }): Promise<ClinicalAssessment> {
    return this.update(id, {
      ...data,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
  }

  /**
   * Cancel an assessment
   */
  async cancelAssessment(id: string, reason?: string): Promise<ClinicalAssessment> {
    return this.update(id, {
      status: "cancelled",
      additional_notes: reason 
        ? `[CANCELLED] ${reason}`
        : undefined,
    })
  }

  /**
   * Link certificate to assessment
   */
  async linkCertificate(assessmentId: string, certificateId: string): Promise<ClinicalAssessment> {
    return this.update(assessmentId, {
      certificate_id: certificateId,
    })
  }

  /**
   * Count assessments by status
   */
  async countByStatus(clinicId: string, status: AssessmentStatus): Promise<number> {
    return this.count([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", status)
    ])
  }

  /**
   * Get assessment statistics for a clinic
   */
  async getStatistics(clinicId: string, startDate?: string, endDate?: string): Promise<{
    total: number
    in_progress: number
    completed: number
    cancelled: number
    fit: number
    fit_with_conditions: number
    fit_with_restrictions: number
    temporarily_unfit: number
    permanently_unfit: number
  }> {
    const baseQueries = [Query.equal("clinic_id", clinicId)]

    if (startDate) {
      baseQueries.push(Query.greaterThanEqual("started_at", startDate))
    }

    if (endDate) {
      baseQueries.push(Query.lessThanEqual("started_at", endDate))
    }

    // Get all assessments for the period
    const assessments = await this.find(baseQueries)

    const stats = {
      total: assessments.length,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      fit: 0,
      fit_with_conditions: 0,
      fit_with_restrictions: 0,
      temporarily_unfit: 0,
      permanently_unfit: 0,
    }

    for (const assessment of assessments) {
      // Count by status
      if (assessment.status === "in_progress") stats.in_progress++
      else if (assessment.status === "completed") stats.completed++
      else if (assessment.status === "cancelled") stats.cancelled++

      // Count by decision (only for completed)
      if (assessment.status === "completed" && assessment.doctor_decision) {
        switch (assessment.doctor_decision) {
          case "fit":
            stats.fit++
            break
          case "fit_with_conditions":
            stats.fit_with_conditions++
            break
          case "fit_with_restrictions":
            stats.fit_with_restrictions++
            break
          case "temporarily_unfit":
            stats.temporarily_unfit++
            break
          case "permanently_unfit":
            stats.permanently_unfit++
            break
        }
      }
    }

    return stats
  }
  
  // Note: delete method is inherited from BaseRepository
  
  /**
   * Find assessments requiring follow-up
   */
  async findRequiringFollowUp(clinicId: string, options?: {
    overdue?: boolean
    upcoming?: boolean
    days?: number
  }): Promise<ClinicalAssessment[]> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.equal("follow_up_required", true),
      Query.equal("status", "completed")
    ]
    
    const now = new Date()
    
    if (options?.overdue) {
      // Find assessments with follow-up date in the past
      queries.push(Query.lessThan("follow_up_date", now.toISOString()))
    } else if (options?.upcoming) {
      // Find assessments with follow-up date in the next X days
      const futureDate = new Date(now)
      futureDate.setDate(futureDate.getDate() + (options.days || 7))
      queries.push(Query.greaterThanEqual("follow_up_date", now.toISOString()))
      queries.push(Query.lessThanEqual("follow_up_date", futureDate.toISOString()))
    }
    
    queries.push(Query.orderAsc("follow_up_date"))
    
    return this.find(queries)
  }
  
  /**
   * Find assessments with referrals
   */
  async findWithReferrals(clinicId: string, options?: {
    priority?: "routine" | "urgent" | "emergency"
  }): Promise<ClinicalAssessment[]> {
    const assessments = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", "completed"),
      Query.orderDesc("completed_at")
    ])
    
    // Filter assessments that have referrals
    return assessments.filter(a => {
      if (!a.referrals || a.referrals.length === 0) return false
      
      if (options?.priority) {
        return a.referrals.some(r => r.priority === options.priority)
      }
      
      return true
    })
  }
  
  /**
   * Find assessments where doctor overrode rules engine
   */
  async findWithOverrides(clinicId: string): Promise<ClinicalAssessment[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("override_rules_engine", true),
      Query.orderDesc("completed_at")
    ])
  }
  
  /**
   * Get recent assessments for dashboard
   */
  async getRecentAssessments(clinicId: string, limit: number = 10): Promise<ClinicalAssessment[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("started_at"),
      Query.limit(limit)
    ])
  }
  
  /**
   * Find assessments by fitness decision
   */

async findByFitnessDecision(
  clinicId: string, 
  decision: ClinicalAssessment["doctor_decision"],
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<ClinicalAssessment[]> {
  // Filter out null decisions - can't query for null with Query.equal()
  if (decision === null) {
    return this.findAssessmentsWithoutDecision(clinicId, options)
  }
  
  const queries = [
    Query.equal("clinic_id", clinicId),
    Query.equal("status", "completed"),
    Query.equal("doctor_decision", decision)
  ]
  
  if (options?.startDate) {
    queries.push(Query.greaterThanEqual("completed_at", options.startDate))
  }
  
  if (options?.endDate) {
    queries.push(Query.lessThanEqual("completed_at", options.endDate))
  }
  
  queries.push(Query.orderDesc("completed_at"))
  
  if (options?.limit) {
    queries.push(Query.limit(options.limit))
  }
  
  return this.find(queries)
}

/**
 * Helper method to find assessments without a decision
 */
private async findAssessmentsWithoutDecision(
  clinicId: string,
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<ClinicalAssessment[]> {
  // First get all completed assessments for the clinic
  const allAssessments = await this.find([
    Query.equal("clinic_id", clinicId),
    Query.equal("status", "completed"),
    Query.orderDesc("completed_at")
  ])
  
  // Then filter in code for assessments without a decision
  let filtered = allAssessments.filter(a => a.doctor_decision === null)
  
  // Apply date filters
  if (options?.startDate) {
    const start = new Date(options.startDate)
    filtered = filtered.filter(a => 
      new Date(a.completed_at || a.started_at) >= start
    )
  }
  
  if (options?.endDate) {
    const end = new Date(options.endDate)
    filtered = filtered.filter(a => 
      new Date(a.completed_at || a.started_at) <= end
    )
  }
  
  // Apply limit
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit)
  }
  
  return filtered
}
  
  /**
   * Get assessment history for a patient
   */
  async getPatientAssessmentHistory(patientId: string, clinicId: string): Promise<{
    assessments: ClinicalAssessment[]
    summary: {
      totalAssessments: number
      lastAssessmentDate: string | null
      fitnessHistory: Array<{
        date: string
        decision: string
      }>
      hasActiveRestrictions: boolean
      pendingFollowUps: number
    }
  }> {
    const assessments = await this.find([
      Query.equal("patient_id", patientId),
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("started_at")
    ])
    
    const completedAssessments = assessments.filter(a => a.status === "completed")
    
    const summary = {
      totalAssessments: assessments.length,
      lastAssessmentDate: completedAssessments[0]?.completed_at || null,
      fitnessHistory: completedAssessments
        .filter(a => a.doctor_decision)
        .map(a => ({
          date: a.completed_at || a.started_at,
          decision: a.doctor_decision!
        })),
      hasActiveRestrictions: completedAssessments.some(a => 
        a.restrictions && a.restrictions.length > 0 &&
        a.restriction_duration !== "permanent" &&
        // Check if restriction is still active (simplified check)
        new Date(a.completed_at || a.started_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ),
      pendingFollowUps: assessments.filter(a => 
        a.follow_up_required && 
        a.follow_up_date && 
        new Date(a.follow_up_date) >= new Date()
      ).length
    }
    
    return { assessments, summary }
  }
  
  /**
   * Bulk update assessments (e.g., for reassigning doctor)
   */
  async bulkUpdateDoctor(
    assessmentIds: string[], 
    newDoctorId: string, 
    newDoctorName: string
  ): Promise<number> {
    let updatedCount = 0
    
    for (const id of assessmentIds) {
      try {
        await this.update(id, {
          doctor_id: newDoctorId,
          doctor_name: newDoctorName
        })
        updatedCount++
      } catch (error) {
        console.error(`[AssessmentRepository] Failed to update assessment ${id}:`, error)
      }
    }
    
    return updatedCount
  }

  async findByAppointmentIds(appointmentIds: string[]): Promise<ClinicalAssessment[]> {
  if (appointmentIds.length === 0) return []
  
  return this.find([
    Query.equal("appointment_id", appointmentIds)
  ])
}
}
