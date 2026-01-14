import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { ClinicRepository } from "@/lib/repositories"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { settings } = await request.json()
    if (!settings) {
      return NextResponse.json({ error: "Settings are required" }, { status: 400 })
    }

    const clinicRepo = new ClinicRepository()
    await clinicRepo.update(user.clinic_id, { settings } as any)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating clinic settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
