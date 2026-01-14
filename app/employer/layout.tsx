import type React from "react"
import { RoleGate } from "@/components/auth/role-gate"
import { EmployerHeader } from "@/components/employer/employer-header"
import { EmployerSidebar } from "@/components/employer/employer-sidebar"

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={["employer"]}>
      <div className="flex h-screen overflow-hidden bg-background">
        <EmployerSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <EmployerHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </RoleGate>
  )
}
