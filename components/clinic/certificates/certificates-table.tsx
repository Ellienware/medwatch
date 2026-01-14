import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // Add this import
import Link from "next/link" // Add this import

import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { FileText, Pencil } from "lucide-react" // Add Pencil icon
import { DownloadCertificateButton } from "./download-certificate-button"
import { createServerClient } from "@/lib/appwrite/server-client"

interface CertificatesTableProps {
  searchParams: { search?: string; type?: string; status?: string }
}

export async function CertificatesTable({ searchParams }: CertificatesTableProps) {
  // Await the client since createServerClient is async
  const client = await createServerClient()
  const { databases } = client
  
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  // Build queries based on search params
  const queries = [Query.equal("clinic_id", user.clinic_id)]

  // Add type filter
  if (searchParams.type && searchParams.type !== "all") {
    queries.push(Query.equal("certificate_type", searchParams.type))
  }

  // Add status filter
  if (searchParams.status === "sent") {
    queries.push(Query.equal("sent_to_employer", true))
  } else if (searchParams.status === "pending") {
    queries.push(Query.equal("sent_to_employer", false))
  }

  // Add search filter
  if (searchParams.search) {
    queries.push(Query.search("certificate_number", searchParams.search))
  }

  queries.push(Query.orderDesc("$createdAt"))
  queries.push(Query.limit(50))

  const certificatesResult = await databases.listDocuments(
    APPWRITE_DATABASE_ID, 
    COLLECTIONS.CERTIFICATES, 
    queries
  )

  const certificates = certificatesResult.documents

  // Fetch patient details for each certificate
  const certificatesWithPatients = await Promise.all(
    certificates.map(async (cert: any) => {
      if (cert.patient_id) {
        try {
          const patient = await databases.getDocument(
            APPWRITE_DATABASE_ID, 
            COLLECTIONS.PATIENTS, 
            cert.patient_id
          )
          return { ...cert, patient }
        } catch (error) {
          return { ...cert, patient: null }
        }
      }
      return { ...cert, patient: null }
    }),
  )

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Certificate No.</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Patient</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Type</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Issue Date</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Status</th>
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
                      <p className="font-medium">
                        {cert.patient?.first_name} {cert.patient?.last_name}
                      </p>
                    </td>
                    <td className="hidden px-4 py-4 capitalize sm:table-cell">
                      {cert.certificate_type?.replace("_", " ") || "N/A"}
                    </td>
                    <td className="hidden px-4 py-4 text-sm md:table-cell">
                      {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <Badge variant={cert.sent_to_employer ? "default" : "secondary"}>
                        {cert.sent_to_employer ? "Sent" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-2">
                        <DownloadCertificateButton certificateId={cert.$id} />
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/clinic/certificates/${cert.$id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No certificates found
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