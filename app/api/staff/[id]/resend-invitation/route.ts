import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getStaffRepository, getClinicRepository } from "@/lib/repositories"
import { emailService } from "@/lib/email/email-service"
import { generatePassword } from "@/lib/utils/password"
import { createAppwriteAccount } from "@/lib/auth/appwrite-auth"

export async function POST(
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
      return NextResponse.json({ error: "Only clinic admins can resend invitations" }, { status: 403 })
    }

    const staffRepo = getStaffRepository()
    const clinicRepo = getClinicRepository()

    // Get the staff member
    const staff = await staffRepo.findById(staffId, { skipCache: true })
    if (!staff || staff.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Get clinic name
    let clinicName = "Your Clinic"
    if (user.clinic_id) {
      const clinic = await clinicRepo.findById(user.clinic_id)
      clinicName = clinic?.name || "Your Clinic"
    }

    // Generate new temporary password
    const tempPassword = generatePassword(12)
    
    let authUserId = staff.auth_user_id

    // Create or update Appwrite auth account
    if (!authUserId) {
      authUserId = await createAppwriteAccount(staff.email, tempPassword, staff.full_name)
      
      // Update staff record with auth user ID
      await staffRepo.update(staffId, {
        auth_user_id: authUserId,
      })
    }

    // Send invitation email
    await emailService.sendInvitation(staff.email, {
      recipientName: staff.full_name,
      invitedBy: user.full_name || "Clinic Admin",
      role: staff.role,
      clinicName: clinicName,
      invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`,
    })

    return NextResponse.json({
      message: "Invitation resent successfully",
    })
  } catch (error) {
    console.error("Resend invitation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend invitation" },
      { status: 500 }
    )
  }
}
