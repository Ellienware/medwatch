// app/api/clinic/patients/[patientId]/deactivate/route.ts (NEW FILE)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { deactivatePatient } from "@/lib/actions/patient-actions"

interface RouteContext {
  params: { patientId: string }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = context.params
    const user = await getCurrentUser()
    
    // Only clinic admins and doctors can deactivate patients
    if (!user?.clinic_id || !['clinic_admin', 'doctor'].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { reason } = body || {}
    
    const result = await deactivatePatient(patientId, reason)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Patient deactivated. ${result.cancelledAppointments} future appointments cancelled.`,
      cancelledAppointments: result.cancelledAppointments
    })
  } catch (error) {
    console.error("Error in patient deactivation:", error)
    return NextResponse.json(
      { error: "Failed to deactivate patient" },
      { status: 500 }
    )
  }
}