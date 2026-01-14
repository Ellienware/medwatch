// components/clinic/appointments/appointment-status-actions.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator" // Add this
import { useToast } from "@/hooks/use-toast"
import { updateAppointmentStatus } from "@/lib/actions/appointment-actions"
import { useState } from "react"
import { Loader2, CheckCircle, UserCheck, Stethoscope, FileCheck, XCircle, Clock, User, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

interface AppointmentStatusActionsProps {
  appointmentId: string
  currentStatus: string
  showFull?: boolean
}

const statusFlow = [
  { value: "scheduled", label: "Scheduled", icon: Clock, color: "bg-blue-500 text-white" },
  { value: "checked_in", label: "Checked In", icon: UserCheck, color: "bg-yellow-500 text-white" },
  { value: "with_nurse", label: "With Nurse", icon: User, color: "bg-purple-500 text-white" },
  { value: "tests_in_progress", label: "Tests in Progress", icon: Activity, color: "bg-orange-500 text-white" },
  { value: "with_doctor", label: "With Doctor", icon: Stethoscope, color: "bg-cyan-500 text-white" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "bg-green-500 text-white" },
]

const cancelStatuses = [
  { value: "cancelled", label: "Cancel", icon: XCircle, color: "bg-red-500 text-white" },
  { value: "no_show", label: "No Show", icon: Clock, color: "bg-gray-500 text-white" },
]

export function AppointmentStatusActions({ 
  appointmentId, 
  currentStatus,
  showFull = false 
}: AppointmentStatusActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus as any)
      
      if (result.success) {
        toast({
          title: "Status updated",
          description: `Appointment status changed to ${newStatus.replace('_', ' ')}`,
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const currentIndex = statusFlow.findIndex(status => status.value === currentStatus)
  const nextStatus = currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null

  if (showFull) {
    return (
      <div className="space-y-4">
        {/* Status Progress */}
        <div className="relative">
          <div className="absolute left-5 top-0 h-full w-0.5 bg-muted" />
          <div className="space-y-4">
            {statusFlow.map((status, index) => {
              const Icon = status.icon
              const isPast = index <= currentIndex
              const isCurrent = status.value === currentStatus
              
              return (
                <div key={status.value} className="relative flex items-center gap-3">
                  <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isCurrent 
                      ? `${status.color} border-white ring-2 ring-offset-2 ring-offset-background ${status.color.split(' ')[0].replace('bg-', 'ring-')}`
                      : isPast 
                        ? `${status.color} border-white`
                        : "bg-muted border-muted"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {status.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-muted-foreground">Current Status</p>
                    )}
                  </div>
                  {isPast && index < statusFlow.length - 1 && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Next Action Button */}
        {nextStatus && (
          <Button 
            onClick={() => handleStatusChange(nextStatus.value)}
            disabled={!!loading}
            className="w-full"
          >
            {loading === nextStatus.value ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <nextStatus.icon className="mr-2 h-4 w-4" />
            )}
            Mark as {nextStatus.label}
          </Button>
        )}

        {/* Cancel Actions */}
        <div className="grid grid-cols-2 gap-2">
          {cancelStatuses.map((status) => (
            <Button
              key={status.value}
              variant="outline"
              onClick={() => handleStatusChange(status.value)}
              disabled={!!loading}
              className={status.value === "cancelled" ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
            >
              {loading === status.value ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <status.icon className="mr-2 h-4 w-4" />
              )}
              {status.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Compact view (for table actions)
  return (
    <div className="flex flex-wrap gap-2">
      {nextStatus && (
        <Button
          onClick={() => handleStatusChange(nextStatus.value)}
          disabled={!!loading}
          size="sm"
        >
          {loading === nextStatus.value ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <nextStatus.icon className="mr-2 h-4 w-4" />
          )}
          {nextStatus.label}
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange("cancelled")}
        disabled={!!loading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        {loading === "cancelled" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="mr-2 h-4 w-4" />
        )}
        Cancel
      </Button>
    </div>
  )
}