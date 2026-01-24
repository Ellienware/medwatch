"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  FileText,
  TestTube2,
  X,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Loader2,
  Check,
} from "lucide-react"
import type { Notification } from "@/lib/types/notifications"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RealtimeService } from "@/lib/realtime/realtime-service"
import { toast } from "sonner"

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to load notifications")
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      toast.error("Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Set up real-time subscription
    const unsubscribe = RealtimeService.subscribeToNotifications(() => {
      fetchNotifications()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)),
        )
        toast.success("Marked as read")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to mark as read")
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
        toast.success("All notifications marked as read")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to mark all as read")
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_reminder":
      case "appointment_scheduled":
      case "appointment_confirmed":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "appointment_cancelled":
      case "appointment_deleted":
        return <X className="h-5 w-5 text-red-500" />
      case "appointment_updated":
      case "appointment_rescheduled":
        return <Calendar className="h-5 w-5 text-orange-500" />
      case "test_result_ready":
        return <TestTube2 className="h-5 w-5 text-purple-500" />
      case "certificate_issued":
      case "certificate_sent":
        return <FileText className="h-5 w-5 text-green-500" />
      case "payment_received":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "payment_due":
        return <CreditCard className="h-5 w-5 text-orange-500" />
      case "system_alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "patient_checked_in":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case "staff_assigned":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "appointment_no_show":
        return <X className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      urgent: <Badge variant="destructive">Urgent</Badge>,
      high: <Badge className="bg-orange-500">High</Badge>,
      medium: <Badge variant="secondary">Medium</Badge>,
      low: <Badge variant="outline">Low</Badge>,
    }
    return variants[priority] || variants.medium
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === "unread" ? "No unread notifications" : "You're all caught up!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className={cn(!notification.read && "bg-muted/30")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{notification.title}</h4>
                          {getPriorityBadge(notification.priority)}
                          {!notification.read && <Badge className="ml-auto">New</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(notification.created_at).toLocaleString()}</span>
                          {notification.read && notification.read_at && (
                            <span>Read {new Date(notification.read_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {notification.link && (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={notification.link}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            View Details
                          </Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
