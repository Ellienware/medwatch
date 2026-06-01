// app/api/cron/appointment-reminders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getAppointmentRepository, getPatientRepository, getClinicRepository } from "@/lib/repositories"
import { emailService } from "@/lib/email/email-service"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    let sentCount = 0
    let errorCount = 0

    // Get all clinics - you'll need to implement getClinicRepository().findAll() or similar
    // For now, let's assume you have a way to get clinic IDs
    const clinics = await clinicRepo.find([]) // Adjust based on your actual method
    
    for (const clinic of clinics) {
      try {
        // Get appointments for tomorrow for this clinic
        const appointments = await appointmentRepo.findByClinicId(clinic.id, {
          date: tomorrowDate,
          status: 'scheduled'
        })
        
        for (const appointment of appointments) {
          try {
            const patient = await patientRepo.findById(appointment.patient_id)
            
            if (patient?.email) {
              await emailService.sendAppointmentReminder(patient.email, {
                patientName: `${patient.first_name} ${patient.last_name}`,
                appointmentDate: appointment.appointment_date,
                appointmentTime: appointment.appointment_time,
                clinicName: clinic.name,
                clinicAddress: clinic.address || undefined,
                clinicPhone: clinic.phone || undefined,
              })
              sentCount++
            }
          } catch (error) {
            console.error(`Failed to send reminder for appointment ${appointment.id}:`, error)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`Failed to process clinic ${clinic.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} appointment reminders, ${errorCount} failed`,
      sent: sentCount,
      failed: errorCount,
    })

  } catch (error) {
    console.error("Error sending appointment reminders:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send reminders" },
      { status: 500 }
    )
  }
}
