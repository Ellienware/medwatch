// app/api/certificates/templates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { CertificateTemplateRepository } from "@/lib/repositories/template-repository"
import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/types/certificate-settings"
import logger from "@/lib/logging/logger"

export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/certificates/templates')
    
    const user = await getCurrentUser()
    logger.debug('Current user:', { 
      userId: user?.id, 
      clinicId: user?.clinic_id,
      userEmail: user?.email 
    })
    
    if (!user?.clinic_id) {
      logger.warn('Unauthorized access - no clinic_id')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    
    const templateRepo = new CertificateTemplateRepository()
    const templates = await templateRepo.findByClinicId(user.clinic_id)

    logger.info(`Found ${templates.length} templates for clinic ${user.clinic_id}`)
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    logger.error("Error fetching templates:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch templates", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('POST /api/certificates/templates - Creating template')
    
    const user = await getCurrentUser()
    logger.debug('Current user:', { 
      userId: user?.id, 
      clinicId: user?.clinic_id,
      userEmail: user?.email 
    })
    
    if (!user?.clinic_id) {
      logger.warn('Unauthorized template creation - no clinic_id')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.id) {
      logger.warn('Unauthorized template creation - no user id')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    logger.debug('Request body:', body)
    
    const { 
      name, 
      description, 
      category = "medical", 
      layout = "single",
      is_one_page = false,
      sections_included = ["patient_info", "test_results", "diagnosis", "restrictions", "recommendations", "signature"],
      settings = DEFAULT_CERTIFICATE_SETTINGS
    } = body

    // Validate required fields
    if (!name?.trim()) {
      logger.warn('Template creation failed - missing name')
      return NextResponse.json({ error: "Template name is required" }, { status: 400 })
    }

    // Validate sections_included is an array
    if (!Array.isArray(sections_included)) {
      logger.warn('Template creation failed - sections_included is not an array')
      return NextResponse.json({ error: "sections_included must be an array" }, { status: 400 })
    }

    const templateRepo = new CertificateTemplateRepository()
    
    // Check if a default template already exists for this clinic
    const existingDefault = await templateRepo.findDefaultTemplate(user.clinic_id)
    const is_default = !existingDefault
    
    logger.debug('Creating template with data:', {
      clinic_id: user.clinic_id,
      name,
      category,
      layout,
      is_one_page,
      sections_included,
      is_default,
      created_by: user.id
    })
    
    try {
      const template = await templateRepo.create({
        clinic_id: user.clinic_id,
        name: name.trim(),
        description: description?.trim() || null,
        category,
        layout,
        is_one_page,
        sections_included,
        settings,
        is_default,
        created_by: user.id,
        thumbnail_url: null
      })

      logger.info(`Template created successfully: ${template.id}`, { 
        templateId: template.id,
        templateName: template.name 
      })
      
      return NextResponse.json({
        success: true,
        template,
        message: "Template created successfully"
      }, { status: 201 })
    } catch (createError: any) {
      logger.error('Error in templateRepo.create:', createError)
      return NextResponse.json(
        { 
          error: "Failed to create template in database", 
          details: createError instanceof Error ? createError.message : "Unknown error",
          code: createError.code || 'UNKNOWN'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error("Error in POST /api/certificates/templates:", error)
    return NextResponse.json(
      { 
        error: "Failed to create template", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    )
  }
}