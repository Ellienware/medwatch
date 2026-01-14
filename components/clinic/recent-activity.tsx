import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, User, Calendar, FileText, FlaskConical, UserPlus, Settings, Building } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/actions"
import { getActivityRepository } from "@/lib/repositories"
import { formatDistanceToNow } from "date-fns"

export async function RecentActivity() {
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your clinic</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No clinic found</p>
        </CardContent>
      </Card>
    )
  }

  const activityRepo = getActivityRepository()
  const activities = await activityRepo.findByClinicId(user.clinic_id, 8)

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your clinic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear here as you use the system
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Map action types to icons and colors
  const getActivityIcon = (actionType: string) => {
    const icons: Record<string, { icon: any; color: string; bgColor: string }> = {
      patient_registered: { 
        icon: UserPlus, 
        color: "text-blue-500", 
        bgColor: "bg-blue-100 dark:bg-blue-900/30" 
      },
      appointment_created: { 
        icon: Calendar, 
        color: "text-green-500", 
        bgColor: "bg-green-100 dark:bg-green-900/30" 
      },
      appointment_completed: { 
        icon: Calendar, 
        color: "text-green-600", 
        bgColor: "bg-green-100 dark:bg-green-900/30" 
      },
      appointment_cancelled: { 
        icon: Calendar, 
        color: "text-red-500", 
        bgColor: "bg-red-100 dark:bg-red-900/30" 
      },
      certificate_issued: { 
        icon: FileText, 
        color: "text-purple-500", 
        bgColor: "bg-purple-100 dark:bg-purple-900/30" 
      },
      test_result_uploaded: { 
        icon: FlaskConical, 
        color: "text-orange-500", 
        bgColor: "bg-orange-100 dark:bg-orange-900/30" 
      },
      user_logged_in: { 
        icon: User, 
        color: "text-indigo-500", 
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30" 
      },
      user_logged_out: { 
        icon: User, 
        color: "text-gray-500", 
        bgColor: "bg-gray-100 dark:bg-gray-900/30" 
      },
      branch_created: { 
        icon: Building, 
        color: "text-cyan-500", 
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30" 
      },
      branch_updated: { 
        icon: Building, 
        color: "text-cyan-600", 
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30" 
      },
      settings_updated: { 
        icon: Settings, 
        color: "text-yellow-500", 
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30" 
      },
    }

    return icons[actionType] || { 
      icon: Activity, 
      color: "text-primary", 
      bgColor: "bg-primary/10 dark:bg-primary/20" 
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return "Some time ago"
    }
  }

  // Format action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions in your clinic
          {activities.length > 0 && (
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              ({activities.length} activities)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {activities.map((activity) => {
            const { icon: Icon, color, bgColor } = getActivityIcon(activity.action_type)
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0 border-border/50"
              >
                <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full ${bgColor}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-tight truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      by {activity.user_name}
                      {activity.user_role && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-muted">
                          {activity.user_role}
                        </span>
                      )}
                    </span>
                    {activity.entity_type && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {formatActionType(activity.entity_type)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatTimeAgo(activity.created_at)}
                </span>
              </div>
            )
          })}
        </div>
        
        {activities.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Showing {activities.length} most recent activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
