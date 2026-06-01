/**
 * Server-side access control utilities
 * Use these in API routes and server actions
 */

import { getCurrentUser } from "@/lib/auth/actions"
import { canAccessPatientData, canDecryptField, hasPermission } from "@/lib/auth/permissions"
import { auditFailure } from "@/lib/security/audit-log"
import type { UserRole } from "@/lib/types/database"

/**
 * Verify user has permission for an action
 * Automatically audits failed attempts
 */
export async function requirePermission(permission: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  if (!hasPermission(user.role, permission)) {
    // Audit the failed permission check
    await auditFailure({
      clinicId: user.clinic_id ?? "unknown", // Use nullish coalescing
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "read",
      entityType: "user" as any,
      entityId: user.id,
      errorMessage: `Insufficient permission: ${permission}`,
    })

    throw new Error(`Permission denied: ${permission}`)
  }
}

/**
 * Verify user can access data from a specific clinic
 */
export async function requireClinicAccess(targetClinicId: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Convert undefined to null for canAccessPatientData
  const userClinicId = user.clinic_id ?? null
  
  if (!canAccessPatientData(user.role, targetClinicId, userClinicId)) {
    await auditFailure({
      clinicId: user.clinic_id ?? "unknown",
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "read",
      entityType: "clinic" as any,
      entityId: targetClinicId,
      errorMessage: "Cross-clinic access attempt",
    })

    throw new Error("Access denied: Cannot access data from other clinics")
  }
}

/**
 * Verify user can decrypt a specific field
 */
export async function requireDecryptionPermission(fieldName: string, entityType: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  if (!canDecryptField(user.role, fieldName, entityType)) {
    await auditFailure({
      clinicId: user.clinic_id ?? "unknown",
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: "decrypt",
      entityType: entityType as any,
      entityId: "field_access",
      errorMessage: `Unauthorized decryption attempt: ${fieldName}`,
    })

    throw new Error(`Permission denied: Cannot decrypt field ${fieldName}`)
  }
}

/**
 * Get user context for operations
 * Use this in server actions
 */
export async function getUserContext() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  return {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role as UserRole,
    clinicId: user.clinic_id ?? "unknown",
    branchId: user.branch_id ?? null,
  }
}

/**
 * Wrap an operation with access control and audit logging
 */
export async function withAccessControl<T>(
  operation: () => Promise<T>,
  options: {
    permission?: string
    clinicId?: string
    entityType?: string
    entityId?: string
    action?: string
  },
): Promise<T> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  try {
    // Check permission if specified
    if (options.permission) {
      await requirePermission(options.permission)
    }

    // Check clinic access if specified
    if (options.clinicId) {
      await requireClinicAccess(options.clinicId)
    }

    // Execute operation
    const result = await operation()

    return result
  } catch (error: any) {
    // Audit the failure
    if (options.entityType && options.entityId) {
      await auditFailure({
        clinicId: user.clinic_id ?? "unknown",
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: (options.action || "read") as any,
        entityType: options.entityType as any,
        entityId: options.entityId,
        errorMessage: error.message,
      })
    }

    throw error
  }
}

/**
 * Middleware-specific helper to check if user needs onboarding
 */
export async function requiresOnboarding(): Promise<boolean> {
  const { getAuthUser } = await import("@/lib/auth/actions")
  const account = await getAuthUser()
  if (!account) return false
  
  const user = await getCurrentUser()
  return !user // If no user profile exists, onboarding is required
}

/**
 * Middleware helper to get auth status
 */
export async function getAuthStatus() {
  const { getAuthUser } = await import("@/lib/auth/actions")
  const user = await getCurrentUser()
  const account = await getAuthUser()
  
  return {
    isAuthenticated: !!account,
    needsOnboarding: !!account && !user,
    user: user,
  }
}
