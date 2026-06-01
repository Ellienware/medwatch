// app/clinic/staff/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  ArrowLeft, 
  UserPlus, 
  User, 
  Shield, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Edit2
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

export default function StaffManagementPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [newStaff, setNewStaff] = useState({
    full_name: "",
    email: "",
    role: "receptionist",
    branch_id: "none",
    professional_registration_number: "",
    specialization: "",
    phone: "",
    send_invitation: true,
  })

  // Load staff and branches
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [staffResponse, branchesResponse] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/branches"),
      ])

      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        setStaffMembers(staffData.staff)
      } else {
        setError("Failed to load staff members")
      }

      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json()
        setBranches(branchesData.branches)
      }
    } catch (error) {
      setError("Failed to load data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      clinic_admin: { variant: "default", label: "Clinic Admin" },
      doctor: { variant: "secondary", label: "Doctor" },
      nurse: { variant: "secondary", label: "Nurse" },
      receptionist: { variant: "outline", label: "Receptionist" },
      employer: { variant: "outline", label: "Employer" },
    }

    const config = roleConfig[role] || { variant: "outline" as const, label: role }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  async function handleAddStaff() {
    if (!newStaff.full_name || !newStaff.email || !newStaff.role) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare data for API - convert "none" to null for branch_id
      const staffData = {
        ...newStaff,
        branch_id: newStaff.branch_id === "none" ? null : newStaff.branch_id
      }

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      })

      const data = await response.json()

      if (response.ok) {
        setStaffMembers([...staffMembers, data.staff])
        // Reset form with "none" for branch_id
        setNewStaff({
          full_name: "",
          email: "",
          role: "receptionist",
          branch_id: "none",
          professional_registration_number: "",
          specialization: "",
          phone: "",
          send_invitation: true,
        })
        setShowAddForm(false)
        setSuccess(data.message)
      } else {
        setError(data.error || "Failed to add staff member")
      }
    } catch (error) {
      setError("Failed to add staff member")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading staff members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/clinic")}
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clinic
        </Button>
        <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
        <p className="text-muted-foreground">
          Manage doctors, nurses, receptionists, and other staff members
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {staffMembers.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Staff</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {staffMembers.filter(s => s.is_active).length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {staffMembers.filter(s => s.role === "doctor").length}
              </p>
              <p className="text-sm text-muted-foreground">Doctors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {staffMembers.filter(s => s.role === "nurse").length}
              </p>
              <p className="text-sm text-muted-foreground">Nurses</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error/Success Messages */}
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

      {/* Add Staff Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Staff Members</h2>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Staff Member</h3>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Dr. John Smith"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@clinic.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch_id">Assign to Branch</Label>
                <Select
                  value={newStaff.branch_id}
                  onValueChange={(value) => setNewStaff({ ...newStaff, branch_id: value })}
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

            {/* Doctor-specific fields */}
            {newStaff.role === "doctor" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="professional_registration_number">Registration Number</Label>
                  <Input
                    id="professional_registration_number"
                    placeholder="HPCSA/MBChB Number"
                    value={newStaff.professional_registration_number}
                    onChange={(e) => setNewStaff({ ...newStaff, professional_registration_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Occupational Health"
                    value={newStaff.specialization}
                    onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="011 123 4567"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newStaff.send_invitation}
                onCheckedChange={(checked) => setNewStaff({ ...newStaff, send_invitation: checked })}
              />
              <Label htmlFor="send-invitation">Send invitation email</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddStaff}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff Member
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  // Reset form with "none" for branch_id
                  setNewStaff({
                    full_name: "",
                    email: "",
                    role: "receptionist",
                    branch_id: "none",
                    professional_registration_number: "",
                    specialization: "",
                    phone: "",
                    send_invitation: true,
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Staff List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left text-sm font-semibold">Staff Member</th>
                <th className="p-4 text-left text-sm font-semibold">Role</th>
                <th className="p-4 text-left text-sm font-semibold">Branch</th>
                <th className="p-4 text-left text-sm font-semibold">Status</th>
                <th className="p-4 text-left text-sm font-semibold">Last Login</th>
                <th className="p-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <User className="w-12 h-12 mb-4 opacity-50" />
                      <p>No staff members found</p>
                      <p className="text-sm">Add your first staff member to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                staffMembers.map((staff) => (
                  <tr key={staff.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{staff.full_name}</p>
                        <p className="text-sm text-muted-foreground">{staff.email}</p>
                        {staff.phone && (
                          <p className="text-xs text-muted-foreground">{staff.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(staff.role)}
                        {staff.role === "doctor" && staff.professional_registration_number && (
                          <p className="text-xs text-muted-foreground">
                            {staff.professional_registration_number}
                          </p>
                        )}
                        {staff.specialization && (
                          <p className="text-xs text-muted-foreground">
                            {staff.specialization}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {staff.branch_name ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{staff.branch_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">All branches</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {staff.is_active ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-sm">Inactive</span>
                          </>
                        )}
                      </div>
                      {staff.last_login && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(staff.created_at).toLocaleDateString("en-ZA")}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      {staff.last_login ? (
                        <p className="text-sm">
                          {new Date(staff.last_login).toLocaleDateString("en-ZA")}
                        </p>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Invitation sent</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/clinic/staff/${staff.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role Permissions Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Role Permissions Summary</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium">Clinic Admin</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Full system access</li>
              <li>• Manage all staff</li>
              <li>• View all reports</li>
              <li>• Configure settings</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Doctor</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Review test results</li>
              <li>• Issue certificates</li>
              <li>• Complete examinations</li>
              <li>• View patient history</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Nurse</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Conduct clinical tests</li>
              <li>• Record test results</li>
              <li>• Update appointment status</li>
              <li>• Take patient vitals</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-500" />
              <span className="font-medium">Receptionist</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Schedule appointments</li>
              <li>• Check-in patients</li>
              <li>• Manage registrations</li>
              <li>• Print certificates</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
