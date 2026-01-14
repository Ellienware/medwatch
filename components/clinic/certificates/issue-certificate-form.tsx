"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Calendar, User, Clock, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCertificate } from "@/lib/actions/certificate-actions"
import { getCompletedAppointments } from "@/lib/actions/appointment-actions" // You'll need to create this
import { useToast } from "@/hooks/use-toast"
import type { CertificateType } from "@/lib/types/database"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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

export function IssueCertificateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingAppointments, setFetchingAppointments] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("")

  useEffect(() => {
    fetchCompletedAppointments()
  }, [])

  async function fetchCompletedAppointments() {
    try {
      setFetchingAppointments(true)
      
      // Create a server action to get completed appointments
      // You can create this in your appointment-actions.ts
      const result = await getCompletedAppointments()
      
      if (result.success) {
        setAppointments(result.appointments)
        
        if (result.appointments.length === 0) {
          toast({
            title: "No completed appointments",
            description: "There are no completed appointments available for certificate issuance.",
            variant: "default",
          })
        }
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

  // Get selected appointment details
  const selectedAppointment = appointments.find(apt => apt.id === selectedAppointmentId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    // Validate form
    if (!selectedAppointmentId) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    // Validate and cast certificate type
    const certificateType = data.certificate_type as string
    const validTypes: CertificateType[] = ["fit_to_work", "fit_with_restrictions", "unfit_to_work"]
    
    if (!validTypes.includes(certificateType as CertificateType)) {
      toast({
        title: "Error",
        description: "Invalid certificate type selected.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const result = await createCertificate({
      appointment_id: selectedAppointmentId,
      certificate_type: certificateType as CertificateType,
      valid_until: (data.valid_until as string) || null,
      diagnosis: (data.diagnosis as string) || null,
      restrictions: (data.restrictions as string) || null,
      recommendations: (data.recommendations as string) || null,
    })

    setLoading(false)

    if (result.success) {
      toast({
        title: "Certificate issued",
        description: "The certificate has been generated and issued successfully.",
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Appointment Selection */}
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
                    name="appointment_id" 
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
                  
                  {/* Appointments List View */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 mt-2">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent ${
                          selectedAppointmentId === apt.id 
                            ? 'border-primary bg-accent ring-1 ring-primary' 
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedAppointmentId(apt.id)}
                      >
                        <div className="rounded-full bg-green-100 p-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium leading-none">{apt.patient_name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {apt.patient_id.substring(0, 12)}...
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{apt.appointment_time}</span>
                            </div>
                            
                            {apt.appointment_type && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="capitalize">{apt.appointment_type.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed on {format(new Date(apt.completed_at), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
              
              {/* Hidden input for form submission */}
              <Input 
                type="hidden" 
                name="appointment_id" 
                value={selectedAppointmentId} 
                required 
              />
            </div>

            {/* Selected Appointment Summary */}
            {selectedAppointment && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedAppointment.patient_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Clock className="h-3 w-3" />
                        <span>{selectedAppointment.appointment_time}</span>
                        <span>•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(selectedAppointment.appointment_date), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAppointmentId("")}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Certificate Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="certificate_type">
                  Certificate Type <span className="text-destructive">*</span>
                </Label>
                <Select name="certificate_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit_to_work">Fit to Work</SelectItem>
                    <SelectItem value="fit_with_restrictions">Fit with Restrictions</SelectItem>
                    <SelectItem value="unfit_to_work">Unfit to Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input 
                  id="valid_until" 
                  name="valid_until" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis / Findings</Label>
              <Textarea 
                id="diagnosis" 
                name="diagnosis" 
                rows={3} 
                placeholder="Medical findings and diagnosis based on examination and tests..." 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Work Restrictions (if applicable)</Label>
              <Textarea
                id="restrictions"
                name="restrictions"
                rows={2}
                placeholder="Any work limitations, restrictions, or accommodations needed..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Medical Recommendations</Label>
              <Textarea
                id="recommendations"
                name="recommendations"
                rows={2}
                placeholder="Follow-up appointments, medications, lifestyle recommendations..."
              />
            </div>

            <div className="rounded-lg border border-dashed p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Certificate Preview</p>
                  <p className="text-xs text-muted-foreground">
                    A professional PDF certificate will be automatically generated with doctor's signature, 
                    clinic logo, and security features.
                  </p>
                </div>
              </div>
              
              {selectedAppointment && (
                <div className="mt-3 rounded bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">
                    Certificate will be issued for: <span className="font-medium">{selectedAppointment.patient_name}</span>
                    <br />
                    Based on appointment on: {format(new Date(selectedAppointment.appointment_date), "MMMM d, yyyy")} at {selectedAppointment.appointment_time}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
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
            disabled={loading || !selectedAppointmentId}
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
  )
}