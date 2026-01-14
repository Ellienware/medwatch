/**
 * Appwrite Function: Secure Patient Operations
 *
 * Handles all CRUD operations on patient data with encryption/decryption
 * Enforces role-based access control and audit logging
 *
 * Setup:
 * 1. Create function in Appwrite Console
 * 2. Set runtime to Node.js 18.x
 * 3. Add environment variable: ENCRYPTION_KEY
 * 4. Deploy this code
 */

import { Client, Databases, ID, Query } from "node-appwrite"

// Types
type UserRole = "super_admin" | "clinic_admin" | "receptionist" | "nurse" | "doctor" | "employer"

interface RequestPayload {
  action: "create" | "read" | "update" | "delete" | "list"
  patientId?: string
  data?: any
  filters?: any
  userId: string
  userEmail: string
  userRole: UserRole
  clinicId: string
}

// Initialize Appwrite client
function initAppwrite(req: any) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID!)
    .setKey(req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY!)

  return new Databases(client)
}

// Encryption utilities (simplified version - import from shared module in production)
async function encryptField(plaintext: string): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const crypto = await import("crypto")
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64")
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
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "base64")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"))

  decipher.setAuthTag(Buffer.from(tag, "base64"))

  let decrypted = decipher.update(ciphertext, "base64", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

// Encrypt sensitive patient fields
async function encryptPatientData(data: any): Promise<any> {
  const sensitiveFields = [
    "first_name",
    "last_name",
    "id_number",
    "passport_number",
    "phone",
    "email",
    "address",
    "emergency_contact_name",
    "emergency_contact_phone",
    "medical_history",
    "current_medications",
    "allergies",
  ]

  const encrypted: any = { ...data }

  for (const field of sensitiveFields) {
    if (data[field]) {
      const { ciphertext, iv, tag } = await encryptField(String(data[field]))
      encrypted[`${field}_enc`] = ciphertext
      encrypted[`${field}_iv`] = iv
      encrypted[`${field}_tag`] = tag
      delete encrypted[field]
    }
  }

  return encrypted
}

// Decrypt sensitive patient fields
async function decryptPatientData(data: any, fieldsToDecrypt: string[]): Promise<any> {
  const decrypted: any = { ...data }

  for (const field of fieldsToDecrypt) {
    const encField = `${field}_enc`
    const ivField = `${field}_iv`
    const tagField = `${field}_tag`

    if (data[encField] && data[ivField] && data[tagField]) {
      try {
        decrypted[field] = await decryptField(data[encField], data[ivField], data[tagField])
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

// Access control check
function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    super_admin: ["create", "read", "update", "delete", "list"],
    clinic_admin: ["create", "read", "update", "delete", "list"],
    receptionist: ["create", "read", "update", "list"],
    nurse: ["read", "update", "list"],
    doctor: ["read", "update", "list"],
    employer: ["read", "list"],
  }

  return permissions[role]?.includes(action) || false
}

// Get allowed decryption fields for role
function getAllowedFields(role: UserRole): string[] {
  const fieldAccess: Record<UserRole, string[]> = {
    super_admin: ["*"],
    clinic_admin: ["*"],
    receptionist: ["first_name", "last_name", "phone", "email", "address"],
    nurse: [
      "first_name",
      "last_name",
      "id_number",
      "phone",
      "email",
      "address",
      "emergency_contact_name",
      "emergency_contact_phone",
      "medical_history",
      "current_medications",
      "allergies",
    ],
    doctor: [
      "first_name",
      "last_name",
      "id_number",
      "phone",
      "email",
      "address",
      "emergency_contact_name",
      "emergency_contact_phone",
      "medical_history",
      "current_medications",
      "allergies",
    ],
    employer: [], // Employers see pre-approved summaries only
  }

  return fieldAccess[role] || []
}

// Create audit log
async function createAuditLog(databases: Databases, entry: any) {
  try {
    await databases.createDocument(process.env.APPWRITE_DATABASE_ID!, "audit_logs", ID.unique(), {
      ...entry,
      timestamp: new Date().toISOString(),
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

// Main function handler
export default async ({ req, res, log, error }: any) => {
  try {
    // Parse request payload
    const payload: RequestPayload = JSON.parse(req.body || "{}")

    log("Request received:", { action: payload.action, userId: payload.userId, role: payload.userRole })

    // Initialize database
    const databases = initAppwrite(req)

    // Check permissions
    if (!hasPermission(payload.userRole, payload.action)) {
      // Audit failed attempt
      await createAuditLog(databases, {
        clinic_id: payload.clinicId,
        user_id: payload.userId,
        user_email: payload.userEmail,
        user_role: payload.userRole,
        action: payload.action,
        entity_type: "patient",
        entity_id: payload.patientId || "unknown",
        success: false,
        error_message: "Insufficient permissions",
        risk_level: "critical",
      })

      return res.json({ success: false, error: "Insufficient permissions" }, 403)
    }

    let result: any

    switch (payload.action) {
      case "create": {
        // Encrypt sensitive fields
        const encryptedData = await encryptPatientData(payload.data)
        encryptedData.clinic_id = payload.clinicId
        encryptedData.created_at = new Date().toISOString()
        encryptedData.updated_at = new Date().toISOString()

        // Create patient record
        const patient = await databases.createDocument(
          process.env.APPWRITE_DATABASE_ID!,
          "patients",
          ID.unique(),
          encryptedData,
        )

        // Audit the creation
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "create",
          entity_type: "patient",
          entity_id: patient.$id,
          entity_description: `New patient created`,
          success: true,
          risk_level: "low",
        })

        result = { success: true, data: { id: patient.$id } }
        break
      }

      case "read": {
        if (!payload.patientId) {
          return res.json({ success: false, error: "Patient ID required" }, 400)
        }

        // Fetch patient record
        const patient = await databases.getDocument(process.env.APPWRITE_DATABASE_ID!, "patients", payload.patientId)

        // Check clinic access
        if (patient.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
          await createAuditLog(databases, {
            clinic_id: payload.clinicId,
            user_id: payload.userId,
            user_email: payload.userEmail,
            user_role: payload.userRole,
            action: "read",
            entity_type: "patient",
            entity_id: payload.patientId,
            success: false,
            error_message: "Access denied - different clinic",
            risk_level: "critical",
          })

          return res.json({ success: false, error: "Access denied" }, 403)
        }

        // Decrypt allowed fields
        const allowedFields = getAllowedFields(payload.userRole)
        const fieldsToDecrypt = allowedFields.includes("*")
          ? [
              "first_name",
              "last_name",
              "id_number",
              "passport_number",
              "phone",
              "email",
              "address",
              "emergency_contact_name",
              "emergency_contact_phone",
              "medical_history",
              "current_medications",
              "allergies",
            ]
          : allowedFields

        const decryptedPatient = await decryptPatientData(patient, fieldsToDecrypt)

        // Audit the read
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "decrypt",
          entity_type: "patient",
          entity_id: payload.patientId,
          entity_description: `Decrypted fields: ${fieldsToDecrypt.join(", ")}`,
          metadata: { fields_decrypted: fieldsToDecrypt },
          success: true,
          risk_level: "medium",
        })

        result = { success: true, data: decryptedPatient }
        break
      }

      case "update": {
        if (!payload.patientId) {
          return res.json({ success: false, error: "Patient ID required" }, 400)
        }

        // Fetch existing patient
        const existingPatient = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          "patients",
          payload.patientId,
        )

        // Check clinic access
        if (existingPatient.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
          return res.json({ success: false, error: "Access denied" }, 403)
        }

        // Encrypt updated fields
        const encryptedUpdates = await encryptPatientData(payload.data)
        encryptedUpdates.updated_at = new Date().toISOString()

        // Update patient record
        const updatedPatient = await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID!,
          "patients",
          payload.patientId,
          encryptedUpdates,
        )

        // Track changes for audit
        const changes: Record<string, any> = {}
        Object.keys(payload.data).forEach((key) => {
          changes[key] = {
            old: "***",
            new: "***", // Don't log actual PHI values
          }
        })

        // Audit the update
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "update",
          entity_type: "patient",
          entity_id: payload.patientId,
          entity_description: `Updated ${Object.keys(payload.data).length} fields`,
          changes,
          success: true,
          risk_level: "medium",
        })

        result = { success: true, data: { id: updatedPatient.$id } }
        break
      }

      case "delete": {
        if (!payload.patientId) {
          return res.json({ success: false, error: "Patient ID required" }, 400)
        }

        // Fetch patient to verify clinic
        const patientToDelete = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID!,
          "patients",
          payload.patientId,
        )

        // Check clinic access
        if (patientToDelete.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
          return res.json({ success: false, error: "Access denied" }, 403)
        }

        // Delete patient record
        await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID!, "patients", payload.patientId)

        // Audit the deletion
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "delete",
          entity_type: "patient",
          entity_id: payload.patientId,
          entity_description: "Patient record deleted",
          success: true,
          risk_level: "high",
        })

        result = { success: true, data: { id: payload.patientId } }
        break
      }

      case "list": {
        // Build query filters
        const queries = [Query.equal("clinic_id", payload.clinicId), Query.limit(100)]

        if (payload.filters?.employerId) {
          queries.push(Query.equal("employer_id", payload.filters.employerId))
        }

        // Fetch patients
        const response = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID!, "patients", queries)

        // Decrypt allowed fields for each patient
        const allowedFields = getAllowedFields(payload.userRole)
        const fieldsToDecrypt = allowedFields.includes("*")
          ? ["first_name", "last_name", "phone", "email"]
          : allowedFields.slice(0, 4) // Limit fields for list view

        const decryptedPatients = await Promise.all(
          response.documents.map((patient) => decryptPatientData(patient, fieldsToDecrypt)),
        )

        // Audit the list operation
        await createAuditLog(databases, {
          clinic_id: payload.clinicId,
          user_id: payload.userId,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          action: "read",
          entity_type: "patient",
          entity_id: "list",
          entity_description: `Listed ${response.documents.length} patients`,
          metadata: {
            count: response.documents.length,
            filters: payload.filters,
          },
          success: true,
          risk_level: "low",
        })

        result = {
          success: true,
          data: {
            documents: decryptedPatients,
            total: response.total,
          },
        }
        break
      }

      default:
        return res.json({ success: false, error: "Invalid action" }, 400)
    }

    return res.json(result)
  } catch (err: any) {
    error("Function error:", err)

    // Try to audit the failure if we have enough context
    try {
      const payload: RequestPayload = JSON.parse(req.body || "{}")
      const databases = initAppwrite(req)

      await createAuditLog(databases, {
        clinic_id: payload.clinicId || "unknown",
        user_id: payload.userId || "unknown",
        user_email: payload.userEmail || "unknown",
        user_role: payload.userRole || "unknown",
        action: payload.action || "unknown",
        entity_type: "patient",
        entity_id: payload.patientId || "unknown",
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
