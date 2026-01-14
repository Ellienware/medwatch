import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAppointmentRepository } from "@/lib/repositories"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const statuses = searchParams.getAll("status")
    const date = searchParams.get("date") ?? undefined

    const appointmentRepo = getAppointmentRepository()

    const appointments =
      await appointmentRepo.findAppointmentsWithPatientInfoBatch(
        user.clinic_id,
        { date }
      )

    const filtered =
      statuses.length > 0
        ? appointments.filter(apt => statuses.includes(apt.status))
        : appointments

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}
