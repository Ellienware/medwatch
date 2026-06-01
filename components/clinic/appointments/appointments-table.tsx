// components/clinic/appointments/appointments-table.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"
import { Clock, Eye, Pencil, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Stethoscope } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  checked_in: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  with_nurse: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  tests_in_progress: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  with_doctor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
  no_show: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

// Helper to get databases client
async function getDatabases() {
  const { Client, Databases } = await import("node-appwrite")
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  return new Databases(client)
}

// Update the interface to accept regular object, not Promise
interface AppointmentsTableProps {
  searchParams: { date?: string; status?: string }
}

export async function AppointmentsTable({ searchParams }: AppointmentsTableProps) {
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  const date = searchParams.date || new Date().toISOString().split("T")[0]

  try {
    const databases = await getDatabases()
    
    // Build queries based on search params
    const queries = [Query.equal("clinic_id", user.clinic_id), Query.equal("appointment_date", date)]

    // Add status filter
    if (searchParams.status && searchParams.status !== "all") {
      queries.push(Query.equal("status", searchParams.status))
    }

    queries.push(Query.orderAsc("appointment_time"))

    const appointmentsResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, queries)

    const appointments = appointmentsResult.documents

    // Fetch related patient and branch data
    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment: any) => {
        const patient = appointment.patient_id
          ? await databases
              .getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, appointment.patient_id)
              .catch(() => null)
          : null
        const branch = appointment.branch_id
          ? await databases
              .getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.BRANCHES, appointment.branch_id)
              .catch(() => null)
          : null
        return { ...appointment, patient, branch }
      }),
    )

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Patient</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Type</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsWithDetails && appointmentsWithDetails.length > 0 ? (
                  appointmentsWithDetails.map((appointment: any) => (
                    <tr key={appointment.$id} className="border-b last:border-0">
                      <td className="px-4 py-4 lg:px-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.appointment_time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium">
                            {appointment.patient?.first_name} {appointment.patient?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.patient?.phone}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 text-sm capitalize md:table-cell">
                        {appointment.appointment_type?.replace("_", " ") || "consultation"}
                      </td>
                      <td className="hidden px-4 py-4 sm:table-cell">
                        <Badge variant="outline" className={statusColors[appointment.status] || statusColors.scheduled}>
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 lg:px-6">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clinic/appointments/${appointment.$id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clinic/appointments/${appointment.$id}/edit`}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/clinic/appointments/${appointment.$id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clinic/appointments/${appointment.$id}/edit`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Appointment
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clinic/tests/record?appointment=${appointment.$id}`}>
                                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Record Test
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clinic/assessments/start?appointment=${appointment.$id}`}>
                                  <Stethoscope className="h-4 w-4 mr-2" />
                                  Start Clinical Assessment
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Cancel Appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No appointments found for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Error loading appointments. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }
}
