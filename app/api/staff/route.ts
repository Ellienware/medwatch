// app/api/staff/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getStaffRepository, getBranchRepository, getClinicRepository } from "@/lib/repositories"
import { emailService } from "@/lib/email/email-service"
import { UserRole } from "@/lib/types/database"
import { generatePassword } from "@/lib/utils/password"
import { createAppwriteAccount } from "@/lib/auth/appwrite-auth"


// GET - List staff members for clinic
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // (but with different data visibility)
    const allowedRoles = ["clinic_admin", "super_admin", "doctor", "nurse"]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const staffRepo = getStaffRepository()
    
    if (user.role === "clinic_admin" || user.role === "super_admin") {
      // Admins see all staff
      const staff = await staffRepo.findByClinicId(user.clinic_id)
      return NextResponse.json({ staff, count: staff.length })
    } else {
      // Doctors and nurses see only active staff (no sensitive info)
      const staff = await staffRepo.findByClinicId(user.clinic_id)
      
      // Filter and limit data for non-admins
      const filteredStaff = staff
        .filter(s => s.is_active)
        .map(staffMember => ({
          id: staffMember.id,
          full_name: staffMember.full_name,
          role: staffMember.role,
          branch_name: staffMember.branch_id,
          is_active: staffMember.is_active,
          // Don't include email, phone, or other sensitive info for non-admins
        }))
      
      return NextResponse.json({
        staff: filteredStaff,
        count: filteredStaff.length,
        note: "Limited view: Only active staff members are shown"
      })
    }
  } catch (error) {
    console.error("Get staff error:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    )
  }
}

// POST - Add new staff member
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is clinic admin
    if (user.role !== "clinic_admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Only clinic admins can add staff" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      full_name, 
      email, 
      role, 
      branch_id, 
      professional_registration_number, 
      specialization, 
      phone,
      send_invitation 
    } = body

    // Validate required fields
    if (!full_name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const allowedRoles: UserRole[] = ["doctor", "nurse", "receptionist", "clinic_admin"]
    if (!allowedRoles.includes(role as UserRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const staffRepo = getStaffRepository()
    const clinicRepo = getClinicRepository()

    // Check if email already exists in this clinic
    const existingStaff = await staffRepo.findByEmailAndClinic(email, user.clinic_id)
    if (existingStaff) {
      return NextResponse.json({ 
        error: `Staff member with email ${email} already exists in your clinic` 
      }, { status: 400 })
    }

    // Get clinic details
    const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    const clinicName = clinic.name
    let authUserId: string | null = null
    let invitationSent = false
    let temporaryPassword: string | null = null

    // Create Appwrite auth account if requested
    if (send_invitation) {
      try {
        // Generate temporary password
        temporaryPassword = generatePassword(10)
        
        // Create Appwrite account with temporary password
        authUserId = await createAppwriteAccount(email, temporaryPassword, full_name)
        
        // Send invitation email
        const emailResult = await emailService.sendStaffInvitation(email, {
          recipientName: full_name,
          invitedBy: user.full_name || "Clinic Admin",
          role: role,
          clinicName: clinicName,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`,
          temporaryPassword: temporaryPassword,
          email: email,
        })
        
        if (emailResult.success) {
          invitationSent = true
        } else {
          console.error("Failed to send invitation email:", emailResult.error)
        }

      } catch (error: any) {
        console.error("Failed to create auth account:", error)
        // Continue without auth account, admin can resend invitation later
      }
    }
   
    

    // Create staff record
    const newStaff = await staffRepo.create({
      clinic_id: user.clinic_id,
      branch_id: branch_id || null,
      auth_user_id: authUserId || null,
      email,
      full_name,
      role: role as UserRole,
      phone: phone || null,
      professional_registration_number: professional_registration_number || null,
      specialization: specialization || null,
      is_active: true,
      first_login_required: !!temporaryPassword,
      temporary_password_set: !!temporaryPassword,
      invitation_status: "pending" as const,
      invited_at: new Date().toISOString(),
      permissions: getDefaultPermissions(role),
    })

    return NextResponse.json({
      staff: newStaff,
      message: invitationSent 
        ? "Staff member added successfully. Invitation email sent with temporary password."
        : "Staff member added. You can send invitation from the staff list.",
    })
  } catch (error) {
    console.error("Add staff error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add staff member" },
      { status: 500 }
    )
  }
}

// Helper function to get default permissions based on role
function getDefaultPermissions(role: string): Record<string, any> {
  const permissions: Record<string, any> = {
    can_view_patients: true,
    can_view_appointments: true,
  }

  switch (role) {
    case "clinic_admin":
      permissions.can_manage_staff = true
      permissions.can_manage_settings = true
      permissions.can_view_reports = true
      permissions.can_issue_certificates = true
      permissions.can_conduct_tests = true
      break
    case "doctor":
      permissions.can_issue_certificates = true
      permissions.can_view_test_results = true
      permissions.can_complete_appointments = true
      break
    case "nurse":
      permissions.can_conduct_tests = true
      permissions.can_record_test_results = true
      permissions.can_update_appointment_status = true
      break
    case "receptionist":
      permissions.can_schedule_appointments = true
      permissions.can_check_in_patients = true
      permissions.can_register_patients = true
      permissions.can_print_certificates = true
      break
  }

  return permissions
}