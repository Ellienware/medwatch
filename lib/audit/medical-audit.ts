// lib/audit/medical-audit.ts
import { getAppointmentRepository, getAuditLogRepository, getPatientRepository, getTestResultRepository, getUserRepository } from "@/lib/repositories"

interface AuditAction {
  userId: string
  userRole: string
  clinicId: string
  entityType: 'patient' | 'appointment' | 'test_result' | 'certificate' | 'user'
  entityId: string
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'REVIEW'
  changes?: Record<string, any> | string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
}

export class MedicalAudit {
  private static readonly AUDIT_RETENTION_DAYS = 730 // 2 years for HIPAA
  
static async logAction(action: AuditAction) {
  try {
    const auditRepo = getAuditLogRepository()
    const userRepo = getUserRepository()
    
    // Get user email for audit trail
    const user = await userRepo.findById(action.userId)
    const userEmail = user?.email || "unknown@email.com"
    
    // Don't log PHI in changes
    const sanitizedChanges = action.changes 
      ? this.sanitizeChanges(action.entityType, action.changes)
      : null
    
    // Get entity description
    const entityDescription = await this.getEntityDescription(
      action.entityType, 
      action.entityId
    )
    
    // Create the audit log data - explicitly define each field
    const auditLogData = {
      clinic_id: action.clinicId,
      user_id: action.userId,
      user_email: userEmail,
      user_role: action.userRole,
      action: action.action,
      entity_type: action.entityType,
      entity_id: action.entityId,
      entity_description: entityDescription,
      changes: sanitizedChanges ? JSON.stringify(sanitizedChanges) : null,
      metadata: action.metadata ? JSON.stringify(action.metadata) : null,
      ip_address: action.ipAddress || null,
      user_agent: action.userAgent || null,
      risk_level: this.calculateRiskLevel(action),
      timestamp: new Date().toISOString(),
      success: true,
      error_message: null,
    }
    
    // Debug: Check what we're sending
    console.log('[MedicalAudit] Creating audit log with data:', auditLogData)
    
    await auditRepo.create(auditLogData)
  } catch (error) {
    console.error("Failed to log audit action:", error)
    // Don't throw - audit failures shouldn't break main functionality
  }
}
  
  private static sanitizeChanges(
    entityType: string, 
    changes: Record<string, any> | string
  ): Record<string, any> | string | null {
    if (typeof changes === 'string') {
      // If it's already a string, just return it as-is
      return changes
    }
    
    if (!changes) return null
    
    const sanitized: Record<string, any> = {}
    const sensitivePatterns = [
      'password', 'token', 'secret', 'key', '_key', '_token',
      'ssn', 'id_number', 'credit_card', 'cvv', 'pin'
    ]
    
    const phiPatterns = [
      'diagnosis', 'results', 'notes', 'findings',
      'allergies', 'conditions', 'medications', 'history'
    ]
    
    for (const [key, value] of Object.entries(changes)) {
      const keyLower = key.toLowerCase()
      
      // Check if field contains sensitive data
      const isSensitive = sensitivePatterns.some(pattern => 
        keyLower.includes(pattern)
      )
      
      const isPHI = phiPatterns.some(pattern => 
        keyLower.includes(pattern)
      )
      
      if (isSensitive) {
        sanitized[key] = "[SENSITIVE DATA REDACTED]"
      } else if (isPHI) {
        sanitized[key] = "[MEDICAL DATA REDACTED]"
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + "..."
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }
  
  private static async getEntityDescription(
    entityType: string, 
    entityId: string
  ): Promise<string | null> {
    try {
      switch(entityType) {
        case 'patient':
          const patientRepo = getPatientRepository()
          const patient = await patientRepo.findById(entityId)
          return patient ? `Patient: ${patient.first_name} ${patient.last_name}` : null
          
        case 'appointment':
          const appointmentRepo = getAppointmentRepository()
          const appointment = await appointmentRepo.findById(entityId)
          return appointment ? `Appointment: ${appointment.appointment_date} ${appointment.appointment_time}` : null
          
        case 'test_result':
          const testRepo = getTestResultRepository()
          const test = await testRepo.findById(entityId)
          return test ? `Test: ${test.test_code}` : null
          
        default:
          return `${entityType}: ${entityId.substring(0, 8)}`
      }
    } catch {
      return null
    }
  }
  
  private static calculateRiskLevel(action: AuditAction): string {
    // High risk actions
    const highRiskActions = ['DELETE', 'STATUS_CHANGE']
    const highRiskEntities = ['patient', 'test_result', 'certificate']
    
    if (highRiskActions.includes(action.action) && 
        highRiskEntities.includes(action.entityType)) {
      return 'high'
    }
    
    // Medium risk
    if (action.entityType === 'test_result' && action.action === 'CREATE') {
      return 'medium'
    }
    
    if (action.entityType === 'patient' && action.action === 'UPDATE') {
      return 'medium'
    }
    
    return 'low'
  }
  
  static async logFailedAction(
    action: Omit<AuditAction, 'action'> & { 
      action: string 
      errorMessage: string 
    }
  ) {
    try {
      const auditRepo = getAuditLogRepository()
      
      await auditRepo.create({
        clinic_id: action.clinicId,
        user_id: action.userId,
        user_email: await this.getUserEmail(action.userId),
        user_role: action.userRole,
        action: action.action as any,
        entity_type: action.entityType,
        entity_id: action.entityId,
        entity_description: await this.getEntityDescription(
          action.entityType, 
          action.entityId
        ),
        changes: null,
        metadata: action.metadata ? JSON.stringify(action.metadata) : null,
        ip_address: action.ipAddress,
        user_agent: action.userAgent,
        risk_level: 'high', // Failed actions are high risk
        timestamp: new Date().toISOString(),
        success: false,
        error_message: action.errorMessage,
      })
    } catch (error) {
      console.error("Failed to log failed audit action:", error)
    }
  }
  
  private static async getUserEmail(userId: string): Promise<string> {
    try {
      const userRepo = getUserRepository()
      const user = await userRepo.findById(userId)
      return user?.email || "unknown@email.com"
    } catch {
      return "unknown@email.com"
    }
  }
}
