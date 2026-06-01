// lib/utils/type-guards.ts
import type { AppointmentStatus } from "@/lib/types/database"

export function isValidAppointmentStatus(status: string | null | undefined): status is AppointmentStatus {
  if (!status) return false
  
  const validStatuses: AppointmentStatus[] = [
    "scheduled",
    "checked_in",
    "with_nurse",
    "tests_in_progress",
    "with_doctor",
    "completed",
    "cancelled",
    "no_show"
  ]
  
  return validStatuses.includes(status as AppointmentStatus)
}
