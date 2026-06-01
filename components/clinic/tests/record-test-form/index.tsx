"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, RefreshCw, User, Clock, Building, CheckCircle, XCircle, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"
import { createMultipleTestResults } from "@/lib/actions/test-result-actions" // Make sure this is exported
import { useToast } from "@/hooks/use-toast"
import { getAppointmentsForTestRecording } from "@/lib/actions/appointment-actions"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import type { Appointment, Patient, ClinicalTest, TestResult } from "@/lib/types/database"
import { AppointmentOption, RecordTestFormProps } from "./types"
import { testCategories, testIcons } from "./test-categories"
import { TestFormWrapper } from "./test-form-wrapper"

export function RecordTestForm({ 
  initialAppointments = [], 
  initialTests = [] 
}: RecordTestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Multi-test state
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [testFormData, setTestFormData] = useState<Record<string, any>>({})
  const [activeTestTab, setActiveTestTab] = useState<string>("")

  // Appointment state - Fixed type issue
  const [appointments, setAppointments] = useState<AppointmentOption[]>(() => {
    if (!initialAppointments || initialAppointments.length === 0) {
      return []
    }
    
    return initialAppointments.map((apt: any) => ({
      id: apt.id || "",
      display: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''} - ${apt.appointment_time || ''}`,
      appointment_time: apt.appointment_time || "",
      appointment_date: apt.appointment_date || "",
      patient_id: apt.patient_id || "",
      patient_name: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim() || `Patient ${apt.patient_id?.substring(0, 8) || 'unknown'}`,
      status: apt.status || "unknown",
      appointment_type: apt.appointment_type || "",
      employer_id: apt.employer_id || null,
    }))
  })
  
  const [fetchingAppointments, setFetchingAppointments] = useState(!initialAppointments?.length)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedAppointment, setSelectedAppointment] = useState<string>("")

  // Fetch appointments on component mount and when date changes
  useEffect(() => {
    if (!initialAppointments?.length || selectedDate !== format(new Date(), "yyyy-MM-dd")) {
      fetchAppointments()
    }
  }, [selectedDate])

  const fetchAppointments = useCallback(async () => {
    try {
      setFetchingAppointments(true)
      const result = await getAppointmentsForTestRecording({
        date: selectedDate,
        status: "checked_in",
        limit: 100
      })
      
      if (result.success) {
        const appointmentOptions: AppointmentOption[] = result.appointments.map((apt: any) => ({
          id: apt.id || "",
          display: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''} - ${apt.appointment_time || ''}`,
          appointment_time: apt.appointment_time || "",
          appointment_date: apt.appointment_date || "",
          patient_id: apt.patient_id || "",
          patient_name: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim() || `Patient ${apt.patient_id?.substring(0, 8) || 'unknown'}`,
          status: apt.status || "unknown",
          appointment_type: apt.appointment_type || "",
          employer_id: apt.employer_id || null,
        }))
        
        setAppointments(appointmentOptions)
        setSelectedAppointment("")
        
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
  }, [selectedDate, toast])

  const handleTestToggle = useCallback((testCode: string) => {
    if (selectedTests.includes(testCode)) {
      // Remove test
      setSelectedTests(prev => prev.filter(t => t !== testCode))
      // Clear form data for removed test
      setTestFormData(prev => {
        const { [testCode]: _, ...rest } = prev
        return rest
      })
      // Update active tab if needed
      if (activeTestTab === testCode) {
        const remainingTests = selectedTests.filter(t => t !== testCode)
        setActiveTestTab(remainingTests[0] || "")
      }
    } else {
      // Add test
      setSelectedTests(prev => [...prev, testCode])
      if (!activeTestTab) {
        setActiveTestTab(testCode)
      }
    }
  }, [selectedTests, activeTestTab])

  const handleTestDataChange = useCallback((testCode: string, data: Record<string, any>) => {
    setTestFormData(prev => ({
      ...prev,
      [testCode]: {
        ...prev[testCode],
        ...data
      }
    }))
  }, [])

  const handleClearAllTests = useCallback(() => {
    setSelectedTests([])
    setTestFormData({})
    setActiveTestTab("")
  }, [])

  // Add this function to identify sensitive tests
  const isSensitiveTest = (testCode: string): boolean => {
    const sensitiveTests = [
      'hiv_test',
      'sti_test',
      'hepatitis_b',
      'hepatitis_c',
      'tb_test',
      'drug_screening',
      'genetic_testing',
      'mental_health_assessment',
    ]
    return sensitiveTests.includes(testCode)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedAppointment) {
      toast({
        title: "Error",
        description: "Please select an appointment",
        variant: "destructive",
      })
      return
    }
    
    if (selectedTests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one test",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const patientId = selectedAppointmentDetails?.patient_id || ""
      
      // Prepare data for each test
      const testResultsData = selectedTests.map(testCode => ({
        appointment_id: selectedAppointment,
        patient_id: patientId,
        test_code: testCode,
        findings: testFormData[testCode]?.findings || null,
        recommendations: testFormData[testCode]?.recommendations || null,
        results: testFormData[testCode] || {},
        is_normal: calculateIsNormal(testCode, testFormData[testCode]),
        attachments: [],
        reviewed_by: null,
        reviewed_at: null,
        // Add sensitive test flag
        is_sensitive: isSensitiveTest(testCode),
      }))

      // Use the createMultipleTestResults action
      const result = await createMultipleTestResults(testResultsData)

      if (result.success) {
        toast({
          title: "Success!",
          description: `${result.created} test(s) saved and encrypted successfully.`,
          duration: 5000,
        })
        router.push("/clinic/tests")
        router.refresh()
      } else {
        toast({
          title: result.created && result.created > 0 ? "Partial Success" : "Error",
          description: result.created && result.created > 0 
            ? `${result.created} of ${selectedTests.length} tests saved. ${result.failed} failed.`
            : `Failed to save all tests.`,
          variant: result.created && result.created > 0 ? "default" : "destructive",
          duration: 5000,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save test results.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to parse numeric values
  const parseNumeric = (value: any): number | null => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  // Helper function to check if value is within range
  const isInRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max
  }

  // Helper function to compare vision acuity
  const isVisionNormal = (acuity: string): boolean => {
    if (!acuity) return false
    // Parse 20/20 or 6/6 format
    const match = acuity.match(/(\d+)\/(\d+)/)
    if (match) {
      const numerator = parseFloat(match[1])
      const denominator = parseFloat(match[2])
      if (denominator === 0) return false
      const ratio = numerator / denominator
      // Normal is 20/20 or better (6/6 or better)
      return ratio <= 1.0
    }
    return false
  }

  const calculateIsNormal = (testCode: string, data: Record<string, any>): boolean | null => {
    if (!data || Object.keys(data).length === 0) {
      return null // No data provided
    }

    switch (testCode) {
      case 'audiometry':
        try {
          let abnormalCount = 0
          const thresholds = [
            'right_250Hz', 'right_500Hz', 'right_1000Hz', 'right_2000Hz', 'right_4000Hz', 'right_8000Hz',
            'left_250Hz', 'left_500Hz', 'left_1000Hz', 'left_2000Hz', 'left_4000Hz', 'left_8000Hz'
          ]
          
          thresholds.forEach(key => {
            const value = parseNumeric(data[key])
            if (value !== null && value > 25) {
              abnormalCount++
            }
          })
          
          return abnormalCount <= 2
        } catch {
          return null
        }

      case 'spirometry':
        try {
          const fvc = parseNumeric(data.fvc)
          const fev1 = parseNumeric(data.fev1)
          const fev1FvcRatio = parseNumeric(data.fev1_fvc_ratio)
          const pef = parseNumeric(data.pef)
          
          let isNormal = true
          
          if (fvc !== null && fvc < 0.80) isNormal = false
          if (fev1 !== null && fev1 < 0.80) isNormal = false
          if (fev1FvcRatio !== null && fev1FvcRatio < 0.70) isNormal = false
          if (pef !== null && pef < 80) isNormal = false
          
          return isNormal
        } catch {
          return null
        }

      case 'vision':
        try {
          const rightDistance = data.right_distance
          const leftDistance = data.left_distance
          const bothDistance = data.both_distance
          const colorVision = data.color_vision
          
          let isNormal = true
          
          if (rightDistance && !isVisionNormal(rightDistance)) isNormal = false
          if (leftDistance && !isVisionNormal(leftDistance)) isNormal = false
          if (bothDistance && !isVisionNormal(bothDistance)) isNormal = false
          
          if (colorVision && colorVision.toLowerCase() !== 'normal') {
            isNormal = false
          }
          
          return isNormal
        } catch {
          return null
        }

      case 'blood_pressure':
        try {
          const systolic = parseNumeric(data.systolic)
          const diastolic = parseNumeric(data.diastolic)
          
          if (systolic === null || diastolic === null) return null
          
          const isNormal = systolic < 120 && diastolic < 80
          
          return isNormal
        } catch {
          return null
        }

      case 'urinalysis':
        try {
          const normalValues: Record<string, any> = {
            ph: { min: 4.5, max: 8.0 },
            specific_gravity: { min: 1.005, max: 1.030 },
            glucose: 0,
            protein: 0,
            ketones: 0,
            bilirubin: 0,
            blood: 0,
            nitrites: false,
            leukocytes: 0
          }
          
          let isNormal = true
          
          Object.keys(normalValues).forEach(key => {
            if (data[key] !== undefined) {
              const expected = normalValues[key]
              const actual = data[key]
              
              if (typeof expected === 'object') {
                const value = parseNumeric(actual)
                if (value !== null && !isInRange(value, expected.min, expected.max)) {
                  isNormal = false
                }
              } else if (typeof expected === 'boolean') {
                if (Boolean(actual) !== expected) {
                  isNormal = false
                }
              } else {
                if (parseNumeric(actual) !== expected) {
                  isNormal = false
                }
              }
            }
          })
          
          return isNormal
        } catch {
          return null
        }

      default:
        if (data.findings) {
          const findings = data.findings.toLowerCase()
          const abnormalKeywords = [
            'abnormal', 'elevated', 'reduced', 'decreased', 'increased', 
            'positive', 'detected', 'irregular', 'poor', 'failed', 'weak'
          ]
          
          for (const keyword of abnormalKeywords) {
            if (findings.includes(keyword)) {
              return false
            }
          }
          
          const normalKeywords = [
            'normal', 'within normal limits', 'negative', 'not detected', 
            'good', 'excellent', 'clear', 'unremarkable', 'satisfactory'
          ]
          
          for (const keyword of normalKeywords) {
            if (findings.includes(keyword)) {
              return true
            }
          }
        }
        
        return null
    }
  }

  const selectedAppointmentDetails = appointments.find(apt => apt.id === selectedAppointment)
  const formattedDate = format(new Date(selectedDate), "EEEE, MMMM d, yyyy")

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCompletionStatus = (testCode: string) => {
    const data = testFormData[testCode] || {}
    const hasRequiredFields = Object.keys(data).length > 0
    const hasFindings = data.findings && data.findings.trim().length > 0
    return {
      hasData: hasRequiredFields,
      hasFindings,
      percentage: hasRequiredFields ? (hasFindings ? 100 : 50) : 0
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Patient & Appointment Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient & Appointment</CardTitle>
              <Badge variant="outline" className="text-sm">
                {fetchingAppointments ? "Loading..." : `${appointments.length} appointments`}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a checked-in appointment to record tests
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
                        handleClearAllTests()
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
                    onClick={() => {
                      setSelectedAppointment("")
                      handleClearAllTests()
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Selection */}
        {selectedAppointment && (
          <Card>
            <CardHeader>
              <CardTitle>Select Tests to Record</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select one or multiple tests to record for this patient
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Categories */}
              <div className="space-y-6">
                {testCategories.map((category) => (
                  <div key={category.name} className="space-y-3">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <h4 className="text-sm font-medium">{category.label}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {category.tests.map((test) => (
                        <div
                          key={test.value}
                          className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent ${
                            selectedTests.includes(test.value)
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border'
                          }`}
                          onClick={() => handleTestToggle(test.value)}
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                            selectedTests.includes(test.value)
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}>
                            {selectedTests.includes(test.value) && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            {test.icon}
                            <span className="text-sm">{test.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Tests Summary */}
              {selectedTests.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">
                        {selectedTests.length} test(s) selected
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllTests}
                      className="text-green-700 hover:text-green-900 hover:bg-green-100"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTests.map(test => {
                      const Icon = testIcons[test as keyof typeof testIcons]
                      return (
                        <Badge 
                          key={test} 
                          variant="secondary" 
                          className={`gap-1 ${activeTestTab === test ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => setActiveTestTab(test)}
                        >
                          {Icon}
                          {test.replace('_', ' ')}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTestToggle(test)
                            }}
                            className="ml-1 hover:text-destructive"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Forms */}
        {selectedTests.length > 0 && (
          <TestFormWrapper
            selectedTests={selectedTests}
            activeTestTab={activeTestTab}
            testFormData={testFormData}
            patientName={selectedAppointmentDetails?.patient_name}
            onTestRemove={handleTestToggle}
            onTabChange={setActiveTestTab}
            onTestDataChange={handleTestDataChange}
          />
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTests.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>{selectedTests.filter(t => getCompletionStatus(t).hasData).length} with data</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>{selectedTests.filter(t => getCompletionStatus(t).hasFindings).length} with findings</span>
                </div>
              </div>
            )}
          </div>
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
              disabled={loading || selectedTests.length === 0}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving {selectedTests.length} Tests...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save All Tests ({selectedTests.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}