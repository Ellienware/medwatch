import type React from "react"
import { getCurrentUser } from "@/lib/auth/actions"
import type { UserRole } from "@/lib/types/database"
import { redirect } from "next/navigation"

interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export async function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized")
  }

  return <>{children}</>
}
