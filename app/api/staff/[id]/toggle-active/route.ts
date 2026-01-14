import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getStaffRepository } from "@/lib/repositories"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Correct syntax
) {
  try {
    // FIX: Await params and destructure
    const { id } = await params
    const staffId = id
    
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is clinic admin
    if (user.role !== "clinic_admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Only clinic admins can modify staff" }, { status: 403 })
    }

    const body = await request.json()
    const { isActive } = body
    const staffRepo = getStaffRepository()

    // Get the staff member
    const staff = await staffRepo.findById(staffId, { skipCache: true })
    if (!staff || staff.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Cannot deactivate yourself
    if (staff.id === user.id) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 })
    }

    // Update staff status
    const updatedStaff = await staffRepo.update(staffId, {
      is_active: isActive,
    })

    return NextResponse.json({ 
      staff: updatedStaff,
      message: `Staff member ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error("Toggle staff active error:", error)
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 })
  }
}