// app/clinic/staff/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Calendar,
  Activity,
  MailIcon,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Clock
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

export default function StaffDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [params.id])

  async function fetchStaff() {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff)
      } else {
        setError("Failed to load staff details")
      }
    } catch (error) {
      setError("Failed to load staff details")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResendInvitation() {
    if (!staff) return

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/staff/${staff.id}/resend-invitation`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Invitation resent successfully")
        // Refresh staff data
        fetchStaff()
      } else {
        setError(data.error || "Failed to resend invitation")
      }
    } catch (error) {
      setError("Failed to resend invitation")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleToggleActive() {
    if (!staff) return

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/staff/${staff.id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staff.is_active }),
      })

      const data = await response.json()

      if (response.ok) {
        setStaff({ ...staff, is_active: !staff.is_active })
        setSuccess(`Staff member ${!staff.is_active ? 'activated' : 'deactivated'} successfully`)
      } else {
        setError(data.error || "Failed to update staff status")
      }
    } catch (error) {
      setError("Failed to update staff status")
    } finally {
      setIsProcessing(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      clinic_admin: { variant: "default", label: "Clinic Admin" },
      doctor: { variant: "secondary", label: "Doctor" },
      nurse: { variant: "secondary", label: "Nurse" },
      receptionist: { variant: "outline", label: "Receptionist" },
    }

    const config = roleConfig[role] || { variant: "outline" as const, label: role }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading staff details...</p>
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/clinic/staff")}
          className="-ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Staff member not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/clinic/staff")}
            className="-ml-4 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Staff
          </Button>
          <h1 className="text-3xl font-bold">{staff.full_name}</h1>
          <p className="text-muted-foreground">Staff member details</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!staff.last_login && (
            <Button
              onClick={handleResendInvitation}
              disabled={isProcessing}
              variant="outline"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MailIcon className="w-4 h-4 mr-2" />
              )}
              Resend Invitation
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => router.push(`/clinic/staff/${staff.id}/edit`)}
            disabled={isProcessing}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              staff.is_active 
                ? "bg-green-100 text-green-600" 
                : "bg-red-100 text-red-600"
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {getRoleBadge(staff.role)}
                <Badge 
                  variant={staff.is_active ? "default" : "secondary"}
                  className={staff.is_active 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-red-100 text-red-800 hover:bg-red-100"
                  }
                >
                  {staff.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {staff.last_login 
                  ? `Last login: ${new Date(staff.last_login).toLocaleDateString("en-ZA")}`
                  : "Invitation pending"
                }
              </p>
            </div>
          </div>
          
          <Button
            variant={staff.is_active ? "outline" : "default"}
            onClick={handleToggleActive}
            disabled={isProcessing}
            className={staff.is_active 
              ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
              : "bg-green-600 hover:bg-green-700"
            }
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : staff.is_active ? (
              <XCircle className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {staff.is_active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{staff.full_name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">{staff.email}</p>
              </div>
            </div>

            {staff.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{staff.phone}</p>
                </div>
              </div>
            )}

            {staff.branch_name && (
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{staff.branch_name}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Account Information Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <div className="mt-1">{getRoleBadge(staff.role)}</div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium">
                  {new Date(staff.created_at).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {staff.last_login && (
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">
                    {new Date(staff.last_login).toLocaleDateString("en-ZA", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Professional Information (for doctors) */}
      {staff.role === "doctor" && (staff.professional_registration_number || staff.specialization) && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">Professional Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {staff.professional_registration_number && (
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-medium">{staff.professional_registration_number}</p>
              </div>
            )}
            
            {staff.specialization && (
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{staff.specialization}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Notes Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <p className="text-sm text-muted-foreground">
          {staff.last_login 
            ? "This staff member has access to the system according to their role permissions."
            : "This staff member has been invited but hasn't completed their account setup yet."
          }
        </p>
      </Card>
    </div>
  )
}
