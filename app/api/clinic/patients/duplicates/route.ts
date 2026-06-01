// app/api/clinic/patients/duplicates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { ZodError } from "zod"
import { PatientSearchSchema } from "@/lib/validation/patient-validation"

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
    
    // Role-based authorization
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!user?.clinic_id || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.json()
    
    // Validate input
    const validatedData = PatientSearchSchema.parse(data)
    
    // Use secure patient service to find duplicates
    const duplicates = await securePatientService.findDuplicates(validatedData)
    
    // Audit log - Use "READ" action for duplicate search (falling under read operation)
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: "duplicate_search",
      action: "READ", // Changed from "DUPLICATE_SEARCH" to "READ"
      changes: validatedData,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        search_criteria: Object.keys(validatedData),
        result_count: duplicates.length,
        via_secure_service: true,
        operation_type: "duplicate_search" // Add this to differentiate
      }
    })
    
    // Return duplicate results with masked sensitive data
    return NextResponse.json({ 
      success: true, 
      data: duplicates 
    })
    
  } catch (error) {
    console.error("Error finding patient duplicates:", error)
    
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 })
    }
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ 
        error: "You don't have permission to search for duplicates" 
      }, { status: 403 })
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}