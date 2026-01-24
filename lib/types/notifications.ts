// lib/types/database.ts (or wherever NotificationType is defined)
export interface Notification {
  id: string
  clinic_id: string
  user_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  link?: string | null
  data?: Record<string, any>
  read: boolean
  read_at?: string | null
  created_at: string
  expires_at?: string | null
}

export type NotificationType =
  | "appointment_scheduled"
  | "appointment_confirmed"
  | "appointment_updated"        // ADD THIS
  | "appointment_cancelled"      // ADD THIS
  | "appointment_rescheduled"
  | "payment_received"    // ADD THIS
  | "appointment_reminder"
  | "test_result_ready"
  | "certificate_issued"
  | "payment_due"
  | "system_alert"
  | "staff_invitation"
  | "employer_invitation"
  | "password_reset"
  | "patient_checked_in"         // ADD THIS
  | "staff_assigned"             // ADD THIS
  | "appointment_no_show"        // ADD THIS
  | "appointment_deleted"        // ADD THIS

export type NotificationPriority = "low" | "medium" | "high" | "urgent"