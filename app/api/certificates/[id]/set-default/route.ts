// app/api/certificates/templates/[id]/set-default/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { CertificateTemplateRepository } from "@/lib/repositories/template-repository"

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
    const template = await templateRepo.findById(params.id)

    if (!template || template.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    await templateRepo.setAsDefault(params.id)

    return NextResponse.json({
      success: true,
      message: "Template set as default successfully"
    })
  } catch (error) {
    console.error("Error setting default template:", error)
    return NextResponse.json(
      { error: "Failed to set default template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}