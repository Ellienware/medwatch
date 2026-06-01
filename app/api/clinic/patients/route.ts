// app/api/clinic/patients/route.ts (NEW FILE for creating patients)
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { ZodError } from "zod"
import { PatientCreateSchema } from "@/lib/validation/patient-validation"

// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return "An unknown error occurred"
}

// Helper function to check if error is permission/access related
function isPermissionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes("permission") || 
         message.includes("access denied") ||
         message.includes("unauthorized") ||
         message.includes("forbidden")
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Only certain roles can create patients
    const allowedRoles = ['clinic_admin', 'receptionist', 'doctor']
    if (!user?.clinic_id || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.json()
    
    // Validate input
    const validatedData = PatientCreateSchema.parse(data)
    
    // Add clinic ID to patient data
    const patientData = {
      ...validatedData,
      clinic_id: user.clinic_id,
      created_by: user.id,
    }
    
    // Use secure service to create patient (auto-encrypts sensitive fields)
    const result = await securePatientService.create(patientData)
    
    // Audit log
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: result.id,
      action: "CREATE",
      changes: validatedData,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        created_via: "secure_api",
        via_secure_service: true
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    }, { status: 201 })
    
  } catch (error: unknown) {
    console.error("Error creating patient:", error)
    
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 })
    }
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ 
        error: "You don't have permission to create patients" 
      }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    )
  }
}