import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository } from "@/lib/repositories"

export async function EmployerStats() {
  const { databases } = createServerClient()
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  // Get employer for this user
  const employerRepo = getEmployerRepository()
  const employer = user.role === "employer" && user.id ? await employerRepo.findByPortalUserId(user.id) : null

  if (!employer) {
    return <div>No employer data found</div>
  }

  // Get total employees
  const employeesResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
    Query.equal("employer_id", employer.id),
    Query.limit(1),
  ])
  const totalEmployees = employeesResult.total

  // Get certificates for employees
  const certificatesResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
    Query.equal("clinic_id", employer.clinic_id),
    Query.limit(1000),
  ])

  // Filter certificates for this employer's employees
  const employeePatientsResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
    Query.equal("employer_id", employer.id),
  ])
  const employeeIds = new Set(employeePatientsResult.documents.map((p: any) => p.$id))

  const employerCertificates = certificatesResult.documents.filter((cert: any) => employeeIds.has(cert.patient_id))

  const fitToWork = employerCertificates.filter((cert: any) => cert.certificate_type === "fit_to_work").length
  const withRestrictions = employerCertificates.filter(
    (cert: any) => cert.certificate_type === "fit_with_restrictions",
  ).length

  // Calculate pending medicals (employees without recent certificates)
  const pendingMedicals = Math.max(0, totalEmployees - employerCertificates.length)

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees.toString(),
      description: "Active workers",
      icon: Users,
    },
    {
      title: "Fit to Work",
      value: fitToWork.toString(),
      description: `${totalEmployees > 0 ? ((fitToWork / totalEmployees) * 100).toFixed(1) : 0}% compliance`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Medicals",
      value: pendingMedicals.toString(),
      description: "Need assessment",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Restrictions",
      value: withRestrictions.toString(),
      description: "With work limitations",
      icon: AlertCircle,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.color || "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
