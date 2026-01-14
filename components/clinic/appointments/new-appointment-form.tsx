// components/clinic/appointments/new-appointment-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, User, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { createAppointment } from "@/lib/actions/appointment-actions"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  first_name: string
  last_name: string
  id_number: string
  email: string | null
  phone: string | null
}

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
}

export function NewAppointmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Patients state
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [patientSearchTerm, setPatientSearchTerm] = useState("")
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  
  // Branches state
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)
  const [branchSearchTerm, setBranchSearchTerm] = useState("")
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])

  // Fetch patients on component mount
  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch("/api/patients/list")
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
          setFilteredPatients(data.patients || [])
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error)
        toast({
          title: "Error",
          description: "Failed to load patients. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingPatients(false)
      }
    }

    fetchPatients()
  }, [toast])

  // Fetch branches on component mount
  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch("/api/branches")
        if (response.ok) {
          const data = await response.json()
          // Filter only active branches
          const activeBranches = data.branches?.filter((branch: any) => branch.is_active) || []
          setBranches(activeBranches)
          setFilteredBranches(activeBranches)
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error)
        toast({
          title: "Error",
          description: "Failed to load branches. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingBranches(false)
      }
    }

    fetchBranches()
  }, [toast])

  // Filter patients based on search term
  useEffect(() => {
    if (!patientSearchTerm.trim()) {
      setFilteredPatients(patients)
      return
    }

    const searchLower = patientSearchTerm.toLowerCase()
    const filtered = patients.filter(patient => 
      patient.first_name.toLowerCase().includes(searchLower) ||
      patient.last_name.toLowerCase().includes(searchLower) ||
      patient.id_number.includes(patientSearchTerm) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(patientSearchTerm)
    )
    setFilteredPatients(filtered)
  }, [patientSearchTerm, patients])

  // Filter branches based on search term
  useEffect(() => {
    if (!branchSearchTerm.trim()) {
      setFilteredBranches(branches)
      return
    }

    const searchLower = branchSearchTerm.toLowerCase()
    const filtered = branches.filter(branch => 
      branch.name.toLowerCase().includes(searchLower) ||
      branch.code.toLowerCase().includes(searchLower) ||
      branch.address?.toLowerCase().includes(searchLower)
    )
    setFilteredBranches(filtered)
  }, [branchSearchTerm, branches])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    // Extract date and time separately as your Appointment type expects them separately
    const appointmentDate = data.appointment_date as string
    const appointmentTime = data.appointment_time as string

    const result = await createAppointment({
      patient_id: data.patient_id as string,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      branch_id: data.branch_id as string,
      appointment_type: data.appointment_type as string,
      reason: (data.reason as string) || undefined,
      status: "scheduled",
    })

    setLoading(false)

    if (result.success) {
      toast({
        title: "Appointment scheduled",
        description: "The appointment has been successfully scheduled.",
      })
      router.push("/clinic/appointments")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to schedule appointment.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient_id">
              Patient <span className="text-destructive">*</span>
            </Label>
            <Select name="patient_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Search patient by name or ID..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Search input inside dropdown */}
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patients..."
                      className="pl-8"
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                {isLoadingPatients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading patients...</span>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {patientSearchTerm ? "No patients found" : "No patients available"}
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {patient.id_number} {patient.email && `• ${patient.email}`}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="appointment_date" 
                name="appointment_date" 
                type="date" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_time">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="appointment_time" 
                name="appointment_time" 
                type="time" 
                required 
                defaultValue="09:00"
              />
            </div>
          </div>

          {/* Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="branch_id">
              Branch <span className="text-destructive">*</span>
            </Label>
            <Select name="branch_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Search input inside dropdown */}
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search branches..."
                      className="pl-8"
                      value={branchSearchTerm}
                      onChange={(e) => setBranchSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                {isLoadingBranches ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Loading branches...</span>
                  </div>
                ) : filteredBranches.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {branchSearchTerm ? "No branches found" : "No branches available"}
                  </div>
                ) : (
                  filteredBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">
                            {branch.name} ({branch.code})
                          </div>
                          {branch.address && (
                            <div className="text-xs text-muted-foreground truncate">
                              {branch.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="appointment_type">
              Appointment Type <span className="text-destructive">*</span>
            </Label>
            <Select name="appointment_type" required defaultValue="routine_medical">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine_medical">Routine Medical</SelectItem>
                <SelectItem value="pre_employment">Pre-Employment</SelectItem>
                <SelectItem value="periodic">Periodic Examination</SelectItem>
                <SelectItem value="exit_medical">Exit Medical</SelectItem>
                <SelectItem value="fitness_assessment">Fitness Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea id="reason" name="reason" rows={3} placeholder="Optional notes about the appointment" />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isLoadingPatients || isLoadingBranches}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Appointment"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}