//api/certificates/preview/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { FitnessCertificateGenerator } from "@/lib/pdf/fitness-certificate-generator"
import { serverStorageService } from "@/lib/storage/storage-service"
import type { CertificateSettings } from "@/lib/types/certificate-settings"
import { CertificateSettingsService } from "@/lib/services/certificate-settings-service"
import type { FitnessCertificateData } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const settings: CertificateSettings = body.settings

    const settingsService = new CertificateSettingsService()
    const effectiveSettings = await settingsService.getCertificateSettings(user.clinic_id, settings)

    // Generate sample data for preview with correct types
    const sampleData: FitnessCertificateData = {
      provider_name: "Sample Medical Clinic",
      provider_address: "123 Medical Center Dr, City, State 12345",
      provider_registration: "MED-123456",
      provider_phone: "(123) 456-7890",
      provider_vat: "VAT-789012",
      provider_email: "info@sampleclinic.com",
      provider_website: "www.sampleclinic.com",
      provider_tagline: "Quality Healthcare Since 2024",
      
      certificate_number: "2024-PREVIEW-001",
      exam_date: new Date().toISOString().split('T')[0],
      issue_date: new Date().toISOString().split('T')[0],
      
      patient_name: "John Michael Smith",
      id_number: "ID-78901234",
      passport_number: "P12345678",
      occupation: "Software Engineer",
      company: "TechCorp Solutions",
      
      medical_type: "annual",
      
      lung_function: {
        fvc_percent: "98%",
        fev1_percent: "96%",
        fev1_fvc_ratio: "0.82",
        pef_l_min: "8.5"
      },
      
      audiometry: {
        left: {
          '500HZ': "25",
          '1000HZ': "20",
          '2000HZ': "15",
          '3000HZ': "20",
          '4000HZ': "25",
          '6000HZ': "30",
          '8000HZ': "35"
        },
        right: {
          '500HZ': "20",
          '1000HZ': "15",
          '2000HZ': "10",
          '3000HZ': "15",
          '4000HZ': "20",
          '6000HZ': "25",
          '8000HZ': "30"
        }
      },
      
      vision: {
        right_acuity: "20/20",
        left_acuity: "20/25",
        color_vision: "Normal"
      },
      
      urinalysis: {
        normal: true,
        hgt_mmol: "5.2"
      },
      
      chest_xray: true,
      
      referrals: {
        local_clinic: false,
        audiologist: false,
        optometrist: true,
        lung_function: false,
        omp: false
      },
      
      fitness_status: "fit",
      restrictions: "No heavy lifting above 25kg. Requires corrected vision for computer work.",
      
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      practitioner_name: "Dr. Sarah Johnson, MD",
      practitioner_number: "PRAC-789012",
      practitioner_qualifications: "MBChB, MMed, D.OccMed",
      practitioner_registration: "HPCSA Reg: 123456",
      omp_number: "OMP-456789"
    }

    // Generate PDF with settings
    const generator = new FitnessCertificateGenerator(effectiveSettings)
    const pdfBuffer = generator.generateCertificate(sampleData)

    // Upload preview to temporary storage
    const fileName = `certificate_preview_${Date.now()}.pdf`
    const pdfUint8Array = new Uint8Array(pdfBuffer)
    const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })
    
    const uploadedFile = await serverStorageService.uploadFile(file, {
      prefix: "PREVIEWS" as "CERTIFICATES", // Cast to valid type
    })

    return NextResponse.json({
      success: true,
      previewUrl: uploadedFile.fileUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      message: "Preview generated successfully"
    })

  } catch (error) {
    console.error("Error generating certificate preview:", error)
    return NextResponse.json(
      { error: "Failed to generate certificate preview" },
      { status: 500 }
    )
  }
}
