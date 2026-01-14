// components/clinic/appointments/appointment-timeline.tsx
import { format } from "date-fns"
import { Clock, User, Stethoscope, FileCheck, CheckCircle, XCircle, Calendar } from "lucide-react"
import type { Appointment } from "@/lib/types/database"

interface AppointmentTimelineProps {
  appointment: Appointment
}

export function AppointmentTimeline({ appointment }: AppointmentTimelineProps) {
  const timelineEvents = []

  // Created event
  if (appointment.created_at) {
    timelineEvents.push({
      icon: Calendar,
      title: "Appointment Created",
      description: `By ${appointment.created_by?.substring(0, 8) || 'system'}`,
      time: format(new Date(appointment.created_at), "MMM d, h:mm a"),
      color: "text-blue-500",
    })
  }

  // Checked in event
  if (appointment.checked_in_at) {
    timelineEvents.push({
      icon: User,
      title: "Patient Checked In",
      description: `By ${appointment.checked_in_by?.substring(0, 8) || 'staff'}`,
      time: format(new Date(appointment.checked_in_at), "MMM d, h:mm a"),
      color: "text-yellow-500",
    })
  }

  // Nurse started event
  if (appointment.nurse_started_at) {
    timelineEvents.push({
      icon: User,
      title: "Nurse Assessment Started",
      description: `Nurse ID: ${appointment.nurse_assigned_id?.substring(0, 8) || 'Unknown'}`,
      time: format(new Date(appointment.nurse_started_at), "MMM d, h:mm a"),
      color: "text-purple-500",
    })
  }

  // Nurse completed event
  if (appointment.nurse_completed_at) {
    timelineEvents.push({
      icon: CheckCircle,
      title: "Nurse Assessment Completed",
      description: "Vitals and initial assessment done",
      time: format(new Date(appointment.nurse_completed_at), "MMM d, h:mm a"),
      color: "text-green-500",
    })
  }

  // Doctor started event
  if (appointment.doctor_started_at) {
    timelineEvents.push({
      icon: Stethoscope,
      title: "Doctor Consultation Started",
      description: `Doctor ID: ${appointment.doctor_assigned_id?.substring(0, 8) || 'Unknown'}`,
      time: format(new Date(appointment.doctor_started_at), "MMM d, h:mm a"),
      color: "text-cyan-500",
    })
  }

  // Doctor completed event
  if (appointment.doctor_completed_at) {
    timelineEvents.push({
      icon: CheckCircle,
      title: "Doctor Consultation Completed",
      description: "Medical examination completed",
      time: format(new Date(appointment.doctor_completed_at), "MMM d, h:mm a"),
      color: "text-green-500",
    })
  }

  // Completed event
  if (appointment.completed_at) {
    timelineEvents.push({
      icon: FileCheck,
      title: "Appointment Completed",
      description: "All procedures completed",
      time: format(new Date(appointment.completed_at), "MMM d, h:mm a"),
      color: "text-green-500",
    })
  }

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No timeline events yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 h-full w-0.5 bg-muted" />
      
      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const Icon = event.icon
          return (
            <div key={index} className="relative flex items-start gap-3">
              {/* Icon with connector */}
              <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-muted">
                <Icon className={`h-5 w-5 ${event.color}`} />
              </div>
              
              {/* Event details */}
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}