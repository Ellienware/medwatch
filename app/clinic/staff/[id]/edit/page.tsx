// app/clinic/staff/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Building2,
  Shield
} from "lucide-react"

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  branch_id: string | null
  branch_name?: string
  professional_registration_number: string | null
  specialization: string | null
  phone: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

interface Branch {
  id: string
  name: string
  code: string
}

export default function EditStaffPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "receptionist",
    branch_id: "none",
    professional_registration_number: "",
    specialization: "",
    phone: "",
    is_active: true,
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load branches
      const branchesResponse = await fetch("/api/branches")
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json()
        setBranches(branchesData.branches || [])
      }

      // Load staff details
      const staffResponse = await fetch(`/api/staff/${params.id}`)
      if (staffResponse.ok) {
        const data = await staffResponse.json()
        const staff = data.staff
        
        setFormData({
          full_name: staff.full_name || "",
          email: staff.email || "",
          role: staff.role || "receptionist",
          branch_id: staff.branch_id || "none",
          professional_registration_number: staff.professional_registration_number || "",
          specialization: staff.specialization || "",
          phone: staff.phone || "",
          is_active: staff.is_active || true,
          notes: "",
        })
      } else {
        setError("Failed to load staff details")
      }
    } catch (error) {
      setError("Failed to load data")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Prepare data for API - convert "none" to null for branch_id
      const submitData = {
        ...formData,
        branch_id: formData.branch_id === "none" ? null : formData.branch_id
      }

      const response = await fetch(`/api/staff/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Staff member updated successfully")
        setTimeout(() => {
          router.push(`/clinic/staff/${params.id}`)
        }, 1500)
      } else {
        setError(data.error || "Failed to update staff member")
      }
    } catch (error) {
      setError("Failed to update staff member")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/clinic/staff/${params.id}`)}
        className="-ml-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Details
      </Button>

      <h1 className="text-3xl font-bold">Edit Staff Member</h1>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Personal Information Section */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Personal Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch Assignment</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific branch</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role & Status Section */}
            <div className="flex items-center gap-3 mt-8 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Role & Status</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Account Status</Label>
                <div className="flex items-center gap-3 p-2 border rounded-md">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {formData.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            {/* Professional Information (for doctors) */}
            {formData.role === "doctor" && (
              <>
                <div className="flex items-center gap-3 mt-8 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-lg font-semibold">Professional Information</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="professional_registration_number">Registration Number</Label>
                    <Input
                      id="professional_registration_number"
                      value={formData.professional_registration_number}
                      onChange={(e) => setFormData({ ...formData, professional_registration_number: e.target.value })}
                      placeholder="HPCSA/MBChB Number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g., Occupational Health"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this staff member..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/clinic/staff/${params.id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/clinic/staff")}
              disabled={saving}
              className="ml-auto"
            >
              Back to Staff List
            </Button>
          </div>
        </form>
      </Card>

      {/* Permissions Info Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Role Permissions</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Clinic Admin:</strong> Full system access, manage staff, configure settings</p>
          <p><strong>Doctor:</strong> Review test results, issue certificates, complete examinations</p>
          <p><strong>Nurse:</strong> Conduct tests, record results, update appointment status</p>
          <p><strong>Receptionist:</strong> Schedule appointments, check-in patients, print certificates</p>
        </div>
      </Card>
    </div>
  )
}
