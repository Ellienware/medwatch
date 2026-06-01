export const dynamic = 'force-dynamic';

import { getCurrentUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"

export default async function DashboardRedirect() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Redirect based on role
  switch (user.role) {
    case "super_admin":
      redirect("/super-admin")
    case "clinic_admin":
      redirect("/clinic")
    case "employer":
      redirect("/employer")
    default:
      redirect("/clinic")
  }
}
