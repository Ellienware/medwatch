import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email/email-service"
import { getCurrentUser } from "@/lib/auth/actions"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { appointmentId } = await request.json()

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    const { databases } = createServerClient()

    // Get appointment details
    const appointment = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, appointmentId)

    // Get patient details
    const patient = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, appointment.patient_id)

    if (!patient.email) {
      return NextResponse.json({ error: "Patient email not found" }, { status: 400 })
    }

    // Get clinic details
    const clinic = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.CLINICS, appointment.clinic_id)

    // Send reminder email
    const result = await emailService.sendAppointmentReminder(patient.email, {
      patientName: `${patient.first_name} ${patient.last_name}`,
      appointmentDate: new Date(appointment.appointment_date).toLocaleDateString(),
      appointmentTime: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Reminder sent successfully" })
  } catch (error) {
    console.error("Send appointment reminder error:", error)
    return NextResponse.json({ error: "Failed to send reminder" }, { status: 500 })
  }
}
