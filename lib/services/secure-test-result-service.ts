import { getCurrentUser } from "@/lib/auth/actions"
import { AppwriteFunctionsService } from "@/lib/appwrite/functions"
import { FUNCTIONS } from "@/lib/appwrite/config"

interface SecureTestResultOperationParams {
  action: "create" | "read" | "update" | "delete" | "list" | "review" | "export"
  testResultId?: string
  data?: any
  filters?: any
}

/**
 * Execute secure test result operation via Appwrite Function
 */
async function executeSecureTestResultOperation(
  params: SecureTestResultOperationParams
): Promise<any> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Validate function configuration
    if (!FUNCTIONS.SECURE_TEST_RESULT) {
      throw new Error("Secure test result function ID is not configured. Check your environment variables.")
    }

    // Validate user has clinic
    if (!user.clinic_id) {
      throw new Error("User is not assigned to a clinic")
    }

    const payload = {
      ...params,
      userId: user.auth_user_id,
      userEmail: user.email,
      userRole: user.role,
      clinicId: user.clinic_id,
    }

    console.log(`Calling secure test result function: ${params.action}`, {
      userId: user.auth_user_id,
      clinicId: user.clinic_id,
      testResultId: params.testResultId
    })

    const result = await AppwriteFunctionsService.secureTestResultOperation(
      params.action,
      payload
    )

    if (!result.success) {
      throw new Error(result.error || "Operation failed")
    }

    return result.data
  } catch (error: any) {
    console.error("Secure test result operation failed:", error)
    throw error
  }
}

/**
 * Public API for secure test result operations
 */
export const secureTestResultService = {
  /**
   * Create a new test result with encryption
   */
  async create(testResultData: any) {
    return executeSecureTestResultOperation({
      action: "create",
      data: testResultData,
    })
  },

  /**
   * Read a test result with decryption
   */
  async read(testResultId: string) {
    return executeSecureTestResultOperation({
      action: "read",
      testResultId,
    })
  },

  /**
   * Update a test result with encryption
   */
  async update(testResultId: string, updates: any) {
    return executeSecureTestResultOperation({
      action: "update",
      testResultId,
      data: updates,
    })
  },

  /**
   * Delete a test result
   */
  async delete(testResultId: string) {
    return executeSecureTestResultOperation({
      action: "delete",
      testResultId,
    })
  },

  /**
   * List test results with partial decryption
   */
  async list(filters?: any) {
    return executeSecureTestResultOperation({
      action: "list",
      filters,
    })
  },

  /**
   * Mark test result as reviewed
   */
  async review(testResultId: string, reviewData: any) {
    return executeSecureTestResultOperation({
      action: "review",
      testResultId,
      data: reviewData,
    })
  },
}