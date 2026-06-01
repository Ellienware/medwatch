/// app/api/clinic/patients/[patientId]/route.ts - UPDATED
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { ZodError } from "zod"
import { PatientUpdateSchema } from "@/lib/validation/patient-validation"

interface RouteContext {
  params: Promise<{ patientId: string }>
}

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

// Helper function to check if error is not found
function isNotFoundError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes("not found") ||
         message.includes("does not exist") ||
         message.includes("no record")
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const user = await getCurrentUser()
    
    // Role-based authorization
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!user?.clinic_id || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const data = await request.json()
    
    // Validate input
    const validatedData = PatientUpdateSchema.parse(data)
    
    // USE: Secure service (auto-encrypts sensitive fields)
    const result = await securePatientService.update(patientId, validatedData)
    
    // Audit log
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: patientId,
      action: "UPDATE",
      changes: validatedData,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        updated_fields: Object.keys(validatedData),
        // Don't log actual PHI values
        patient_name: "***",
        via_secure_service: true
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      data: result 
    })
    
  } catch (error) {
    console.error("Error updating patient:", error)
    
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 })
    }
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ 
        error: "You don't have permission to update this patient" 
      }, { status: 403 })
    }
    
    if (isNotFoundError(error)) {
      return NextResponse.json({ 
        error: "Patient not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const user = await getCurrentUser()
    
    // Role-based authorization
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    if (!user?.clinic_id || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // USE: Secure service (auto-decrypts based on role)
    const patient = await securePatientService.read(patientId)
    
    // Audit log for viewing
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: patientId,
      action: "READ",
      changes: undefined,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        patient_name: "***",
        accessed_via: "secure_api",
        via_secure_service: true
      }
    })
    
    return NextResponse.json({ data: patient })
    
  } catch (error) {
    console.error("Error fetching patient:", error)
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ 
        error: "You don't have permission to view this patient" 
      }, { status: 403 })
    }
    
    if (isNotFoundError(error)) {
      return NextResponse.json({ 
        error: "Patient not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = await context.params
    const user = await getCurrentUser()
    
    // Only clinic admins can delete patients
    if (!user?.clinic_id || user.role !== 'clinic_admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // USE: Secure service for soft delete
    // First get patient to verify they exist
    const patient = await securePatientService.read(patientId)
    
    // Then update with secure service
    const result = await securePatientService.update(patientId, {
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: user.id,
    })
    
    // Audit log
    await MedicalAudit.logAction({
      userId: user.id,
      userRole: user.role,
      clinicId: user.clinic_id,
      entityType: "patient",
      entityId: patientId,
      action: "STATUS_CHANGE",
      changes: { is_active: false },
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: {
        patient_name: "***",
        deactivated_by: user.email,
        deactivated_at: new Date().toISOString(),
        via_secure_service: true
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: "Patient deactivated successfully",
      data: result
    })
  } catch (error) {
    console.error("Error deactivating patient:", error)
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ 
        error: "You don't have permission to deactivate this patient" 
      }, { status: 403 })
    }
    
    if (isNotFoundError(error)) {
      return NextResponse.json({ 
        error: "Patient not found" 
      }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}