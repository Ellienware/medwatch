// components/clinic/appointments/appointment-notes.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateAppointment } from "@/lib/actions/appointment-actions"
import { useState } from "react"
import { User, Stethoscope, Save } from "lucide-react"

interface AppointmentNotesProps {
  appointmentId: string
  initialNurseNotes?: string | null
  initialDoctorNotes?: string | null
}

export function AppointmentNotes({ 
  appointmentId, 
  initialNurseNotes, 
  initialDoctorNotes 
}: AppointmentNotesProps) {
  const { toast } = useToast()
  const [nurseNotes, setNurseNotes] = useState(initialNurseNotes || "")
  const [doctorNotes, setDoctorNotes] = useState(initialDoctorNotes || "")
  const [saving, setSaving] = useState<string | null>(null)

  const handleSaveNotes = async (type: 'nurse' | 'doctor') => {
    setSaving(type)
    try {
      const result = await updateAppointment(appointmentId, {
        [type === 'nurse' ? 'nurse_notes' : 'doctor_notes']: type === 'nurse' ? nurseNotes : doctorNotes
      })
      
      if (result.success) {
        toast({
          title: "Notes saved",
          description: `${type === 'nurse' ? 'Nurse' : 'Doctor'} notes updated successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save notes",
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
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nurse Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-500" />
            <label className="text-sm font-medium">Nurse Assessment Notes</label>
          </div>
          <Textarea
            placeholder="Enter nurse assessment findings, vitals, observations..."
            value={nurseNotes}
            onChange={(e) => setNurseNotes(e.target.value)}
            rows={3}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSaveNotes('nurse')}
              disabled={saving === 'nurse'}
            >
              {saving === 'nurse' ? (
                <Save className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Nurse Notes
            </Button>
          </div>
        </div>

        {/* Doctor Notes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-cyan-500" />
            <label className="text-sm font-medium">Doctor Consultation Notes</label>
          </div>
          <Textarea
            placeholder="Enter doctor diagnosis, treatment plan, prescriptions..."
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            rows={3}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSaveNotes('doctor')}
              disabled={saving === 'doctor'}
            >
              {saving === 'doctor' ? (
                <Save className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Doctor Notes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
