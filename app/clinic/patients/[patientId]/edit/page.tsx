import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EditPatientForm } from "@/components/clinic/patients/edit-patient-form"

// IMPORT SECURE SERVICE
import { securePatientService } from "@/lib/services/secure-patient-service"

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

  // REPLACE THIS: Old direct repository call
  // const patientRepo = getPatientRepository()
  // const patient = await patientRepo.findById(patientId)

  // USE THIS: Secure service call
  try {
    const patient = await securePatientService.read(patientId)
    
    // The secure service already validates:
    // 1. User is authenticated
    // 2. User has permission to read patients
    // 3. User belongs to same clinic as patient
    // 4. Sensitive fields are decrypted based on user role
    
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/clinic/patients/${patient.$id}`}>
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
            {/* Pass the already-decrypted patient data to form */}
            <EditPatientForm patient={patient} />
          </CardContent>
        </Card>
      </div>
    )
    
  } catch (error: any) {
    // Handle security errors (permission denied, not found, etc.)
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-destructive mb-4">
          {error.message || "You don't have permission to view this patient."}
        </p>
        <Button asChild className="mt-4">
          <Link href="/clinic/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>
    )
  }
}