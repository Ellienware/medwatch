import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getNotificationRepository } from "@/lib/repositories"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Unwrap params (Next.js 14+ uses Promise for params)
    const { id } = await Promise.resolve(params)
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if auth_user_id exists
    if (!user.auth_user_id) {
      return NextResponse.json({ 
        error: "User authentication ID not found" 
      }, { status: 400 })
    }

    const notificationId = id
    const notificationRepo = getNotificationRepository()
    
    // Get the notification first to verify ownership
    const notification = await notificationRepo.findById(notificationId)
    
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Check if user owns this notification
    if (notification.user_id !== user.auth_user_id) {
      return NextResponse.json({ error: "Unauthorized to access this notification" }, { status: 403 })
    }

    await notificationRepo.markAsRead(notificationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}