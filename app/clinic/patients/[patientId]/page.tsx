import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { ArrowLeft, Edit, Calendar, Shield, Lock, FileText, Phone, Mail, MapPin, User, Heart, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getPatient } from "@/lib/actions/patient-actions"
import { hasPermission } from "@/lib/security/access-control"

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

  try {
    const result = await getPatient(patientId)
    
    if (!result.success) {
      throw new Error(result.error || "Failed to load patient")
    }

    const patient = result.patient

    // Check permissions
    const canEditPatient = hasPermission(user.role, 'patient', 'update')
    const canViewMedicalInfo = ['doctor', 'nurse', 'clinic_admin', 'super_admin'].includes(user.role)
    const canViewSensitiveInfo = canViewMedicalInfo || user.role === 'receptionist'

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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  {!canViewSensitiveInfo && (
                    <Shield className="h-5 w-5 text-blue-600" aria-label="Limited view based on your role" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground">
                    Patient ID: {patient.id_number || "••••••••••"}
                  </p>
                  {!patient.id_number && canViewSensitiveInfo && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={patient.is_active ? "default" : "secondary"}>
              {patient.is_active ? "Active" : "Inactive"}
            </Badge>
            {canEditPatient && (
              <Button asChild>
                <Link href={`/clinic/patients/${patient.$id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Patient
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Role-based Security Notice */}
        {user.role === 'receptionist' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Limited Access View</p>
                <p className="text-sm text-blue-700">
                  As a receptionist, you can view basic contact information only. 
                  Medical details are restricted to medical staff.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">
                      {patient.date_of_birth ? calculateAge(patient.date_of_birth) : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Contact Information
                  {canViewSensitiveInfo && (
                    <Shield className="h-4 w-4 text-green-600" aria-label="Decrypted based on your role" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium whitespace-pre-line">{patient.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Information - Conditionally shown */}
            {canViewMedicalInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    Medical Information
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Medical Staff Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {patient.allergies && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Allergies
                      </p>
                      <p className="font-medium mt-1">{patient.allergies}</p>
                    </div>
                  )}
                  {patient.chronic_conditions && (
                    <div>
                      <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                      <p className="font-medium mt-1">{patient.chronic_conditions}</p>
                    </div>
                  )}
                  {patient.medical_history && (
                    <div>
                      <p className="text-sm text-muted-foreground">Medical History</p>
                      <p className="font-medium mt-1 whitespace-pre-line">{patient.medical_history}</p>
                    </div>
                  )}
                  {patient.current_medications && (
                    <div>
                      <p className="text-sm text-muted-foreground">Current Medications</p>
                      <p className="font-medium mt-1 whitespace-pre-line">{patient.current_medications}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Placeholder for non-medical staff */}
            {!canViewMedicalInfo && (
              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-5 w-5" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Restricted Access
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Medical information is only available to doctors and nurses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Employment Information */}
            {patient.employer_id && (
              <Card>
                <CardHeader>
                  <CardTitle>Employment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.employee_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Employee Number</p>
                      <p className="font-medium">{patient.employee_number}</p>
                    </div>
                  )}
                  {patient.job_title && (
                    <div>
                      <p className="text-sm text-muted-foreground">Job Title</p>
                      <p className="font-medium">{patient.job_title}</p>
                    </div>
                  )}
                  {patient.department && (
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{patient.department}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {canViewMedicalInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.emergency_contact_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{patient.emergency_contact_name}</p>
                    </div>
                  )}
                  {patient.emergency_contact_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{patient.emergency_contact_phone}</p>
                    </div>
                  )}
                  {patient.emergency_contact_relationship && (
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium">{patient.emergency_contact_relationship}</p>
                    </div>
                  )}
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
                  <Link href={`/clinic/appointments/new?patientId=${patient.$id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
                {canViewMedicalInfo && (
                  <>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/clinic/patients/${patient.$id}/test-results`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Test Results
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/clinic/patients/${patient.$id}/certificates`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Certificates
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Information (Admins only) */}
            {(user.role === 'clinic_admin' || user.role === 'super_admin') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/clinic/audit?patientId=${patient.id}`}>
                      View Access History
                    </Link>
                  </Button>
                  <div className="pt-4 border-t text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Data Protection</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-1">
                        <Lock className="h-3 w-3 text-green-600" />
                        <span>Sensitive fields: Encrypted</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-600" />
                        <span>Access: Role-based</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-amber-600" />
                        <span>Audit: Complete</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
    
  } catch (error: any) {
    console.error("Error loading patient:", error)
    
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <Shield className="h-16 w-16 mx-auto text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">
            {error.message?.includes("permission") ? "Access Denied" : "Patient Not Found"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error.message?.includes("permission") 
              ? "You don't have permission to view this patient's information." 
              : "The patient record could not be found or accessed."}
          </p>
          <Button asChild className="mt-4">
            <Link href="/clinic/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}

function calculateAge(dateOfBirth: string): string {
  try {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return `${age} years`
  } catch {
    return "N/A"
  }
}