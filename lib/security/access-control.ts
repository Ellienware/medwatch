/**
 * Access Control Utilities
 *
 * Enforces role-based access control and data isolation
 * Ensures users only access data from their assigned clinic
 */

import type { UserRole } from "@/lib/types/database"
import type { AuditEntityType } from "./audit-log"

/**
 * Define permissions for each role
 */
const ROLE_PERMISSIONS = {
  super_admin: {
    // Super admin has access to everything
    "*": ["create", "read", "update", "delete", "export"],
  },
  clinic_admin: {
    // Clinic admin has full access within their clinic
    patient: ["create", "read", "update", "delete", "export"],
    appointment: ["create", "read", "update", "delete", "export"],
    test_result: ["create", "read", "update", "delete", "export"],
    certificate: ["create", "read", "update", "delete", "export"],
    user: ["create", "read", "update", "delete"],
    employer: ["create", "read", "update", "delete"],
    clinic: ["read", "update"],
    branch: ["create", "read", "update", "delete"],
    subscription: ["read"],
    payment: ["read"],
  },
  receptionist: {
    patient: ["create", "read", "update"],
    appointment: ["create", "read", "update"],
    test_result: ["read"],
    certificate: ["read"],
    employer: ["read"],
  },
  nurse: {
    patient: ["read", "update"],
    appointment: ["read", "update"],
    test_result: ["create", "read", "update"],
    certificate: ["read"],
  },
  doctor: {
    patient: ["read", "update"],
    appointment: ["read", "update"],
    test_result: ["read", "update"],
    certificate: ["create", "read", "update"],
  },
  employer: {
    // Employers can only view their own employees and certificates
    patient: ["read"],
    certificate: ["read"],
  },
} as const

/**
 * Check if a user role has permission to perform an action on an entity type
 */
export function hasPermission(role: UserRole, entityType: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[role]

  if (!permissions) {
    return false
  }

  // Super admin has all permissions
  if ("*" in permissions && permissions["*"].includes(action)) {
    return true
  }

  // Check specific entity type permissions
  if (entityType in permissions) {
    const entityPermissions = permissions[entityType as keyof typeof permissions]
    return Array.isArray(entityPermissions) && entityPermissions.includes(action)
  }

  return false
}

/**
 * Check if a user can access data from a specific clinic
 * Enforces data isolation between clinics
 */
export function canAccessClinic(userClinicId: string | null, targetClinicId: string, userRole: UserRole): boolean {
  // Super admins can access any clinic
  if (userRole === "super_admin") {
    return true
  }

  // All other users can only access their own clinic
  return userClinicId === targetClinicId
}

/**
 * Check if a user can decrypt sensitive fields
 * Only authorized roles can decrypt PHI
 */
export function canDecryptFields(role: UserRole): boolean {
  // Employers cannot decrypt any fields (they see pre-approved data only)
  if (role === "employer") {
    return false
  }

  // Receptionists have limited decryption access
  if (role === "receptionist") {
    return true // Can decrypt basic contact info only
  }

  // All medical staff can decrypt
  return ["nurse", "doctor", "clinic_admin", "super_admin"].includes(role)
}

/**
 * Get allowed decryption fields for a role
 * Restricts which fields each role can decrypt
 */
export function getAllowedDecryptionFields(role: UserRole, entityType: AuditEntityType): string[] {
  // Super admin and clinic admin can decrypt everything
  if (role === "super_admin" || role === "clinic_admin") {
    return ["*"]
  }

  // Define field-level access for each role
  const fieldAccess: Record<UserRole, Record<string, string[]>> = {
    super_admin: {},
    clinic_admin: {},
    receptionist: {
      patient: ["first_name", "last_name", "phone", "email", "address"],
      appointment: ["notes"],
      employer: ["contact_person", "contact_email", "contact_phone"],
      user: ["phone", "email"],
      test_result: [],
      certificate: [],
    },
    nurse: {
      patient: [
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
      appointment: ["notes", "examination_findings"],
      test_result: ["test_data", "notes", "technician_notes"],
      certificate: ["medical_conditions", "restrictions"],
      user: ["phone", "email"],
      employer: [],
    },
    doctor: {
      patient: [
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
      appointment: ["notes", "examination_findings"],
      test_result: ["test_data", "notes", "technician_notes"],
      certificate: ["medical_conditions", "restrictions", "recommendations", "doctor_notes"],
      user: ["phone", "email"],
      employer: [],
    },
    employer: {
      // Employers cannot decrypt any fields
      patient: [],
      appointment: [],
      test_result: [],
      certificate: [],
      user: [],
      employer: [],
    },
  }

  return fieldAccess[role][entityType] || []
}

/**
 * Validate that a user has the required permission and audit the access
 */
export function validateAccess(params: {
  userRole: UserRole
  userClinicId: string | null
  targetClinicId: string
  entityType: string
  action: string
}): { allowed: boolean; reason?: string } {
  // Check clinic access
  if (!canAccessClinic(params.userClinicId, params.targetClinicId, params.userRole)) {
    return {
      allowed: false,
      reason: "User does not have access to this clinic's data",
    }
  }

  // Check entity permission
  if (!hasPermission(params.userRole, params.entityType, params.action)) {
    return {
      allowed: false,
      reason: `Role ${params.userRole} does not have permission to ${params.action} ${params.entityType}`,
    }
  }

  return { allowed: true }
}
