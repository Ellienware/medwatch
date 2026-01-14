import { NotificationsList } from "@/components/notifications/notifications-list"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Notifications</h1>
        <p className="text-muted-foreground">Stay updated with your clinic's latest activities</p>
      </div>

      <NotificationsList />
    </div>
  )
}
