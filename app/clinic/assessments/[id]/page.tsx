// app/clinic/assessments/[id]/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, XCircle, FileText, Printer } from "lucide-react"
import { format } from "date-fns"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAssessmentWithDetails } from "@/lib/actions/assessment-actions"
import { DoctorAssessmentForm } from "@/components/clinic/assessments/doctor-assessment-form"
import type { FitnessDecision, AssessmentStatus } from "@/lib/types/database"

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>
}

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

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    redirect("/login")
  }

  // Only doctors and admins can access this page
  if (!["doctor", "clinic_admin", "super_admin"].includes(user.role)) {
    redirect("/clinic")
  }

  const result = await getAssessmentWithDetails(id)

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/assessments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assessment Not Found</h1>
            <p className="text-muted-foreground">
              The assessment could not be found or you don't have permission to view it.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {result.error || "Assessment not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { assessment, patient, appointment, testResults } = result.data

  // Show completed assessment view
  if (assessment.status === "completed") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/clinic/assessments">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                  Assessment #{assessment.id.substring(0, 8).toUpperCase()}
                </h1>
                <Badge variant="outline" className={statusColors[assessment.status]}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Completed on {format(new Date(assessment.completed_at!), "MMMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {assessment.certificate_id && (
              <Button asChild>
                <Link href={`/clinic/certificates/${assessment.certificate_id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Certificate
                </Link>
              </Button>
            )}
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Completed Assessment Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{patient?.first_name} {patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Number</span>
                  <span className="font-medium">{patient?.id_number}</span>
                </div>
                {patient?.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-medium">{format(new Date(patient.date_of_birth), "MMMM d, yyyy")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium capitalize">{patient?.gender || "Not specified"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Decision */}
          <Card>
            <CardHeader>
              <CardTitle>Fitness Decision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessment.doctor_decision && (
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-lg px-4 py-2 ${decisionColors[assessment.doctor_decision]}`}
                    >
                      {decisionLabels[assessment.doctor_decision]}
                    </Badge>
                    {assessment.override_rules_engine && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                        Override Applied
                      </Badge>
                    )}
                  </div>
                )}
                {assessment.doctor_reasoning && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Clinical Reasoning</p>
                    <p className="text-sm">{assessment.doctor_reasoning}</p>
                  </div>
                )}
                {assessment.override_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Override Reason</p>
                    <p className="text-sm">{assessment.override_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restrictions */}
          {assessment.restrictions && assessment.restrictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Restrictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.restrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {restriction}
                    </Badge>
                  ))}
                  {assessment.restriction_duration && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Duration: {assessment.restriction_duration.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referrals */}
          {assessment.referrals && assessment.referrals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment.referrals.map((referral, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{referral.type}</span>
                        <Badge variant="outline" className={
                          referral.priority === "emergency" ? "bg-red-500/10 text-red-700" :
                          referral.priority === "urgent" ? "bg-orange-500/10 text-orange-700" :
                          "bg-blue-500/10 text-blue-700"
                        }>
                          {referral.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{referral.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-up */}
          {assessment.follow_up_required && (
            <Card>
              <CardHeader>
                <CardTitle>Follow-up</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessment.follow_up_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{format(new Date(assessment.follow_up_date), "MMMM d, yyyy")}</span>
                    </div>
                  )}
                  {assessment.follow_up_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{assessment.follow_up_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessed By */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessed By</span>
                  <span className="font-medium">{assessment.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">{format(new Date(assessment.started_at), "MMM d, yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{format(new Date(assessment.completed_at!), "MMM d, yyyy HH:mm")}</span>
                </div>
                {appointment?.appointment_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Examination Type</span>
                    <span className="font-medium capitalize">{appointment.appointment_type.replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show cancelled assessment
  if (assessment.status === "cancelled") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/assessments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                Assessment #{assessment.id.substring(0, 8).toUpperCase()}
              </h1>
              <Badge variant="outline" className={statusColors[assessment.status]}>
                <XCircle className="h-3 w-3 mr-1" />
                Cancelled
              </Badge>
            </div>
            <p className="text-muted-foreground">
              This assessment was cancelled
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Assessment Cancelled</h3>
            <p className="text-muted-foreground text-center mb-4">
              {assessment.additional_notes?.replace("[CANCELLED] ", "") || "This assessment was cancelled."}
            </p>
            <Button asChild>
              <Link href="/clinic/assessments">
                Back to Assessments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show in-progress assessment form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/assessments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                Clinical Assessment
              </h1>
              <Badge variant="outline" className={statusColors[assessment.status]}>
                <Clock className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Started {format(new Date(assessment.started_at), "MMMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Form */}
      <DoctorAssessmentForm
        assessment={assessment}
        patient={patient}
        appointment={appointment}
        testResults={testResults}
      />
    </div>
  )
}
