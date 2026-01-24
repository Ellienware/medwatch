// lib/actions/test-result-actions.ts
"use server"

import { getCurrentUser } from "@/lib/auth/actions"
import { getClinicalTestRepository, getPatientRepository, getTestResultRepository } from "@/lib/repositories"
import { revalidatePath } from "next/cache"
import type { TestResult } from "@/lib/types/database"
import { notificationService } from "@/lib/notifications/notification-service"


// Add this function to your lib/actions/test-result-actions.ts
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

    const testResultRepo = getTestResultRepository()
    const patientRepo = getPatientRepository()
    const clinicalTestRepo = getClinicalTestRepository()

    // Get the test result
    const testResult = await testResultRepo.findById(testResultId)
    
    if (!testResult || testResult.clinic_id !== user.clinic_id) {
      return { 
        success: false, 
        fullReport: null, 
        error: "Test result not found or access denied" 
      }
    }

    // Get patient details
    const patient = testResult.patient_id 
      ? await patientRepo.findById(testResult.patient_id).catch(() => null)
      : null

    // Get test details
    const test = testResult.test_code
      ? await clinicalTestRepo.findByTestCode(testResult.test_code, testResult.clinic_id).catch(() => null)
      : null

    // Parse the results and attachments
    const parsedResults = typeof testResult.results === 'string' 
      ? JSON.parse(testResult.results || '{}')
      : testResult.results || {}

    const parsedAttachments = typeof testResult.attachments === 'string'
      ? JSON.parse(testResult.attachments || '[]')
      : testResult.attachments || []

    // Parse test parameters and normal ranges if they exist
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
      results: parsedResults,
      attachments: parsedAttachments,
      patient,
      test,
      testParameters: parsedParameters,
      normalRanges: parsedNormalRanges
    }

    return { 
      success: true, 
      fullReport, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching full report:", error)
    return { 
      success: false, 
      fullReport: null, 
      error: (error as Error).message 
    }
  }
}


export async function createTestResult(data: Partial<TestResult>) {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    const testResultRepo = getTestResultRepository()

    const testResultData: Partial<TestResult> = {
      ...data,
      test_code: data.test_code,
      clinic_id: user.clinic_id,
      performed_by: user.id,
      performed_at: new Date().toISOString(),

      is_normal: data.is_normal ?? null,
      findings: data.findings ?? null,
      recommendations: data.recommendations ?? null,

      // ✅ ALWAYS object
      results: data.results ?? {},

      attachments: data.attachments ?? [],
      reviewed_by: data.reviewed_by ?? null,
      reviewed_at: data.reviewed_at ?? null,
    }

    const testResult = await testResultRepo.create(testResultData)


    await notificationService.notifyTestResultReady(
      user.id,
      user.clinic_id,
      "Patient",
      testResult.id
    )

    revalidatePath("/clinic/tests")

    return { success: true, testResult, error: null }
  } catch (error) {
    console.error("Error creating test result:", error)
    return { success: false, testResult: null, error: (error as Error).message }
  }
}

export async function createMultipleTestResults(dataArray: Partial<TestResult>[]) {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    const testResultRepo = getTestResultRepository()
    const results = []
    const errors = []

    // Create each test result
    for (const data of dataArray) {
      try {
        const testResultData: Partial<TestResult> = {
          ...data,
          clinic_id: user.clinic_id,
          performed_by: user.id,
          performed_at: new Date().toISOString(),
          is_normal: data.is_normal ?? null,
          findings: data.findings ?? null,
          recommendations: data.recommendations ?? null,
          results: data.results ?? {},
          attachments: data.attachments ?? [],
          reviewed_by: data.reviewed_by ?? null,
          reviewed_at: data.reviewed_at ?? null,
        }

        const testResult = await testResultRepo.create(testResultData)
        results.push({ success: true, testResult, test_code: data.test_code })
        
        // Send notification for each test
        await notificationService.notifyTestResultReady(
          user.id,
          user.clinic_id,
          "Patient",
          testResult.id
        )
      } catch (error) {
        errors.push({
          test_code: data.test_code,
          error: (error as Error).message
        })
        console.error(`Error creating test ${data.test_code}:`, error)
      }
    }

    revalidatePath("/clinic/tests")

    return {
      success: errors.length === 0,
      created: results.length,
      failed: errors.length,
      results,
      errors
    }
  } catch (error) {
    console.error("Error creating multiple test results:", error)
    return {
      success: false,
      created: 0,
      failed: dataArray.length,
      results: [],
      errors: [{ error: (error as Error).message }]
    }
  }
}

// ADD THIS FUNCTION - It was missing
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

    const testResultRepo = getTestResultRepository()
    const testResult = await testResultRepo.findById(id)
    
    if (!testResult || testResult.clinic_id !== user.clinic_id) {
      return { 
        success: false, 
        testResult: null, 
        error: "Test result not found or access denied" 
      }
    }

    return { 
      success: true, 
      testResult, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching test result:", error)
    return { 
      success: false, 
      testResult: null, 
      error: (error as Error).message 
    }
  }
}

// Add this function if it doesn't exist
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

    const testResultRepo = getTestResultRepository()
    const testResults = await testResultRepo.findByAppointmentId(appointmentId)

    return { 
      success: true, 
      testResults, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching test results:", error)
    return { 
      success: false, 
      testResults: [], 
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

    const testResultRepo = getTestResultRepository()

    // ✅ no stringification here
    const testResult = await testResultRepo.update(id, {
      ...data,
      results: data.results ?? undefined,
    })

    revalidatePath("/clinic/tests")

    return { success: true, testResult, error: null }
  } catch (error) {
    console.error("Error updating test result:", error)
    return { success: false, testResult: null, error: (error as Error).message }
  }
}


// Optional: Add function to mark test result as reviewed
export async function markTestResultAsReviewed(id: string, reviewedBy: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    const testResultRepo = getTestResultRepository()
    const testResult = await testResultRepo.markAsReviewed(id, reviewedBy)

    revalidatePath("/clinic/tests")

    return { success: true, testResult, error: null }
  } catch (error) {
    console.error("Error marking test result as reviewed:", error)
    return { success: false, testResult: null, error: (error as Error).message }
  }
}

