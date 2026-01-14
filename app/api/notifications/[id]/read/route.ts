import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getNotificationRepository } from "@/lib/repositories"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params // Unwrap the params Promise
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notificationId = id
    const notificationRepo = getNotificationRepository()
    
    // Get the notification first to verify ownership
    const notification = await notificationRepo.findById(notificationId)
    if (!notification || notification.user_id !== user.auth_user_id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await notificationRepo.markAsRead(notificationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}