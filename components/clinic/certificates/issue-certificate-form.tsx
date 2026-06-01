//components/clinic/certificates/issue-certificate-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Calendar, User, Clock, CheckCircle, Settings, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCertificate } from "@/lib/actions/certificate-actions"
import { getCompletedAppointments } from "@/lib/actions/appointment-actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AppointmentOption {
  id: string
  appointment_id: string
  display: string
  appointment_date: string
  appointment_time: string
  patient_id: string
  patient_name: string
  appointment_type?: string
  completed_at: string
}

type CertificateType = "fit_to_work" | "fit_with_restrictions" | "unfit_to_work"

export function IssueCertificateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingAppointments, setFetchingAppointments] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("")
  const [formData, setFormData] = useState({
    certificate_type: "fit_to_work" as CertificateType,
    valid_until: "",
    diagnosis: "",
    restrictions: "",
    recommendations: "",
  })

  useEffect(() => {
    fetchCompletedAppointments()
  }, [])

  async function fetchCompletedAppointments() {
    try {
      setFetchingAppointments(true)
      const result = await getCompletedAppointments()
      
      if (result.success) {
        setAppointments(result.appointments)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch completed appointments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      })
    } finally {
      setFetchingAppointments(false)
    }
  }

  const selectedAppointment = appointments.find(apt => apt.id === selectedAppointmentId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!selectedAppointmentId) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const result = await createCertificate({
      appointment_id: selectedAppointmentId,
      certificate_type: formData.certificate_type,
      valid_until: formData.valid_until || null,
      diagnosis: formData.diagnosis || null,
      restrictions: formData.restrictions || null,
      recommendations: formData.recommendations || null,
    })

    setLoading(false)

    if (result.success) {
      toast({
        title: "Certificate issued",
        description: "The certificate has been generated successfully.",
      })
      router.push("/clinic/certificates")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to issue certificate.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Certificate</h1>
          <p className="text-muted-foreground">
            Create a certificate for a completed appointment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Appointment Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Appointment
              </CardTitle>
              <CardDescription>
                Choose a completed appointment to issue a certificate for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="appointment_id">
                  Select Completed Appointment <span className="text-destructive">*</span>
                </Label>
                
                {fetchingAppointments ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading appointments...</span>
                    </div>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-2">
                    <Select 
                      required 
                      onValueChange={setSelectedAppointmentId}
                      value={selectedAppointmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a completed appointment" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {appointments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id} className="py-3">
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{apt.patient_name}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {format(new Date(apt.completed_at), "MMM d")}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{apt.appointment_time}</span>
                                {apt.appointment_type && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{apt.appointment_type.replace('_', ' ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-amber-400" />
                    <h3 className="mt-3 text-lg font-medium text-amber-800">No completed appointments</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      There are no completed appointments available for certificate issuance. 
                      Please complete appointments first.
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => router.push("/clinic/appointments")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Appointments
                    </Button>
                  </div>
                )}
              </div>

              {/* Selected Appointment Summary */}
              {selectedAppointment && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{selectedAppointment.patient_name}</span>
                      <span className="text-muted-foreground ml-2">
                        • Appointment completed on {format(new Date(selectedAppointment.completed_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAppointmentId("")}
                    >
                      Change
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Certificate Details - Only show if appointment is selected */}
          {selectedAppointment && (
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>
                  Fill in the certificate details for {selectedAppointment.patient_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="certificate_type">
                      Certificate Type <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.certificate_type}
                      onValueChange={(value: CertificateType) => 
                        setFormData({...formData, certificate_type: value})
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit_to_work">Fit to Work</SelectItem>
                        <SelectItem value="fit_with_restrictions">Fit with Restrictions</SelectItem>
                        <SelectItem value="unfit_to_work">Unfit to Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until (Optional)</Label>
                    <Input 
                      id="valid_until" 
                      type="date" 
                      value={formData.valid_until}
                      onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnosis / Findings</Label>
                  <Textarea 
                    id="diagnosis" 
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                    rows={3} 
                    placeholder="Medical findings and diagnosis based on examination and tests..." 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restrictions">Work Restrictions (Optional)</Label>
                  <Textarea
                    id="restrictions"
                    value={formData.restrictions}
                    onChange={(e) => setFormData({...formData, restrictions: e.target.value})}
                    rows={2}
                    placeholder="Any work limitations, restrictions, or accommodations needed..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendations">Medical Recommendations (Optional)</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                    rows={2}
                    placeholder="Follow-up appointments, medications, lifestyle recommendations..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
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
              disabled={loading || !selectedAppointment}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Issue Certificate
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
