// app/clinic/appointments/[id]/edit/page.tsx
import { EditAppointmentForm } from "@/components/clinic/appointments/edit-appointment-form"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAppointmentRepository } from "@/lib/repositories"
import { notFound, redirect } from "next/navigation"


interface EditAppointmentPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditAppointmentPage({ params }: EditAppointmentPageProps) {
  // Await the params promise
  const { id } = await params
  
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    redirect("/auth/login")
  }

  const appointmentRepo = getAppointmentRepository()
  
  try {
    const appointment = await appointmentRepo.findById(id)
    
    // Check if appointment belongs to user's clinic
    if (!appointment || appointment.clinic_id !== user.clinic_id) {
      notFound()
    }

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Appointment</h1>
          <p className="text-muted-foreground">
            Update appointment details
          </p>
        </div>
        
        <EditAppointmentForm 
          appointment={appointment}
          clinicId={user.clinic_id}
        />
      </div>
    )
  } catch (error) {
    console.error("Error fetching appointment:", error)
    notFound()
  }
}