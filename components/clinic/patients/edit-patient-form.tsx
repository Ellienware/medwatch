"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Shield, Lock } from "lucide-react"
import type { Patient } from "@/lib/types/database"
import { updatePatient } from "@/lib/actions/patient-actions"

interface EditPatientFormProps {
  patient: Patient
}

// Define the form data type
interface FormData {
  first_name: string
  last_name: string
  id_number: string
  passport_number: string
  date_of_birth: string
  gender: string
  email: string
  phone: string
  address: string
  blood_type: string
  allergies: string
  chronic_conditions: string
  medical_history: string
  current_medications: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  employee_number: string
  job_title: string
  department: string
  notes: string
  is_active: boolean
  consent_given: boolean
}

export function EditPatientForm({ patient }: EditPatientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize form data with safe defaults using optional chaining
  const [formData, setFormData] = useState<FormData>({
    first_name: patient.first_name || "",
    last_name: patient.last_name || "",
    id_number: patient.id_number || "",
    passport_number: patient.passport_number || "",
    date_of_birth: patient.date_of_birth || "",
    gender: patient.gender || "",
    email: patient.email || "",
    phone: patient.phone || "",
    address: patient.address || "",
    blood_type: patient.blood_type || "",
    allergies: patient.allergies || "",
    chronic_conditions: patient.chronic_conditions || "",
    medical_history: patient.medical_history || "", // Now these properties exist
    current_medications: patient.current_medications || "", // Now these properties exist
    emergency_contact_name: patient.emergency_contact_name || "",
    emergency_contact_phone: patient.emergency_contact_phone || "",
    emergency_contact_relationship: patient.emergency_contact_relationship || "", // Now these properties exist
    employee_number: patient.employee_number || "",
    job_title: patient.job_title || "",
    department: patient.department || "",
    notes: patient.notes || "",
    is_active: patient.is_active ?? true,
    consent_given: patient.consent_given || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updatePatient(patient.id, formData)
      
      if (result.success) {
        router.push(`/clinic/patients/${patient.id}`)
        router.refresh()
      } else {
        alert(`Failed to update patient: ${result.error}`)
      }
    } catch (error: any) {
      console.error("Error updating patient:", error)
      alert(`Error updating patient: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name as keyof FormData]: value }))
  }

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Fix for the checkbox handler - specify correct type
  const handleCheckboxChange = (name: keyof FormData, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Secure Update</p>
            <p className="text-sm text-blue-700">
              Changes to sensitive fields will be encrypted using AES-256. 
              Field access is controlled by role-based permissions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Personal Information
            <Lock className="h-4 w-4 text-muted-foreground" />
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="first_name" className="flex items-center gap-1">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name" className="flex items-center gap-1">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number" className="flex items-center gap-1">
              ID Number <span className="text-destructive">*</span>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="id_number"
              name="id_number"
              value={formData.id_number}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">Encrypted using AES-256</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passport_number" className="flex items-center gap-1">
              Passport Number
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="passport_number"
              name="passport_number"
              value={formData.passport_number}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
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

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Contact Information
            <Lock className="h-4 w-4 text-muted-foreground" />
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              Email
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1">
              Phone
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              Address
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blood_type">Blood Type</Label>
            <Select
              value={formData.blood_type}
              onValueChange={(value) => handleSelectChange("blood_type", value)}
            >
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
        </div>
      </div>

      {/* Medical Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          Medical Information
          <span className="text-xs text-muted-foreground font-normal ml-2">(Doctors/Nurses Only)</span>
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="allergies" className="flex items-center gap-1">
            Allergies
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            rows={2}
            placeholder="List any allergies..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chronic_conditions" className="flex items-center gap-1">
            Chronic Conditions
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Textarea
            id="chronic_conditions"
            name="chronic_conditions"
            value={formData.chronic_conditions}
            onChange={handleChange}
            rows={2}
            placeholder="List any chronic conditions..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medical_history" className="flex items-center gap-1">
            Medical History
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Textarea
            id="medical_history"
            name="medical_history"
            value={formData.medical_history}
            onChange={handleChange}
            rows={3}
            placeholder="Previous medical conditions, surgeries, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_medications" className="flex items-center gap-1">
            Current Medications
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Textarea
            id="current_medications"
            name="current_medications"
            value={formData.current_medications}
            onChange={handleChange}
            rows={2}
            placeholder="List current medications and dosages"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Emergency Contact
          <Lock className="h-4 w-4 text-muted-foreground" />
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name" className="flex items-center gap-1">
              Name
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone" className="flex items-center gap-1">
              Phone
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
            <Select
              value={formData.emergency_contact_relationship}
              onValueChange={(value) => handleSelectChange("emergency_contact_relationship", value)}
            >
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
      </div>

      {/* Employment Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Employment Information</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee_number">Employee Number</Label>
            <Input
              id="employee_number"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Notes</h3>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional information about the patient"
          />
        </div>
      </div>

      {/* Status & Consent */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              handleCheckboxChange("is_active", checked as boolean)
            }
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Patient is active
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="consent_given"
            checked={formData.consent_given}
            onCheckedChange={(checked) =>
              handleCheckboxChange("consent_given", checked as boolean)
            }
          />
          <Label htmlFor="consent_given" className="cursor-pointer">
            Consent for treatment given
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clinic/patients/${patient.id}`)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Patient...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Update Patient Securely
            </>
          )}
        </Button>
      </div>
    </form>
  )
}