import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getStaffRepository, getBranchRepository } from "@/lib/repositories"

// GET - Get single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Correct syntax
) {
  try {
    console.log("🚀 GET /api/staff/[id] started")
    
    // FIX: Await the params and destructure
    const { id } = await params
    const staffId = id
    console.log("📌 Requested staff ID:", staffId)
    
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      console.log("❌ No user or clinic_id")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 User clinic_id:", user.clinic_id)
    
    const staffRepo = getStaffRepository()
    const branchRepo = getBranchRepository()

    console.log("🔎 Looking for staff with ID:", staffId)
    
    // Try findById with skipCache to bypass any caching issues
    let staff = await staffRepo.findById(staffId, { skipCache: true })
    
    if (staff) {
      console.log("✅ Found staff via findById:")
      console.log("   Staff clinic_id:", staff.clinic_id)
      console.log("   User clinic_id:", user.clinic_id)
      
      if (staff.clinic_id !== user.clinic_id) {
        console.log("❌ Clinic mismatch")
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
      }
    } else {
      console.log("❌ Staff not found via findById")
      
      // Try alternative: search all staff in the clinic
      const allClinicStaff = await staffRepo.findByClinicId(user.clinic_id)
      console.log(`   Found ${allClinicStaff.length} staff in clinic`)
      
      staff = allClinicStaff.find(s => s.id === staffId) || null
      
      if (!staff) {
        console.log("❌ Staff not found in clinic list either")
        return NextResponse.json({ 
          error: "Staff member not found",
          debug: {
            requestedId: staffId,
            userClinicId: user.clinic_id,
            totalStaffInClinic: allClinicStaff.length
          }
        }, { status: 404 })
      }
    }

    // Get branch name if exists
    let branch_name = null
    if (staff.branch_id) {
      try {
        const branch = await branchRepo.findById(staff.branch_id)
        branch_name = branch?.name || null
      } catch (error) {
        console.error("Failed to fetch branch:", error)
      }
    }

    // Prepare response data
    const staffData = {
      id: staff.id,
      full_name: staff.full_name,
      email: staff.email,
      role: staff.role,
      branch_id: staff.branch_id,
      branch_name: branch_name,
      professional_registration_number: staff.professional_registration_number,
      specialization: staff.specialization,
      phone: staff.phone,
      is_active: staff.is_active,
      last_login: staff.last_login,
      created_at: staff.created_at,
    }

    console.log("✅ Success! Returning staff data for:", staffData.full_name)
    
    return NextResponse.json({ 
      staff: staffData
    })
  } catch (error: any) {
    console.error("❌ Error in single staff API:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json({ 
      error: "Failed to fetch staff details",
      debug: {
        message: error.message,
        code: error.code
      }
    }, { status: 500 })
  }
}

// PATCH - Update staff member
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
    const staffRepo = getStaffRepository()

    // Get the staff member
    const staff = await staffRepo.findById(staffId, { skipCache: true })
    if (!staff || staff.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Extract allowed fields for update
    const {
      full_name,
      email,
      role,
      branch_id,
      professional_registration_number,
      specialization,
      phone,
      is_active,
    } = body

    // Prepare update data
    const updateData: any = {}

    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (branch_id !== undefined) updateData.branch_id = branch_id
    if (professional_registration_number !== undefined) 
      updateData.professional_registration_number = professional_registration_number
    if (specialization !== undefined) updateData.specialization = specialization
    if (phone !== undefined) updateData.phone = phone
    if (is_active !== undefined) updateData.is_active = is_active

    // Update staff record
    const updatedStaff = await staffRepo.update(staffId, updateData)

    return NextResponse.json({ 
      staff: updatedStaff,
      message: "Staff member updated successfully"
    })
  } catch (error) {
    console.error("Update staff error:", error)
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 })
  }
}
