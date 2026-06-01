// app/clinic/assessments/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth/actions"
import { AssessmentRepository } from "@/lib/repositories/assessment-repository"
import { AppointmentRepository } from "@/lib/repositories/appointment-repository"
import { PatientRepository } from "@/lib/repositories/patient-repository"
import type { AssessmentStatus, FitnessDecision, Patient } from "@/lib/types/database"

// Move static data outside component
const statusColors: Record<AssessmentStatus, string> = {
  in_progress: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
}

const decisionColors: Record<FitnessDecision, string> = {
  fit: "bg-green-500/10 text-green-700 border-green-200",
  fit_with_conditions: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  fit_with_restrictions: "bg-orange-500/10 text-orange-700 border-orange-200",
  temporarily_unfit: "bg-red-500/10 text-red-700 border-red-200",
  permanently_unfit: "bg-red-600/10 text-red-800 border-red-300",
}

const decisionLabels: Record<FitnessDecision, string> = {
  fit: "Fit",
  fit_with_conditions: "Fit with Conditions",
  fit_with_restrictions: "Fit with Restrictions",
  temporarily_unfit: "Temporarily Unfit",
  permanently_unfit: "Permanently Unfit",
}

// Interface for appointments with patient data
interface AppointmentWithPatient {
  id: string
  clinic_id: string
  branch_id: string
  patient_id: string
  employer_id: string | null
  appointment_date: string
  appointment_time: string
  appointment_type: string
  reason: string | null
  status: string
  checked_in_at: string | null
  checked_in_by: string | null
  nurse_assigned_id: string | null
  nurse_started_at: string | null
  nurse_completed_at: string | null
  doctor_assigned_id: string | null
  doctor_started_at: string | null
  doctor_completed_at: string | null
  completed_at: string | null
  reception_notes: string | null
  nurse_notes: string | null
  doctor_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  patient?: {
    id: string
    first_name: string
    last_name: string
    id_number: string
    date_of_birth: string
    gender: string | null
    // Add other patient fields as needed
  }
}

// Statistics component with loading state
async function AssessmentStatistics({ clinicId }: { clinicId: string }) {
  try {
    const repo = new AssessmentRepository()
    const statistics = await repo.getStatistics(clinicId)
    
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.in_progress || 0}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics.fit || 0}</p>
                <p className="text-sm text-muted-foreground">Fit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(statistics.temporarily_unfit || 0) + 
                   (statistics.permanently_unfit || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Unfit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error loading assessment statistics:", error)
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}

// Helper function to fetch patients for appointments
async function fetchPatientsForAppointments(appointments: any[], clinicId: string) {
  try {
    const patientRepo = new PatientRepository()
    const patientIds = appointments.map(a => a.patient_id).filter(Boolean)
    
    if (patientIds.length === 0) return appointments
    
    // Fetch patients one by one or use a different approach
    // Since AppWrite doesn't support IN queries directly, we need to fetch individually
    const patients: Patient[] = []
    
    // Fetch in parallel but with limits to avoid too many requests
    const batchSize = 10
    for (let i = 0; i < patientIds.length; i += batchSize) {
      const batch = patientIds.slice(i, i + batchSize)
      const batchPromises = batch.map(patientId => 
        patientRepo.findById(patientId).catch(() => null)
      )
      
      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter((p): p is Patient => p !== null)
      patients.push(...validResults)
    }
    
    // Create a map for quick lookup
    const patientMap = new Map(patients.map(p => [p.id, p]))
    
    // Join patients with appointments
    return appointments.map(appointment => ({
      ...appointment,
      patient: patientMap.get(appointment.patient_id)
    }))
  } catch (error) {
    console.error("Error fetching patients:", error)
    // Return appointments without patient data if fetch fails
    return appointments.map(appointment => ({
      ...appointment,
      patient: undefined
    }))
  }
}

// Ready for Assessment Tab content
async function ReadyForAssessmentContent({ clinicId, userId }: { clinicId: string; userId: string }) {
  try {
    const appointmentRepo = new AppointmentRepository()
    const assessmentRepo = new AssessmentRepository()
    
    // Get appointments that are ready for assessment (with tests completed)
    const appointments = await appointmentRepo.findReadyForAssessment(clinicId)
    
    // Fetch patient data for these appointments
    const appointmentsWithPatients = await fetchPatientsForAppointments(appointments, clinicId)
    
    // Get existing assessments for these appointments
    const appointmentIds = appointments.map(a => a.id)
    const existingAssessments = appointmentIds.length > 0 
      ? await assessmentRepo.findByAppointmentIds(appointmentIds)
      : []
    
    const appointmentsWithStatus = appointmentsWithPatients.map(appointment => {
      const existingAssessment = existingAssessments.find(a => a.appointment_id === appointment.id)
      return {
        ...appointment,
        hasAssessment: !!existingAssessment,
        assessmentId: existingAssessment?.id
      }
    })
    
    if (appointmentsWithStatus.length === 0) {
      return (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Appointments Ready</h3>
          <p className="text-muted-foreground">
            There are no appointments waiting for clinical assessment
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-3">
        {appointmentsWithStatus.map((appointment) => (
          <div 
            key={appointment.id} 
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {appointment.patient 
                    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                    : `Patient ID: ${appointment.patient_id?.substring(0, 8) || 'Unknown'}`
                  }
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {appointment.patient?.id_number || appointment.patient_id?.substring(0, 8) || 'Unknown'}</span>
                  <span>|</span>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(appointment.appointment_date), "MMM d, yyyy")} at {appointment.appointment_time}
                  </span>
                </div>
                <Badge variant="outline" className="mt-1 capitalize">
                  {appointment.appointment_type?.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {appointment.hasAssessment ? (
                <Button asChild>
                  <Link href={`/clinic/assessments/${appointment.assessmentId}`}>
                    Continue Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/clinic/assessments/start?appointment=${appointment.id}`}>
                    Start Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error loading ready for assessment:", error)
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-600">Failed to Load</h3>
        <p className="text-muted-foreground">
          Unable to load appointments. Please try again.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }
}

// My In Progress Tab content
async function MyInProgressContent({ clinicId, userId }: { clinicId: string; userId: string }) {
  try {
    const assessmentRepo = new AssessmentRepository()
    const assessments = await assessmentRepo.findByDoctorId(userId, { status: "in_progress" })
    
    if (assessments.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No In-Progress Assessments</h3>
          <p className="text-muted-foreground">
            You don't have any assessments in progress
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-3">
        {assessments.map((assessment) => (
          <div 
            key={assessment.id} 
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Assessment #{assessment.id.substring(0, 8).toUpperCase()}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Started: {format(new Date(assessment.started_at), "MMM d, yyyy HH:mm")}</span>
                </div>
                <Badge variant="outline" className={statusColors[assessment.status]}>
                  In Progress
                </Badge>
              </div>
            </div>
            <Button asChild>
              <Link href={`/clinic/assessments/${assessment.id}`}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error loading my in-progress assessments:", error)
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-600">Failed to Load</h3>
        <p className="text-muted-foreground">
          Unable to load your assessments. Please try again.
        </p>
      </div>
    )
  }
}

// All Assessments Tab content
async function AllAssessmentsContent({ clinicId }: { clinicId: string }) {
  try {
    const assessmentRepo = new AssessmentRepository()
    const assessments = await assessmentRepo.findByClinicId(clinicId, { 
      limit: 50,
      offset: 0 
    })
    
    if (assessments.length === 0) {
      return (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Assessments</h3>
          <p className="text-muted-foreground">
            No clinical assessments have been performed yet
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-3">
        {assessments.map((assessment) => (
          <div 
            key={assessment.id} 
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                assessment.status === "completed" ? "bg-green-500/10" :
                assessment.status === "in_progress" ? "bg-yellow-500/10" :
                "bg-red-500/10"
              }`}>
                {assessment.status === "completed" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : assessment.status === "in_progress" ? (
                  <Clock className="h-6 w-6 text-yellow-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium">Assessment #{assessment.id.substring(0, 8).toUpperCase()}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>By: {assessment.doctor_name}</span>
                  <span>|</span>
                  <span>
                    {assessment.completed_at 
                      ? `Completed: ${format(new Date(assessment.completed_at), "MMM d, yyyy")}`
                      : `Started: ${format(new Date(assessment.started_at), "MMM d, yyyy")}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={statusColors[assessment.status]}>
                    {assessment.status.replace("_", " ")}
                  </Badge>
                  {assessment.doctor_decision && (
                    <Badge variant="outline" className={decisionColors[assessment.doctor_decision]}>
                      {decisionLabels[assessment.doctor_decision]}
                    </Badge>
                  )}
                  {assessment.override_rules_engine && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                      Override
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/clinic/assessments/${assessment.id}`}>
                View
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error loading all assessments:", error)
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-600">Failed to Load</h3>
        <p className="text-muted-foreground">
          Unable to load assessments. Please try again.
        </p>
      </div>
    )
  }
}

// Loading skeleton for tabs
function TabContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AssessmentsPage() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      redirect("/login")
    }

    // Only doctors and admins can access this page
    if (!["doctor", "clinic_admin", "super_admin"].includes(user.role)) {
      redirect("/clinic")
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Clinical Assessments</h1>
            <p className="text-muted-foreground">
              Perform clinical assessments and make fitness determinations
            </p>
          </div>
        </div>

        {/* Statistics - Load separately */}
        <Suspense fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }>
          <AssessmentStatistics clinicId={user.clinic_id} />
        </Suspense>

        <Tabs defaultValue="ready" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ready">
              Ready for Assessment
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              My In Progress
            </TabsTrigger>
            <TabsTrigger value="all">All Assessments</TabsTrigger>
          </TabsList>

          {/* Ready for Assessment Tab */}
          <TabsContent value="ready">
            <Suspense fallback={<TabContentSkeleton />}>
              <Card>
                <CardHeader>
                  <CardTitle>Appointments Ready for Assessment</CardTitle>
                  <CardDescription>
                    Patients who have completed their tests and are waiting for clinical assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReadyForAssessmentContent 
                    clinicId={user.clinic_id} 
                    userId={user.id} 
                  />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          {/* My In Progress Tab */}
          <TabsContent value="in-progress">
            <Suspense fallback={<TabContentSkeleton />}>
              <Card>
                <CardHeader>
                  <CardTitle>My In-Progress Assessments</CardTitle>
                  <CardDescription>
                    Assessments you have started but not yet completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MyInProgressContent 
                    clinicId={user.clinic_id} 
                    userId={user.id} 
                  />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          {/* All Assessments Tab */}
          <TabsContent value="all">
            <Suspense fallback={<TabContentSkeleton />}>
              <Card>
                <CardHeader>
                  <CardTitle>All Assessments</CardTitle>
                  <CardDescription>
                    Complete history of clinical assessments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AllAssessmentsContent clinicId={user.clinic_id} />
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    )
  } catch (error) {
    console.error("Error in AssessmentsPage:", error)
    
    // Handle errors gracefully
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-lg font-semibold text-red-800">Unable to Load Page</h2>
              <p className="text-red-600">
                There was an error loading the assessments page. Please try again.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button variant="outline" asChild>
              <Link href="/clinic">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}