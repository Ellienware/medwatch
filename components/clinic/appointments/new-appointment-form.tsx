"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, User, Building, X, Check, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { createAppointment } from "@/lib/actions/appointment-actions"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Patient {
  $id: string
  first_name: string
  last_name: string
  id_number?: string
  email?: string | null
  phone?: string | null
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
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false)
  const patientSearchRef = useRef<HTMLInputElement>(null)
  
  // Branches state
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)
  const [branchSearchTerm, setBranchSearchTerm] = useState("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
  const branchSearchRef = useRef<HTMLInputElement>(null)

  // Filtered patients using useMemo for performance
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patients
    
    const searchLower = patientSearchTerm.toLowerCase()
    return patients.filter(patient => {
      return (
        patient.first_name?.toLowerCase().includes(searchLower) ||
        patient.last_name?.toLowerCase().includes(searchLower) ||
        patient.id_number?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.phone?.includes(patientSearchTerm)
      )
    })
  }, [patients, patientSearchTerm])

  // Filtered branches using useMemo for performance
  const filteredBranches = useMemo(() => {
    if (!branchSearchTerm.trim()) return branches
    
    const searchLower = branchSearchTerm.toLowerCase()
    return branches.filter(branch => {
      return (
        branch.name.toLowerCase().includes(searchLower) ||
        branch.code.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower)
      )
    })
  }, [branches, branchSearchTerm])

  // Fetch patients on component mount
  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch("/api/patients/list")
        if (response.ok) {
          const data = await response.json()
          console.log("Patients API response:", data)
          setPatients(data.patients || [])
        } else {
          console.error("Failed to fetch patients:", response.status)
          toast({
            title: "Error",
            description: "Failed to load patients. Please try again.",
            variant: "destructive",
          })
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
          console.log("Branches API response:", data)
          const activeBranches = data.branches?.filter((branch: any) => branch.is_active) || []
          setBranches(activeBranches)
        } else {
          console.error("Failed to fetch branches:", response.status)
          toast({
            title: "Error",
            description: "Failed to load branches. Please try again.",
            variant: "destructive",
          })
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isPatientDropdownOpen && patientSearchRef.current) {
      setTimeout(() => {
        patientSearchRef.current?.focus()
      }, 100)
    }
  }, [isPatientDropdownOpen])

  useEffect(() => {
    if (isBranchDropdownOpen && branchSearchRef.current) {
      setTimeout(() => {
        branchSearchRef.current?.focus()
      }, 100)
    }
  }, [isBranchDropdownOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const appointmentDate = data.appointment_date as string
    const appointmentTime = data.appointment_time as string

    const result = await createAppointment({
      patient_id: selectedPatientId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      branch_id: selectedBranchId,
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

  // Get selected patient and branch for display
  const selectedPatient = patients.find(p => p.$id === selectedPatientId)
  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  // Clear patient selection
  const clearPatientSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedPatientId("")
    setPatientSearchTerm("")
  }

  // Clear branch selection
  const clearBranchSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedBranchId("")
    setBranchSearchTerm("")
  }

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    console.log("Selecting patient:", patientId)
    setSelectedPatientId(patientId)
    setIsPatientDropdownOpen(false)
    setPatientSearchTerm("")
  }

  // Handle branch selection
  const handleBranchSelect = (branchId: string) => {
    setSelectedBranchId(branchId)
    setIsBranchDropdownOpen(false)
    setBranchSearchTerm("")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-3">
            <Label htmlFor="patient_id">
              Patient <span className="text-destructive">*</span>
              {selectedPatient && (
                <span className="ml-2 text-sm text-green-600 font-normal">
                  ✓ Patient selected
                </span>
              )}
            </Label>
            
            <div className="space-y-3">
              <input type="hidden" name="patient_id" value={selectedPatientId} />
              
              {/* Custom patient selector */}
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "min-h-10"
                  )}
                  onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
                >
                  {selectedPatient ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <User className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {selectedPatient.first_name} {selectedPatient.last_name}
                          </div>
                          {selectedPatient.id_number && (
                            <div className="text-xs text-muted-foreground truncate">
                              ID: {selectedPatient.id_number}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                        <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-muted-foreground">Select a patient</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
                
                {/* Patient dropdown */}
                {isPatientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={patientSearchRef}
                          placeholder="Search patients by name, ID, or email..."
                          className="pl-9"
                          value={patientSearchTerm}
                          onChange={(e) => setPatientSearchTerm(e.target.value)}
                        />
                        {patientSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setPatientSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingPatients ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm">Loading patients...</span>
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          {patientSearchTerm ? "No patients found. Try a different search." : "No patients available"}
                        </div>
                      ) : (
                        <>
                          {patientSearchTerm && (
                            <div className="p-2 border-b bg-muted/50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
                                </span>
                                {patientSearchTerm && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setPatientSearchTerm("")}
                                  >
                                    Clear search
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {filteredPatients.map((patient) => (
                            <button
                              key={patient.$id}
                              type="button"
                              className={cn(
                                "w-full px-3 py-3 text-left hover:bg-muted/50 flex items-center gap-2",
                                selectedPatientId === patient.$id && "bg-green-50"
                              )}
                              onClick={() => handlePatientSelect(patient.$id)}
                            >
                              <User className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {patient.id_number && `ID: ${patient.id_number}`}
                                  {patient.email && ` • ${patient.email}`}
                                  {patient.phone && ` • ${patient.phone}`}
                                </div>
                              </div>
                              {selectedPatientId === patient.$id && (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                    
                    <div className="p-2 border-t">
                      <button
                        type="button"
                        onClick={() => setIsPatientDropdownOpen(false)}
                        className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedPatient && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Selected: {selectedPatient.first_name} {selectedPatient.last_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearPatientSelection}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
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
                min={new Date().toISOString().split('T')[0]}
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
          <div className="space-y-3">
            <Label htmlFor="branch_id">
              Branch <span className="text-destructive">*</span>
              {selectedBranch && (
                <span className="ml-2 text-sm text-green-600 font-normal">
                  ✓ Branch selected
                </span>
              )}
            </Label>
            
            <div className="space-y-3">
              <input type="hidden" name="branch_id" value={selectedBranchId} />
              
              {/* Custom branch selector */}
              <div className="relative">
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "min-h-10"
                  )}
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                >
                  {selectedBranch ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {selectedBranch.name} ({selectedBranch.code})
                          </div>
                          {selectedBranch.address && (
                            <div className="text-xs text-muted-foreground truncate">
                              {selectedBranch.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Check className="h-3 w-3 text-green-600" />
                        <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-muted-foreground">Select a branch</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
                
                {/* Branch dropdown */}
                {isBranchDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={branchSearchRef}
                          placeholder="Search branches by name or code..."
                          className="pl-9"
                          value={branchSearchTerm}
                          onChange={(e) => setBranchSearchTerm(e.target.value)}
                        />
                        {branchSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setBranchSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingBranches ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm">Loading branches...</span>
                        </div>
                      ) : filteredBranches.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          {branchSearchTerm ? "No branches found. Try a different search." : "No branches available"}
                        </div>
                      ) : (
                        <>
                          {branchSearchTerm && (
                            <div className="p-2 border-b bg-muted/50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''} found
                                </span>
                                {branchSearchTerm && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => setBranchSearchTerm("")}
                                  >
                                    Clear search
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {filteredBranches.map((branch) => (
                            <button
                              key={branch.id}
                              type="button"
                              className={cn(
                                "w-full px-3 py-3 text-left hover:bg-muted/50 flex items-center gap-2",
                                selectedBranchId === branch.id && "bg-green-50"
                              )}
                              onClick={() => handleBranchSelect(branch.id)}
                            >
                              <Building className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {branch.name} ({branch.code})
                                </div>
                                {branch.address && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {branch.address}
                                  </div>
                                )}
                              </div>
                              {selectedBranchId === branch.id && (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                    
                    <div className="p-2 border-t">
                      <button
                        type="button"
                        onClick={() => setIsBranchDropdownOpen(false)}
                        className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedBranch && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Selected: {selectedBranch.name} ({selectedBranch.code})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearBranchSelection}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label htmlFor="appointment_type">
              Appointment Type <span className="text-destructive">*</span>
            </Label>
            <Select name="appointment_type" required defaultValue="routine_medical">
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
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
            <Textarea 
              id="reason" 
              name="reason" 
              rows={3} 
              placeholder="Optional notes about the appointment"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || isLoadingPatients || isLoadingBranches || !selectedPatientId || !selectedBranchId}
              className={cn(
                !selectedPatientId || !selectedBranchId 
                  ? "opacity-50 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}