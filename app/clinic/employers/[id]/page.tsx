// app/clinic/employers/[id]/page.tsx
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository, getPatientRepository } from "@/lib/repositories"
import { Building2, Mail, Phone, MapPin, Calendar, FileText, Users, Settings } from "lucide-react"
import Link from "next/link"
import { EmployeesTable } from "@/components/employer/employees-table"
import { Query } from "appwrite"
import { EmployerQuickActions } from "@/components/employer/employer-quick-actions"
import { EmployerActions } from "@/components/employer/employer-actions"

export default async function EmployerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return notFound()
  }

  const employerRepo = getEmployerRepository()
  const employer = await employerRepo.findById(id)

  if (!employer || employer.clinic_id !== user.clinic_id) {
    return notFound()
  }

  // Get employee count for this employer
  const patientsRepo = getPatientRepository()
  const employeeCount = await patientsRepo.count([
    Query.equal("employer_id", employer.id),
    Query.equal("is_active", true)
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {employer.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {employer.industry && (
                  <Badge variant="outline" className="capitalize">
                    {employer.industry}
                  </Badge>
                )}
                <Badge variant={employer.is_active ? "default" : "secondary"}>
                  {employer.is_active ? "Active" : "Inactive"}
                </Badge>
                {employer.portal_enabled && (
                  <Badge variant="secondary">Portal Enabled</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/clinic/employers">
              Back to Employers
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/clinic/employers/${id}/edit`}>
              Edit Employer
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Company Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Official company details and registration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </div>
                  <p>{employer.company_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Registration Number
                  </div>
                  <p>{employer.registration_number || "Not provided"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                <p className="whitespace-pre-line">{employer.address || "Not provided"}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                  <p>{employer.email}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                  <p>{employer.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Payment Terms
                  </div>
                  <p>{employer.payment_terms} days</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Billing Email
                  </div>
                  <p>{employer.billing_email || "Same as primary email"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employees Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employees ({employeeCount})
              </CardTitle>
              <CardDescription>
                All employees registered under this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeesTable employerId={employer.id} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Settings & Actions */}
        <div className="space-y-6">
{/* Portal Settings Card */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Settings className="h-5 w-5" />
      Portal Settings
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <div className="text-sm font-medium">Portal Access</div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {employer.portal_enabled ? "Enabled" : "Disabled"}
        </p>
        <Badge variant={employer.portal_enabled ? "default" : "secondary"}>
          {employer.portal_enabled ? "ACTIVE" : "INACTIVE"}
        </Badge>
      </div>
    </div>

    <div className="space-y-2">
      <div className="text-sm font-medium">Certificate Delivery</div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {employer.auto_receive_certificates ? "Auto-send enabled" : "Manual delivery"}
        </p>
        <Badge variant={employer.auto_receive_certificates ? "default" : "secondary"}>
          {employer.auto_receive_certificates ? "AUTO" : "MANUAL"}
        </Badge>
      </div>
    </div>

    <div className="space-y-2">
      <div className="text-sm font-medium">Portal User ID</div>
      <p className="text-sm text-muted-foreground break-all">
        {employer.portal_user_id || "Not assigned"}
      </p>
    </div>

    <div className="pt-4">
      <EmployerActions
        employerId={employer.id}
        employerName={employer.company_name}
        isActive={employer.is_active}
        portalEnabled={employer.portal_enabled}
        portalUserId={employer.portal_user_id}
      />
    </div>
  </CardContent>
</Card>

            {/* Quick Actions Card */}
            <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <EmployerQuickActions
                employerId={employer.id}
                employerName={employer.company_name}
                isActive={employer.is_active}
                portalEnabled={employer.portal_enabled}
                portalUserId={employer.portal_user_id}
                />
            </CardContent>
            </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(employer.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(employer.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Record ID</span>
                <span className="font-mono text-xs">{employer.id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}