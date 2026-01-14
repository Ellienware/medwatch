/**
 * Secure API endpoint for patient data
 * All operations go through server-side encryption/decryption
 */

import { NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api/secure-api-wrapper"
import { requireClinicAccess, getUserContext } from "@/lib/middleware/access-control"
import { securePatientService } from "@/lib/services/secure-patient-service"
import { auditRead, auditUpdate, auditDelete } from "@/lib/security/audit-log"

// GET /api/secure/patients/[id]
export const GET = withApiAuth(
  async (req, { user, params }) => {
    const patientId = params.id

    // Fetch patient via secure service (includes decryption)
    const patient = await securePatientService.read(patientId)

    // Verify clinic access
    await requireClinicAccess(patient.clinic_id)

    // Audit the read
    const context = await getUserContext()
    await auditRead({
      ...context,
      entityType: "patient",
      entityId: patientId,
      entityDescription: `${patient.first_name} ${patient.last_name}`,
    })

    return NextResponse.json({ data: patient })
  },
  {
    requiredRole: ["super_admin", "clinic_admin", "receptionist", "nurse", "doctor"],
    requiredPermission: "canViewPatients",
  },
)

// PUT /api/secure/patients/[id]
export const PUT = withApiAuth(
  async (req, { user, params }) => {
    const patientId = params.id
    const updates = await req.json()

    // Update via secure service (includes encryption)
    const result = await securePatientService.update(patientId, updates)

    // Audit the update
    const context = await getUserContext()
    await auditUpdate({
      ...context,
      entityType: "patient",
      entityId: patientId,
      entityDescription: "Patient updated",
      changes: Object.keys(updates).reduce(
        (acc, key) => {
          acc[key] = { old: "***", new: "***" } // Don't log PHI
          return acc
        },
        {} as Record<string, any>,
      ),
    })

    return NextResponse.json({ data: result })
  },
  {
    requiredRole: ["super_admin", "clinic_admin", "receptionist", "nurse"],
    requiredPermission: "canManagePatients",
  },
)

// DELETE /api/secure/patients/[id]
export const DELETE = withApiAuth(
  async (req, { user, params }) => {
    const patientId = params.id

    // Delete via secure service
    await securePatientService.delete(patientId)

    // Audit the deletion
    const context = await getUserContext()
    await auditDelete({
      ...context,
      entityType: "patient",
      entityId: patientId,
      entityDescription: "Patient deleted",
    })

    return NextResponse.json({ success: true })
  },
  {
    requiredRole: ["super_admin", "clinic_admin"],
    requiredPermission: "canDeleteRecords",
  },
)
