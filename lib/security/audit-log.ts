/**
 * Audit Logging System
 *
 * Provides immutable audit trails for all sensitive data operations
 * Required for POPIA compliance and security monitoring
 */

import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { ID } from "node-appwrite"
import logger from "@/lib/logging/logger"

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "print"
  | "decrypt"
  | "login"
  | "logout"
  | "permission_change"
  | "encryption_key_access"

export type AuditEntityType =
  | "patient"
  | "appointment"
  | "test_result"
  | "certificate"
  | "user"
  | "employer"
  | "clinic"
  | "branch"
  | "subscription"
  | "payment"

export interface AuditLogEntry {
  clinic_id: string
  user_id: string
  user_email: string
  user_role: string
  action: AuditAction
  entity_type: AuditEntityType
  entity_id: string
  entity_description?: string
  changes?: Record<string, { old?: any; new?: any }>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
  success: boolean
  error_message?: string
  risk_level?: "low" | "medium" | "high" | "critical"
}

/**
 * Create an audit log entry
 * This function should be called for all operations on sensitive data
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
  try {
    const appwrite = await createServerClient()

    const auditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      // Store changes as JSON string for Appwrite
      changes: entry.changes ? JSON.stringify(entry.changes) : undefined,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
    }

    // Create audit log document
    await appwrite.databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.AUDIT_LOGS, ID.unique(), auditEntry)

    // Also log to application logger for monitoring
    logger.info("Audit log created", {
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      user_id: entry.user_id,
      clinic_id: entry.clinic_id,
      success: entry.success,
      risk_level: entry.risk_level,
    })
  } catch (error) {
    // Audit logging failures should never break the application
    // But we should log them for monitoring
    logger.error("Failed to create audit log", error, {
      entry,
    })

    if (process.env.NODE_ENV === "production") {
      // Send alert to monitoring system (Sentry, email, etc.)
      try {
        await sendAuditFailureAlert(error, entry)
      } catch (alertError) {
        logger.error("Failed to send audit failure alert", alertError)
      }
    }
  }
}

/**
 * Send alert when audit logging fails
 */
async function sendAuditFailureAlert(error: any, entry: any): Promise<void> {
  // Implement alerting mechanism
  // Could be: email, Slack, Sentry, PagerDuty, etc.
  logger.error("CRITICAL: Audit logging failure requires immediate attention", error, {
    entry,
    alert_type: "audit_failure",
    severity: "critical",
  })

  // Example: Send to external monitoring
  // await fetch('/api/alerts', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     type: 'audit_failure',
  //     error: error.message,
  //     entry,
  //     timestamp: new Date().toISOString()
  //   })
  // })
}

/**
 * Helper function to create audit logs for read operations
 * Tracks who accessed what sensitive data
 */
export async function auditRead(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  entityId: string
  entityDescription?: string
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "read",
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_description: params.entityDescription,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    success: true,
    risk_level: "low",
  })
}

/**
 * Helper function to create audit logs for create operations
 */
export async function auditCreate(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  entityId: string
  entityDescription?: string
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "create",
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_description: params.entityDescription,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    success: true,
    risk_level: "low",
  })
}

/**
 * Helper function to create audit logs for update operations
 * Includes tracking of what changed
 */
export async function auditUpdate(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  entityId: string
  entityDescription?: string
  changes?: Record<string, { old?: any; new?: any }>
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  // Determine risk level based on what changed
  let riskLevel: "low" | "medium" | "high" | "critical" = "low"

  if (params.changes) {
    const criticalFields = ["consent_given", "is_active", "permissions", "role"]
    const hasCriticalChange = Object.keys(params.changes).some((key) => criticalFields.includes(key))

    if (hasCriticalChange) {
      riskLevel = "high"
    } else if (Object.keys(params.changes).length > 5) {
      riskLevel = "medium"
    }
  }

  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "update",
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_description: params.entityDescription,
    changes: params.changes,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    success: true,
    risk_level: riskLevel,
  })
}

/**
 * Helper function to create audit logs for delete operations
 */
export async function auditDelete(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  entityId: string
  entityDescription?: string
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "delete",
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_description: params.entityDescription,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    success: true,
    risk_level: "high", // Deletes are always high risk
  })
}

/**
 * Helper function to create audit logs for data export operations
 */
export async function auditExport(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  exportFormat: string
  recordCount: number
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "export",
    entity_type: params.entityType,
    entity_id: "bulk_export",
    entity_description: `Exported ${params.recordCount} records as ${params.exportFormat}`,
    metadata: {
      ...params.metadata,
      export_format: params.exportFormat,
      record_count: params.recordCount,
    },
    ip_address: params.ipAddress,
    success: true,
    risk_level: params.recordCount > 100 ? "high" : "medium",
  })
}

/**
 * Helper function to create audit logs for decryption operations
 * Critical for tracking access to encrypted PHI
 */
export async function auditDecrypt(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  entityType: AuditEntityType
  entityId: string
  fieldsDecrypted: string[]
  reason?: string
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: "decrypt",
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_description: `Decrypted fields: ${params.fieldsDecrypted.join(", ")}`,
    metadata: {
      fields_decrypted: params.fieldsDecrypted,
      reason: params.reason,
    },
    ip_address: params.ipAddress,
    success: true,
    risk_level: "medium",
  })
}

/**
 * Helper function to create audit logs for failed operations
 * Important for security monitoring and detecting unauthorized access attempts
 */
export async function auditFailure(params: {
  clinicId: string
  userId: string
  userEmail: string
  userRole: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  errorMessage: string
  metadata?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    clinic_id: params.clinicId,
    user_id: params.userId,
    user_email: params.userEmail,
    user_role: params.userRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: params.metadata,
    ip_address: params.ipAddress,
    success: false,
    error_message: params.errorMessage,
    risk_level: "critical", // Failed operations are always flagged for review
  })
}

/**
 * Query audit logs for a specific entity
 * Useful for displaying audit trails in the UI
 */
export async function getAuditLogsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  clinicId: string,
  limit = 50,
): Promise<any[]> {
  try {
    const appwrite = await createServerClient()

    const response = await appwrite.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
      `clinicId=${clinicId}`,
      `entityType=${entityType}`,
      `entityId=${entityId}`,
      `orderBy=timestamp:desc`,
      `limit=${limit}`,
    ])

    return response.documents
  } catch (error) {
    logger.error("Failed to fetch audit logs", error, {
      entity_type: entityType,
      entity_id: entityId,
      clinic_id: clinicId,
    })
    return []
  }
}

/**
 * Query suspicious audit logs for security monitoring
 * Returns high-risk operations and failed attempts
 */
export async function getSuspiciousActivity(clinicId: string, hours = 24): Promise<any[]> {
  try {
    const appwrite = await createServerClient()
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const response = await appwrite.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.AUDIT_LOGS, [
      `clinicId=${clinicId}`,
      `timestamp>=${since}`,
      `(riskLevel=high OR riskLevel=critical OR success=false)`,
      `orderBy=timestamp:desc`,
      `limit=100`,
    ])

    return response.documents
  } catch (error) {
    logger.error("Failed to fetch suspicious activity", error, {
      clinic_id: clinicId,
    })
    return []
  }
}
