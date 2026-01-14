// app/api/notifications/mark-all-read/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getNotificationRepository } from "@/lib/repositories"

export async function POST(request: NextRequest) {
  try {
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

    const notificationRepo = getNotificationRepository()
    
    // Now auth_user_id is guaranteed to be a string
    await notificationRepo.markAllAsRead(user.auth_user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 })
  }
}
