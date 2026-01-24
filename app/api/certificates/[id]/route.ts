// app/api/certificates/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { CertificateTemplateRepository } from "@/lib/repositories/template-repository"


export async function GET(
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

    return NextResponse.json({
      success: true,
      template
    })
  } catch (error) {
    console.error("Error fetching template:", error)
    return NextResponse.json(
      { error: "Failed to fetch template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const { 
      name, 
      description, 
      category, 
      layout,
      is_one_page,
      sections_included,
      settings
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (layout !== undefined) updateData.layout = layout
    if (is_one_page !== undefined) updateData.is_one_page = is_one_page
    if (sections_included !== undefined) updateData.sections_included = sections_included
    if (settings !== undefined) updateData.settings = settings

    const updatedTemplate = await templateRepo.update(params.id, updateData)

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: "Template updated successfully"
    })
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json(
      { error: "Failed to update template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if template is default
    if (existingTemplate.is_default) {
      return NextResponse.json(
        { error: "Cannot delete default template. Set another template as default first." },
        { status: 400 }
      )
    }

    await templateRepo.delete(params.id)

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json(
      { error: "Failed to delete template", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}