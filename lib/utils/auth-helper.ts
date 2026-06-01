// lib/utils/auth-helpers.ts
import { EmployerUserSyncService } from "@/lib/services/employer-user-sync"
import { getCurrentUser } from "../auth/actions"

export async function getCurrentUserWithEmployer() {
  const user = await getCurrentUser()
  if (!user) return null

  if (user.role === 'employer') {
    const employer = await EmployerUserSyncService.getEmployerFromUser(user.id)
    return {
      ...user,
      employerDetails: employer
    }
  }

  return user
}
