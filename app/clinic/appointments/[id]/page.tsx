// app/clinic/appointments/[id]/page.tsx
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, User, Building, Stethoscope, FileText, Activity, Printer, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { getAppointmentWithPatientInfo, updateAppointmentStatus } from "@/lib/actions/appointment-actions"
import { getCurrentUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { AppointmentStatusActions } from "../appintment-status-check"
import { AppointmentTests } from "../appointment-tests"
import { AppointmentTimeline } from "../appointment-timeline"
import { AppointmentNotes } from "../appointment-notes"

interface AppointmentDetailPageProps {
  params: Promise<{ id: string }>
}


export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  
  if (!user?.clinic_id) {
    redirect("/login")
  }

  const result = await getAppointmentWithPatientInfo(id)
  
  if (!result.success || !result.appointment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Appointment Not Found</h1>
            <p className="text-muted-foreground">The appointment could not be found or you don't have permission to view it.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {result.error || "Appointment not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const appointment = result.appointment
  const patient = appointment.patient
  const isToday = appointment.appointment_date === format(new Date(), "yyyy-MM-dd")
  const formattedDate = format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")
  const branch = appointment.branch 
  // Status colors
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-700 border-blue-200",
    checked_in: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    with_nurse: "bg-purple-500/10 text-purple-700 border-purple-200",
    tests_in_progress: "bg-orange-500/10 text-orange-700 border-orange-200",
    with_doctor: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
    completed: "bg-green-500/10 text-green-700 border-green-200",
    cancelled: "bg-red-500/10 text-red-700 border-red-200",
    no_show: "bg-gray-500/10 text-gray-700 border-gray-200",
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                Appointment #{appointment.id.substring(0, 8).toUpperCase()}
              </h1>
              <Badge variant="outline" className={`border-2 ${statusColors[appointment.status]}`}>
                {appointment.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {formattedDate} • {appointment.appointment_time}
              {isToday && <span className="ml-2 text-green-600">• Today</span>}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <AppointmentStatusActions appointmentId={appointment.id} currentStatus={appointment.status} />
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Patient & Appointment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/clinic/patients/${appointment.patient_id}`}>
                    View Full Profile
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Appointment for {patient?.first_name} {patient?.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                      <p className="font-medium">{patient.id_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {format(new Date(patient.date_of_birth), "MMMM d, yyyy")}
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years)
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{patient.gender || "Not specified"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{patient.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{patient.email || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {patient.address && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="font-medium">{patient.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                      <Badge variant="outline">{patient.blood_type || "Unknown"}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                      <Badge variant="outline">
                        {patient.allergies || "None reported"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Medical Conditions</p>
                      <Badge variant="outline">
                        {patient.chronic_conditions || "None reported"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Patient information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formattedDate}</span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="font-medium">{appointment.appointment_time}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Appointment Type</p>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium capitalize">
                        {appointment.appointment_type?.replace('_', ' ') || "General Checkup"}
                      </span>
                    </div>
                  </div>
                  
                    {branch ? (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Branch</p>
                        <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <span className="font-medium block">{branch.name}</span>
                            {branch.code && (
                            <span className="text-xs text-muted-foreground">
                                Code: {branch.code}
                            </span>
                            )}
                            {branch.address && (
                            <span className="text-xs text-muted-foreground block truncate max-w-[200px]">
                                {branch.address}
                            </span>
                            )}
                        </div>
                        </div>
                    </div>
                    ) : appointment.branch_id ? (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Branch</p>
                        <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Branch #{appointment.branch_id.substring(0, 8)}</span>
                        </div>
                    </div>
                    ) : null}
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Reason for Visit</p>
                    <div className="rounded-lg bg-muted p-3 min-h-[80px]">
                      <p className="text-sm">
                        {appointment.reason || "No reason provided"}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.reception_notes && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Reception Notes</p>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-sm text-blue-700">{appointment.reception_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests & Procedures Card */}
          <AppointmentTests appointmentId={appointment.id} patientId={appointment.patient_id} />
        </div>

        {/* Right Column - Actions & Timeline */}
        <div className="space-y-6">
          {/* Status Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Appointment Status
              </CardTitle>
              <CardDescription>Update the appointment workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentStatusActions 
                appointmentId={appointment.id} 
                currentStatus={appointment.status}
                showFull={true}
              />
              
              <Separator className="my-4" />
              
              <AppointmentTimeline appointment={appointment} />
            </CardContent>
          </Card>

          {/* Clinical Notes Card */}
          
          <AppointmentNotes 
            appointmentId={appointment.id}
            initialNurseNotes={appointment.nurse_notes}
            initialDoctorNotes={appointment.doctor_notes}
          />

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/clinic/tests/record?appointment=${appointment.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Record Test Results
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/clinic/patients/${appointment.patient_id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View Patient Profile
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/clinic/appointments/${appointment.id}/edit`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Edit Appointment
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}