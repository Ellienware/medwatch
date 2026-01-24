import { getCurrentUser } from "@/lib/auth/actions"
import { getActivityRepository } from "@/lib/repositories"
import type { ActivityType } from "@/lib/types/database"

export async function logActivity(
  actionType: ActivityType,
  description: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id || !user.id) {
      console.warn("Cannot log activity: No user or clinic found")
      return
    }

    const activityRepo = getActivityRepository()
    
    await activityRepo.createActivity({
      clinic_id: user.clinic_id,
      user_id: user.id,
      user_name: user.full_name || user.email || "Unknown User",
      user_role: user.role || "",
      action_type: actionType,
      description,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
    // Don't throw error to prevent breaking the main functionality
  }
}

// Convenience functions for common activity types
export const activityLogger = {
  patientRegistered: async (patientId: string, patientName: string) => {
    await logActivity(
      "patient_registered",
      `Registered new patient: ${patientName}`,
      "patient",
      patientId,
      { patient_id: patientId, patient_name: patientName }
    )
  },

  patientUpdated: async (patientId: string, patientName: string) => {
    await logActivity(
      "patient_updated",
      `Updated patient: ${patientName}`,
      "patient",
      patientId,
      { patient_id: patientId, patient_name: patientName }
    )
  },

  patientDeleted: async (patientId: string, patientName: string) => {
    await logActivity(
      "patient_deleted",
      `Deleted patient: ${patientName}`,
      "patient",
      patientId,
      { 
        patient_id: patientId, 
        patient_name: patientName,
        deleted_at: new Date().toISOString()
      }
    )
  },

  patientActivated: async (patientId: string, patientName: string) => {
    await logActivity(
      "patient_activated",
      `Activated patient: ${patientName}`,
      "patient",
      patientId,
      { patient_id: patientId, patient_name: patientName }
    )
  },

  patientDeactivated: async (patientId: string, patientName: string) => {
    await logActivity(
      "patient_deactivated",
      `Deactivated patient: ${patientName}`,
      "patient",
      patientId,
      { patient_id: patientId, patient_name: patientName }
    )
  },

  appointmentCreated: async (appointmentId: string, patientName: string) => {
    await logActivity(
      "appointment_created",
      `Created appointment for ${patientName}`,
      "appointment",
      appointmentId,
      { appointment_id: appointmentId, patient_name: patientName }
    )
  },

  appointmentCompleted: async (appointmentId: string, patientName: string) => {
    await logActivity(
      "appointment_completed",
      `Completed appointment for ${patientName}`,
      "appointment",
      appointmentId,
      { appointment_id: appointmentId, patient_name: patientName }
    )
  },

  appointmentCancelled: async (appointmentId: string, patientName: string) => {
    await logActivity(
      "appointment_cancelled",
      `Cancelled appointment for ${patientName}`,
      "appointment",
      appointmentId,
      { appointment_id: appointmentId, patient_name: patientName }
    )
  },

  certificateIssued: async (certificateId: string, patientName: string) => {
    await logActivity(
      "certificate_issued",
      `Issued certificate for ${patientName}`,
      "certificate",
      certificateId,
      { certificate_id: certificateId, patient_name: patientName }
    )
  },

  testResultUploaded: async (testId: string, patientName: string) => {
    await logActivity(
      "test_result_uploaded",
      `Uploaded test result for ${patientName}`,
      "test",
      testId,
      { test_id: testId, patient_name: patientName }
    )
  },

  userLoggedIn: async () => {
    await logActivity(
      "user_logged_in",
      "User logged in",
      "user"
    )
  },

  userLoggedOut: async () => {
    await logActivity(
      "user_logged_out",
      "User logged out",
      "user"
    )
  },

  branchCreated: async (branchId: string, branchName: string) => {
    await logActivity(
      "branch_created",
      `Created new branch: ${branchName}`,
      "branch",
      branchId,
      { branch_id: branchId, branch_name: branchName }
    )
  },

  branchUpdated: async (branchId: string, branchName: string) => {
    await logActivity(
      "branch_updated",
      `Updated branch: ${branchName}`,
      "branch",
      branchId,
      { branch_id: branchId, branch_name: branchName }
    )
  },

  settingsUpdated: async (userId?: string, settingType?: string) => {
    await logActivity(
      "settings_updated",
      `Updated ${settingType || "user"} settings`,
      "settings",
      userId
    )
  },

  // NEW: User-specific activity methods
  profileUpdated: async (userId: string, changes?: Record<string, any>) => {
    await logActivity(
      "settings_updated",
      `Updated user profile`,
      "user",
      userId,
      changes
    )
  },

  passwordChanged: async (userId: string) => {
    await logActivity(
      "settings_updated",
      "Changed password",
      "user",
      userId,
      { action: "password_change" }
    )
  },

  avatarUpdated: async (userId: string) => {
    await logActivity(
      "settings_updated",
      "Updated profile picture",
      "user",
      userId,
      { action: "avatar_update" }
    )
  },

  // Generic method for other activity types
  custom: async (
    actionType: ActivityType,
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    await logActivity(actionType, description, entityType, entityId, metadata)
  },
}