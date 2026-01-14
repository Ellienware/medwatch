// app/api/patients/list/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getPatientRepository } from "@/lib/repositories"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const patientRepo = getPatientRepository()
    
    // Get all active patients for the current clinic
    const patients = await patientRepo.findByClinicId(user.clinic_id, {
      isActive: true
    })

    // Return only necessary fields for the dropdown
    const patientList = patients.map(patient => ({
      id: patient.id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      id_number: patient.id_number,
      email: patient.email,
      phone: patient.phone,
    }))

    return NextResponse.json({ patients: patientList })
  } catch (error) {
    console.error("Get patients list error:", error)
    return NextResponse.json({ error: "Failed to load patients" }, { status: 500 })
  }
}