// lib/actions/test-result-actions.ts - UPDATED WITH ENCRYPTION
"use server"

import { getCurrentUser } from "@/lib/auth/actions"
import { 
  getAppointmentRepository, 
  getClinicalTestRepository, 
  getClinicRepository, 
  getPatientRepository
} from "@/lib/repositories"
import { revalidatePath } from "next/cache"
import type { TestResult } from "@/lib/types/database"
import { notificationService } from "@/lib/notifications/notification-service"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { TestValidationService } from "../services/test-validation-service"
import { secureTestResultService } from "@/lib/services/secure-test-result-service" // ADD THIS
import { securePatientService } from "@/lib/services/secure-patient-service"

export async function createTestResult(data: Partial<TestResult>) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // 1. VALIDATE CLINIC SUBSCRIPTION
    const clinicRepo = getClinicRepository()
    const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
      throw new Error("Clinic not found")
    }
    
    const allowedStatuses = ['active', 'trial']
    const currentStatus = clinic.subscription_status || 'unknown'
    
    if (!allowedStatuses.includes(currentStatus)) {
      throw new Error(`Clinic subscription is ${currentStatus}. Please contact support.`)
    }

    // 2. GET TEST DETAILS
    const clinicalTestRepo = getClinicalTestRepository()
    const test = await clinicalTestRepo.findByTestCode(data.test_code!, user.clinic_id)
    
    if (!test) {
      throw new Error(`Test ${data.test_code} not found`)
    }

    // 3. VALIDATE TEST RESULTS MEDICALLY
    const validation = TestValidationService.validateTestResult(
      data.test_code!,
      data.results || {}
    )
    
    if (!validation.isValid) {
      throw new Error(`Invalid test results: ${validation.warnings.join(', ')}`)
    }

    // 4. GET PATIENT FOR GENDER-SPECIFIC VALIDATION
    const patientRepo = getPatientRepository()
    const patient = data.patient_id 
      ? await patientRepo.findById(data.patient_id).catch(() => null)
      : null
    
    const patientGender = patient?.gender as 'male' | 'female' | undefined

    // 5. CHECK FOR SENSITIVE TESTS
    const isSensitive = TestValidationService.isSensitiveTest(data.test_code!)
    if (isSensitive && !['doctor', 'nurse', 'clinic_admin'].includes(user.role)) {
      throw new Error("Unauthorized: Only medical staff can record sensitive tests")
    }

    // 6. CREATE TEST RESULT USING SECURE SERVICE
    const testResultData = {
      clinic_id: user.clinic_id,
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      is_normal: validation.isNormal,
      results: validation.normalizedResults,
      is_sensitive: isSensitive,
      test_price: test.price,
      validation_warnings: validation.warnings,
      requires_review: validation.requiresReview,
      // Include all original data (will be encrypted by secure service)
      ...data,
    }

    // REPLACE: Direct repository call with secure service
    // const testResultRepo = getTestResultRepository()
    // const testResult = await testResultRepo.create(testResultData)

    // USE: Secure service (auto-encrypts sensitive fields)
    const testResult = await secureTestResultService.create(testResultData)

    // 7. UPDATE APPOINTMENT STATUS
    if (data.appointment_id) {
      const appointmentRepo = getAppointmentRepository()
      await appointmentRepo.update(data.appointment_id, {
        status: "tests_in_progress",
        last_test_at: new Date().toISOString(),
        requires_doctor_review: validation.requiresReview || !validation.isNormal
      })
    }

    // 8. SEND NOTIFICATIONS
    if (validation.requiresReview || !validation.isNormal) {
      await notificationService.createNotification(
        user.id,
        user.clinic_id,
        "test_result_requires_review",
        "Test Result Requires Review",
        `Test ${test.test_name} requires medical review`,
        {
          priority: validation.requiresReview ? "high" : "medium",
          link: `/clinic/tests/${testResult.id}`,
          data: {
            testResultId: testResult.id,
            testName: test.test_name,
            appointmentId: data.appointment_id,
            isAbnormal: !validation.isNormal,
            isCritical: validation.requiresReview,
            requires_acknowledgement: validation.requiresReview
          }
        }
      )
    }

    // 9. AUDIT LOG
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "test_result",
      entityId: testResult.id,
      action: "CREATE",
      changes: {
        test_code: data.test_code,
        is_normal: validation.isNormal,
        requires_review: validation.requiresReview,
        is_sensitive: isSensitive
      },
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_id: data.patient_id,
        appointment_id: data.appointment_id,
        test_name: test.test_name,
        validation_warnings: validation.warnings.length,
        is_sensitive_test: isSensitive,
        via_secure_service: true
      }
    })

    revalidatePath("/clinic/tests")
    if (data.appointment_id) {
      revalidatePath(`/clinic/appointments/${data.appointment_id}`)
    }

    return { 
      success: true, 
      testResult, 
      warnings: validation.warnings,
      isNormal: validation.isNormal,
      requiresReview: validation.requiresReview,
      error: null 
    }
  } catch (error) {
    console.error("Error creating test result:", error)
    
    // Log failed attempt
    const user = await getCurrentUser().catch(() => null)
    if (user) {
      await MedicalAudit.logFailedAction({
        userId: user.id,
        userRole: user.role || 'unknown',
        clinicId: user.clinic_id || 'unknown',
        entityType: "test_result",
        entityId: 'unknown',
        action: "CREATE_FAILED",
        errorMessage: (error as Error).message,
        ipAddress: null,
        userAgent: null,
        metadata: {
          test_code: data.test_code,
          attempted_at: new Date().toISOString(),
          error_type: error instanceof Error ? error.message : 'unknown'
        }
      })
    }
    
    return { 
      success: false, 
      testResult: null, 
      error: (error as Error).message 
    }
  }
}

export async function getTestResultById(id: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return { 
        success: false, 
        testResult: null, 
        error: "Unauthorized - No clinic access" 
      }
    }

    // REPLACE: Direct repository call
    // const testResultRepo = getTestResultRepository()
    // const testResult = await testResultRepo.findById(id)

    // USE: Secure service (auto-decrypts based on user role)
    const testResult = await secureTestResultService.read(id)
    
    return { 
      success: true, 
      testResult, 
      error: null 
    }
  } catch (error: any) {
    console.error("Error fetching test result:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to view this test result"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Test result not found"
    }
    
    return { 
      success: false, 
      testResult: null, 
      error: errorMessage 
    }
  }
}

// Add this function to lib/actions/test-result-actions.ts
export async function createMultipleTestResults(testsData: Partial<TestResult>[]) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // 1. VALIDATE CLINIC SUBSCRIPTION
    const clinicRepo = getClinicRepository()
    const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
      throw new Error("Clinic not found")
    }
    
    const allowedStatuses = ['active', 'trial']
    const currentStatus = clinic.subscription_status || 'unknown'
    
    if (!allowedStatuses.includes(currentStatus)) {
      throw new Error(`Clinic subscription is ${currentStatus}. Please contact support.`)
    }

    // 2. Process each test
    const results = await Promise.allSettled(
      testsData.map(testData => createTestResult(testData))
    )

    // 3. Count successes and failures
    const created = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    return { 
      success: true, 
      created, 
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Failed to create test result' })
    }
  } catch (error) {
    console.error("Error creating multiple test results:", error)
    return { 
      success: false, 
      created: 0, 
      failed: testsData.length,
      results: [],
      error: (error as Error).message 
    }
  }
}

export async function updateTestResult(id: string, data: Partial<TestResult>) {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Check user role for update permissions
    const allowedRoles = ['doctor', 'nurse', 'clinic_admin']
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Only medical staff can update test results")
    }

    // REPLACE: Direct repository call
    // const testResultRepo = getTestResultRepository()
    // const existingTestResult = await testResultRepo.findById(id)

    // USE: Secure service to get existing test result
    const existingTestResult = await secureTestResultService.read(id)

    // Validate if sensitive test can be updated by this user
    if (existingTestResult.is_sensitive && !['doctor', 'clinic_admin'].includes(user.role)) {
      throw new Error("Only doctors and clinic admins can update sensitive test results")
    }

    // USE: Secure service for update
    const testResult = await secureTestResultService.update(id, data)

    // AUDIT LOG
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "test_result",
      entityId: id,
      action: "UPDATE",
      changes: data,
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_id: existingTestResult.patient_id,
        appointment_id: existingTestResult.appointment_id,
        test_code: existingTestResult.test_code,
        updated_fields: Object.keys(data),
        is_sensitive_test: existingTestResult.is_sensitive,
        via_secure_service: true
      }
    })

    revalidatePath("/clinic/tests")
    revalidatePath(`/clinic/tests/${id}`)

    return { success: true, testResult, error: null }
  } catch (error: any) {
    console.error("Error updating test result:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to update test results"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Test result not found"
    }
    
    return { success: false, testResult: null, error: errorMessage }
  }
}

export async function getTestResultFullReport(testResultId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return { 
        success: false, 
        fullReport: null, 
        error: "Unauthorized - No clinic access" 
      }
    }

    // USE: Secure service to get test result
    const testResult = await secureTestResultService.read(testResultId)
    
    if (!testResult) {
      return { 
        success: false, 
        fullReport: null, 
        error: "Test result not found or access denied" 
      }
    }

    // Get patient details using secure patient service
    let patient = null
    if (testResult.patient_id) {
      try {
        const patientResult = await securePatientService.read(testResult.patient_id)
        patient = patientResult.success ? patientResult.data : null
      } catch {
        patient = null
      }
    }

    // Get test details
    const clinicalTestRepo = getClinicalTestRepository()
    const test = testResult.test_code
      ? await clinicalTestRepo.findByTestCode(testResult.test_code, testResult.clinic_id).catch(() => null)
      : null

    // Parse additional data
    let parsedParameters = []
    let parsedNormalRanges = {}
    
    if (test) {
      try {
        parsedParameters = typeof test.parameters === 'string' 
          ? JSON.parse(test.parameters || '[]')
          : test.parameters || []
      } catch (e) {
        parsedParameters = []
      }
      
      try {
        parsedNormalRanges = typeof test.normal_ranges === 'string'
          ? JSON.parse(test.normal_ranges || '{}')
          : test.normal_ranges || {}
      } catch (e) {
        parsedNormalRanges = {}
      }
    }

    const fullReport = {
      ...testResult,
      patient,
      test,
      testParameters: parsedParameters,
      normalRanges: parsedNormalRanges,
      // Note: results and findings are already decrypted by secure service
    }

    return { 
      success: true, 
      fullReport, 
      error: null 
    }
  } catch (error: any) {
    console.error("Error fetching full report:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to view this test report"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Test result not found"
    }
    
    return { 
      success: false, 
      fullReport: null, 
      error: errorMessage 
    }
  }
}

export async function getTestResultsByAppointment(appointmentId: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return { 
        success: false, 
        testResults: [], 
        error: "Unauthorized - No clinic access" 
      }
    }

    // USE: Secure service to list test results with filter
    const result = await secureTestResultService.list({
      appointment_id: appointmentId
    })
    
    const testResults = result.documents || []

    return { 
      success: true, 
      testResults, 
      error: null 
    }
  } catch (error: any) {
    console.error("Error fetching test results:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to view test results"
    }
    
    return { 
      success: false, 
      testResults: [], 
      error: errorMessage 
    }
  }
}

export async function markTestResultAsReviewed(id: string, reviewedBy: string, notes?: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Only doctors and clinic admins can mark as reviewed
    if (!['doctor', 'clinic_admin'].includes(user.role)) {
      throw new Error("Only doctors and clinic admins can review test results")
    }

    // USE: Secure service for review
    const testResult = await secureTestResultService.review(id, {
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      requires_review: false
    })

    // AUDIT LOG
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "test_result",
      entityId: id,
      action: "REVIEW",
      changes: { 
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        requires_review: false
      },
      ipAddress: null,
      userAgent: null,
      metadata: {
        patient_id: testResult.patient_id,
        test_code: testResult.test_code,
        reviewed_by_role: user.role,
        review_notes: notes,
        via_secure_service: true
      }
    })

    // Send notification if test result was abnormal
    if (!testResult.is_normal) {
      await notificationService.createNotification(
        user.id,
        user.clinic_id,
        "test_result_reviewed",
        "Test Result Reviewed",
        `Test ${testResult.test_code} has been reviewed by a doctor`,
        {
          priority: "medium",
          link: `/clinic/tests/${id}`,
          data: {
            testResultId: id,
            testCode: testResult.test_code,
            reviewedBy: user.email,
            reviewNotes: notes
          }
        }
      )
    }

    revalidatePath("/clinic/tests")
    revalidatePath(`/clinic/tests/${id}`)

    return { success: true, testResult, error: null }
  } catch (error: any) {
    console.error("Error marking test result as reviewed:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to review test results"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Test result not found"
    }
    
    return { success: false, testResult: null, error: errorMessage }
  }
}

export async function deleteTestResult(id: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    // Only clinic admins can delete test results
    if (user.role !== 'clinic_admin') {
      throw new Error("Only clinic admins can delete test results")
    }

    // USE: Secure service for delete
    await secureTestResultService.delete(id)

    // AUDIT LOG
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "test_result",
      entityId: id,
      action: "DELETE",
      changes: {},
      ipAddress: null,
      userAgent: null,
      metadata: {
        deleted_by: user.email,
        deleted_at: new Date().toISOString(),
        via_secure_service: true
      }
    })

    revalidatePath("/clinic/tests")

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error deleting test result:", error)
    
    let errorMessage = (error as Error).message
    if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      errorMessage = "You don't have permission to delete test results"
    } else if (errorMessage.includes("not found")) {
      errorMessage = "Test result not found"
    }
    
    return { success: false, error: errorMessage }
  }
}

