"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, RefreshCw, User, Clock, Building, Ear, Eye, Heart, Thermometer, Syringe, Stethoscope, Microscope, Activity, Shield, Droplets, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createTestResult } from "@/lib/actions/test-result-actions"
import { useToast } from "@/hooks/use-toast"
import { getAppointmentsForTestRecording } from "@/lib/actions/appointment-actions"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Appointment, Patient, ClinicalTest, TestResult } from "@/lib/types/database"

// Define type for appointment option in the form
interface AppointmentOption {
  id: string;
  display: string;
  appointment_time: string;
  appointment_date: string;
  patient_id: string;
  patient_name: string;
  status: string;
  appointment_type?: string;
  employer_id?: string | null;
}

// Define props for the component
interface RecordTestFormProps {
  initialAppointments?: (Appointment & { patient?: Patient })[];
  initialTests?: ClinicalTest[];
}

export function RecordTestForm({ 
  initialAppointments = [], 
  initialTests = [] 
}: RecordTestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState("")
  
  // Initialize with server data if provided
  const [appointments, setAppointments] = useState<AppointmentOption[]>(() => {
    // Convert server appointments to client format
    if (initialAppointments?.length) {
      return initialAppointments.map(apt => ({
        id: apt.id,
        display: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''} - ${apt.appointment_time}`,
        appointment_time: apt.appointment_time,
        appointment_date: apt.appointment_date,
        patient_id: apt.patient_id,
        patient_name: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim() || `Patient ${apt.patient_id.substring(0, 8)}`,
        status: apt.status,
        appointment_type: apt.appointment_type,
        employer_id: apt.employer_id,
      }))
    }
    return []
  })
  
  const [fetchingAppointments, setFetchingAppointments] = useState(!initialAppointments?.length)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedAppointment, setSelectedAppointment] = useState<string>("")

  // Fetch appointments on component mount and when date changes
  useEffect(() => {
    // Only fetch if we don't have initial appointments or date changes from today
    if (!initialAppointments?.length || selectedDate !== format(new Date(), "yyyy-MM-dd")) {
      fetchAppointments()
    }
  }, [selectedDate])

  async function fetchAppointments() {
    try {
      setFetchingAppointments(true)
      const result = await getAppointmentsForTestRecording({
        date: selectedDate,
        status: "checked_in", // Only show appointments that are checked in
        limit: 100
      })
      
      if (result.success) {
        setAppointments(result.appointments)
        setSelectedAppointment("") // Reset selected appointment when list changes
        
        if (result.appointments.length === 0) {
          toast({
            title: "No appointments found",
            description: `No checked-in appointments found for ${format(new Date(selectedDate), "MMMM d, yyyy")}`,
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch appointments",
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    // Validate form
    if (!selectedAppointment) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      })
      return
    }
    
    if (!selectedTest) {
      toast({
        title: "Error",
        description: "Please select a test type",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    // Collect all form data for results
    const results: Record<string, any> = {}
    formData.forEach((value, key) => {
      if (key !== 'appointment_id' && key !== 'test_id' && 
          key !== 'findings' && key !== 'recommendations') {
        results[key] = value
      }
    })

    // Get patient_id from selected appointment
    const patientId = selectedAppointmentDetails?.patient_id || ""

    // Create the test result data
    const testResultData: Partial<TestResult> = {
      appointment_id: selectedAppointment,
      patient_id: patientId,
      test_id: selectedTest,
      findings: (data.findings as string) || null,
      recommendations: (data.recommendations as string) || null,
      results,
      // Other fields will be filled by the server action
      is_normal: null, // You can calculate this if you have normal ranges
      attachments: [],
      reviewed_by: null,
      reviewed_at: null,
    }

    const result = await createTestResult(testResultData)

    setLoading(false)

    if (result.success) {
      toast({
        title: "Test results saved",
        description: "The test results have been successfully recorded.",
      })
      router.push("/clinic/tests")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save test results.",
        variant: "destructive",
      })
    }
  }

  // Get selected appointment details
  const selectedAppointmentDetails = appointments.find(apt => apt.id === selectedAppointment)

  // Format date for display
  const formattedDate = format(new Date(selectedDate), "EEEE, MMMM d, yyyy")

  // Get initials from patient name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Test type icons
  const testIcons: Record<string, React.ReactNode> = {
    audiometry: <Ear className="h-4 w-4" />,
    spirometry: <Activity className="h-4 w-4" />,
    vision: <Eye className="h-4 w-4" />,
    xray: <Activity className="h-4 w-4" />,
    bp: <Heart className="h-4 w-4" />,
    drug: <AlertCircle className="h-4 w-4" />,
    hiv: <Shield className="h-4 w-4" />,
    malaria: <Droplets className="h-4 w-4" />,
    hepatitis_b: <Syringe className="h-4 w-4" />,
    hepatitis_c: <Syringe className="h-4 w-4" />,
    syphilis: <Microscope className="h-4 w-4" />,
    urinalysis: <Droplets className="h-4 w-4" />,
    blood_glucose: <Thermometer className="h-4 w-4" />,
    cholesterol: <Activity className="h-4 w-4" />,
    ecg: <Heart className="h-4 w-4" />,
    ultrasound: <Activity className="h-4 w-4" />,
    cbc: <Microscope className="h-4 w-4" />,
    liver_function: <Activity className="h-4 w-4" />,
    kidney_function: <Droplets className="h-4 w-4" />,
    pregnancy: <Heart className="h-4 w-4" />,
    tuberculosis: <Microscope className="h-4 w-4" />,
    typhoid: <Thermometer className="h-4 w-4" />,
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Patient & Test Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Information</CardTitle>
              <Badge variant="outline" className="text-sm">
                {fetchingAppointments ? "Loading..." : `${appointments.length} appointments`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Select an appointment and test type to record results
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label htmlFor="appointment-date">Appointment Date</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[200px]">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="appointment-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={fetchAppointments}
                  disabled={fetchingAppointments}
                  title="Refresh appointments"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchingAppointments ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing checked-in appointments for <span className="font-medium">{formattedDate}</span>
              </p>
            </div>

            {/* Appointments List */}
            <div className="space-y-3">
              <Label htmlFor="appointment_id">
                Select Appointment <span className="text-destructive">*</span>
              </Label>
              
              {fetchingAppointments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading appointments...</span>
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent ${
                        selectedAppointment === apt.id 
                          ? 'border-primary bg-accent ring-1 ring-primary' 
                          : 'border-border'
                      }`}
                      onClick={() => {
                        setSelectedAppointment(apt.id)
                        // Reset test selection when changing appointment
                        setSelectedTest("")
                      }}
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(apt.patient_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium leading-none">{apt.patient_name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {apt.patient_id.substring(0, 12)}...
                            </p>
                          </div>
                          <Badge variant={apt.status === "checked_in" ? "default" : "secondary"} className="text-xs">
                            {apt.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{apt.appointment_time}</span>
                          </div>
                          
                          {apt.appointment_type && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span>{apt.appointment_type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-6 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-amber-400" />
                  <h3 className="mt-3 text-lg font-medium text-amber-800">No appointments found</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    No checked-in appointments found for {formattedDate}. 
                    Please ensure appointments are scheduled and patients are checked in.
                  </p>
                </div>
              )}
              
              {/* Hidden select for form submission */}
              <Input 
                type="hidden" 
                name="appointment_id" 
                value={selectedAppointment} 
                required 
              />
            </div>

            {/* Selected Appointment Summary */}
            {selectedAppointmentDetails && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(selectedAppointmentDetails.patient_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{selectedAppointmentDetails.patient_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{selectedAppointmentDetails.appointment_time}</span>
                        <span>•</span>
                        <User className="h-3 w-3" />
                        <span>{selectedAppointmentDetails.patient_id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAppointment("")}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Test Type Selection */}
            <div className="space-y-3">
              <Label htmlFor="test_id">
                Test Type <span className="text-destructive">*</span>
              </Label>
              <Select 
                name="test_id" 
                required 
                onValueChange={setSelectedTest}
                disabled={!selectedAppointment}
                value={selectedTest}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      CLINICAL TESTS
                    </p>
                    <SelectItem value="audiometry" className="flex items-center gap-2">
                      <Ear className="h-4 w-4" />
                      Audiometry (Hearing Test)
                    </SelectItem>
                    <SelectItem value="spirometry" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Spirometry (Lung Function)
                    </SelectItem>
                    <SelectItem value="vision" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Vision Screening
                    </SelectItem>
                    <SelectItem value="bp" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Blood Pressure
                    </SelectItem>
                    <SelectItem value="drug" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Drug & Alcohol Screening
                    </SelectItem>
                  </div>
                  
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      IMAGING TESTS
                    </p>
                    <SelectItem value="xray" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Chest X-Ray
                    </SelectItem>
                    <SelectItem value="ecg" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      ECG (Electrocardiogram)
                    </SelectItem>
                    <SelectItem value="ultrasound" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Ultrasound
                    </SelectItem>
                  </div>
                  
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Microscope className="h-3 w-3" />
                      LABORATORY TESTS
                    </p>
                    <SelectItem value="hiv" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      HIV Testing
                    </SelectItem>
                    <SelectItem value="malaria" className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Malaria Test
                    </SelectItem>
                    <SelectItem value="hepatitis_b" className="flex items-center gap-2">
                      <Syringe className="h-4 w-4" />
                      Hepatitis B Test
                    </SelectItem>
                    <SelectItem value="hepatitis_c" className="flex items-center gap-2">
                      <Syringe className="h-4 w-4" />
                      Hepatitis C Test
                    </SelectItem>
                    <SelectItem value="syphilis" className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Syphilis Test
                    </SelectItem>
                    <SelectItem value="urinalysis" className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Urinalysis
                    </SelectItem>
                    <SelectItem value="blood_glucose" className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Blood Glucose
                    </SelectItem>
                    <SelectItem value="cholesterol" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Cholesterol Test
                    </SelectItem>
                    <SelectItem value="cbc" className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Complete Blood Count (CBC)
                    </SelectItem>
                    <SelectItem value="liver_function" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Liver Function Test
                    </SelectItem>
                    <SelectItem value="kidney_function" className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Kidney Function Test
                    </SelectItem>
                  </div>
                  
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      OTHER TESTS
                    </p>
                    <SelectItem value="pregnancy" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Pregnancy Test
                    </SelectItem>
                    <SelectItem value="tuberculosis" className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Tuberculosis Test
                    </SelectItem>
                    <SelectItem value="typhoid" className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Typhoid Test
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>
              
              {!selectedAppointment && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Please select an appointment first to choose a test.
                  </p>
                </div>
              )}
              
              {selectedTest && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    {testIcons[selectedTest]}
                    <span className="font-medium">{selectedTest.replace('_', ' ').toUpperCase()}</span>
                    selected for {selectedAppointmentDetails?.patient_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Test Fields Based on Selection */}
        {selectedTest && selectedAppointment && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testIcons[selectedTest]}
                  <CardTitle className="capitalize">{selectedTest.replace('_', ' ')} Results</CardTitle>
                </div>
                <Badge variant="outline" className="text-sm">
                  Patient: {selectedAppointmentDetails?.patient_name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter test results and findings for {selectedAppointmentDetails?.patient_name}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test-Specific Forms */}
              {selectedTest === "audiometry" && <AudiometryForm />}
              {selectedTest === "spirometry" && <SpirometryForm />}
              {selectedTest === "vision" && <VisionForm />}
              {selectedTest === "xray" && <XRayForm />}
              {selectedTest === "bp" && <BloodPressureForm />}
              {selectedTest === "drug" && <DrugScreenForm />}
              {selectedTest === "hiv" && <HIVTestForm />}
              {selectedTest === "malaria" && <MalariaTestForm />}
              {selectedTest === "hepatitis_b" && <HepatitisBTestForm />}
              {selectedTest === "hepatitis_c" && <HepatitisCTestForm />}
              {selectedTest === "syphilis" && <SyphilisTestForm />}
              {selectedTest === "urinalysis" && <UrinalysisForm />}
              {selectedTest === "blood_glucose" && <BloodGlucoseForm />}
              {selectedTest === "cholesterol" && <CholesterolForm />}
              {selectedTest === "ecg" && <ECGForm />}
              {selectedTest === "ultrasound" && <UltrasoundForm />}
              {selectedTest === "cbc" && <CBCForm />}
              {selectedTest === "liver_function" && <LiverFunctionForm />}
              {selectedTest === "kidney_function" && <KidneyFunctionForm />}
              {selectedTest === "pregnancy" && <PregnancyTestForm />}
              {selectedTest === "tuberculosis" && <TuberculosisTestForm />}
              {selectedTest === "typhoid" && <TyphoidTestForm />}

              {/* Common Fields for All Tests */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <Label htmlFor="findings" className="text-base">
                    Clinical Findings & Observations
                  </Label>
                  <Textarea 
                    id="findings" 
                    name="findings" 
                    rows={4} 
                    placeholder="Enter detailed clinical findings, observations, and interpretation of test results..." 
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe any abnormalities, specific findings, or important observations from the test.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="recommendations" className="text-base">
                    Recommendations & Follow-up
                  </Label>
                  <Textarea 
                    id="recommendations" 
                    name="recommendations" 
                    rows={3} 
                    placeholder="Enter clinical recommendations, follow-up actions, or referrals if needed..." 
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include any referrals, follow-up tests, medications, or lifestyle recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            disabled={loading || !selectedTest || !selectedAppointment}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Results...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Test Results
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ===================== ALL TEST FORM COMPONENTS =====================

function AudiometryForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Ear className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Hearing Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter hearing thresholds in decibels (dB) for each frequency.
        </p>
      </div>
      
      <Tabs defaultValue="right">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="right" className="flex items-center gap-2">
            <Ear className="h-4 w-4" />
            Right Ear
          </TabsTrigger>
          <TabsTrigger value="left" className="flex items-center gap-2">
            <Ear className="h-4 w-4" />
            Left Ear
          </TabsTrigger>
        </TabsList>
        <TabsContent value="right" className="space-y-4 pt-4">
          <h5 className="font-medium">Right Ear Hearing Thresholds</h5>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {["250Hz", "500Hz", "1000Hz", "2000Hz", "4000Hz", "8000Hz"].map((freq) => (
              <div key={freq} className="space-y-2">
                <Label htmlFor={`right_${freq}`}>{freq}</Label>
                <Input 
                  id={`right_${freq}`} 
                  name={`right_${freq}`} 
                  type="number" 
                  placeholder="dB" 
                  min="0" 
                  max="120"
                />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="left" className="space-y-4 pt-4">
          <h5 className="font-medium">Left Ear Hearing Thresholds</h5>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {["250Hz", "500Hz", "1000Hz", "2000Hz", "4000Hz", "8000Hz"].map((freq) => (
              <div key={freq} className="space-y-2">
                <Label htmlFor={`left_${freq}`}>{freq}</Label>
                <Input 
                  id={`left_${freq}`} 
                  name={`left_${freq}`} 
                  type="number" 
                  placeholder="dB" 
                  min="0" 
                  max="120"
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SpirometryForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Lung Function Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter spirometry values. Normal ranges may vary based on age, sex, and height.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fvc">FVC (Forced Vital Capacity) <span className="text-destructive">*</span></Label>
          <Input id="fvc" name="fvc" type="number" step="0.01" placeholder="Liters" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fev1">FEV1 (Forced Expiratory Volume) <span className="text-destructive">*</span></Label>
          <Input id="fev1" name="fev1" type="number" step="0.01" placeholder="Liters" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fev1_fvc_ratio">FEV1/FVC Ratio</Label>
          <Input id="fev1_fvc_ratio" name="fev1_fvc_ratio" type="number" step="0.01" placeholder="%" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pef">PEF (Peak Expiratory Flow)</Label>
          <Input id="pef" name="pef" type="number" placeholder="L/min" />
        </div>
      </div>
    </div>
  )
}

function VisionForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Vision Screening Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter visual acuity for each eye using Snellen notation (e.g., 6/6, 20/20).
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="right_distance">Right Eye (Distance)</Label>
          <Input id="right_distance" name="right_distance" placeholder="e.g., 6/6 or 20/20" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="left_distance">Left Eye (Distance)</Label>
          <Input id="left_distance" name="left_distance" placeholder="e.g., 6/6 or 20/20" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="both_distance">Both Eyes (Distance)</Label>
          <Input id="both_distance" name="both_distance" placeholder="e.g., 6/6 or 20/20" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color_vision">Color Vision</Label>
          <Select name="color_vision">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="red_green_deficiency">Red-Green Deficiency</SelectItem>
              <SelectItem value="blue_yellow_deficiency">Blue-Yellow Deficiency</SelectItem>
              <SelectItem value="monochromacy">Monochromacy (Total Color Blindness)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function XRayForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Chest X-Ray Findings</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from chest X-ray examination.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heart_size">Heart Size</Label>
            <Select name="heart_size">
              <SelectTrigger>
                <SelectValue placeholder="Select heart size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="mildly_enlarged">Mildly Enlarged</SelectItem>
                <SelectItem value="moderately_enlarged">Moderately Enlarged</SelectItem>
                <SelectItem value="severely_enlarged">Severely Enlarged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lung_fields">Lung Fields</Label>
            <Select name="lung_fields">
              <SelectTrigger>
                <SelectValue placeholder="Select lung condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear Bilaterally</SelectItem>
                <SelectItem value="mild_infiltrates">Mild Infiltrates</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
                <SelectItem value="effusion">Pleural Effusion</SelectItem>
                <SelectItem value="nodules">Pulmonary Nodules</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="xray_impression">Overall Impression</Label>
          <Textarea
            id="xray_impression"
            name="xray_impression"
            rows={3}
            placeholder="Radiologist's interpretation and findings..."
          />
        </div>
      </div>
    </div>
  )
}

function BloodPressureForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Blood Pressure Measurement</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter blood pressure readings. Normal range: 120/80 mmHg.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="systolic">Systolic (mmHg) <span className="text-destructive">*</span></Label>
          <Input id="systolic" name="systolic" type="number" placeholder="e.g., 120" min="50" max="300" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="diastolic">Diastolic (mmHg) <span className="text-destructive">*</span></Label>
          <Input id="diastolic" name="diastolic" type="number" placeholder="e.g., 80" min="30" max="200" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pulse">Pulse Rate (bpm)</Label>
          <Input id="pulse" name="pulse" type="number" placeholder="e.g., 72" min="30" max="200" />
        </div>
      </div>
    </div>
  )
}

function DrugScreenForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h4 className="font-medium text-amber-800">Drug & Alcohol Screening</h4>
        </div>
        <p className="mt-1 text-sm text-amber-700">
          Confidential test results. Requires patient consent for testing.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="alcohol">Alcohol (Breath/BAC)</Label>
            <Input id="alcohol" name="alcohol" type="number" step="0.01" placeholder="mg/L or % BAC" />
          </div>
        </div>
        
        <Separator />
        
        <h5 className="font-medium">Substance Screening Results</h5>
        <div className="grid gap-4 md:grid-cols-2">
          {["Cannabis", "Cocaine", "Opiates", "Amphetamines", "Benzodiazepines", "Barbiturates"].map((substance) => (
            <div key={substance} className="space-y-2">
              <Label htmlFor={substance.toLowerCase()}>{substance}</Label>
              <Select name={substance.toLowerCase()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="not_tested">Not Tested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HIVTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">HIV Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          HIV testing requires informed consent. Ensure patient has received pre-test counseling.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hiv_result">
            HIV Test Result <span className="text-destructive">*</span>
          </Label>
          <Select name="hiv_result" required>
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="invalid">Invalid/Indeterminate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hiv_test_type">Test Type/Method</Label>
          <Select name="hiv_test_type">
            <SelectTrigger>
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rapid">Rapid Test</SelectItem>
              <SelectItem value="elisa">ELISA</SelectItem>
              <SelectItem value="western_blot">Western Blot</SelectItem>
              <SelectItem value="pcr">PCR (Viral Load)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="hiv_test_kit">Test Kit Used</Label>
          <Select name="hiv_test_kit">
            <SelectTrigger>
              <SelectValue placeholder="Select kit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="determine">Determine HIV-1/2</SelectItem>
              <SelectItem value="unigold">Uni-Gold Recombigen</SelectItem>
              <SelectItem value="first_response">First Response</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_lot_number">Lot Number</Label>
          <Input id="hiv_lot_number" name="hiv_lot_number" placeholder="Enter lot number" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_expiry_date">Expiry Date</Label>
          <Input id="hiv_expiry_date" name="hiv_expiry_date" type="date" />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="hiv_confirmatory_test">Confirmatory Test</Label>
          <Select name="hiv_confirmatory_test">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_referral_made">Referral Made</Label>
          <Select name="hiv_referral_made">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hiv_counseling">Post-Test Counseling</Label>
          <Select name="hiv_counseling">
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provided">Provided</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function MalariaTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Malaria Test Results</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Rapid Diagnostic Test (RDT) or microscopy results for malaria.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="malaria_result">Malaria Test Result</Label>
          <Select name="malaria_result">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="pf">P. falciparum Positive</SelectItem>
              <SelectItem value="pv">P. vivax Positive</SelectItem>
              <SelectItem value="pm">P. malariae Positive</SelectItem>
              <SelectItem value="po">P. ovale Positive</SelectItem>
              <SelectItem value="mixed">Mixed Infection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="malaria_parasite_count">Parasite Count (parasites/μL)</Label>
          <Input id="malaria_parasite_count" name="malaria_parasite_count" type="number" placeholder="e.g., 1500" />
        </div>
      </div>
    </div>
  )
}

function HepatitisBTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Hepatitis B Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hbsag">HBsAg (Surface Antigen)</Label>
          <Select name="hbsag">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anti_hbs">Anti-HBs (Surface Antibody)</Label>
          <Select name="anti_hbs">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="reactive">Reactive (≥10 mIU/mL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anti_hbc">Anti-HBc (Core Antibody)</Label>
          <Select name="anti_hbc">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hbeag">HBeAg (e Antigen)</Label>
          <Select name="hbeag">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function HepatitisCTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Hepatitis C Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="anti_hcv">Anti-HCV Antibody</Label>
          <Select name="anti_hcv">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hcv_rna">HCV RNA (Viral Load)</Label>
          <Input id="hcv_rna" name="hcv_rna" type="number" placeholder="IU/mL" />
        </div>
      </div>
    </div>
  )
}

function SyphilisTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Microscope className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Syphilis Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="syphilis_rpr">RPR/VDRL (Non-treponemal)</Label>
          <Select name="syphilis_rpr">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nonreactive">Non-reactive</SelectItem>
              <SelectItem value="reactive">Reactive</SelectItem>
              <SelectItem value="titer">Titer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="syphilis_tppa">TPPA/FTA-ABS (Treponemal)</Label>
          <Select name="syphilis_tppa">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="syphilis_titer">RPR Titer (if reactive)</Label>
          <Input id="syphilis_titer" name="syphilis_titer" placeholder="e.g., 1:8, 1:16" />
        </div>
      </div>
    </div>
  )
}

function UrinalysisForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Urinalysis Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="urine_color">Color</Label>
          <Select name="urine_color">
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="straw">Straw (Normal)</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="amber">Amber</SelectItem>
              <SelectItem value="red">Red/Pink</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urine_clarity">Clarity</Label>
          <Select name="urine_clarity">
            <SelectTrigger>
              <SelectValue placeholder="Select clarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">Clear</SelectItem>
              <SelectItem value="slightly_cloudy">Slightly Cloudy</SelectItem>
              <SelectItem value="cloudy">Cloudy</SelectItem>
              <SelectItem value="turbid">Turbid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="urine_ph">pH</Label>
          <Input id="urine_ph" name="urine_ph" type="number" step="0.1" placeholder="e.g., 6.5" min="4.5" max="9" />
        </div>
      </div>
      
      <Separator />
      
      <h5 className="font-medium">Chemical Analysis</h5>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "urine_protein", label: "Protein" },
          { name: "urine_glucose", label: "Glucose" },
          { name: "urine_blood", label: "Blood" },
          { name: "urine_ketones", label: "Ketones" },
          { name: "urine_bilirubin", label: "Bilirubin" },
          { name: "urine_urobilinogen", label: "Urobilinogen" },
          { name: "urine_nitrite", label: "Nitrite" },
          { name: "urine_leukocytes", label: "Leukocytes" }
        ].map((test) => (
          <div key={test.name} className="space-y-2">
            <Label htmlFor={test.name}>{test.label}</Label>
            <Select name={test.name}>
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Negative</SelectItem>
                <SelectItem value="trace">Trace</SelectItem>
                <SelectItem value="1+">1+</SelectItem>
                <SelectItem value="2+">2+</SelectItem>
                <SelectItem value="3+">3+</SelectItem>
                <SelectItem value="4+">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}

function BloodGlucoseForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Blood Glucose Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="glucose_fasting">Fasting Glucose (mg/dL)</Label>
          <Input id="glucose_fasting" name="glucose_fasting" type="number" placeholder="e.g., 95" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_random">Random Glucose (mg/dL)</Label>
          <Input id="glucose_random" name="glucose_random" type="number" placeholder="e.g., 120" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_hba1c">HbA1c (%)</Label>
          <Input id="glucose_hba1c" name="glucose_hba1c" type="number" step="0.1" placeholder="e.g., 5.7" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="glucose_test_type">Test Type</Label>
          <Select name="glucose_test_type">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fasting">Fasting</SelectItem>
              <SelectItem value="random">Random</SelectItem>
              <SelectItem value="post_prandial">Post Prandial</SelectItem>
              <SelectItem value="hba1c">HbA1c</SelectItem>
              <SelectItem value="ogtt">Oral Glucose Tolerance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function CholesterolForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Lipid Profile Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cholesterol_total">Total Cholesterol (mg/dL)</Label>
          <Input id="cholesterol_total" name="cholesterol_total" type="number" placeholder="e.g., 200" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_hdl">HDL (Good Cholesterol) (mg/dL)</Label>
          <Input id="cholesterol_hdl" name="cholesterol_hdl" type="number" placeholder="e.g., 60" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_ldl">LDL (Bad Cholesterol) (mg/dL)</Label>
          <Input id="cholesterol_ldl" name="cholesterol_ldl" type="number" placeholder="e.g., 100" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cholesterol_triglycerides">Triglycerides (mg/dL)</Label>
          <Input id="cholesterol_triglycerides" name="cholesterol_triglycerides" type="number" placeholder="e.g., 150" />
        </div>
      </div>
    </div>
  )
}

function ECGForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">ECG Interpretation</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from ECG reading. Consider consulting with a cardiologist for abnormal results.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ecg_heart_rate">Heart Rate (bpm)</Label>
          <Input id="ecg_heart_rate" name="ecg_heart_rate" type="number" placeholder="e.g., 72" min="30" max="300" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_rhythm">Rhythm</Label>
          <Select name="ecg_rhythm">
            <SelectTrigger>
              <SelectValue placeholder="Select rhythm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal_sinus">Normal Sinus Rhythm</SelectItem>
              <SelectItem value="sinus_tachycardia">Sinus Tachycardia</SelectItem>
              <SelectItem value="sinus_bradycardia">Sinus Bradycardia</SelectItem>
              <SelectItem value="atrial_fibrillation">Atrial Fibrillation</SelectItem>
              <SelectItem value="atrial_flutter">Atrial Flutter</SelectItem>
              <SelectItem value="premature_ventricular">Premature Ventricular Contractions</SelectItem>
              <SelectItem value="ventricular_tachycardia">Ventricular Tachycardia</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_pr_interval">PR Interval (ms)</Label>
          <Input id="ecg_pr_interval" name="ecg_pr_interval" type="number" placeholder="e.g., 160" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ecg_qrs_duration">QRS Duration (ms)</Label>
          <Input id="ecg_qrs_duration" name="ecg_qrs_duration" type="number" placeholder="e.g., 100" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ecg_findings">ECG Findings</Label>
        <Textarea 
          id="ecg_findings" 
          name="ecg_findings" 
          rows={4} 
          placeholder="Describe ECG findings in detail, including any abnormalities, ST segment changes, T wave inversions, etc." 
        />
      </div>
    </div>
  )
}

function UltrasoundForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Ultrasound Examination</h4>
        </div>
        <p className="mt-1 text-sm text-blue-700">
          Enter findings from ultrasound examination. Specify organ/system examined.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ultrasound_type">Type of Ultrasound</Label>
          <Select name="ultrasound_type">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abdominal">Abdominal</SelectItem>
              <SelectItem value="pelvic">Pelvic</SelectItem>
              <SelectItem value="obstetric">Obstetric</SelectItem>
              <SelectItem value="thyroid">Thyroid</SelectItem>
              <SelectItem value="breast">Breast</SelectItem>
              <SelectItem value="testicular">Testicular</SelectItem>
              <SelectItem value="carotid">Carotid Doppler</SelectItem>
              <SelectItem value="renal">Renal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ultrasound_findings_summary">Findings Summary</Label>
          <Input 
            id="ultrasound_findings_summary" 
            name="ultrasound_findings_summary" 
            placeholder="e.g., Normal liver echotexture" 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="ultrasound_details">Detailed Findings</Label>
        <Textarea 
          id="ultrasound_details" 
          name="ultrasound_details" 
          rows={3} 
          placeholder="Describe ultrasound findings in detail including measurements if applicable..." 
        />
      </div>
    </div>
  )
}

function CBCForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Microscope className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Complete Blood Count Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cbc_wbc">White Blood Cells (WBC)</Label>
          <Input id="cbc_wbc" name="cbc_wbc" type="number" step="0.1" placeholder="x10³/µL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_rbc">Red Blood Cells (RBC)</Label>
          <Input id="cbc_rbc" name="cbc_rbc" type="number" step="0.1" placeholder="x10⁶/µL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_hemoglobin">Hemoglobin (Hb)</Label>
          <Input id="cbc_hemoglobin" name="cbc_hemoglobin" type="number" step="0.1" placeholder="g/dL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_hematocrit">Hematocrit (Hct)</Label>
          <Input id="cbc_hematocrit" name="cbc_hematocrit" type="number" placeholder="%" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_platelets">Platelets</Label>
          <Input id="cbc_platelets" name="cbc_platelets" type="number" placeholder="x10³/µL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cbc_mcv">Mean Corpuscular Volume (MCV)</Label>
          <Input id="cbc_mcv" name="cbc_mcv" type="number" placeholder="fL" />
        </div>
      </div>
    </div>
  )
}

function LiverFunctionForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Liver Function Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lft_alt">ALT (SGPT) (U/L)</Label>
          <Input id="lft_alt" name="lft_alt" type="number" placeholder="U/L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_ast">AST (SGOT) (U/L)</Label>
          <Input id="lft_ast" name="lft_ast" type="number" placeholder="U/L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_alp">Alkaline Phosphatase (ALP) (U/L)</Label>
          <Input id="lft_alp" name="lft_alp" type="number" placeholder="U/L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_bilirubin_total">Total Bilirubin (mg/dL)</Label>
          <Input id="lft_bilirubin_total" name="lft_bilirubin_total" type="number" step="0.1" placeholder="mg/dL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_bilirubin_direct">Direct Bilirubin (mg/dL)</Label>
          <Input id="lft_bilirubin_direct" name="lft_bilirubin_direct" type="number" step="0.1" placeholder="mg/dL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lft_albumin">Albumin (g/dL)</Label>
          <Input id="lft_albumin" name="lft_albumin" type="number" step="0.1" placeholder="g/dL" />
        </div>
      </div>
    </div>
  )
}

function KidneyFunctionForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Kidney Function Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kft_creatinine">Creatinine (mg/dL)</Label>
          <Input id="kft_creatinine" name="kft_creatinine" type="number" step="0.01" placeholder="mg/dL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_urea">Urea (BUN) (mg/dL)</Label>
          <Input id="kft_urea" name="kft_urea" type="number" step="0.1" placeholder="mg/dL" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_egfr">eGFR (mL/min/1.73m²)</Label>
          <Input id="kft_egfr" name="kft_egfr" type="number" placeholder="mL/min/1.73m²" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_sodium">Sodium (mmol/L)</Label>
          <Input id="kft_sodium" name="kft_sodium" type="number" placeholder="mmol/L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_potassium">Potassium (mmol/L)</Label>
          <Input id="kft_potassium" name="kft_potassium" type="number" step="0.1" placeholder="mmol/L" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kft_chloride">Chloride (mmol/L)</Label>
          <Input id="kft_chloride" name="kft_chloride" type="number" placeholder="mmol/L" />
        </div>
      </div>
    </div>
  )
}

function PregnancyTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Pregnancy Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pregnancy_result">Pregnancy Test Result <span className="text-destructive">*</span></Label>
          <Select name="pregnancy_result" required>
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pregnancy_test_type">Test Type</Label>
          <Select name="pregnancy_test_type">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urine">Urine Test</SelectItem>
              <SelectItem value="blood">Blood Test (Beta HCG)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pregnancy_weeks">Estimated Gestation (if positive)</Label>
        <Input id="pregnancy_weeks" name="pregnancy_weeks" type="number" placeholder="Weeks" />
      </div>
    </div>
  )
}

function TuberculosisTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Microscope className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Tuberculosis Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tb_test_type">Test Type</Label>
          <Select name="tb_test_type">
            <SelectTrigger>
              <SelectValue placeholder="Select test" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mantoux">Mantoux (PPD) Test</SelectItem>
              <SelectItem value="igra">IGRA (Quantiferon)</SelectItem>
              <SelectItem value="sputum">Sputum AFB</SelectItem>
              <SelectItem value="xpert">GeneXpert MTB/RIF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tb_result">Test Result</Label>
          <Select name="tb_result">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="induration">Induration (mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tb_induration">Induration Measurement (mm)</Label>
        <Input id="tb_induration" name="tb_induration" type="number" placeholder="Millimeters" />
      </div>
    </div>
  )
}

function TyphoidTestForm() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-blue-600" />
          <h4 className="font-medium text-blue-800">Typhoid Test Results</h4>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="typhoid_widal">Widal Test</Label>
          <Select name="typhoid_widal">
            <SelectTrigger>
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="titer">Titer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="typhoid_titer">Titer Value</Label>
          <Input id="typhoid_titer" name="typhoid_titer" placeholder="e.g., 1:80" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="typhoid_culture">Blood Culture Result</Label>
        <Select name="typhoid_culture">
          <SelectTrigger>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="negative">Negative</SelectItem>
            <SelectItem value="positive_s_typhi">S. Typhi Positive</SelectItem>
            <SelectItem value="positive_paratyphi">S. Paratyphi Positive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}