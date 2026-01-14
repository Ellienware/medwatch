import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth/actions"
import { analyticsService } from "@/lib/analytics/analytics-service"
import { TrendingUp, Users, FileText, TestTube2 } from "lucide-react"

export async function ReportsOverview() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  try {
    // Get metrics for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

    // Fetch all metrics in parallel
    const [appointments, certificates, patients, testResults] = await Promise.all([
      analyticsService.getAppointmentMetrics(user.clinic_id, { 
        startDate: startOfMonth, 
        endDate: endOfMonth 
      }),
      analyticsService.getCertificateMetrics(user.clinic_id, { 
        startDate: startOfMonth, 
        endDate: endOfMonth 
      }),
      analyticsService.getPatientMetrics(user.clinic_id),
      analyticsService.getTestResultStats(user.clinic_id, { 
        startDate: startOfMonth, 
        endDate: endOfMonth 
      }),
    ])

    const stats = [
      {
        title: "Appointments",
        value: appointments.total.toString(),
        description: `${appointments.completionRate.toFixed(1)}% completion rate`,
        icon: TrendingUp,
        trend: appointments.completionRate >= 80 ? "up" : "down",
      },
      {
        title: "Active Patients",
        value: patients.active.toString(),
        description: `${patients.newThisMonth} new this month`,
        icon: Users,
      },
      {
        title: "Certificates Issued",
        value: certificates.total.toString(),
        description: `${certificates.pending} pending delivery`,
        icon: FileText,
      },
      {
        title: "Tests Performed",
        value: testResults.total.toString(),
        description: `${testResults.unreviewed} awaiting review`,
        icon: TestTube2,
      },
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error loading report overview:", error)
    
    // Return fallback UI
    const stats = [
      { title: "Appointments", value: "0", description: "Data unavailable", icon: TrendingUp },
      { title: "Active Patients", value: "0", description: "Data unavailable", icon: Users },
      { title: "Certificates Issued", value: "0", description: "Data unavailable", icon: FileText },
      { title: "Tests Performed", value: "0", description: "Data unavailable", icon: TestTube2 },
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}