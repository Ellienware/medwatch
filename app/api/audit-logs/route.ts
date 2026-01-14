/**
 * API endpoint for viewing audit logs
 */

import { NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api/secure-api-wrapper"
import { getAuditLogsForEntity } from "@/lib/security/audit-log"
import { requireClinicAccess } from "@/lib/middleware/access-control"

export const GET = withApiAuth(
  async (req, { user }) => {
    const searchParams = req.nextUrl.searchParams
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 })
    }

    // Ensure user can only view logs from their clinic
    await requireClinicAccess(user.clinic_id)

    const auditLogs = await getAuditLogsForEntity(entityType as any, entityId, user.clinic_id, 100)

    return NextResponse.json({ data: auditLogs })
  },
  {
    requiredRole: ["super_admin", "clinic_admin"],
    requiredPermission: "canViewAuditLogs",
  },
)
