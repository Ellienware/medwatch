/**
 * Secure API endpoint for patient list and creation
 */

import { NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api/secure-api-wrapper"
import { getUserContext } from "@/lib/middleware/access-control"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { auditCreate } from "@/lib/security/audit-log"

// GET /api/secure/patients
export const GET = withApiAuth(
  async (req, { user }) => {
    const searchParams = req.nextUrl.searchParams
    const filters = {
      employerId: searchParams.get("employerId"),
      search: searchParams.get("search"),
    }

    // List patients via secure service
    const result = await securePatientService.list(filters)

    return NextResponse.json({ data: result })
  },
  {
    requiredRole: ["super_admin", "clinic_admin", "receptionist", "nurse", "doctor"],
  },
)

// POST /api/secure/patients
export const POST = withApiAuth(
  async (req, { user }) => {
    const patientData = await req.json()

    // Create patient via secure service (includes encryption)
    const result = await securePatientService.create(patientData)

    // Audit the creation
    const context = await getUserContext()
    await auditCreate({
      ...context,
      entityType: "patient",
      entityId: result.id,
      entityDescription: `New patient: ${patientData.first_name} ${patientData.last_name}`,
    })

    return NextResponse.json({ data: result })
  },
  {
    requiredRole: ["super_admin", "clinic_admin", "receptionist"],
    requiredPermission: "canManagePatients",
  },
)
