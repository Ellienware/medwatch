// components/employer/employees-table.tsx - UPDATED
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { serverDatabases } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { Eye } from "lucide-react"
import Link from "next/link"

interface EmployeesTableProps {
  employerId: string
}

export async function EmployeesTable({ employerId }: EmployeesTableProps) {
  // Get employees for this employer
  const employeesResult = await serverDatabases.listDocuments(
    APPWRITE_DATABASE_ID, 
    COLLECTIONS.PATIENTS, 
    [
      Query.equal("employer_id", employerId),
      Query.equal("is_active", true),
      Query.orderAsc("last_name"),
      Query.limit(100),
    ]
  )

  const employees = employeesResult.documents

  // Get latest certificate for each employee
  const employeesWithStatus = await Promise.all(
    employees.map(async (employee: any) => {
      const certificatesResult = await serverDatabases.listDocuments(
        APPWRITE_DATABASE_ID, 
        COLLECTIONS.CERTIFICATES, 
        [
          Query.equal("patient_id", employee.$id),
          Query.orderDesc("issue_date"),
          Query.limit(1),
        ]
      )

      const latestCert = certificatesResult.documents[0] || null

      return {
        ...employee,
        latestCertificate: latestCert,
        status: latestCert?.certificate_type || "pending",
      }
    }),
  )

  const statusColors: Record<string, string> = {
    fit_to_work: "bg-green-500/10 text-green-700 dark:text-green-400",
    fit_with_restrictions: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    unfit_to_work: "bg-red-500/10 text-red-700 dark:text-red-400",
    pending: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  }

  const statusLabels: Record<string, string> = {
    fit_to_work: "Fit to Work",
    fit_with_restrictions: "Fit with Restrictions",
    unfit_to_work: "Unfit to Work",
    pending: "No Certificate",
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Employee</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Department</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Job Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Last Medical</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesWithStatus && employeesWithStatus.length > 0 ? (
                employeesWithStatus.map((employee: any) => (
                  <tr key={employee.$id} className="border-b last:border-0">
                    <td className="px-4 py-4 lg:px-6">
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        {employee.employee_number && (
                          <p className="text-sm text-muted-foreground">{employee.employee_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 text-sm sm:table-cell">{employee.department || "-"}</td>
                    <td className="hidden px-4 py-4 text-sm md:table-cell">{employee.job_title || "-"}</td>
                    <td className="px-4 py-4">
                      <Badge variant="outline" className={statusColors[employee.status] || ""}>
                        {statusLabels[employee.status] || "Pending"}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-4 text-sm sm:table-cell">
                      {employee.latestCertificate?.issue_date
                        ? new Date(employee.latestCertificate.issue_date).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clinic/patients/${employee.$id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No employees found for this company
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
