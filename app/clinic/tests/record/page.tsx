// app/clinic/tests/record/page.tsx (Server Component)
import { RecordTestForm } from "@/components/clinic/tests/record-test-form"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAppointmentRepository } from "@/lib/repositories"
import { getClinicalTestRepository } from "@/lib/repositories"
import type { Appointment, Patient, ClinicalTest } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Define the type for appointment with patient
type AppointmentWithPatient = Appointment & { patient?: Patient }

export default async function RecordTestPage() {
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return <div>No clinic found</div>
  }

  // Fetch data on the server
  const appointmentRepo = getAppointmentRepository()
  const testRepo = getClinicalTestRepository()

  const [appointments, tests] = await Promise.all([
    appointmentRepo.findAppointmentsWithPatientInfoBatch(user.clinic_id, { 
      status: "checked_in" 
    }) as Promise<AppointmentWithPatient[]>,
    testRepo.find([
      JSON.stringify({ method: "equal", attribute: "clinic_id", values: [user.clinic_id] }),
      JSON.stringify({ method: "equal", attribute: "is_active", values: [true] }),
      JSON.stringify({ method: "orderAsc", attribute: "test_name" })
    ]) as Promise<ClinicalTest[]>
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/tests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Record Test Results</h1>
          <p className="text-muted-foreground">Enter multiple test results for a patient</p>
        </div>
      </div>

      <RecordTestForm 
        initialAppointments={appointments}
        initialTests={tests}
      />
    </div>
  )
}