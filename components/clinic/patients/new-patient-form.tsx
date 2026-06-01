"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getActiveEmployers } from "@/lib/actions/employer-actions"
import { createPatient } from "@/lib/actions/patient-actions"

interface Employer {
  id: string
  company_name: string
}

export function NewPatientForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingEmployers, setLoadingEmployers] = useState(true)
  const [employers, setEmployers] = useState<Employer[]>([])

  useEffect(() => {
    async function fetchEmployers() {
      try {
        setLoadingEmployers(true)
        const result = await getActiveEmployers()
        
        if (result.success) {
          setEmployers(result.data || [])
        } else {
          toast({
            title: "Warning",
            description: result.error || "Could not load employer list.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to fetch employers:", error)
        toast({
          title: "Error",
          description: "Failed to load employer list.",
          variant: "destructive",
        })
      } finally {
        setLoadingEmployers(false)
      }
    }

    fetchEmployers()
  }, [toast])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    const result = await createPatient({
      first_name: data.first_name as string,
      last_name: data.last_name as string,
      id_number: data.id_number as string,
      passport_number: (data.passport_number as string) || null,
      date_of_birth: data.date_of_birth as string,
      gender: (data.gender as string) || null,
      blood_type: (data.blood_type as string) || null,
      email: (data.email as string) || null,
      phone: (data.phone as string) || null,
      address: (data.address as string) || null,
      employer_id: data.employer_id === "none" ? null : (data.employer_id as string) || null,
      employee_number: (data.employee_number as string) || null,
      job_title: (data.job_title as string) || null,
      department: (data.department as string) || null,
      allergies: (data.allergies as string) || null,
      chronic_conditions: (data.chronic_conditions as string) || null,
      emergency_contact_name: (data.emergency_contact_name as string) || null,
      emergency_contact_phone: (data.emergency_contact_phone as string) || null,
      emergency_contact_relationship: (data.emergency_contact_relationship as string) || null,
      medical_history: (data.medical_history as string) || null,
      current_medications: (data.current_medications as string) || null,
      notes: (data.notes as string) || null,
    })

    setLoading(false)

    if (result.success) {
      toast({
        title: "Patient registered securely",
        description: result.message || "Patient information has been encrypted and stored.",
        duration: 5000,
      })
      router.push("/clinic/patients")
      router.refresh()
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "Failed to register patient.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Personal Information
            <span className="text-xs text-muted-foreground font-normal ml-2">(AES-256 Encrypted)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-1">
                First Name <span className="text-destructive">*</span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="flex items-center gap-1">
                Last Name <span className="text-destructive">*</span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_number" className="flex items-center gap-1">
                ID Number <span className="text-destructive">*</span>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="id_number" name="id_number" required />
              <p className="text-xs text-muted-foreground">Will be encrypted using AES-256</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport_number" className="flex items-center gap-1">
                Passport Number
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="passport_number" name="passport_number" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender">
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blood_type">Blood Type</Label>
            <Select name="blood_type">
              <SelectTrigger>
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Contact Information
            <span className="text-xs text-muted-foreground font-normal ml-2">(Encrypted Fields)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                Email
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                Phone Number
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              Address
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Textarea id="address" name="address" rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employer_id">Employer</Label>
            <Select name="employer_id" disabled={loadingEmployers}>
              <SelectTrigger>
                {loadingEmployers ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading employers...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select employer (optional)" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Individual / No Employer</SelectItem>
                {employers.map((employer) => (
                  <SelectItem key={employer.id} value={employer.id}>
                    {employer.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number</Label>
              <Input id="employee_number" name="employee_number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Medical Information
            <span className="text-xs text-muted-foreground font-normal ml-2">(Doctors/Nurses Only)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medical_history" className="flex items-center gap-1">
              Medical History
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Textarea id="medical_history" name="medical_history" rows={3} placeholder="Previous medical conditions, surgeries, etc." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_medications" className="flex items-center gap-1">
              Current Medications
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Textarea id="current_medications" name="current_medications" rows={2} placeholder="List current medications and dosages" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="allergies" className="flex items-center gap-1">
                Allergies
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Textarea id="allergies" name="allergies" rows={2} placeholder="List any known allergies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chronic_conditions" className="flex items-center gap-1">
                Chronic Conditions
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Textarea id="chronic_conditions" name="chronic_conditions" rows={2} placeholder="List any chronic conditions" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Emergency Contact
            <span className="text-xs text-muted-foreground font-normal ml-2">(Encrypted Fields)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name" className="flex items-center gap-1">
                Name
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone" className="flex items-center gap-1">
                Phone
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Select name="emergency_contact_relationship">
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Any additional information about the patient" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting and Saving...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Register Patient Securely
            </>
          )}
        </Button>
      </div>
    </form>
  )
}