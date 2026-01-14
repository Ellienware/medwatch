import type React from "react"
import { RoleGate } from "@/components/auth/role-gate"
import { ClinicSidebar } from "@/components/clinic/sidebar"
import { ClinicHeader } from "@/components/clinic/header"

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["clinic_admin", "receptionist", "nurse", "doctor"]}>
      <div className="flex h-screen overflow-hidden bg-background">
        <ClinicSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <ClinicHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </RoleGate>
  )
}
