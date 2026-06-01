import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAppointmentRepository, getPatientRepository } from "@/lib/repositories"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0]

    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()

    // 1️⃣ Fetch today's appointments
    const appointments = await appointmentRepo.findByClinicId(
      user.clinic_id,
      { date: today }
    )

    // 2️⃣ Fetch patient for each appointment (same as table)
    const appointmentsWithPatients = await Promise.all(
      appointments.slice(0, 5).map(async (apt) => {
        const patient = apt.patient_id
          ? await patientRepo.findById(apt.patient_id).catch(() => null)
          : null

        return {
          ...apt,
          patient,
        }
      })
    )
    const sanitizedAppointments = appointmentsWithPatients.map(apt => ({
      ...apt,
      patient: apt.patient ? {
        id: apt.patient.id,
        first_name: apt.patient.first_name,
        last_name: apt.patient.last_name,
      } : null
    }))

    return NextResponse.json(sanitizedAppointments)
  } catch (error) {
    console.error("Error fetching today's appointments:", error)
    return NextResponse.json(
      { error: "Failed to load today's appointments" },
      { status: 500 }
    )
  }
}
