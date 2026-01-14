import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getPatientRepository } from "@/lib/repositories"
import { EditPatientForm } from "@/components/clinic/patients/edit-patient-form"


interface EditPatientPageProps {
  params: Promise<{ patientId: string }>
}

export default async function EditPatientPage({ params }: EditPatientPageProps) {
  const { patientId } = await params
  const user = await getCurrentUser()

  if (!user?.clinic_id) {
    return (
      <div className="container mx-auto p-6">
        <p>No clinic found. Please contact your administrator.</p>
      </div>
    )
  }

  const patientRepo = getPatientRepository()
  const patient = await patientRepo.findById(patientId)

  if (!patient || patient.clinic_id !== user.clinic_id) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Patient Not Found</h1>
        <p>The patient you're looking for doesn't exist or you don't have access to it.</p>
        <Button asChild className="mt-4">
          <Link href="/clinic/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/clinic/patients/${patient.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Patient</h1>
          <p className="text-muted-foreground">
            Editing: {patient.first_name} {patient.last_name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPatientForm patient={patient} />
        </CardContent>
      </Card>
    </div>
  )
}