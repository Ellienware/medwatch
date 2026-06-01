//api/certificate/generate-pdf/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { 
  CertificateRepository, 
  PatientRepository, 
  ClinicRepository, 
  TestResultRepository,
  ClinicalTestRepository 
} from "@/lib/repositories"
import { serverStorageService } from "@/lib/storage/storage-service"
import { FitnessCertificateGenerator } from "@/lib/pdf/fitness-certificate-generator"
import { FitnessCertificateTransformer } from "@/lib/pdf/fitness-certificate-transformer"
import { ValidationService } from "@/lib/services/validation-service"
import { CertificateSettingsService } from "@/lib/services/certificate-settings-service"

// Rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimits.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }

  if (userLimit.count >= 5) { // 5 requests per minute
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { certificateId } = await request.json()
    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
    }

    // Fetch certificate and related data
    const certificateRepo = new CertificateRepository()
    const patientRepo = new PatientRepository()
    const clinicRepo = new ClinicRepository()
    const testResultRepo = new TestResultRepository()
    const clinicalTestRepo = new ClinicalTestRepository()

    const certificate = await certificateRepo.findById(certificateId)
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Verify user has access to this certificate
    if (certificate.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get patient
    const patient = await patientRepo.findById(certificate.patient_id)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Get clinic
    const clinic = await clinicRepo.findById(certificate.clinic_id)
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // Get test results
    const testResults = await testResultRepo.findByAppointmentId(certificate.appointment_id!)
    
    // Enrich test results with test names
    const enrichedTestResults = await Promise.all(
      testResults.map(async (testResult) => {
        let testName = 'Unknown Test'
        
        if (testResult.test_code) {
          try {
            const test = await clinicalTestRepo.findByTestCode(testResult.test_code, user.clinic_id!)
            testName = test?.test_name || 'Unknown Test'
          } catch (error) {
            console.error('Error fetching test name:', error)
          }
        }
        
        // Parse results if they're strings
        let parsedResults = {}
        if (testResult.results) {
          try {
            parsedResults = typeof testResult.results === 'string' 
              ? JSON.parse(testResult.results || '{}')
              : testResult.results
          } catch (error) {
            console.error('Error parsing test results:', error)
            parsedResults = {}
          }
        }
        
        return {
          ...testResult,
          test_name: testName,
          results: parsedResults
        }
      })
    )

    

    // Transform data for fitness certificate
    const certificateData = FitnessCertificateTransformer.transform(
      certificate,
      patient,
      clinic,
      enrichedTestResults
    )

    // Validate certificate data
    const validation = ValidationService.validateCertificateData(certificateData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid certificate data", details: validation.errors },
        { status: 400 }
      )
    }

    // Get certificate settings
    const settingsService = new CertificateSettingsService()
    const finalCertificateSettings = await settingsService.getCertificateSettings(
      user.clinic_id,
      certificate.settings_override
    )

    // Validate settings
    const settingsValidation = ValidationService.validateCertificateSettings(finalCertificateSettings)
    if (!settingsValidation.valid) {
      return NextResponse.json(
        { error: "Invalid certificate settings", details: settingsValidation.errors },
        { status: 400 }
      )
    }

    // Generate PDF
    const generator = new FitnessCertificateGenerator(finalCertificateSettings)
    const pdfBuffer = generator.generateCertificate(certificateData)

    // Convert Buffer to Uint8Array for File constructor
    const pdfUint8Array = new Uint8Array(pdfBuffer)

    // Upload to storage
    const fileName = `fitness_certificate_${certificate.certificate_number}_${Date.now()}.pdf`
    const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })
    
    const uploadedFile = await serverStorageService.uploadFile(file, {
      prefix: "CERTIFICATES" as const
    })

    // Update certificate with PDF URL
    await certificateRepo.update(certificateId, {
      pdf_url: uploadedFile.fileUrl,
    })

    return NextResponse.json({
      success: true,
      pdfUrl: uploadedFile.fileUrl,
      fileId: uploadedFile.fileId,
      message: "Fitness certificate generated successfully"
    })
  } catch (error) {
    console.error("Error generating fitness certificate PDF:", error)
    
    // Handle single page constraint error
    if (error instanceof Error && error.message.includes('single page')) {
      return NextResponse.json(
        { 
          error: "Certificate content too large", 
          details: "Content must fit within single A4 page. Please reduce content or contact support.",
          code: "SINGLE_PAGE_LIMIT"
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate fitness certificate PDF", 
        details: error instanceof Error ? error.message : "Unknown error",
        code: "GENERATION_ERROR"
      },
      { status: 500 }
    )
  }
}
