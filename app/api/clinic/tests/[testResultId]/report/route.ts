// app/api/clinic/tests/[testResultId]/report/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getTestResultFullReport } from "@/lib/actions/test-result-actions"
import { MedicalAudit } from "@/lib/audit/medical-audit"

interface RouteContext {
  params: Promise<{ testResultId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { testResultId } = await context.params
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view reports
    const allowedRoles = ['doctor', 'nurse', 'clinic_admin', 'super_admin']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to view test reports" }, { status: 403 })
    }

    // Get the full test result report
    const result = await getTestResultFullReport(testResultId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    const { fullReport } = result

    // Check if test is sensitive and user has permission
    if (fullReport.is_sensitive && !['doctor', 'clinic_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: "You don't have permission to view sensitive test reports" }, { status: 403 })
    }

    // TODO: Generate PDF report using a PDF generation library
    // For now, we'll return the data and you can implement PDF generation
    const reportData = {
      testResult: fullReport,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      clinicId: user.clinic_id,
      securityLevel: fullReport.is_sensitive ? "high" : "medium"
    }

    // Audit the report generation - Use "READ" action since exporting is a form of reading
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "test_result",
      entityId: testResultId,
      action: "READ", // Changed from "EXPORT" to "READ"
      changes: undefined,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        patient_name: `${fullReport.patient?.first_name} ${fullReport.patient?.last_name}`,
        test_name: fullReport.test?.test_name,
        is_sensitive: fullReport.is_sensitive,
        report_format: "pdf",
        via_secure_api: true,
        operation_type: "export" // Add this to differentiate from regular reads
      }
    })

    // In a real implementation, you would:
    // 1. Generate PDF using @react-pdf/renderer or similar
    // 2. Upload to secure storage
    // 3. Return download URL
    const pdfUrl = `/api/clinic/tests/${testResultId}/report/download` // Placeholder

    return NextResponse.json({
      success: true,
      pdfUrl,
      reportData,
      message: "Report generated securely"
    })
    
  } catch (error) {
    console.error("Error generating test report:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}