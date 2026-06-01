// app/clinic/audit-logs/page.tsx
import { getCurrentUser } from "@/lib/auth/actions"
import { getActivityRepository } from "@/lib/repositories"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Query } from "appwrite"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; entity_id?: string; action_type?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Unauthorized access</p>
      </div>
    )
  }

  try {
    const activityRepo = getActivityRepository()
    
    // Build queries
    const queries = [
      Query.equal("clinic_id", user.clinic_id),
      Query.orderDesc("$createdAt"),
      Query.limit(100)
    ]

    if (params.entity_type) {
      queries.push(Query.equal("entity_type", params.entity_type))
    }

    if (params.entity_id) {
      queries.push(Query.equal("entity_id", params.entity_id))
    }

    if (params.action_type) {
      queries.push(Query.equal("action_type", params.action_type))
    }

    const activities = await activityRepo.find(queries)

    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and changes
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/clinic">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clinic
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter activities by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!params.entity_type ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/clinic/audit-logs">
                  All Activities
                </Link>
              </Button>
              <Button
                variant={params.entity_type === "employer" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/clinic/audit-logs?entity_type=employer">
                  Employer Activities
                </Link>
              </Button>
              <Button
                variant={params.entity_type === "patient" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/clinic/audit-logs?entity_type=patient">
                  Patient Activities
                </Link>
              </Button>
              <Button
                variant={params.entity_type === "appointment" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/clinic/audit-logs?entity_type=appointment">
                  Appointment Activities
                </Link>
              </Button>
              <Button
                variant={params.entity_type === "user" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href="/clinic/audit-logs?entity_type=user">
                  User Activities
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              {params.entity_type && params.entity_id 
                ? `Showing activities for ${params.entity_type} ${params.entity_id.substring(0, 8)}...`
                : params.entity_type
                ? `Showing ${params.entity_type} activities`
                : "Showing all recent activities"
              }
              <span className="ml-2 text-xs">({activities.length} records)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No activities found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try changing your filters or check back later
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="space-y-2 border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{activity.description}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.action_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By <span className="font-medium">{activity.user_name}</span>
                          {activity.user_role && ` (${activity.user_role})`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(activity.created_at), "MMM d, yyyy HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                    
                    {activity.entity_type && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Entity: <span className="font-medium">{activity.entity_type}</span>
                        </span>
                        {activity.entity_id && (
                          <span className="text-muted-foreground">
                            ID: <code className="text-xs">{activity.entity_id.substring(0, 8)}...</code>
                          </span>
                        )}
                      </div>
                    )}
                    
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                    
                    {/* Action buttons for specific entity types */}
                    {activity.entity_type && activity.entity_id && (
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 text-xs"
                        >
                          <Link href={`/clinic/audit-logs?entity_type=${activity.entity_type}&entity_id=${activity.entity_id}`}>
                            View all for this {activity.entity_type}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error loading audit logs:", error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-red-500">Error loading activity logs: {error instanceof Error ? error.message : "Unknown error"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/clinic">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clinic
          </Link>
        </Button>
      </div>
    )
  }
}
