import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository } from "@/lib/repositories"
import { FileText, Download } from "lucide-react"

export async function EmployerCertificatesTable() {
  const { databases } = createServerClient()
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  // Get employer for this user
  const employerRepo = getEmployerRepository()
  const employer = user.role === "employer" && user.id ? await employerRepo.findByPortalUserId(user.id) : null

  if (!employer) {
    return <div>No employer data found</div>
  }

  // Get employees for this employer
  const employeesResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
    Query.equal("employer_id", employer.id),
  ])
  const employeeIds = employeesResult.documents.map((p: any) => p.$id)

  if (employeeIds.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No certificates found for your employees
        </CardContent>
      </Card>
    )
  }

  // Get certificates for these employees
  const certificatesResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
    Query.equal("clinic_id", employer.clinic_id),
    Query.orderDesc("issue_date"),
    Query.limit(100),
  ])

  // Filter for this employer's employees only
  const certificates = certificatesResult.documents.filter((cert: any) => employeeIds.includes(cert.patient_id))

  // Get patient details for each certificate
  const certificatesWithPatients = await Promise.all(
    certificates.map(async (cert: any) => {
      const patient = await databases
        .getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, cert.patient_id)
        .catch(() => null)
      return { ...cert, patient }
    }),
  )

  const typeColors: Record<string, string> = {
    fit_to_work: "bg-green-500/10 text-green-700 dark:text-green-400",
    fit_with_restrictions: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    unfit_to_work: "bg-red-500/10 text-red-700 dark:text-red-400",
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Certificate No.</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Type</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Issue Date</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Valid Until</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificatesWithPatients && certificatesWithPatients.length > 0 ? (
                certificatesWithPatients.map((cert: any) => (
                  <tr key={cert.$id} className="border-b last:border-0">
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cert.certificate_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {cert.patient?.first_name} {cert.patient?.last_name}
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <Badge variant="outline" className={typeColors[cert.certificate_type]}>
                        {cert.certificate_type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-4 text-sm md:table-cell">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>
                    <td className="hidden px-4 py-4 text-sm sm:table-cell">
                      {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No certificates found for your employees
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
