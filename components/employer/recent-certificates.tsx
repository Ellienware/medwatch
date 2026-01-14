import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { serverDatabases } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository } from "@/lib/repositories"
import { FileText, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

export async function RecentCertificates() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) {
    return null
  }

  // Get employer for this user
  const employerRepo = getEmployerRepository()
  const employer = user.role === "employer" && user.id ? await employerRepo.findByPortalUserId(user.id) : null

  if (!employer) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Certificates</CardTitle>
          <CardDescription>No employer data found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Get employees for this employer
  const employeesResult = await serverDatabases.listDocuments(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.PATIENTS,
    [Query.equal("employer_id", employer.id)]
  )
  const employeeIds = employeesResult.documents.map((p: any) => p.$id)

  if (employeeIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Certificates</CardTitle>
          <CardDescription>No employees found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Get recent certificates
  const certificatesResult = await serverDatabases.listDocuments(
    APPWRITE_DATABASE_ID,
    COLLECTIONS.CERTIFICATES,
    [
      Query.equal("clinic_id", employer.clinic_id),
      Query.orderDesc("issue_date"),
      Query.limit(3),
    ]
  )

  // Filter for this employer's employees only
  const certificates = certificatesResult.documents.filter((cert: any) => 
    employeeIds.includes(cert.patient_id)
  )

  // Get patient details for certificates
  const certificatesWithPatients = await Promise.all(
    certificates.map(async (cert: any) => {
      try {
        const patient = await serverDatabases.getDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.PATIENTS,
          cert.patient_id
        )
        return { ...cert, patient }
      } catch {
        return { ...cert, patient: null }
      }
    })
  )

  const typeColors: Record<string, string> = {
    fit_to_work: "bg-green-500/10 text-green-700 dark:text-green-400",
    fit_with_restrictions: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    unfit_to_work: "bg-red-500/10 text-red-700 dark:text-red-400",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Certificates</CardTitle>
          <CardDescription>Latest medical fitness certificates</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/employer/certificates">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certificatesWithPatients && certificatesWithPatients.length > 0 ? (
            certificatesWithPatients.map((cert: any) => (
              <div key={cert.$id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {cert.patient?.first_name} {cert.patient?.last_name || "Unknown Employee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`hidden sm:inline-flex ${typeColors[cert.certificate_type] || ""}`}
                  >
                    {cert.certificate_type?.replace("_", " ") || "Unknown"}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent certificates found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
