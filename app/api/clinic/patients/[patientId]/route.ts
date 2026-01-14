import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getPatientRepository } from "@/lib/repositories"

interface RouteContext {
  params: Promise<{ patientId: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { params } = context
    const { patientId } = await params
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const patientRepo = getPatientRepository()

    // First, verify the patient exists and belongs to this clinic
    const patient = await patientRepo.findById(patientId)
    if (!patient || patient.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Update the patient
    const updatedPatient = await patientRepo.update(patientId, {
      ...data,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json(updatedPatient)
  } catch (error) {
    console.error("Error updating patient:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}