// app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getNotificationRepository } from "@/lib/repositories"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if auth_user_id exists
    if (!user.auth_user_id) {
      // Return empty notifications if no auth_user_id
      return NextResponse.json({ notifications: [] })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const notificationRepo = getNotificationRepository()
    
    // Now auth_user_id is guaranteed to be a string
    const notifications = await notificationRepo.findByUserId(user.auth_user_id, {
      unreadOnly,
      limit: 50,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
