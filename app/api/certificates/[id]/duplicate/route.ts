import { getCurrentUser } from "@/lib/auth/actions"
import { CertificateTemplateRepository } from "@/lib/repositories/template-repository"
import { NextRequest, NextResponse } from "next/server"

// app/api/certificates/templates/[id]/duplicate/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateRepo = new CertificateTemplateRepository()
    const existingTemplate = await templateRepo.findById(params.id)

    if (!existingTemplate || existingTemplate.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await request.json()
    const newName = body.name || `${existingTemplate.name} (Copy)`

    const newTemplate = await templateRepo.duplicateTemplate(params.id, newName)

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: "Template duplicated successfully"
    })
  } catch (error) {
    console.error("Error duplicating template:", error)
    return NextResponse.json(
      { error: "Failed to duplicate template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}