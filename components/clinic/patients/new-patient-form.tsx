// components/patient/new-patient-form.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createPatient } from "@/lib/actions/patient-actions"
import { getActiveEmployers } from "@/lib/actions/employer-actions"
import { useToast } from "@/hooks/use-toast"

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

  // Fetch employers from server action
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
            description: result.error || "Could not load employer list. Using default options.",
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
    })

    setLoading(false)

    if (result.success) {
      toast({
        title: "Patient registered",
        description: "The patient has been successfully registered.",
      })
      router.push("/clinic/patients")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to register patient.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input id="first_name" name="first_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input id="last_name" name="last_name" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="id_number">
                  ID Number <span className="text-destructive">*</span>
                </Label>
                <Input id="id_number" name="id_number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input id="date_of_birth" name="date_of_birth" type="date" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                  </SelectContent>
                </Select>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
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
                  {employers.length > 0 ? (
                    employers.map((employer) => (
                      <SelectItem key={employer.id} value={employer.id}>
                        {employer.company_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-employers" disabled>
                      No active employers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {loadingEmployers ? null : employers.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No active employers found. You can add employers in the Employers section.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input id="employee_number" name="employee_number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input id="job_title" name="job_title" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea id="allergies" name="allergies" rows={2} placeholder="List any known allergies" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chronic_conditions">Chronic Conditions</Label>
              <Textarea
                id="chronic_conditions"
                name="chronic_conditions"
                rows={2}
                placeholder="List any chronic conditions"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input id="emergency_contact_name" name="emergency_contact_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Register Patient"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}