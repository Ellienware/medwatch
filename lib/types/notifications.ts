// lib/types/database.ts (or wherever NotificationType is defined)
export type NotificationType =
  | "appointment_reminder"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_updated"
  | "appointment_rescheduled"
  | "appointment_deleted"
  | "appointment_no_show"
  | "patient_checked_in"
  | "staff_assigned"
  | "test_result_ready"
  | "certificate_issued"
  | "certificate_sent"
  | "payment_received"
  | "payment_due"
  | "system_alert"
  | "task_assigned"
  | "message_received"

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

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
