import { StatsGrid } from "@/components/clinic/stats-grid"
import { TodayAppointments } from "@/components/clinic/today-appointments"
import { QuickActions } from "@/components/clinic/quick-actions"
import { RecentActivity } from "@/components/clinic/recent-activity"

export default function ClinicDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Overview of today's activities and clinic performance</p>
      </div>

      <StatsGrid />

      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAppointments />
        <RecentActivity />
      </div>
    </div>
  )
}
