// app/api/patients/list/route.ts - UPDATED
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { securePatientService } from "@/lib/services/secure-patient-service"

// Define patient type for mapping
interface SecurePatient {
  $id: string
  first_name?: string
  last_name?: string
  id_number?: string
  phone?: string
  email?: string
  is_active?: boolean
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

// Helper function to check if error is permission-related
function isPermissionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes("permission") || 
         message.includes("access denied") ||
         message.includes("unauthorized") ||
         message.includes("forbidden")
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const allowedRoles = ['clinic_admin', 'doctor', 'nurse', 'receptionist']
    
    if (!user?.clinic_id || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      employerId: searchParams.get("employerId"),
      search: searchParams.get("search"),
      status: searchParams.get("status") || "active", // Default to active
    }

    // Use secure service (auto-decrypts based on role)
    const result = await securePatientService.list(filters)
    const patients = (result.documents || []) as SecurePatient[]

    // Return only necessary fields for the dropdown
    const patientList = patients.map((patient: SecurePatient) => {
      const baseFields = {
        $id: patient.$id,
        first_name: patient.first_name || '', // Already decrypted by secure service
        last_name: patient.last_name || '',   // Already decrypted by secure service
      }
      
      // Add role-specific fields (already decrypted if permitted)
      switch(user.role) {
        case 'doctor':
        case 'nurse':
          return { 
            ...baseFields, 
            id_number: patient.id_number || '', // Only if user has permission to see it
            phone: patient.phone || '',
            email: patient.email || ''
          }
        case 'receptionist':
          return { 
            ...baseFields,
            phone: patient.phone || '',
            email: patient.email || ''
          }
        case 'clinic_admin':
          return {
            ...baseFields,
            id_number: patient.id_number || '',
            phone: patient.phone || '',
            email: patient.email || '',
            is_active: patient.is_active
          }
        default:
          return baseFields
      }
    })

    return NextResponse.json({ patients: patientList })
  } catch (error: unknown) {
    console.error("Get patients list error:", error)
    
    // Handle secure service errors
    if (isPermissionError(error)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
    
    return NextResponse.json({ error: "Failed to load patients" }, { status: 500 })
  }
}