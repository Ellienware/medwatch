//lib/actions/certificate-actions.ts
"use server"

import { 
  getCertificateRepository, 
  getAppointmentRepository, 
  getPatientRepository, 
  getClinicRepository, 
  getUserRepository, 
  getEmployerRepository, 
  getTestResultRepository, 
  getClinicalTestRepository 
} from "@/lib/repositories"

import { revalidatePath } from "next/cache"
import type { Certificate, Appointment, Patient, Clinic, User, CertificateType, CertificateSettings, TestResult } from "@/lib/types/database"
import { FitnessCertificateGenerator } from "@/lib/pdf/fitness-certificate-generator"
import { CertificateSettingsService } from "@/lib/services/certificate-settings-service"
import { ValidationService } from "@/lib/services/validation-service"
import { serverStorageService } from "@/lib/storage/storage-service"
import { getCurrentUser } from "@/lib/auth/actions"
import { emailService } from "@/lib/email/email-service"
import { format, addYears } from "date-fns"
import { Query } from "appwrite"
import { FitnessCertificateTransformer } from "@/lib/pdf/fitness-certificate-transformer"
import { z } from "zod"
import { logger } from "@/lib/services/logging-service"
import { cache } from "@/lib/services/cache-service"
import { performanceMonitor } from "../services/perfomance-service"
import { clinicalRulesEngine } from "@/lib/services/clinical-rules-engine"
import type { RulesEngineSummary, FitnessDecision } from "@/lib/types/database"
import { certificateTypeToFitnessDecision, fitnessDecisionToFitnessStatus } from "../utils/fitness-mapping"
import { DateFormatter } from "../utils/date-formatter"
import { TestResultsService } from "../services/test-results-service"

// Validation schemas
const certificateSchema = z.object({
  appointment_id: z.string().min(1, "Appointment ID is required"),
  certificate_type: z.enum(["fit_to_work", "unfit_to_work", "fit_with_restrictions"]),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  settings_override: z.any().optional().nullable(),
  // Add new fields for rules engine integration
  doctor_decision_override: z.boolean().optional().default(false),
  override_reason: z.string().optional().nullable(),
})

const updateCertificateSchema = z.object({
  id: z.string().min(1, "Certificate ID is required"),
  certificate_type: z.enum(["fit_to_work", "unfit_to_work", "fit_with_restrictions"]),
  diagnosis: z.string().optional().nullable(),
  restrictions: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  settings_override: z.any().optional().nullable()
})

const emailCertificateSchema = z.object({
  certificateId: z.string().min(1, "Certificate ID is required"),
  recipientType: z.enum(["patient", "employer", "both"]).optional().default("both")
})

// Helper functions
function getCertificateTypeText(type: CertificateType): string {
  switch (type) {
    case 'fit_to_work': return 'Fit to Work'
    case 'unfit_to_work': return 'Unfit to Work'
    case 'fit_with_restrictions': return 'Fit with Restrictions'
    default: return type
  }
}

function determineMedicalType(appointmentType: string = ''): 'pre_employment' | 'annual' | 'exit' | 'transfer' {
  const type = appointmentType.toLowerCase();
  
  if (type.includes('pre') || type.includes('employment')) return 'pre_employment';
  if (type.includes('annual') || type.includes('regular')) return 'annual';
  if (type.includes('exit') || type.includes('termination')) return 'exit';
  if (type.includes('transfer') || type.includes('relocation')) return 'transfer';
  
  return 'annual';
}

function formatDateForDisplay(dateString: string): string {
  try {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    logger.warn('Failed to format date', { dateString })
    return dateString
  }
}



function formatDateForStorage(dateString: string): string {
  try {
    return format(new Date(dateString), "yyyy-MM-dd")
  } catch {
    logger.warn('Failed to format date for storage', { dateString })
    return format(new Date(), "yyyy-MM-dd")
  }
}




function mapFitnessDecisionToFitnessStatus(decision: FitnessDecision): "fit" | "fit_with_conditions" | "fit_with_restrictions" | "temporarily_unfit" {
  switch (decision) {
    case "fit":
      return "fit"
    case "fit_with_conditions":
      return "fit_with_conditions"
    case "fit_with_restrictions":
      return "fit_with_restrictions"
    case "temporarily_unfit":
    case "permanently_unfit":
      return "temporarily_unfit"
    default:
      return "fit"
  }
}

function mapCertificateTypeToFitnessDecision(
  type: CertificateType
): FitnessDecision {
  switch (type) {
    case "fit_to_work":
      return "fit"
    case "unfit_to_work":
      return "temporarily_unfit"
    case "fit_with_restrictions":
      return "fit_with_restrictions"
    default:
      return "fit"
  }
}
// Main certificate creation function
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  private readonly LIMIT = 10
  private readonly WINDOW_MS = 60000

  check(userId: string): boolean {
    const now = Date.now()
    const userRequest = this.requests.get(userId)
    if (!userRequest || now > userRequest.resetTime) {
      this.requests.set(userId, { count: 1, resetTime: now + this.WINDOW_MS })
      return true
    }
    if (userRequest.count >= this.LIMIT) return false
    userRequest.count++
    return true
  }
}
const rateLimiter = new RateLimiter()

/**
 * Create a new fitness certificate
 * Reuses rules engine summary from assessment if available
 */
export async function createCertificate(data: Partial<Certificate> & {
  sent_to_patient?: boolean
  status?: "draft" | "issued" | "revoked" | "expired"
  settings_override?: CertificateSettings
  doctor_decision_override?: boolean
  override_reason?: string | null
}) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.clinic_id) {
      return { success: false, certificate: null, error: "User is not associated with a clinic" }
    }

    // Rate limiting
    if (!rateLimiter.check(currentUser.id)) {
      return { success: false, certificate: null, error: "Too many requests. Please try again later." }
    }

    // Validate input
    const validationResult = certificateSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        certificate: null,
        error: validationResult.error.errors.map(e => e.message).join(', ')
      }
    }

    // Repositories
    const certificateRepo = getCertificateRepository()
    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const testResultRepo = getTestResultRepository()
    const clinicalTestRepo = getClinicalTestRepository()
    const employerRepo = getEmployerRepository()
    const settingsService = new CertificateSettingsService()

    // Fetch appointment
    const appointment = await appointmentRepo.findById(data.appointment_id!)
    if (!appointment) {
      return { success: false, certificate: null, error: "Appointment not found" }
    }

    // Fetch patient
    const patient = await patientRepo.findById(appointment.patient_id)
    if (!patient) {
      return { success: false, certificate: null, error: "Patient not found" }
    }

    // Fetch clinic
    const clinic = await clinicRepo.findById(currentUser.clinic_id)
    if (!clinic) {
      return { success: false, certificate: null, error: "Clinic not found" }
    }

    // Fetch test results
    const testResults = await testResultRepo.findByAppointmentId(data.appointment_id!)
    const enrichedTestResults = await Promise.all(
    testResults.map(async (tr) => {
    // Determine test name: use existing, fetch by code, or default
    let testName = tr.test_name;
    if (!testName && tr.test_code) {
      testName = await getTestName(tr.test_code, currentUser.clinic_id!);
    }
    if (!testName) {
      testName = 'Unknown Test';
    }

    return {
      ...tr,
      test_name: testName,
      results: TestResultsService.parseResults(tr),
    };
  })
);

    // --- Rules engine: reuse from assessment if possible ---
    let rulesEvaluation = data.rules_evaluation
    let engineConfidence = data.evaluation_confidence
    let suggestedDecision = data.suggested_fitness_decision

    if (!rulesEvaluation && data.appointment_id) {
      try {
        const assessmentRepo = (await import('@/lib/repositories')).getAssessmentRepository()
        const assessment = await assessmentRepo.findByAppointmentId(data.appointment_id)
        if (assessment?.rules_engine_summary) {
          rulesEvaluation = assessment.rules_engine_summary
          engineConfidence = assessment.rules_engine_summary.overallConfidence
          suggestedDecision = assessment.rules_engine_summary.overallSuggestedDecision
          logger.info('Reusing rules engine summary from assessment', {
            assessmentId: assessment.id,
            certificateNumber: data.certificate_number,
          })
        }
      } catch (error) {
        logger.warn('Could not fetch assessment for rules engine reuse', { error })
      }
    }

    // Only run rules engine if still missing and we have test results
    if (!rulesEvaluation && enrichedTestResults.length > 0) {
      rulesEvaluation = clinicalRulesEngine.evaluate(enrichedTestResults as TestResult[])
      engineConfidence = rulesEvaluation.overallConfidence
      suggestedDecision = rulesEvaluation.overallSuggestedDecision
    }

    // Determine doctor's fitness decision from certificate type
    const doctorDecision = certificateTypeToFitnessDecision(data.certificate_type!)
    const isDoctorOverride = suggestedDecision ? doctorDecision !== suggestedDecision : false

    // Generate certificate number if not provided
    let certificateNumber = data.certificate_number
    if (!certificateNumber) {
      certificateNumber = await certificateRepo.generateCertificateNumber(currentUser.clinic_id)
    }

    // Format dates
    const now = new Date()
    const issueDate = DateFormatter.formatForDatabase(now)
    const validFrom = data.valid_from || issueDate
    const validUntil = data.valid_until || DateFormatter.addDays(now, 365)

    // Determine medical type
    const medicalType = appointment.appointment_type?.includes('pre') ? 'pre_employment'
      : appointment.appointment_type?.includes('exit') ? 'exit'
      : appointment.appointment_type?.includes('transfer') ? 'transfer'
      : 'annual'

    // Prepare certificate data
    const certificateData: Partial<Certificate> = {
      ...data,
      clinic_id: currentUser.clinic_id,
      patient_id: patient.id,
      appointment_id: data.appointment_id!,
      certificate_number: certificateNumber,
      issue_date: issueDate,
      exam_date: appointment.appointment_date || issueDate,
      valid_from: validFrom,
      valid_until: validUntil,
      issued_by: currentUser.id,
      doctor_name: currentUser.full_name,
      doctor_registration_number: currentUser.professional_registration_number || null,
      sent_to_employer: false,
      sent_to_patient: false,
      sent_at: null,
      status: data.status || "issued",
      medical_type: medicalType,
      fitness_status: fitnessDecisionToFitnessStatus(doctorDecision),

      // Rules engine data
      rules_evaluation: rulesEvaluation,
      suggested_fitness_decision: suggestedDecision,
      evaluation_confidence: engineConfidence,
      doctor_decision_override: data.doctor_decision_override || isDoctorOverride,
      override_reason: data.override_reason || (isDoctorOverride ? "Clinical discretion applied" : null),

      // Test results
      test_results: enrichedTestResults,
    }

    // Validate certificate data
    const validation = ValidationService.validateCertificateData(certificateData)
    if (!validation.valid) {
      return { success: false, certificate: null, error: validation.errors.join(', ') }
    }

    // Create certificate record
    const certificate = await certificateRepo.create(certificateData)

    // --- PDF Generation ---
    let pdfUrl: string | null = null
    try {
      const certificateSettings = await settingsService.getCertificateSettings(
        currentUser.clinic_id,
        data.settings_override
      )

      const settingsValidation = ValidationService.validateCertificateSettings(certificateSettings)
      if (!settingsValidation.valid) {
        throw new Error(`Invalid certificate settings: ${settingsValidation.errors.join(', ')}`)
      }

      // Transform data for PDF (using transformer that internally uses test results service)
      const { FitnessCertificateTransformer } = await import('@/lib/pdf/fitness-certificate-transformer')
      const fitnessData = FitnessCertificateTransformer.transform(
        certificate,
        patient,
        clinic,
        enrichedTestResults as TestResult[]
      )

      const generator = new FitnessCertificateGenerator(certificateSettings)
      const pdfBuffer = generator.generateCertificate(fitnessData)

      const fileName = `fitness_certificate_${certificate.certificate_number}_${Date.now()}.pdf`
      const pdfUint8Array = new Uint8Array(pdfBuffer)
      const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })

      const uploadedFile = await serverStorageService.uploadFile(file, { prefix: "CERTIFICATES" as const })
      pdfUrl = uploadedFile.fileUrl

      await certificateRepo.update(certificate.id, { pdf_url: pdfUrl })
    } catch (pdfError) {
      logger.error('PDF generation failed, certificate created without PDF', { certificateId: certificate.id, pdfError })
    }

    // --- Email sending (optional) ---
    let emailsSent = { patient: false, employer: false }
    if (pdfUrl) {
      // Send to patient
      if (patient.email) {
        try {
          const result = await emailService.sendCertificateEmail(patient.email, {
            patientName: `${patient.first_name} ${patient.last_name}`,
            certificateNumber: certificate.certificate_number!,
            certificateType: certificate.certificate_type!,
            issueDate: DateFormatter.formatForDisplay(certificate.issue_date!),
            expiryDate: certificate.valid_until ? DateFormatter.formatForDisplay(certificate.valid_until) : undefined,
            doctorName: certificate.doctor_name!,
            clinicName: clinic.name,
            downloadUrl: pdfUrl,
            isComputerAssisted: !!rulesEvaluation,
            confidence: engineConfidence ?? undefined, 
          })
          if (result.success) {
            emailsSent.patient = true
            await certificateRepo.update(certificate.id, { sent_to_patient: true, sent_at: new Date().toISOString() })
          }
        } catch (emailError) {
          logger.error('Failed to send email to patient', { certificateId: certificate.id, emailError })
        }
      }

      // Send to employer
      if (patient.employer_id && patient.employer_id !== 'none') {
        try {
          const employer = await employerRepo.findById(patient.employer_id)
          if (employer?.email && (employer.auto_receive_certificates || employer.portal_enabled)) {
            const result = await emailService.sendCertificateEmail(employer.email, {
              patientName: `${patient.first_name} ${patient.last_name}`,
              certificateNumber: certificate.certificate_number!,
              certificateType: certificate.certificate_type!,
              issueDate: DateFormatter.formatForDisplay(certificate.issue_date!),
              expiryDate: certificate.valid_until ? DateFormatter.formatForDisplay(certificate.valid_until) : undefined,
              doctorName: certificate.doctor_name!,
              clinicName: clinic.name,
              downloadUrl: pdfUrl,
              employerName: employer.company_name,
              isComputerAssisted: !!rulesEvaluation,
            })
            if (result.success) {
              emailsSent.employer = true
              await certificateRepo.update(certificate.id, { sent_to_employer: true })
            }
          }
        } catch (emailError) {
          logger.error('Failed to send email to employer', { certificateId: certificate.id, emailError })
        }
      }
    }

    logger.info('Certificate created successfully', {
      certificateId: certificate.id,
      certificateNumber: certificate.certificate_number,
      patientId: patient.id,
      emailsSent,
    })

    revalidatePath("/clinic/certificates")

    return {
      success: true,
      certificate,
      error: null,
      message: "Certificate created successfully.",
      emailsSent,
      certificateType: 'fitness',
      settingsApplied: await settingsService.getCertificateSettings(currentUser.clinic_id),
      rulesEvaluation,
    }

  } catch (error) {
    logger.error('Error creating certificate', { error })
    return {
      success: false,
      certificate: null,
      error: error instanceof Error ? error.message : "Failed to create certificate",
    }
  }
}

// Update certificate function
export async function updateCertificateAction(data: {
  id: string
  certificate_type: "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"
  diagnosis?: string
  restrictions?: string
  recommendations?: string
  valid_from?: string
  valid_until?: string
  test_results?: any[]
  settings_override?: CertificateSettings
}) {
  const startTime = Date.now()
  
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      logger.error('User not associated with clinic', { userId: user?.id })
      return { 
        success: false, 
        certificate: null, 
        error: "User is not associated with a clinic",
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

    // Rate limiting
    if (!rateLimiter.check(user.id)) {
      logger.warn('Rate limit exceeded', { userId: user.id })
      return { 
        success: false, 
        certificate: null, 
        error: "Too many requests. Please try again later.",
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

    // Validate input
    const validationResult = updateCertificateSchema.safeParse(data)
    if (!validationResult.success) {
      logger.warn('Certificate update validation failed', { 
        userId: user.id, 
        errors: validationResult.error.errors 
      })
      return { 
        success: false, 
        certificate: null, 
        error: validationResult.error.errors.map(e => e.message).join(', '),
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

    const certificateRepo = getCertificateRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const testResultRepo = getTestResultRepository()
    const clinicalTestRepo = getClinicalTestRepository()
    const settingsService = new CertificateSettingsService()

    // Get existing certificate
    const existingCertificate = await performanceMonitor.measure(
      'fetch_existing_certificate',
      () => certificateRepo.findById(data.id)
    )
    
    if (!existingCertificate) {
      logger.error('Certificate not found', { certificateId: data.id })
      return { 
        success: false, 
        certificate: null, 
        error: "Certificate not found",
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

    // Verify access
    if (existingCertificate.clinic_id !== user.clinic_id) {
      logger.warn('Unauthorized certificate access', { 
        userId: user.id, 
        certificateId: data.id 
      })
      return { 
        success: false, 
        certificate: null, 
        error: "Unauthorized access",
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

    // Prepare update data
    const updateData: Partial<Certificate> = {
      certificate_type: data.certificate_type,
      diagnosis: data.diagnosis || null,
      restrictions: data.restrictions || null,
      recommendations: data.recommendations || null,
      valid_from: data.valid_from || null,
      valid_until: data.valid_until || null,
      // updated_at: new Date().toISOString(),
    }

    // Add settings override if provided
    if (data.settings_override) {
      updateData.settings_override = data.settings_override
    }

    // Format dates if provided
    if (data.valid_from) {
      updateData.valid_from = formatDateForStorage(data.valid_from)
    }
    if (data.valid_until) {
      updateData.valid_until = formatDateForStorage(data.valid_until)
    }

    // Update certificate
    const updatedCertificate = await performanceMonitor.measure(
      'update_certificate_record',
      () => certificateRepo.update(data.id, updateData)
    )

    logger.info('Certificate record updated', {
      certificateId: updatedCertificate.id,
      userId: user.id,
      changes: Object.keys(updateData)
    })

    // Regenerate PDF with updated data
    try {
      const [patient, clinic] = await Promise.all([
        performanceMonitor.measure(
          'fetch_patient_for_update',
          () => patientRepo.findById(updatedCertificate.patient_id)
        ),
        performanceMonitor.measure(
          'fetch_clinic_for_update',
          () => clinicRepo.findById(updatedCertificate.clinic_id)
        )
      ])

      if (!patient || !clinic) {
        throw new Error("Patient or clinic not found")
      }

      // Get test results
      const testResults = await performanceMonitor.measure(
        'fetch_test_results_for_update',
        () => testResultRepo.findByAppointmentId(updatedCertificate.appointment_id!)
      )
      
      // Enrich test results with test names
      const enrichedTestResults = await Promise.all(
        testResults.map(async (testResult) => {
          let testName = 'Unknown Test'
          
          if (testResult.test_code) {
            try {
              const test = await clinicalTestRepo.findByTestCode(testResult.test_code, user.clinic_id!)
              testName = test?.test_name || 'Unknown Test'
            } catch (error) {
              logger.error('Error fetching test name', { testCode: testResult.test_code, error })
            }
          }
          
          // Parse results if they're strings
          let parsedResults = {}
          if (testResult.results) {
            try {
              parsedResults = typeof testResult.results === 'string' 
                ? JSON.parse(testResult.results || '{}')
                : testResult.results
            } catch (error) {
              logger.error('Error parsing test results', { testId: testResult.id, error })
              parsedResults = {}
            }
          }
          
          return {
            ...testResult,
            test_name: testName,
            results: parsedResults
          }
        })
      )

      // Create certificate object for PDF generation
      const certificateForPDF: Certificate = {
        ...updatedCertificate,
        exam_date: updatedCertificate.exam_date || updatedCertificate.issue_date!,
        medical_type: updatedCertificate.medical_type || 'annual',
        test_results: enrichedTestResults
      }

      // Transform data for fitness certificate
      const fitnessCertificateData = await performanceMonitor.measure(
  'transform_certificate_data',
  async () => await FitnessCertificateTransformer.transform(
    certificateForPDF,
    patient,
    clinic,
    enrichedTestResults
  )
)

      // Validate certificate data
      const validation = ValidationService.validateCertificateData(fitnessCertificateData)
      if (!validation.valid) {
        logger.error('Invalid certificate data for update', { 
          certificateId: updatedCertificate.id,
          errors: validation.errors 
        })
        throw new Error(`Invalid certificate data: ${validation.errors.join(', ')}`)
      }

      // Get certificate settings
      const finalCertificateSettings = await settingsService.getCertificateSettings(
        user.clinic_id,
        updatedCertificate.settings_override
      )

      // Validate settings
      const settingsValidation = ValidationService.validateCertificateSettings(finalCertificateSettings)
      if (!settingsValidation.valid) {
        logger.error('Invalid certificate settings for update', { 
          certificateId: updatedCertificate.id,
          errors: settingsValidation.errors 
        })
        throw new Error(`Invalid certificate settings: ${settingsValidation.errors.join(', ')}`)
      }

      // Regenerate PDF
      const pdfBuffer = await performanceMonitor.measure(
  'generate_pdf',
  async () => {
    const generator = new FitnessCertificateGenerator(finalCertificateSettings)
    return await generator.generateCertificate(fitnessCertificateData) as Buffer
  }
)

      // Upload updated PDF to storage
      const fileName = `fitness_certificate_${updatedCertificate.certificate_number}_${Date.now()}_updated.pdf`
      
const pdfBufferTyped2 = pdfBuffer as Buffer;
const pdfUint8Array2 = new Uint8Array(pdfBufferTyped2);
const file2 = new File([pdfUint8Array2], fileName, { type: "application/pdf" });
      
      const uploadedFile = await performanceMonitor.measure(
        'upload_updated_pdf',
        () => serverStorageService.uploadFile(file2, {
          prefix: "CERTIFICATES" as const
        })
      )

      // Update certificate with new PDF URL
      const finalCertificate = await certificateRepo.update(updatedCertificate.id, {
        pdf_url: uploadedFile.fileUrl,
      })

      // Invalidate cache
      cache.invalidateCertificate(updatedCertificate.id)
      cache.invalidateClinic(user.clinic_id)

      logger.info('Certificate PDF regenerated', {
        certificateId: finalCertificate.id,
        fileUrl: uploadedFile.fileUrl
      })

      const duration = Date.now() - startTime
      logger.info('Certificate update completed', {
        certificateId: finalCertificate.id,
        duration,
        success: true
      })

      return { 
        success: true, 
        certificate: finalCertificate, 
        error: null,
        certificateType: 'fitness',
        settingsApplied: finalCertificateSettings
      }

    } catch (pdfError) {
      logger.error('Error regenerating fitness certificate PDF', {
        certificateId: updatedCertificate.id,
        error: pdfError
      })
      
      // Check if it's a single page constraint error
      if (pdfError instanceof Error && pdfError.message.includes('single page')) {
        return { 
          success: false, 
          certificate: updatedCertificate, 
          error: "Certificate content exceeds single page limit",
          certificateType: 'fitness',
          settingsApplied: null
        }
      }
      
      return { 
        success: true, 
        certificate: updatedCertificate, 
        error: "Certificate updated but PDF regeneration failed",
        certificateType: 'fitness',
        settingsApplied: null
      }
    }

  } catch (error) {
    logger.error('Error updating fitness certificate', { error })
    return { 
      success: false, 
      certificate: null, 
      error: error instanceof Error ? error.message : "Failed to update fitness certificate",
      certificateType: 'fitness',
      settingsApplied: null
    }
  }
}

async function getTestName(testCode: string, clinicId: string): Promise<string> {
  try {
    const clinicalTestRepo = (await import('@/lib/repositories')).getClinicalTestRepository()
    const test = await clinicalTestRepo.findByTestCode(testCode, clinicId)
    return test?.test_name || 'Unknown Test'
  } catch {
    return 'Unknown Test'
  }
}

export async function sendCertificateEmail(certificateId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      logger.error('User not associated with clinic', { userId: user?.id })
      return { 
        success: false, 
        error: "User is not associated with a clinic",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    // Rate limiting
    if (!rateLimiter.check(user.id)) {
      logger.warn('Rate limit exceeded', { userId: user.id })
      return { 
        success: false, 
        error: "Too many requests. Please try again later.",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    const certificateRepo = getCertificateRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const employerRepo = getEmployerRepository()

    // Get certificate with caching
    const certificate = await cache.getCertificateData(
      certificateId,
      () => certificateRepo.findById(certificateId)
    )
    
    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      logger.error('Certificate not found or unauthorized', { 
        certificateId, 
        userId: user.id 
      })
      return { 
        success: false, 
        error: "Certificate not found or unauthorized",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    // Get patient details
    const patient = await patientRepo.findById(certificate.patient_id)
    if (!patient) {
      logger.error('Patient not found', { patientId: certificate.patient_id })
      return { 
        success: false, 
        error: "Patient not found",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    // Get clinic details
    const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
      logger.error('Clinic not found', { clinicId: user.clinic_id })
      return { 
        success: false, 
        error: "Clinic not found",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    // Check if certificate has PDF URL
    if (!certificate.pdf_url) {
      logger.error('Certificate PDF not available', { certificateId })
      return { 
        success: false, 
        error: "Certificate PDF not available",
        emailsSent: { patient: false, employer: false },
        certificateType: 'fitness'
      }
    }

    let emailsSent = {
      patient: false,
      employer: false
    }
    let errors: string[] = []

    // Send email to patient
    if (patient.email) {
      try {
        const certificateTypeText = getCertificateTypeText(certificate.certificate_type)

        const emailResult = await emailService.sendCertificateEmail(patient.email, {
          patientName: `${patient.first_name} ${patient.last_name}`,
          certificateNumber: certificate.certificate_number,
          certificateType: certificateTypeText,
          issueDate: formatDateForDisplay(certificate.issue_date),
          expiryDate: certificate.valid_until ? formatDateForDisplay(certificate.valid_until) : undefined,
          doctorName: certificate.doctor_name,
          clinicName: clinic.name,
          downloadUrl: certificate.pdf_url,
        })

        if (emailResult.success) {
          emailsSent.patient = true
          await certificateRepo.update(certificate.id, {
            sent_to_patient: true,
            sent_at: new Date().toISOString()
          })
          logger.info('Email sent to patient', { certificateId })
        } else {
          errors.push(`Failed to send to patient: ${emailResult.error}`)
          logger.warn('Failed to send email to patient', { 
            certificateId, 
            error: emailResult.error 
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to send to patient: ${errorMessage}`)
        logger.error('Exception sending email to patient', { 
          certificateId, 
          error 
        })
      }
    } else {
      errors.push("Patient has no email address")
      logger.warn('Patient has no email address', { certificateId })
    }

    // Send email to employer
    if (patient.employer_id && patient.employer_id !== 'none') {
      try {
        const employer = await employerRepo.findById(patient.employer_id)
        
        if (employer && employer.email && (employer.auto_receive_certificates || employer.portal_enabled)) {
          const certificateTypeText = getCertificateTypeText(certificate.certificate_type)

          const emailResult = await emailService.sendCertificateEmail(employer.email, {
            patientName: `${patient.first_name} ${patient.last_name}`,
            certificateNumber: certificate.certificate_number,
            certificateType: certificateTypeText,
            issueDate: formatDateForDisplay(certificate.issue_date),
            expiryDate: certificate.valid_until ? formatDateForDisplay(certificate.valid_until) : undefined,
            doctorName: certificate.doctor_name,
            clinicName: clinic.name,
            downloadUrl: certificate.pdf_url,
            employerName: employer.company_name,
          })

          if (emailResult.success) {
            emailsSent.employer = true
            await certificateRepo.update(certificate.id, {
              sent_to_employer: true,
              sent_at: new Date().toISOString()
            })
            logger.info('Email sent to employer', { certificateId })
          } else {
            errors.push(`Failed to send to employer: ${emailResult.error}`)
            logger.warn('Failed to send email to employer', { 
              certificateId, 
              error: emailResult.error 
            })
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Failed to send to employer: ${errorMessage}`)
        logger.error('Exception sending email to employer', { 
          certificateId, 
          error 
        })
      }
    }

    // Invalidate cache
    cache.invalidateCertificate(certificateId)

    revalidatePath("/clinic/certificates")
    revalidatePath(`/clinic/certificates/${certificateId}`)

    const success = emailsSent.patient || emailsSent.employer
    const message = success 
      ? `Email${emailsSent.patient && emailsSent.employer ? 's' : ''} sent successfully${emailsSent.patient && emailsSent.employer ? ' to both patient and employer' : emailsSent.patient ? ' to patient' : ' to employer'}.`
      : 'Failed to send emails.'

    logger.info('Email sending completed', {
      certificateId,
      emailsSent,
      success,
      errors: errors.length > 0 ? errors : undefined
    })

    return { 
      success, 
      certificate: await certificateRepo.findById(certificateId),
      error: errors.length > 0 ? errors.join('; ') : null,
      message,
      emailsSent,
      certificateType: 'fitness'
    }
  } catch (error) {
    logger.error("Error sending certificate email:", error)
    return { 
      success: false, 
      certificate: null, 
      error: error instanceof Error ? error.message : "Failed to send certificate email",
      message: null,
      emailsSent: { patient: false, employer: false },
      certificateType: 'fitness'
    }
  }
}

export async function updateCertificateStatus(id: string, status: "draft" | "issued" | "revoked" | "expired") {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, certificate: null, error: "User not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    
    // Verify certificate exists and user has access
    const certificate = await certificateRepo.findById(id)
    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      return { success: false, certificate: null, error: "Certificate not found or unauthorized" }
    }

    // Update status
    const updatedCertificate = await certificateRepo.update(id, { 
      status,
      // updated_at: new Date().toISOString()
    })

    // Invalidate cache
    cache.invalidateCertificate(id)
    cache.invalidateClinic(user.clinic_id)

    logger.info('Certificate status updated', {
      certificateId: id,
      oldStatus: certificate.status,
      newStatus: status,
      userId: user.id
    })

    revalidatePath("/clinic/certificates")
    return { success: true, certificate: updatedCertificate, error: null }
  } catch (error) {
    logger.error("Error updating certificate status:", { certificateId: id, error })
    return { 
      success: false, 
      certificate: null, 
      error: (error as Error).message 
    }
  }
}

// Helper function to get completed appointments
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
          logger.error("Error fetching patient for appointment:", { appointmentId: appointment.id, error })
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
    logger.error("Error fetching completed appointments:", error)
    return { 
      success: false, 
      appointments: [], 
      error: (error as Error).message 
    }
  }
}

export async function previewCertificateWithSettings(
  certificateId: string,
  previewSettings: CertificateSettings
) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, error: "User is not associated with a clinic" }
    }

    // Rate limiting
    if (!rateLimiter.check(user.id)) {
      return { 
        success: false, 
        error: "Too many requests. Please try again later.",
        previewUrl: null
      }
    }

    const certificateRepo = getCertificateRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const testResultRepo = getTestResultRepository()
    const clinicalTestRepo = getClinicalTestRepository()
    const settingsService = new CertificateSettingsService()

    // Get certificate
    const certificate = await certificateRepo.findById(certificateId)
    if (!certificate) {
      return { success: false, error: "Certificate not found", previewUrl: null }
    }

    // Verify access
    if (certificate.clinic_id !== user.clinic_id) {
      return { success: false, error: "Unauthorized access", previewUrl: null }
    }

    // Get patient and clinic
    const [patient, clinic] = await Promise.all([
      patientRepo.findById(certificate.patient_id),
      clinicRepo.findById(certificate.clinic_id),
    ])

    if (!patient || !clinic) {
      return { success: false, error: "Patient or clinic not found", previewUrl: null }
    }

    // Get test results
    const testResults = await testResultRepo.findByAppointmentId(certificate.appointment_id!)
    const enrichedTestResults = await Promise.all(
      testResults.map(async (testResult) => {
        let testName = 'Unknown Test'
        if (testResult.test_code) {
          try {
            const test = await clinicalTestRepo.findByTestCode(testResult.test_code, user.clinic_id!)
            testName = test?.test_name || 'Unknown Test'
          } catch (error) {
            logger.error('Error fetching test name:', { testCode: testResult.test_code, error })
          }
        }
        return {
          ...testResult,
          test_name: testName
        }
      })
    )

    // Transform data
    const fitnessCertificateData = FitnessCertificateTransformer.transform(
      certificate,
      patient,
      clinic,
      enrichedTestResults
    )

    // Get final settings (clinic defaults + preview overrides)
    const finalSettings = await settingsService.getCertificateSettings(
      user.clinic_id,
      previewSettings
    )

    // Validate settings
    const settingsValidation = ValidationService.validateCertificateSettings(finalSettings)
    if (!settingsValidation.valid) {
      return { 
        success: false, 
        error: `Invalid preview settings: ${settingsValidation.errors.join(', ')}`,
        previewUrl: null
      }
    }

    // Generate preview PDF
    const generator = new FitnessCertificateGenerator(finalSettings)
    const pdfBuffer = generator.generateCertificate(fitnessCertificateData)

    // Upload preview to temporary storage
    const fileName = `certificate_preview_${certificate.certificate_number}_${Date.now()}.pdf`
    const pdfUint8Array = new Uint8Array(pdfBuffer)
    const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })
    
    const uploadedFile = await serverStorageService.uploadFile(file, {
      prefix: "CERTIFICATES" as const
    })

    logger.info('Certificate preview generated', {
      certificateId,
      previewUrl: uploadedFile.fileUrl
    })

    return {
      success: true,
      previewUrl: uploadedFile.fileUrl,
      settings: finalSettings,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

  } catch (error) {
    logger.error("Error generating certificate preview:", { certificateId, error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate preview",
      previewUrl: null
    }
  }
}

// Also export a simpler version if needed:
export async function updateCertificate(data: {
  id: string
  certificate_type: "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"
  diagnosis?: string
  restrictions?: string
  recommendations?: string
  valid_from?: string
  valid_until?: string
  settings_override?: CertificateSettings
}) {
  return updateCertificateAction(data)
}

export async function getCertificateById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, certificate: null, error: "User not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    
    // Use cache for certificate data
    const certificate = await cache.getCertificateData(
      id,
      () => certificateRepo.findById(id)
    )

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      return { success: false, certificate: null, error: "Certificate not found or unauthorized" }
    }

    return { 
      success: true, 
      certificate, 
      error: null,
      certificateType: 'fitness'
    }
  } catch (error) {
    logger.error("Error fetching certificate:", { certificateId: id, error })
    return { success: false, certificate: null, error: (error as Error).message }
  }
}

export async function getCertificatesByPatient(patientId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, certificates: [], error: "User not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const certificates = await certificateRepo.findByPatientId(patientId)

    // Filter by clinic_id for security
    const clinicCertificates = certificates.filter(cert => cert.clinic_id === user.clinic_id)

    return { success: true, certificates: clinicCertificates, error: null }
  } catch (error) {
    logger.error("Error fetching patient certificates:", { patientId, error })
    return { success: false, certificates: [], error: (error as Error).message }
  }
}

export async function resendCertificateEmails(certificateId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, error: "User is not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(certificateId)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      return { success: false, error: "Certificate not found or unauthorized" }
    }

    // Check if certificate has PDF URL
    if (!certificate.pdf_url) {
      return { success: false, error: "Certificate PDF not available" }
    }

    // Send emails using the existing sendCertificateEmail function
    const result = await sendCertificateEmail(certificateId)

    revalidatePath("/clinic/certificates")
    revalidatePath(`/clinic/certificates/${certificateId}`)

    return result
  } catch (error) {
    logger.error("Error resending certificate emails:", { certificateId, error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to resend emails",
      emailsSent: { patient: false, employer: false },
      certificateType: 'fitness'
    }
  }
}

export async function deleteCertificate(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(id)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      throw new Error("Certificate not found or unauthorized")
    }

    // Only allow deleting certificates that haven't been sent
    if (certificate.sent_to_patient || certificate.sent_to_employer) {
      throw new Error("Cannot delete certificate that has been sent")
    }

    // Delete the certificate
    await certificateRepo.delete(id)

    // Invalidate cache
    cache.invalidateCertificate(id)
    cache.invalidateClinic(user.clinic_id)

    logger.info('Certificate deleted', {
      certificateId: id,
      userId: user.id
    })

    revalidatePath("/clinic/certificates")
    return { success: true, error: null }
  } catch (error) {
    logger.error("Error deleting certificate:", { certificateId: id, error })
    return { success: false, error: (error as Error).message }
  }
}

export async function bulkSendCertificates(certificateIds: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { 
        success: false, 
        results: [], 
        error: "User not associated with a clinic" 
      }
    }

    // Rate limiting for bulk operations
    if (!rateLimiter.check(user.id)) {
      return { 
        success: false, 
        results: [], 
        error: "Too many requests. Please try again later." 
      }
    }

    const results = await Promise.allSettled(
      certificateIds.map(id => sendCertificateEmail(id))
    )

    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length

    const failedCount = results.length - successCount

    logger.info('Bulk certificate email sending completed', {
      total: results.length,
      success: successCount,
      failed: failedCount,
      userId: user.id
    })

    revalidatePath("/clinic/certificates")

    return {
      success: true,
      results: results.map((r, i) => ({
        certificateId: certificateIds[i],
        success: r.status === 'fulfilled' ? r.value.success : false,
        error: r.status === 'rejected' ? (r.reason as Error).message : 
               (r.status === 'fulfilled' && !r.value.success) ? r.value.error : undefined
      })),
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      }
    }
  } catch (error) {
    logger.error("Error in bulk certificate sending:", error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : "Failed to send certificates"
    }
  }
}
