// lib/repositories/audit-log-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { AuditLog } from "@/lib/types/database"

export class AuditLogRepository extends BaseRepository<AuditLog> {
  protected collectionId = COLLECTIONS.AUDIT_LOGS

  constructor() {
    super("audit_log")
  }

  protected mapToEntity(doc: any): AuditLog {
    // Parse changes from JSON string or use null
    let changes: string | null = null
    if (typeof doc.changes === 'string' && doc.changes.trim()) {
      try {
        changes = doc.changes
      } catch (error) {
        console.warn('Failed to parse changes JSON:', error)
      }
    } else if (doc.changes && typeof doc.changes === 'object') {
      changes = JSON.stringify(doc.changes)
    } else if (doc.changes === null) {
      changes = null
    }

    // Parse metadata from JSON string or use null
    let metadata: string | null = null
    if (typeof doc.metadata === 'string' && doc.metadata.trim()) {
      try {
        metadata = doc.metadata
      } catch (error) {
        console.warn('Failed to parse metadata JSON:', error)
      }
    } else if (doc.metadata && typeof doc.metadata === 'object') {
      metadata = JSON.stringify(doc.metadata)
    } else if (doc.metadata === null) {
      metadata = null
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      user_id: doc.user_id,
      user_email: doc.user_email,
      user_role: doc.user_role,
      action: doc.action,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
      entity_description: doc.entity_description,
      changes: changes,
      metadata: metadata,
      ip_address: doc.ip_address,
      user_agent: doc.user_agent,
      risk_level: doc.risk_level,
      timestamp: doc.timestamp,
      success: doc.success,
      error_message: doc.error_message,
    }
  }

  async findByClinicId(clinicId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("timestamp"),
      Query.limit(limit),
    ])
  }

  async findByUserId(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.find([
      Query.equal("user_id", userId),
      Query.orderDesc("timestamp"),
      Query.limit(limit),
    ])
  }

  async findHighRisk(clinicId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("risk_level", "high"),
      Query.orderDesc("timestamp"),
      Query.limit(limit),
    ])
  }

  async findFailedActions(clinicId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("success", false),
      Query.orderDesc("timestamp"),
      Query.limit(limit),
    ])
  }
}