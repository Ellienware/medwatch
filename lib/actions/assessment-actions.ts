// lib/actions/assessment-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/actions"
import {
  getAssessmentRepository,
  getAppointmentRepository,
  getPatientRepository,
  getTestResultRepository,
  getUserRepository,
  getClinicRepository,
} from "@/lib/repositories"

import type { 
  ClinicalAssessment, 
  AssessmentStatus,
  FitnessDecision,
  ClinicalFinding,
  RulesEngineSummary,
} from "@/lib/types/database"
import { z } from "zod"
import { clinicalRulesEngine } from "../services/clinical-rules-engine"
import { logger } from "../services/logging-service"
import { AssessmentToCertificateMapper } from "../services/assessment-to-certificate-mapper"


function mapFitnessDecisionToCertificateType(decision: FitnessDecision): "fit_to_work" | "unfit_to_work" | "fit_with_restrictions" {
  switch (decision) {
    case "fit":
      return "fit_to_work"
    case "fit_with_conditions":
    case "fit_with_restrictions":
      return "fit_with_restrictions"
    case "temporarily_unfit":
    case "permanently_unfit":
      return "unfit_to_work"
    default:
      return "fit_to_work"
  }
}

function generateDiagnosisFromFindings(findings?: any[]): string {
  if (!findings || findings.length === 0) {
    return "No significant findings noted."
  }
  return `${findings.length} clinical finding(s) documented. Requires medical review.`
}
// Transaction-like operation tracking
interface OperationStep {
  name: string
  completed: boolean
  rollbackFn?: () => Promise<void>
}

class AssessmentTransaction {
  private steps: OperationStep[] = []
  private committed = false
  
  async execute<T>(
    name: string, 
    operation: () => Promise<T>, 
    rollback?: (result: T) => Promise<void>
  ): Promise<T> {
    const step: OperationStep = { name, completed: false }
    this.steps.push(step)
    
    try {
      const result = await operation()
      step.completed = true
      
      if (rollback) {
        step.rollbackFn = () => rollback(result)
      }
      
      return result
    } catch (error) {
      console.error(`[Assessment Transaction] Step "${name}" failed:`, error)
      throw error
    }
  }
  
  async rollback(): Promise<void> {
    if (this.committed) {
      console.warn("[Assessment Transaction] Cannot rollback committed transaction")
      return
    }
    
    console.log("[Assessment Transaction] Rolling back...")
    
    // Rollback in reverse order
    for (let i = this.steps.length - 1; i >= 0; i--) {
      const step = this.steps[i]
      if (step.completed && step.rollbackFn) {
        try {
          await step.rollbackFn()
          console.log(`[Assessment Transaction] Rolled back: ${step.name}`)
        } catch (rollbackError) {
          console.error(`[Assessment Transaction] Rollback failed for "${step.name}":`, rollbackError)
        }
      }
    }
  }
  
  commit(): void {
    this.committed = true
    console.log(`[Assessment Transaction] Committed ${this.steps.length} steps`)
  }
  
  getCompletedSteps(): string[] {
    return this.steps.filter(s => s.completed).map(s => s.name)
  }
}

// Validation schemas
const startAssessmentSchema = z.object({
  appointment_id: z.string().min(1, "Appointment ID is required"),
})

const updateAssessmentSchema = z.object({
  id: z.string().min(1, "Assessment ID is required"),
  clinical_findings: z.array(z.object({
    category: z.string(),
    finding: z.string(),
    severity: z.enum(["normal", "mild", "moderate", "severe"]),
    notes: z.string().optional(),
  })).optional(),
  fitness_decision: z.enum(["fit", "fit_with_conditions", "fit_with_restrictions", "temporarily_unfit", "permanently_unfit"]).optional(),
  notes: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional().nullable(),
})

export async function completeAssessmentAndCreateCertificate(assessmentId: string) {
  const transaction = new AssessmentTransaction()
  
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User not associated with a clinic")
    }
    
    const assessmentRepo = getAssessmentRepository()
    const appointmentRepo = getAppointmentRepository()
    const testResultRepo = getTestResultRepository()
    
    // Get assessment with transaction
    const assessment = await transaction.execute(
      "fetch_assessment",
      () => assessmentRepo.findById(assessmentId)
    )
    
    if (!assessment) {
      throw new Error("Assessment not found")
    }
    
    // Verify access
    if (assessment.clinic_id !== user.clinic_id) {
      throw new Error("Unauthorized access to assessment")
    }
    
    // Get test results
    const testResults = await transaction.execute(
      "fetch_test_results",
      () => testResultRepo.findByAppointmentId(assessment.appointment_id)
    )
    
    // Run clinical rules engine
    const rulesEvaluation = await transaction.execute(
      "clinical_rules_evaluation",
      async () => clinicalRulesEngine.evaluate(testResults) 
    )
    
    // Update assessment with evaluation
      const updatedAssessment = await transaction.execute(
        "update_assessment_with_evaluation",
        () => assessmentRepo.update(assessmentId, {
          rules_engine_summary: rulesEvaluation,  // Fixed: use correct property name
          doctor_decision: rulesEvaluation.overallSuggestedDecision,
          status: "completed",
          // updated_at: new Date().toISOString(),
        })
      )
    
    // Auto-create certificate draft
      // Auto-create certificate draft
    const certificateData = {
      appointment_id: assessment.appointment_id,
      certificate_type: (rulesEvaluation.overallSuggestedDecision === "fit" ? "fit_to_work" : 
                        rulesEvaluation.overallSuggestedDecision === "temporarily_unfit" || 
                        rulesEvaluation.overallSuggestedDecision === "permanently_unfit" ? "unfit_to_work" : 
                        "fit_with_restrictions") as "fit_to_work" | "unfit_to_work" | "fit_with_restrictions",  // Add type assertion
      status: "draft" as const,
      rules_evaluation: rulesEvaluation,
      suggested_fitness_decision: rulesEvaluation.overallSuggestedDecision,
      evaluation_confidence: rulesEvaluation.overallConfidence,
      doctor_decision_override: false,
      notes: "Auto-generated from clinical rules engine evaluation. Doctor review required.",
    }
    
    // Import certificate function
    const { createCertificate } = await import("./certificate-actions")
    
    const certificateResult = await transaction.execute(
      "create_certificate_draft",
      () => createCertificate(certificateData)
    )
    
    if (!certificateResult.success) {
      throw new Error(`Failed to create certificate: ${certificateResult.error}`)
    }
    
    // Update assessment with certificate link
    await transaction.execute(
      "link_certificate_to_assessment",
      () => assessmentRepo.update(assessmentId, {
        certificate_id: certificateResult.certificate?.id || null,
      })
    )
    
    // Update appointment status
    await transaction.execute(
      "update_appointment_status",
      () => appointmentRepo.update(assessment.appointment_id, {
        status: "completed",
        // updated_at: new Date().toISOString(),
      })
    )
    
    transaction.commit()
    
    logger.info('Assessment completed with auto-certificate generation', {
      assessmentId,
      certificateId: certificateResult.certificate?.id,
      engineDecision: rulesEvaluation.overallSuggestedDecision,
      engineConfidence: rulesEvaluation.overallConfidence,
      userId: user.id,
    })
    
    revalidatePath("/clinic/assessments")
    revalidatePath("/clinic/certificates")
    
    return {
      success: true,
      assessment: updatedAssessment,
      certificate: certificateResult.certificate,
      rulesEvaluation,
      message: "Assessment completed. Certificate draft created with rules engine suggestions.",
    }
    
  } catch (error) {
    await transaction.rollback()
    logger.error("Error completing assessment:", { assessmentId, error })
    return {
      success: false,
      assessment: null,
      certificate: null,
      error: error instanceof Error ? error.message : "Failed to complete assessment",
    }
  }
}

const completeAssessmentSchema = z.object({
  id: z.string().min(1, "Assessment ID is required"),
  doctor_decision: z.enum([
    "fit",
    "fit_with_conditions",
    "fit_with_restrictions",
    "temporarily_unfit",
    "permanently_unfit",
  ]),
  doctor_reasoning: z.string().min(1, "Reasoning is required"),
  restrictions: z.array(z.string()).optional(),
  restriction_duration: z.string().optional(),
  referrals: z.array(z.object({
    type: z.string(),
    reason: z.string(),
    priority: z.enum(["routine", "urgent", "emergency"]),
  })).optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  follow_up_notes: z.string().optional(),
  additional_notes: z.string().optional(),
  override_rules_engine: z.boolean().optional(),
  override_reason: z.string().optional(),
})

/**
 * Start a clinical assessment for an appointment
 * Uses transaction-like handling for rollback on failure
 */
export async function startAssessment(data: { appointment_id: string }) {
  const transaction = new AssessmentTransaction()
  let originalAppointmentStatus: string | null = null
  
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessment: null, error: "Unauthorized - No clinic access" }
    }

    // Validate user role - only doctors can start assessments
    if (user.role !== "doctor" && user.role !== "clinic_admin" && user.role !== "super_admin") {
      return { success: false, assessment: null, error: "Only doctors can start clinical assessments" }
    }

    // Validate input
    const validationResult = startAssessmentSchema.safeParse(data)
    if (!validationResult.success) {
      return { 
        success: false, 
        assessment: null, 
        error: validationResult.error.errors.map(e => e.message).join(", ") 
      }
    }

    const assessmentRepo = getAssessmentRepository()
    const appointmentRepo = getAppointmentRepository()
    const testResultRepo = getTestResultRepository()

    // Get appointment
    const appointment = await transaction.execute(
      "Fetch appointment",
      () => appointmentRepo.findById(data.appointment_id)
    )
    
    if (!appointment) {
      return { success: false, assessment: null, error: "Appointment not found" }
    }
    
    // Store original status for potential rollback
    originalAppointmentStatus = appointment.status

    if (appointment.clinic_id !== user.clinic_id) {
      return { success: false, assessment: null, error: "Access denied" }
    }

    // Check if assessment already exists for this appointment
    const existingAssessment = await transaction.execute(
      "Check existing assessment",
      () => assessmentRepo.findByAppointmentId(data.appointment_id)
    )
    
    if (existingAssessment && existingAssessment.status !== "cancelled") {
      return { 
        success: false, 
        assessment: existingAssessment, 
        error: "An assessment already exists for this appointment" 
      }
    }

    // Get test results for the appointment
    const testResults = await transaction.execute(
      "Fetch test results",
      () => testResultRepo.findByAppointmentId(data.appointment_id)
    )

    // Run rules engine on test results
    let rulesEngineSummary: RulesEngineSummary | null = null
    if (testResults.length > 0) {
      rulesEngineSummary = clinicalRulesEngine.evaluate(testResults)
    }

    // Create assessment (with rollback capability)
    const assessmentData: Partial<ClinicalAssessment> = {
      clinic_id: user.clinic_id,
      appointment_id: data.appointment_id,
      patient_id: appointment.patient_id,
      doctor_id: user.id,
      doctor_name: user.full_name,
      started_at: new Date().toISOString(),
      status: "in_progress",
      clinical_findings: [],
      physical_examination: {},
      rules_engine_summary: rulesEngineSummary ?? undefined,
      restrictions: [],
      referrals: [],
      follow_up_required: false,
      override_rules_engine: false,
    }

    const assessment = await transaction.execute(
      "Create assessment",
      () => assessmentRepo.create(assessmentData),
      async (createdAssessment) => {
        // Rollback: Delete the created assessment
        if (createdAssessment?.id) {
          try {
            await assessmentRepo.delete(createdAssessment.id)
          } catch (e) {
            console.error("Failed to delete assessment during rollback:", e)
          }
        }
      }
    )

    // Update appointment status to with_doctor (with rollback capability)
    await transaction.execute(
      "Update appointment status",
      () => appointmentRepo.update(data.appointment_id, {
        status: "with_doctor",
        doctor_assigned_id: user.id,
        doctor_started_at: new Date().toISOString(),
      }),
      async () => {
        // Rollback: Restore original appointment status
        if (originalAppointmentStatus) {
          await appointmentRepo.update(data.appointment_id, {
            status: originalAppointmentStatus as any,
            doctor_assigned_id: null,
            doctor_started_at: null,
          })
        }
      }
    )

    // All operations successful - commit transaction
    transaction.commit()

    revalidatePath("/clinic/appointments")
    revalidatePath(`/clinic/appointments/${data.appointment_id}`)
    revalidatePath("/clinic/assessments")

    return { 
      success: true, 
      assessment, 
      rulesEngineSummary,
      error: null 
    }
  } catch (error) {
    console.error("Error starting assessment:", error)
    
    // Attempt rollback of completed operations
    await transaction.rollback()
    
    return { 
      success: false, 
      assessment: null, 
      error: (error as Error).message,
      completedSteps: transaction.getCompletedSteps()
    }
  }
}

/**
 * Get assessment by ID with related data
 */
export async function getAssessmentWithDetails(assessmentId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, data: null, error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const testResultRepo = getTestResultRepository()

    const assessment = await assessmentRepo.findById(assessmentId)
    if (!assessment) {
      return { success: false, data: null, error: "Assessment not found" }
    }

    if (assessment.clinic_id !== user.clinic_id) {
      return { success: false, data: null, error: "Access denied" }
    }

    // Get related data
    const [appointment, patient, testResults] = await Promise.all([
      appointmentRepo.findById(assessment.appointment_id),
      patientRepo.findById(assessment.patient_id),
      testResultRepo.findByAppointmentId(assessment.appointment_id),
    ])

    return {
      success: true,
      data: {
        assessment,
        appointment,
        patient,
        testResults,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching assessment:", error)
    return { success: false, data: null, error: (error as Error).message }
  }
}

/**
 * Get assessment by appointment ID
 */
export async function getAssessmentByAppointmentId(appointmentId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessment: null, error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const assessment = await assessmentRepo.findByAppointmentId(appointmentId)

    if (assessment && assessment.clinic_id !== user.clinic_id) {
      return { success: false, assessment: null, error: "Access denied" }
    }

    return { success: true, assessment, error: null }
  } catch (error) {
    console.error("Error fetching assessment:", error)
    return { success: false, assessment: null, error: (error as Error).message }
  }
}

/**
 * Update assessment (save progress)
 */
export async function updateAssessment(data: {
  id: string
  clinical_findings?: ClinicalFinding[]
  physical_examination?: Record<string, string>
  medical_history_notes?: string
  current_medications?: string
  allergies_confirmed?: string
  additional_notes?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessment: null, error: "Unauthorized" }
    }

    // Validate input
    const validationResult = updateAssessmentSchema.safeParse(data)
    if (!validationResult.success) {
      return { 
        success: false, 
        assessment: null, 
        error: validationResult.error.errors.map(e => e.message).join(", ") 
      }
    }

    const assessmentRepo = getAssessmentRepository()
    
    // Get existing assessment
    const existing = await assessmentRepo.findById(data.id)
    if (!existing) {
      return { success: false, assessment: null, error: "Assessment not found" }
    }

    if (existing.clinic_id !== user.clinic_id) {
      return { success: false, assessment: null, error: "Access denied" }
    }

    if (existing.status !== "in_progress") {
      return { success: false, assessment: null, error: "Assessment is not in progress" }
    }

    // Update assessment - only include fields that exist in schema
    const { id, ...updateData } = data
    
    
    const assessment = await assessmentRepo.update(id, updateData)

    revalidatePath(`/clinic/assessments/${id}`)

    return { success: false, assessment, error: null }
  } catch (error) {
    console.error("Error updating assessment:", error)
    return { success: false, assessment: null, error: (error as Error).message }
  }
}

/**
 * Refresh rules engine analysis (re-run on test results)
 */
export async function refreshRulesEngineAnalysis(assessmentId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessment: null, error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const testResultRepo = getTestResultRepository()

    const assessment = await assessmentRepo.findById(assessmentId)
    if (!assessment) {
      return { success: false, assessment: null, error: "Assessment not found" }
    }

    if (assessment.clinic_id !== user.clinic_id) {
      return { success: false, assessment: null, error: "Access denied" }
    }

    // Get test results
    const testResults = await testResultRepo.findByAppointmentId(assessment.appointment_id)

    // Re-run rules engine
    const rulesEngineSummary = testResults.length > 0
      ? clinicalRulesEngine.evaluate(testResults)
      : null

    // Update assessment
    const updatedAssessment = await assessmentRepo.update(assessmentId, {
      rules_engine_summary: rulesEngineSummary ?? undefined,
    })

    revalidatePath(`/clinic/assessments/${assessmentId}`)

    return { 
      success: true, 
      assessment: updatedAssessment, 
      rulesEngineSummary,
      error: null 
    }
  } catch (error) {
    console.error("Error refreshing rules engine:", error)
    return { success: false, assessment: null, error: (error as Error).message }
  }
}

/**
 * Complete assessment with doctor's decision
 */
export async function completeAssessmentAction(data: {
  id: string
  doctor_decision: FitnessDecision
  doctor_reasoning: string
  restrictions?: string[]
  restriction_duration?: string
  referrals?: Array<{
    type: string
    reason: string
    priority: "routine" | "urgent" | "emergency"
  }>
  follow_up_required?: boolean
  follow_up_date?: string
  follow_up_notes?: string
  additional_notes?: string
  override_rules_engine?: boolean
  override_reason?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, error: "User not associated with a clinic" }
    }

    // Validate input
    const validationResult = completeAssessmentSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors.map(e => e.message).join(', ')
      }
    }

    const assessmentRepo = getAssessmentRepository()
    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const testResultRepo = getTestResultRepository()

    // Get existing assessment
    const assessment = await assessmentRepo.findById(data.id)
    if (!assessment) {
      return { success: false, error: "Assessment not found" }
    }

    if (assessment.clinic_id !== user.clinic_id) {
      return { success: false, error: "Unauthorized access to assessment" }
    }

    // Update assessment with doctor's findings
    const updateData: any = {
      doctor_decision: data.doctor_decision,
      doctor_reasoning: data.doctor_reasoning,
      status: "completed",
      completed_at: new Date().toISOString(),
      restrictions: data.restrictions || [],
      restriction_duration: data.restriction_duration || undefined,
      referrals: data.referrals || [],
      follow_up_required: data.follow_up_required || false,
      follow_up_date: data.follow_up_date || undefined,
      follow_up_notes: data.follow_up_notes || undefined,
      additional_notes: data.additional_notes || undefined,
      override_rules_engine: data.override_rules_engine || false,
      override_reason: data.override_reason || undefined,
    }

    // Clean up undefined fields (Appwrite doesn't accept undefined)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    const updatedAssessment = await assessmentRepo.update(data.id, updateData)

    // Update appointment status to completed
    await appointmentRepo.update(assessment.appointment_id, {
      status: "completed"
    })

    // --- Auto‑generate certificate draft ---
    let certificateResult = null
    try {
      // Fetch related data needed for certificate
      const patient = await patientRepo.findById(assessment.patient_id)
      const clinic = await clinicRepo.findById(assessment.clinic_id)
      const testResults = await testResultRepo.findByAppointmentId(assessment.appointment_id)

      if (patient && clinic) {
        // Use mapper to create certificate data
        const certificateData = AssessmentToCertificateMapper.createCertificateFromAssessment(
          updatedAssessment,
          patient,
          clinic,
          testResults
        )

        // Import dynamically to avoid circular dependency
        const { createCertificate } = await import('./certificate-actions')
        certificateResult = await createCertificate(certificateData)

        if (certificateResult.success) {
          logger.info('Certificate auto‑generated from assessment', {
            assessmentId: data.id,
            certificateId: certificateResult.certificate?.id,
          })
        } else {
          logger.error('Failed to auto‑generate certificate', {
            assessmentId: data.id,
            error: certificateResult.error,
          })
        }
      } else {
        logger.error('Patient or clinic not found for certificate generation', {
          patientId: assessment.patient_id,
          clinicId: assessment.clinic_id,
        })
      }
    } catch (certError) {
      logger.error('Error during certificate auto‑generation', {
        assessmentId: data.id,
        error: certError,
      })
      // Do not fail the assessment completion – only log
    }
    // --- End certificate generation ---

    logger.info('Assessment completed by doctor', {
      assessmentId: data.id,
      fitnessDecision: data.doctor_decision,
      userId: user.id,
      certificateGenerated: certificateResult?.success ?? false,
    })

    revalidatePath("/clinic/assessments")
    revalidatePath("/clinic/certificates")

    return {
      success: true,
      assessment: updatedAssessment,
      message: "Assessment completed successfully" + (certificateResult?.success ? " and certificate draft created." : "."),
    }

  } catch (error) {
    logger.error("Error completing assessment:", {
      assessmentId: data.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete assessment",
    }
  }
}

/**
 * Cancel an assessment
 */
export async function cancelAssessment(assessmentId: string, reason?: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessment: null, error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()

    const existing = await assessmentRepo.findById(assessmentId)
    if (!existing) {
      return { success: false, assessment: null, error: "Assessment not found" }
    }

    if (existing.clinic_id !== user.clinic_id) {
      return { success: false, assessment: null, error: "Access denied" }
    }

    if (existing.status !== "in_progress") {
      return { success: false, assessment: null, error: "Can only cancel in-progress assessments" }
    }

    const assessment = await assessmentRepo.cancelAssessment(assessmentId, reason)

    revalidatePath("/clinic/assessments")
    revalidatePath(`/clinic/assessments/${assessmentId}`)

    return { success: true, assessment, error: null }
  } catch (error) {
    console.error("Error cancelling assessment:", error)
    return { success: false, assessment: null, error: (error as Error).message }
  }
}

/**
 * Get assessments for current user's clinic
 */
export async function getAssessments(options?: {
  status?: AssessmentStatus
  limit?: number
  offset?: number
}) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessments: [], error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const assessments = await assessmentRepo.findByClinicId(user.clinic_id, options)

    return { success: true, assessments, error: null }
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return { success: false, assessments: [], error: (error as Error).message }
  }
}

/**
 * Get in-progress assessments for current doctor
 */
export async function getMyInProgressAssessments() {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, assessments: [], error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const assessments = await assessmentRepo.findByDoctorId(user.id, {
      status: "in_progress",
    })

    return { success: true, assessments, error: null }
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return { success: false, assessments: [], error: (error as Error).message }
  }
}

/**
 * Get assessment statistics
 */
export async function getAssessmentStatistics(startDate?: string, endDate?: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, statistics: null, error: "Unauthorized" }
    }

    const assessmentRepo = getAssessmentRepository()
    const statistics = await assessmentRepo.getStatistics(
      user.clinic_id,
      startDate,
      endDate
    )

    return { success: true, statistics, error: null }
  } catch (error) {
    console.error("Error fetching assessment statistics:", error)
    return { success: false, statistics: null, error: (error as Error).message }
  }
}

/**
 * Get appointments ready for assessment (with_doctor status)
 */
export async function getAppointmentsForAssessment() {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, appointments: [], error: "Unauthorized" }
    }

    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const assessmentRepo = getAssessmentRepository()

    // Get appointments with status "with_doctor" or "tests_in_progress"
    const [withDoctorAppointments, testsInProgressAppointments] = await Promise.all([
      appointmentRepo.findByClinicId(user.clinic_id, { status: "with_doctor" }),
      appointmentRepo.findByClinicId(user.clinic_id, { status: "tests_in_progress" }),
    ])

    const appointments = [...withDoctorAppointments, ...testsInProgressAppointments]

    // Enrich with patient info and check for existing assessments
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const [patient, assessment] = await Promise.all([
          patientRepo.findById(appointment.patient_id).catch(() => null),
          assessmentRepo.findByAppointmentId(appointment.id),
        ])

        return {
          ...appointment,
          patient,
          hasAssessment: !!assessment && assessment.status !== "cancelled",
          assessmentStatus: assessment?.status || null,
          assessmentId: assessment?.id || null,
        }
      })
    )

    return { success: true, appointments: enrichedAppointments, error: null }
  } catch (error) {
    console.error("Error fetching appointments for assessment:", error)
    return { success: false, appointments: [], error: (error as Error).message }
  }
  
}



