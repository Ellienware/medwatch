/**
 * Client-side service for secure patient operations
 * Calls Appwrite Functions instead of direct database access
 */

import { getCurrentUser } from "@/lib/auth/actions"

const FUNCTION_ENDPOINT = process.env.NEXT_PUBLIC_SECURE_PATIENT_FUNCTION_ENDPOINT!

interface SecureOperationParams {
  action: "create" | "read" | "update" | "delete" | "list"
  patientId?: string
  data?: any
  filters?: any
}

/**
 * Execute secure patient operation via Appwrite Function
 */
async function executeSecureOperation(params: SecureOperationParams): Promise<any> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const payload = {
    ...params,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    clinicId: user.clinic_id!,
  }

  const response = await fetch(FUNCTION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Add Appwrite session for authentication
      "X-Appwrite-Session": await getSessionToken(),
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || "Operation failed")
  }

  return result.data
}

// Helper to get session token
async function getSessionToken(): Promise<string> {
  // Implementation depends on your auth setup
  // This should return the current Appwrite session JWT
  const session = await fetch("/api/auth/session")
  const data = await session.json()
  return data.sessionToken
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
}
