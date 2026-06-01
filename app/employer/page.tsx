export const dynamic = 'force-dynamic';

import { EmployerStats } from "@/components/employer/employer-stats"
import { RecentCertificates } from "@/components/employer/recent-certificates"
import { EmployeeHealthStatus } from "@/components/employer/employee-health-status"

export default function EmployerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Employer Dashboard</h1>
        <p className="text-muted-foreground">Monitor your workforce health and compliance</p>
      </div>

      <EmployerStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentCertificates />
        <EmployeeHealthStatus />
      </div>
    </div>
  )
}
