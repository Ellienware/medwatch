"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, Calendar, FileText, TestTube2, X, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification } from "@/lib/types/notifications"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RealtimeService } from "@/lib/realtime/realtime-service"
import { toast } from "sonner"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const unsubscribe = RealtimeService.subscribeToNotifications((response) => {
      // Refetch notifications when a new one arrives
      fetchNotifications()
    })

    // Poll as fallback every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => {
      clearInterval(interval)
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
        setUnreadCount((prev) => Math.max(0, prev - 1))
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
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })))
        setUnreadCount(0)
        toast.success("All notifications marked as read")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to mark all as read")
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast.error("Failed to mark all as read")
    } finally {
      setIsLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_reminder":
      case "appointment_scheduled":
      case "appointment_confirmed":
        return <Calendar className="h-4 w-4 text-blue-500" />
      case "appointment_cancelled":
      case "appointment_deleted":
        return <X className="h-4 w-4 text-red-500" />
      case "appointment_updated":
      case "appointment_rescheduled":
        return <Calendar className="h-4 w-4 text-orange-500" />
      case "test_result_ready":
        return <TestTube2 className="h-4 w-4 text-purple-500" />
      case "certificate_issued":
      case "certificate_sent":
        return <FileText className="h-4 w-4 text-green-500" />
      case "payment_received":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "payment_due":
        return <CreditCard className="h-4 w-4 text-orange-500" />
      case "system_alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "patient_checked_in":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case "staff_assigned":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "appointment_no_show":
        return <X className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-l-red-500"
      case "high":
        return "border-l-4 border-l-orange-500"
      case "medium":
        return "border-l-4 border-l-blue-500"
      case "low":
        return "border-l-4 border-l-gray-500"
      default:
        return ""
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between px-2 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="h-auto p-1 text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3",
                  !notification.read && "bg-muted/50",
                  getPriorityColor(notification.priority),
                )}
                asChild
              >
                <Link 
                  href={notification.link || "#"} 
                  onClick={(e) => {
                    if (!notification.read) {
                      e.preventDefault()
                      markAsRead(notification.id)
                      if (notification.link && notification.link !== "#") {
                        window.location.href = notification.link
                      }
                    }
                  }}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <p className="text-sm font-medium">{notification.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Link href="/clinic/notifications" className="text-xs text-primary hover:underline">
                View all notifications
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}