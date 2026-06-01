//functions/secure-test-result-operations/src/index.ts
/**
 * Appwrite Function: Secure Test Result Operations
 * Handles encryption/decryption of test result data
 */

import { Client, Databases, ID, Query } from "node-appwrite"

// Types
type UserRole = "super_admin" | "clinic_admin" | "receptionist" | "nurse" | "doctor" | "employer"

interface RequestPayload {
  action: "create" | "read" | "update" | "delete" | "list" | "review" | "export"
  testResultId?: string
  data?: any
  filters?: any
  userId: string
  userEmail: string
  userRole: UserRole
  clinicId: string
}

interface AppwriteRequest {
  body: string
  headers: {
    [key: string]: string
  }
}

interface AppwriteResponse {
  json: (data: any, status?: number) => any
}

interface AppwriteContext {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
}

interface EncryptedField {
  ciphertext: string
  iv: string
  tag: string
}

// Initialize Appwrite client
function initAppwrite(req: AppwriteRequest) {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || "")
      .setKey(req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY || "")

  return new Databases(client)
}

// Encryption utilities
async function encryptField(plaintext: string): Promise<EncryptedField> {
  const crypto = await import("crypto")
  const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64")
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "base64")
  encrypted += cipher.final("base64")
  const tag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  }
}

async function decryptField(ciphertext: string, iv: string, tag: string): Promise<string> {
  const crypto = await import("crypto")
  const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "base64")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"))

  decipher.setAuthTag(Buffer.from(tag, "base64"))

  let decrypted = decipher.update(ciphertext, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

// Encrypt sensitive test result fields
async function encryptTestResultData(data: any): Promise<any> {
  const sensitiveFields = [
    "findings",
    "recommendations",
    "notes",
    "technician_notes",
    "review_notes",
  ]

  const encrypted = { ...data }

  for (const field of sensitiveFields) {
    if (data[field] && typeof data[field] === 'string') {
      const { ciphertext, iv, tag } = await encryptField(data[field])
      encrypted[`${field}_enc`] = ciphertext
      encrypted[`${field}_iv`] = iv
      encrypted[`${field}_tag`] = tag
      delete encrypted[field]
    }
  }

  // Also encrypt JSON results if they contain sensitive info
  if (data.results && typeof data.results === 'object') {
    try {
      const resultsStr = JSON.stringify(data.results)
      const { ciphertext, iv, tag } = await encryptField(resultsStr)
      encrypted.results_enc = ciphertext
      encrypted.results_iv = iv
      encrypted.results_tag = tag
      delete encrypted.results
    } catch (error) {
      console.error("Error encrypting results:", error)
    }
  }

  return encrypted
}

// Decrypt sensitive test result fields
async function decryptTestResultData(data: any, fieldsToDecrypt: string[]): Promise<any> {
  const decrypted = { ...data }

  for (const field of fieldsToDecrypt) {
    const encField = `${field}_enc`
    const ivField = `${field}_iv`
    const tagField = `${field}_tag`

    if (data[encField] && data[ivField] && data[tagField]) {
      try {
        const decryptedValue = await decryptField(data[encField], data[ivField], data[tagField])
        
        // Parse JSON if it's the results field
        if (field === 'results') {
          try {
            decrypted[field] = JSON.parse(decryptedValue)
          } catch (e) {
            console.error(`Failed to parse results JSON:`, e)
            decrypted[field] = decryptedValue
          }
        } else {
          decrypted[field] = decryptedValue
        }
        
        delete decrypted[encField]
        delete decrypted[ivField]
        delete decrypted[tagField]
      } catch (error) {
        console.error(`Failed to decrypt ${field}:`, error)
        decrypted[field] = null
      }
    }
  }

  return decrypted
}

// Access control check for test results
function hasPermission(role: UserRole, action: string, isSensitive = false): boolean {
  const permissions: Record<UserRole, string[]> = {
    super_admin: ["create", "read", "update", "delete", "list", "review"],
    clinic_admin: ["create", "read", "update", "delete", "list", "review"],
    doctor: ["create", "read", "update", "review", "list"],
    nurse: ["create", "read", "update", "list"],
    receptionist: ["read", "list"], // Can only view basic test info
    employer: ["read"], // Can only view basic results
  }

  const userPermissions = permissions[role] || []
  
  // Extra check for sensitive tests
  if (isSensitive && !["doctor", "clinic_admin", "super_admin"].includes(role)) {
    return false
  }

  return userPermissions.includes(action)
}

// Get allowed decryption fields for role
function getAllowedFields(role: UserRole, isSensitive = false): string[] {
  const fieldAccess: Record<UserRole, string[]> = {
    super_admin: ["*"],
    clinic_admin: ["*"],
    doctor: ["findings", "recommendations", "notes", "results", "technician_notes", "review_notes"],
    nurse: ["findings", "results", "technician_notes"],
    receptionist: ["results"], // Only see basic results
    employer: [], // Only see status, not actual results
  }

  const fields = fieldAccess[role] || []
  
  // Limit fields for sensitive tests
  if (isSensitive && role === 'nurse') {
    return fields.filter(f => f !== 'results') // Nurses can't see sensitive results
  }

  return fields
}

interface AuditLogEntry {
  clinic_id: string
  user_id: string
  user_email: string
  user_role: UserRole
  action: string
  entity_type: string
  entity_id: string
  success: boolean
  risk_level: string
  changes?: any
  metadata?: any
  error_message?: string
}

// Create audit log
async function createAuditLog(databases: Databases, entry: AuditLogEntry) {
  try {
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID!,
      "audit_logs",
      ID.unique(),
      {
        ...entry,
        timestamp: new Date().toISOString(),
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      }
    )
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

// Main function handler
export default async ({ req, res, log, error }: {
  req: AppwriteRequest,
  res: AppwriteResponse,
  log: AppwriteContext["log"],
  error: AppwriteContext["error"]
}) => {
  try {
    const payload: RequestPayload = JSON.parse(req.body || "{}")
    const databases = initAppwrite(req)

    log("Test result request:", { 
      action: payload.action, 
      userId: payload.userId, 
      role: payload.userRole 
    })

    let result

    switch (payload.action) {
      case "create": {
        if (!hasPermission(payload.userRole, "create")) {
          return res.json({ success: false, error: "Insufficient permissions" }, 403)
        }

        // Check for required fields
        if (!payload.data?.test_code || !payload.data?.patient_id) {
          return res.json({ success: false, error: "Missing required fields: test_code and patient_id are required" }, 400)
        }

        // Encrypt sensitive fields
        const encryptedData = await encryptTestResultData(payload.data)
        encryptedData.clinic_id = payload.clinicId
        encryptedData.created_at = new Date().toISOString()

        // Create test result
        const testResult = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          "test_results",
          ID.unique(),
          encryptedData
        )

        // Audit log
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "create",
          entity_type: "test_result",
          entity_id: testResult.$id,
          success: true,
          risk_level: "low",
        })

        // Decrypt for response based on role
        const allowedFields = getAllowedFields(payload.userRole, encryptedData.is_sensitive)
        const fieldsToDecrypt = allowedFields.includes("*") 
          ? ["findings", "recommendations", "notes", "results", "technician_notes", "review_notes"]
          : allowedFields
        const decryptedResult = await decryptTestResultData(testResult, fieldsToDecrypt)

        result = { success: true, data: decryptedResult }
        break
      }

      case "read": {
        if (!payload.testResultId) {
          return res.json({ success: false, error: "Test result ID required" }, 400)
        }

        try {
          // Get test result
          const testResult = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId
          )

          // Check clinic access
          if (testResult.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
            return res.json({ success: false, error: "Access denied - different clinic" }, 403)
          }

          // Check permission
          const canRead = hasPermission(payload.userRole, "read", testResult.is_sensitive)
          if (!canRead) {
            return res.json({ success: false, error: "Insufficient permissions" }, 403)
          }

          // Decrypt allowed fields
          const allowedFields = getAllowedFields(payload.userRole, testResult.is_sensitive)
          const fieldsToDecrypt = allowedFields.includes("*")
            ? ["findings", "recommendations", "notes", "results", "technician_notes", "review_notes"]
            : allowedFields

          const decryptedResult = await decryptTestResultData(testResult, fieldsToDecrypt)

          // Add test name and patient name if available
          if (testResult.test_code) {
            try {
              const test = await databases.getDocument(
                process.env.APPWRITE_DATABASE_ID!,
                "clinical_tests",
                testResult.test_code
              )
              decryptedResult.test_name = test.test_name
            } catch (e) {
              // Test not found, continue without name
            }
          }

          // Audit log for sensitive data access
          if (testResult.is_sensitive) {
            await createAuditLog(databases, {
              clinic_id: payload.clinicId,
              user_id: payload.userId,
              user_email: payload.userEmail,
              user_role: payload.userRole,
              action: "decrypt",
              entity_type: "test_result",
              entity_id: payload.testResultId,
              metadata: { 
                fields_decrypted: fieldsToDecrypt,
                is_sensitive: true 
              },
              success: true,
              risk_level: "medium",
            })
          }

          result = { success: true, data: decryptedResult }
        } catch (err: any) {
          if (err.code === 404) {
            return res.json({ success: false, error: "Test result not found" }, 404)
          }
          throw err
        }
        break
      }

      case "update": {
        if (!payload.testResultId) {
          return res.json({ success: false, error: "Test result ID required" }, 400)
        }

        try {
          // Get existing test result
          const existingTestResult = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId
          )

          // Check clinic access
          if (existingTestResult.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
            return res.json({ success: false, error: "Access denied - different clinic" }, 403)
          }

          // Check permission
          const canUpdate = hasPermission(payload.userRole, "update", existingTestResult.is_sensitive)
          if (!canUpdate) {
            return res.json({ success: false, error: "Insufficient permissions" }, 403)
          }

          // Encrypt updated fields
          const encryptedUpdates = await encryptTestResultData(payload.data)
          encryptedUpdates.updated_at = new Date().toISOString()

          // Update test result
          const updatedTestResult = await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId,
            encryptedUpdates
          )

          // Decrypt for response
          const allowedFields = getAllowedFields(payload.userRole, existingTestResult.is_sensitive)
          const fieldsToDecrypt = allowedFields.includes("*")
            ? ["findings", "recommendations", "notes", "results", "technician_notes", "review_notes"]
            : allowedFields
          const decryptedResult = await decryptTestResultData(updatedTestResult, fieldsToDecrypt)

          // Audit log
          await createAuditLog(databases, {
            clinic_id: payload.clinicId,
            user_id: payload.userId,
            user_email: payload.userEmail,
            user_role: payload.userRole,
            action: "update",
            entity_type: "test_result",
            entity_id: payload.testResultId,
            success: true,
            risk_level: "medium",
          })

          result = { success: true, data: decryptedResult }
        } catch (err: any) {
          if (err.code === 404) {
            return res.json({ success: false, error: "Test result not found" }, 404)
          }
          throw err
        }
        break
      }

      case "review": {
        if (!payload.testResultId) {
          return res.json({ success: false, error: "Test result ID required" }, 400)
        }

        try {
          // Get existing test result
          const existingTestResult = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId
          )

          // Check clinic access
          if (existingTestResult.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
            return res.json({ success: false, error: "Access denied - different clinic" }, 403)
          }

          // Only doctors and admins can review
          if (!["doctor", "clinic_admin", "super_admin"].includes(payload.userRole)) {
            return res.json({ success: false, error: "Only medical staff can review test results" }, 403)
          }

          // Encrypt review notes
          const reviewData = { ...payload.data }
          if (reviewData.review_notes) {
            const { ciphertext, iv, tag } = await encryptField(reviewData.review_notes)
            reviewData.review_notes_enc = ciphertext
            reviewData.review_notes_iv = iv
            reviewData.review_notes_tag = tag
            delete reviewData.review_notes
          }

          reviewData.updated_at = new Date().toISOString()

          // Update test result
          const updatedTestResult = await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId,
            reviewData
          )

          // Decrypt for response
          const allowedFields = getAllowedFields(payload.userRole, existingTestResult.is_sensitive)
          const fieldsToDecrypt = allowedFields.includes("*")
            ? ["findings", "recommendations", "notes", "results", "technician_notes", "review_notes"]
            : allowedFields
          const decryptedResult = await decryptTestResultData(updatedTestResult, fieldsToDecrypt)

          // Audit log
          await createAuditLog(databases, {
            clinic_id: payload.clinicId,
            user_id: payload.userId,
            user_email: payload.userEmail,
            user_role: payload.userRole,
            action: "review",
            entity_type: "test_result",
            entity_id: payload.testResultId,
            success: true,
            risk_level: "low",
          })

          result = { success: true, data: decryptedResult }
        } catch (err: any) {
          if (err.code === 404) {
            return res.json({ success: false, error: "Test result not found" }, 404)
          }
          throw err
        }
        break
      }

      case "list": {
        if (!hasPermission(payload.userRole, "list")) {
          return res.json({ success: false, error: "Insufficient permissions" }, 403)
        }

        // Build queries
        const queries = [
          Query.equal("clinic_id", payload.clinicId),
          Query.limit(payload.filters?.limit || 100),
          Query.orderDesc("performed_at")
        ]

        // Apply filters
        if (payload.filters?.appointment_id) {
          queries.push(Query.equal("appointment_id", payload.filters.appointment_id))
        }

        if (payload.filters?.patient_id) {
          queries.push(Query.equal("patient_id", payload.filters.patient_id))
        }

        if (payload.filters?.status) {
          queries.push(Query.equal("status", payload.filters.status))
        }

        if (payload.filters?.requires_review) {
          queries.push(Query.equal("requires_review", true))
        }

        if (payload.filters?.test_code) {
          queries.push(Query.equal("test_code", payload.filters.test_code))
        }

        // Get test results
        const response = await databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID!,
          "test_results",
          queries
        )

        // Decrypt each test result based on role
        const decryptedResults = await Promise.all(
          response.documents.map(async (doc) => {
            const allowedFields = getAllowedFields(payload.userRole, doc.is_sensitive)
            const fieldsToDecrypt = allowedFields.includes("*")
              ? ["results"] // For list view, only decrypt basic results
              : allowedFields.filter(f => f === "results") // Only decrypt results field for list

            const decrypted = await decryptTestResultData(doc, fieldsToDecrypt)
            
            // Add basic info for display
            return {
              id: decrypted.$id,
              test_code: decrypted.test_code,
              patient_id: decrypted.patient_id,
              appointment_id: decrypted.appointment_id,
              results: decrypted.results,
              is_normal: decrypted.is_normal,
              is_sensitive: decrypted.is_sensitive,
              performed_at: decrypted.performed_at,
              reviewed_by: decrypted.reviewed_by,
              reviewed_at: decrypted.reviewed_at,
              requires_review: decrypted.requires_review,
              // Add metadata for statistics
              clinic_id: decrypted.clinic_id,
              created_at: decrypted.created_at
            }
          })
        )

        // Calculate statistics if requested
        let stats = null
        if (payload.filters?.includeStats) {
          const total = response.total
          const sensitiveCount = response.documents.filter((d: any) => d.is_sensitive).length
          const pendingReview = response.documents.filter((d: any) => d.requires_review && !d.reviewed_by).length
          
          stats = {
            total,
            sensitiveCount,
            pendingReview,
            normalCount: response.documents.filter((d: any) => d.is_normal === true).length,
            abnormalCount: response.documents.filter((d: any) => d.is_normal === false).length,
          }
        }

        result = {
          success: true,
          data: {
            documents: decryptedResults,
            total: response.total,
            stats
          },
        }
        break
      }

      case "delete": {
        if (!payload.testResultId) {
          return res.json({ success: false, error: "Test result ID required" }, 400)
        }

        try {
          // Get test result to check access
          const testResult = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId
          )

          // Check clinic access
          if (testResult.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
            return res.json({ success: false, error: "Access denied - different clinic" }, 403)
          }

          // Only admins can delete
          if (!["clinic_admin", "super_admin"].includes(payload.userRole)) {
            return res.json({ success: false, error: "Only admins can delete test results" }, 403)
          }

          // Delete test result
          await databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID!,
            "test_results",
            payload.testResultId
          )

          // Audit log
          await createAuditLog(databases, {
            clinic_id: payload.clinicId,
            user_id: payload.userId,
            user_email: payload.userEmail,
            user_role: payload.userRole,
            action: "delete",
            entity_type: "test_result",
            entity_id: payload.testResultId,
            success: true,
            risk_level: "high",
          })

          result = { success: true, data: { id: payload.testResultId } }
        } catch (err: any) {
          if (err.code === 404) {
            return res.json({ success: false, error: "Test result not found" }, 404)
          }
          throw err
        }
        break
      }

      default:
        return res.json({ success: false, error: "Invalid action" }, 400)
    }

    return res.json(result)
  } catch (err: any) {
    error("Function error:", err)

    // Try to audit the failure
    try {
      const payload: RequestPayload = JSON.parse(req.body || "{}")
      const databases = initAppwrite(req)

      await createAuditLog(databases, {
        clinic_id: payload.clinicId || "unknown",
        user_id: payload.userId || "unknown",
        user_email: payload.userEmail || "unknown",
        user_role: payload.userRole || "unknown",
        action: payload.action || "unknown",
        entity_type: "test_result",
        entity_id: payload.testResultId || "unknown",
        success: false,
        error_message: err.message,
        risk_level: "critical",
      })
    } catch (auditError) {
      error("Failed to audit error:", auditError)
    }

    return res.json(
      {
        success: false,
        error: err.message || "Internal server error",
      },
      500,
    )
  }
}