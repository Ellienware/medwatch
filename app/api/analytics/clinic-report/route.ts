import { type NextRequest, NextResponse } from "next/server"
import { analyticsService } from "@/lib/analytics/analytics-service"
import { getCurrentUser } from "@/lib/auth/actions"
import logger from "@/lib/logging/logger"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const report = await analyticsService.generateClinicReport(user.clinic_id, { 
      startDate, 
      endDate 
    })

    // Transform the data to match what DetailedAnalytics expects
    const transformedReport = {
      appointments: {
        total: report.appointments.total,
        completed: report.appointments.completed,
        cancelled: report.appointments.cancelled,
        noShow: report.appointments.noShow,
        completionRate: report.appointments.completionRate,
      },
      certificates: {
        total: report.certificates.total,
        fitToWork: report.certificates.fitToWork,
        fitWithRestrictions: report.certificates.fitWithRestrictions,
        unfitToWork: report.certificates.unfitToWork,
      },
      testResults: {
        total: report.testResults.total,
        normal: report.testResults.normal,
        abnormal: report.testResults.abnormal, // This is missing
        normalRate: report.testResults.normalRate,
      }
    }

    return NextResponse.json(transformedReport)
  } catch (error) {
    logger.error("Generate clinic report error", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}