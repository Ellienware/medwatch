// app/clinic/employers/[id]/employees/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { 
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Search,
  Download
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { EmployerExportButton } from "@/components/export/employer-export-button"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ search?: string }>
}

export default async function EmployerEmployeesPage({ params, searchParams }: PageProps) {
  const { id: employerId } = await params
  const resolvedSearchParams = await searchParams
  const { databases } = createServerClient()
  const user = await getCurrentUser()

  if (!user?.clinic_id) {
    return <div>Unauthorized</div>
  }

  // Fetch employer details
  const employer = await databases.getDocument(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.EMPLOYERS,
    employerId
  )

  // Check if employer belongs to user's clinic
  if (employer.clinic_id !== user.clinic_id) {
    return <div>Unauthorized</div>
  }

  // Build queries for patients under this employer
  const queries = [
    Query.equal("clinic_id", user.clinic_id),
    Query.equal("employer_id", employerId)
  ]

  // Add search filter
  if (resolvedSearchParams.search) {
    queries.push(
      Query.or([
        Query.search("first_name", resolvedSearchParams.search),
        Query.search("last_name", resolvedSearchParams.search),
        Query.search("id_number", resolvedSearchParams.search),
        Query.search("employee_number", resolvedSearchParams.search),
      ]),
    )
  }

  queries.push(Query.orderDesc("$createdAt"))
  queries.push(Query.limit(100))

  const patientsResult = await databases.listDocuments(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.PATIENTS,
    queries
  )

  const patients = patientsResult.documents

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/clinic/employers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Employers
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              Employees - {employer.company_name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and view employees registered under this employer
          </p>
        </div>
        
        <div className="flex items-center gap-2">
        <EmployerExportButton 
            employerId={employerId}
            employerName={employer.company_name}
            employeeCount={patients.length}
        />
        <Button asChild>
            <Link href="/clinic/patients/new">
            Add New Employee
            </Link>
        </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <User className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Calendar className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <FileText className="h-5 w-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Certificates</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Building2 className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employer Status</p>
                <p className="text-2xl font-bold">
                  <Badge variant={employer.is_active ? "default" : "secondary"}>
                    {employer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, ID, or employee number..."
                className="pl-9"
                defaultValue={resolvedSearchParams.search || ""}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees List</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient: any) => (
                  <TableRow key={patient.$id}>
                    <TableCell>
                      <div className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(patient.date_of_birth), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>{patient.id_number}</TableCell>
                    <TableCell>{patient.employee_number || "-"}</TableCell>
                    <TableCell>{patient.job_title || "-"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {patient.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{patient.email}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.last_visit 
                        ? format(new Date(patient.last_visit), "MMM d, yyyy")
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clinic/patients/${patient.$id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No employees found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                No employees have been registered under this employer yet.
              </p>
              <Button asChild>
                <Link href="/clinic/patients/new">
                  Add First Employee
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
