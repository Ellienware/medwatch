// components/clinic/certificates/issue-certificate-form.tsx - UPDATED VERSION
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Calendar, User, Clock, CheckCircle, Settings, ArrowLeft, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCertificate } from "@/lib/actions/certificate-actions"
import { getCompletedAppointments } from "@/lib/actions/appointment-actions"
import { useToast } from "@/hooks/use-toast"
import type { CertificateType, CertificateTemplate } from "@/lib/types/database"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { TemplateSelector } from "./template-selector"
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

type IssueStep = 'select-appointment' | 'select-template' | 'fill-details'

export function IssueCertificateForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<IssueStep>('select-appointment')
  const [fetchingAppointments, setFetchingAppointments] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [formData, setFormData] = useState({
    certificate_type: "fit_to_work" as CertificateType,
    valid_until: "",
    diagnosis: "",
    restrictions: "",
    recommendations: "",
  })

  useEffect(() => {
    fetchCompletedAppointments()
    fetchTemplates()
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

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/certificates/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        
        // Set default template if available
        const defaultTemplate = data.templates.find((t: CertificateTemplate) => t.is_default)
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate)
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const selectedAppointment = appointments.find(apt => apt.id === selectedAppointmentId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!selectedAppointmentId || !selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select an appointment and template",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const result = await createCertificate({
      appointment_id: selectedAppointmentId,
      template_id: selectedTemplate.id,
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
        description: `The certificate has been generated using the ${selectedTemplate.name} template.`,
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

  const navigateToSettings = () => {
    router.push("/clinic/settings/certificate-templates")
  }

  // Helper to render step content
  const renderStepContent = () => {
    switch (step) {
      case 'select-appointment':
        return (
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
            <CardContent className="space-y-4">
              {/* Existing appointment selection code */}
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

              {/* Next Button */}
              {selectedAppointment && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep('select-template')}
                    className="gap-2"
                  >
                    Next: Choose Template
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'select-template':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Choose Certificate Template
              </CardTitle>
              <CardDescription>
                Select a template for {selectedAppointment?.patient_name}'s certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TemplateSelector 
                clinicId="" // Will be filled from user context
                onSelect={setSelectedTemplate}
                selectedTemplateId={selectedTemplate?.id}
                showPreview={true}
              />

              {/* Selected Template Preview */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Selected Template</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.name} • {selectedTemplate.is_one_page ? 'One Page' : 'Multi-page'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep('select-appointment')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep('fill-details')}
                      >
                        Next: Fill Details
                      </Button>
                    </div>
                  </div>

                  {/* Template Features */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {selectedTemplate.category}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Layout:</span>
                      <span className="ml-2 font-medium capitalize">
                        {selectedTemplate.layout.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Included Sections */}
                  <div>
                    <span className="text-sm text-muted-foreground">Sections included:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTemplate.sections_included.map(section => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedTemplate.is_one_page && (
                    <Alert>
                      <AlertDescription className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        This template is optimized to fit on a single page
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'fill-details':
        return (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Certificate Details</CardTitle>
                      <CardDescription>
                        Using {selectedTemplate?.name} template for {selectedAppointment?.patient_name}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('select-template')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Change Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Show only sections included in template */}
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
                    
                    {selectedTemplate?.sections_included.includes('validity') && (
                      <div className="space-y-2">
                        <Label htmlFor="valid_until">Valid Until</Label>
                        <Input 
                          id="valid_until" 
                          type="date" 
                          value={formData.valid_until}
                          onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    )}
                  </div>

                  {selectedTemplate?.sections_included.includes('diagnosis') && (
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
                  )}

                  {selectedTemplate?.sections_included.includes('restrictions') && (
                    <div className="space-y-2">
                      <Label htmlFor="restrictions">Work Restrictions (if applicable)</Label>
                      <Textarea
                        id="restrictions"
                        value={formData.restrictions}
                        onChange={(e) => setFormData({...formData, restrictions: e.target.value})}
                        rows={2}
                        placeholder="Any work limitations, restrictions, or accommodations needed..."
                      />
                    </div>
                  )}

                  {selectedTemplate?.sections_included.includes('recommendations') && (
                    <div className="space-y-2">
                      <Label htmlFor="recommendations">Medical Recommendations</Label>
                      <Textarea
                        id="recommendations"
                        value={formData.recommendations}
                        onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                        rows={2}
                        placeholder="Follow-up appointments, medications, lifestyle recommendations..."
                      />
                    </div>
                  )}

                  {/* Template Info */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedTemplate?.name} Template</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTemplate?.is_one_page 
                              ? 'Will generate a single-page certificate' 
                              : 'Certificate may span multiple pages based on content'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={navigateToSettings}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Manage Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('select-template')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-4">
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
            </div>
          </form>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Certificate</h1>
          <p className="text-muted-foreground">
            {step === 'select-appointment' && 'Select a completed appointment'}
            {step === 'select-template' && 'Choose a certificate template'}
            {step === 'fill-details' && 'Fill in certificate details'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={navigateToSettings}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Template Settings
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          {(['select-appointment', 'select-template', 'fill-details'] as IssueStep[]).map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
                step === stepName 
                  ? 'bg-primary text-primary-foreground' 
                  : step === 'select-template' && stepName === 'select-appointment'
                  ? 'bg-primary/20 text-primary'
                  : step === 'fill-details' && (stepName === 'select-appointment' || stepName === 'select-template')
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < 2 && (
                <div className={`w-16 h-1 ${
                  step === 'select-template' && stepName === 'select-appointment'
                    ? 'bg-primary/50'
                    : step === 'fill-details' && (stepName === 'select-appointment' || stepName === 'select-template')
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-center text-sm">
        <div className="w-24 text-center">1. Appointment</div>
        <div className="w-16"></div>
        <div className="w-24 text-center">2. Template</div>
        <div className="w-16"></div>
        <div className="w-24 text-center">3. Details</div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  )
}