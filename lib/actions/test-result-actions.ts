// lib/actions/test-result-actions.ts
"use server"

import { getCurrentUser } from "@/lib/auth/actions"
import { getTestResultRepository } from "@/lib/repositories"
import { revalidatePath } from "next/cache"
import type { TestResult } from "@/lib/types/database"
import { notificationService } from "@/lib/notifications/notification-service"


export async function createTestResult(data: Partial<TestResult>) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized - No clinic access")
    }

    const testResultRepo = getTestResultRepository()
    
    // Add required fields
    const testResultData: Partial<TestResult> = {
      ...data,
      clinic_id: user.clinic_id,
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      // Ensure optional fields have defaults
      is_normal: data.is_normal ?? null,
      findings: data.findings || null,
      recommendations: data.recommendations || null,
      results: data.results || {},
      attachments: data.attachments || [],
      reviewed_by: data.reviewed_by || null,
      reviewed_at: data.reviewed_at || null,
    }

    const testResult = await testResultRepo.create(testResultData)

    // Notify appropriate staff about test result
    await notificationService.notifyTestResultReady(
      user.id,
      user.clinic_id,
      "Patient", // You might want to fetch patient name here
      testResult.id
    )

    revalidatePath("/clinic/tests")

    return { success: true, testResult, error: null }
  } catch (error) {
    console.error("[v0] Error creating test result:", error)
    return { success: false, testResult: null, error: (error as Error).message }
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
    console.error("[v0] Error fetching test result:", error)
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
    console.error("[v0] Error fetching test results:", error)
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
    const testResult = await testResultRepo.update(id, data)

    revalidatePath("/clinic/tests")

    return { success: true, testResult, error: null }
  } catch (error) {
    console.error("[v0] Error updating test result:", error)
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
    console.error("[v0] Error marking test result as reviewed:", error)
    return { success: false, testResult: null, error: (error as Error).message }
  }
}