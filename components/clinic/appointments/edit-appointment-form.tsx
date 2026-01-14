// components/clinic/appointments/edit-appointment-form.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, Clock, User, Building, FileText, ArrowLeft } from "lucide-react"
import { updateAppointment } from "@/lib/actions/appointment-actions"
import type { Appointment } from "@/lib/types/database"

interface EditAppointmentFormProps {
  appointment: Appointment
  clinicId: string
}

export function EditAppointmentForm({ appointment, clinicId }: EditAppointmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    appointment_type: appointment.appointment_type || "general_checkup",
    status: appointment.status,
    reason: appointment.reason || "",
    reception_notes: appointment.reception_notes || "",
    nurse_notes: appointment.nurse_notes || "",
    doctor_notes: appointment.doctor_notes || "",
    branch_id: appointment.branch_id || "",
    nurse_assigned_id: appointment.nurse_assigned_id || "",
    doctor_assigned_id: appointment.doctor_assigned_id || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateAppointment(appointment.id, formData)

      if (result.success) {
        toast({
          title: "Appointment updated",
          description: "The appointment has been successfully updated.",
        })
        router.push(`/clinic/appointments/${appointment.id}`)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update appointment",
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
      setLoading(false)
    }
  }

  const appointmentTypes = [
    "general_checkup",
    "follow_up",
    "vaccination",
    "test",
    "consultation",
    "emergency",
    "surgery",
    "dental",
    "optical",
    "other"
  ]

  const statusOptions = [
    "scheduled",
    "checked_in",
    "with_nurse",
    "tests_in_progress",
    "with_doctor",
    "completed",
    "cancelled",
    "no_show"
  ]

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Appointment Details</CardTitle>
              <CardDescription>
                Update appointment information and status
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Date and Time */}
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Appointment Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="appointment_date"
                    name="appointment_date"
                    type="date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_time">Appointment Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="appointment_time"
                    name="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Appointment Type and Status */}
              <div className="space-y-2">
                <Label htmlFor="appointment_type">Appointment Type</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(value) => handleSelectChange("appointment_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ").toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          <div className={`h-2 w-2 rounded-full mr-2 ${
                            status === 'scheduled' ? 'bg-blue-500' :
                            status === 'checked_in' ? 'bg-yellow-500' :
                            status === 'with_nurse' ? 'bg-purple-500' :
                            status === 'tests_in_progress' ? 'bg-orange-500' :
                            status === 'with_doctor' ? 'bg-cyan-500' :
                            status === 'completed' ? 'bg-green-500' :
                            status === 'cancelled' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`} />
                          {status.replace("_", " ").toUpperCase()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch and Staff Assignment */}
              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch ID</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="branch_id"
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter branch ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nurse_assigned_id">Nurse Assigned ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nurse_assigned_id"
                    name="nurse_assigned_id"
                    value={formData.nurse_assigned_id}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter nurse ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor_assigned_id">Doctor Assigned ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="doctor_assigned_id"
                    name="doctor_assigned_id"
                    value={formData.doctor_assigned_id}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter doctor ID"
                  />
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter reason for visit..."
                rows={3}
              />
            </div>

            {/* Notes Sections */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="reception_notes">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reception Notes
                  </div>
                </Label>
                <Textarea
                  id="reception_notes"
                  name="reception_notes"
                  value={formData.reception_notes}
                  onChange={handleChange}
                  placeholder="Reception notes..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nurse_notes">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Nurse Notes
                  </div>
                </Label>
                <Textarea
                  id="nurse_notes"
                  name="nurse_notes"
                  value={formData.nurse_notes}
                  onChange={handleChange}
                  placeholder="Nurse notes..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor_notes">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Doctor Notes
                  </div>
                </Label>
                <Textarea
                  id="doctor_notes"
                  name="doctor_notes"
                  value={formData.doctor_notes}
                  onChange={handleChange}
                  placeholder="Doctor notes..."
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Appointment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}