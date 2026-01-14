import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { ArrowLeft, Edit, Calendar } from "lucide-react"
import Link from "next/link"
import { getPatientRepository } from "@/lib/repositories"

interface PatientPageProps {
  params: Promise<{ patientId: string }>
}

export default async function PatientPage({ params }: PatientPageProps) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/clinic/patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-muted-foreground">Patient ID: {patient.id_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={patient.is_active ? "default" : "secondary"}>
            {patient.is_active ? "Active" : "Inactive"}
          </Badge>
          <Button asChild>
            <Link href={`/clinic/patients/${patient.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Patient
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{patient.date_of_birth || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{patient.gender || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Type</p>
                  <p className="font-medium">{patient.blood_type || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{patient.email || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{patient.phone || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{patient.address || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          {(patient.allergies || patient.chronic_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && (
                  <div>
                    <p className="text-sm text-muted-foreground">Allergies</p>
                    <p className="font-medium">{patient.allergies}</p>
                  </div>
                )}
                {patient.chronic_conditions && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                    <p className="font-medium">{patient.chronic_conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employment Information */}
          {patient.employer_id && (
            <Card>
              <CardHeader>
                <CardTitle>Employment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Employee Number</p>
                  <p className="font-medium">{patient.employee_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="font-medium">{patient.job_title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{patient.department || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.emergency_contact_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.emergency_contact_phone || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" asChild>
                <Link href={`/clinic/appointments/new?patientId=${patient.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}