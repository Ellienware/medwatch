import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, CheckCircle, Clock } from "lucide-react"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"

// Helper to get databases client
async function getDatabases() {
  const { Client, Databases } = await import("node-appwrite")
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  return new Databases(client)
}

export async function StatsGrid() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  try {
    const databases = await getDatabases()
    
    // Get today's date
    const today = new Date().toISOString().split("T")[0]

    // Fetch stats in parallel for better performance
    const [
      todayAppointments,
      totalPatients,
      completedToday,
      pendingAppointments
    ] = await Promise.all([
      databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("appointment_date", today),
      ]),
      databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("is_active", true),
      ]),
      databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("appointment_date", today),
        Query.equal("status", "completed"),
      ]),
      databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        Query.equal("clinic_id", user.clinic_id),
        Query.equal("appointment_date", today),
        Query.or([
          Query.equal("status", "scheduled"),
          Query.equal("status", "checked_in"),
          Query.equal("status", "with_nurse"),
          Query.equal("status", "tests_in_progress"),
          Query.equal("status", "with_doctor"),
        ]),
      ])
    ])

    const stats = [
      {
        title: "Today's Appointments",
        value: todayAppointments.total || 0,
        icon: Calendar,
        description: "Scheduled for today",
      },
      {
        title: "Total Patients",
        value: totalPatients.total || 0,
        icon: Users,
        description: "Active patients",
      },
      {
        title: "Completed Today",
        value: completedToday.total || 0,
        icon: CheckCircle,
        description: "Appointments done",
      },
      {
        title: "Pending",
        value: pendingAppointments.total || 0,
        icon: Clock,
        description: "In progress or waiting",
      },
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Error fetching stats:", error)
    // Return empty stats or error state
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Today's Appointments", "Total Patients", "Completed Today", "Pending"].map((title) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Data unavailable</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}