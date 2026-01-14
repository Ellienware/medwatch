import { ReportsOverview } from "@/components/clinic/reports/reports-overview"
import { ReportGenerator } from "@/components/clinic/reports/report-generator"
import { QuickReports } from "@/components/clinic/reports/quick-reports"
import { DetailedAnalytics } from "@/components/clinic/reports/detailed-analytics"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Reports & Analytics</h1>
        <p className="text-muted-foreground">Generate comprehensive reports and track clinic performance</p>
      </div>

      <ReportsOverview />

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportGenerator />
        <QuickReports />
      </div>

      <DetailedAnalytics />
    </div>
  )
}
