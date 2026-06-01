import { getCurrentUser } from "@/lib/auth/actions"
import { AppwriteFunctionsService } from "@/lib/appwrite/functions"
import { FUNCTIONS } from "@/lib/appwrite/config"

interface SecureOperationParams {
  action: "create" | "read" | "update" | "delete" | "list" | "findDuplicates"
  patientId?: string
  data?: any
  filters?: any
}

/**
 * Execute secure patient operation via Appwrite Function
 */
async function executeSecureOperation(params: SecureOperationParams): Promise<any> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("User not authenticated")
    }

    // Validate function configuration
    if (!FUNCTIONS.SECURE_PATIENT) {
      throw new Error("Secure patient function ID is not configured. Check your environment variables.")
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

    console.log(`Calling secure patient function: ${params.action}`, {
      userId: user.auth_user_id,
      clinicId: user.clinic_id,
      hasPatientId: !!params.patientId
    })

    const result = await AppwriteFunctionsService.securePatientOperation(
      params.action,
      payload
    )

    if (!result.success) {
      throw new Error(result.error || "Operation failed")
    }

    return result.data
  } catch (error: any) {
    console.error("Secure patient operation failed:", error)
    throw error
  }
}

/**
 * Public API for secure patient operations
 */
export const securePatientService = {
  /**
   * Create a new patient with encrypted data
   */
  async create(patientData: any) {
    return executeSecureOperation({
      action: "create",
      data: patientData,
    })
  },

  /**
   * Read a patient record with decryption
   */
  async read(patientId: string) {
    return executeSecureOperation({
      action: "read",
      patientId,
    })
  },

  /**
   * Update a patient record with encryption
   */
  async update(patientId: string, updates: any) {
    return executeSecureOperation({
      action: "update",
      patientId,
      data: updates,
    })
  },

  /**
   * Delete a patient record
   */
  async delete(patientId: string) {
    return executeSecureOperation({
      action: "delete",
      patientId,
    })
  },

  /**
   * List patients with partial decryption
   */
  async list(filters?: any) {
    return executeSecureOperation({
      action: "list",
      filters,
    })
  },

  /**
   * Find potential duplicate patients
   */
  async findDuplicates(searchCriteria: any) {
    return executeSecureOperation({
      action: "findDuplicates",
      data: searchCriteria,
    })
  },
}