import type React from "react"
import { RoleGate } from "@/components/auth/role-gate"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["super_admin"]}>
      <div className="flex h-screen overflow-hidden bg-background">
        <SuperAdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </RoleGate>
  )
}
