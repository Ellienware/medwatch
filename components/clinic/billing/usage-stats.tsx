// components/clinic/billing/usage-stats.tsx
import { Activity, Users, FileText, Award } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/actions"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { createServerClient } from "@/lib/appwrite/server-client"
import { Query } from "appwrite"

async function getUsageStats() {
  const user = await getCurrentUser()
  if (!user?.clinic_id) {
    return { patients: 0, appointments: 0, tests: 0, certificates: 0 }
  }

  const { databases } = createServerClient()

  try {
    const [patients, appointments, tests, certificates] = await Promise.all([
      databases
        .listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.PATIENTS,
          [Query.equal("clinic_id", user.clinic_id)]
        )
        .then((r) => r.total)
        .catch((error) => {
          console.error("Error fetching patients:", error)
          return 0
        }),
      databases
        .listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.APPOINTMENTS,
          [Query.equal("clinic_id", user.clinic_id)]
        )
        .then((r) => r.total)
        .catch((error) => {
          console.error("Error fetching appointments:", error)
          return 0
        }),
      databases
        .listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.CLINICAL_TESTS,
          [Query.equal("clinic_id", user.clinic_id)]
        )
        .then((r) => r.total)
        .catch((error) => {
          console.error("Error fetching clinical tests:", error)
          return 0
        }),
      databases
        .listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.CERTIFICATES,
          [Query.equal("clinic_id", user.clinic_id)]
        )
        .then((r) => r.total)
        .catch((error) => {
          console.error("Error fetching certificates:", error)
          return 0
        }),
    ])

    return { patients, appointments, tests, certificates }
  } catch (error) {
    console.error("Error in getUsageStats:", error)
    return { patients: 0, appointments: 0, tests: 0, certificates: 0 }
  }
}

export async function UsageStats() {
  const stats = await getUsageStats()

  const items = [
    { label: "Patients Registered", value: stats.patients, icon: Users },
    { label: "Appointments", value: stats.appointments, icon: Activity },
    { label: "Tests Performed", value: stats.tests, icon: FileText },
    { label: "Certificates Issued", value: stats.certificates, icon: Award },
  ]

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <span className="text-2xl font-bold">{item.value}</span>
          </div>
        )
      })}

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">All features included in your subscription</p>
      </div>
    </div>
  )
}