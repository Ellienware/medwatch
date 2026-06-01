// app/api/clinic-id/route.ts
import { getCurrentUser } from "@/lib/auth/actions"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      clinicId: user.clinic_id
    })
  } catch (error) {
    console.error("Error getting clinic ID:", error)
    return NextResponse.json(
      { error: "Failed to get clinic ID" },
      { status: 500 }
    )
  }
}
