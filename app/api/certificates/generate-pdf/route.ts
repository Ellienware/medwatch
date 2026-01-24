// app/api/certificates/generate-pdf/route.ts - UPDATED WITH TEST RESULTS
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { serverCertificateGenerator } from "@/lib/pdf/server-certificate-generator"
import { 
  CertificateRepository, 
  PatientRepository, 
  ClinicRepository, 
  UserRepository, 
  BranchRepository, 
  AppointmentRepository,
  TestResultRepository,   
  ClinicalTestRepository 
} from "@/lib/repositories"
import { serverStorageService } from "@/lib/storage/storage-service"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateId } = await request.json()
    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
    }

    // Fetch certificate and related data
    const certificateRepo = new CertificateRepository()
    const patientRepo = new PatientRepository()
    const clinicRepo = new ClinicRepository()
    const userRepo = new UserRepository()
    const branchRepo = new BranchRepository()
    const appointmentRepo = new AppointmentRepository()
    const testResultRepo = new TestResultRepository()     // ADD THIS
    const clinicalTestRepo = new ClinicalTestRepository() // ADD THIS

    const certificate = await certificateRepo.findById(certificateId)
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Verify user has access to this certificate
    if (certificate.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get appointment to get branch_id
    const appointment = await appointmentRepo.findById(certificate.appointment_id)

    // ========== ADD TEST RESULT FETCHING LOGIC HERE ==========
    console.log('🔍 DEBUG: API - Fetching test results for appointment:', certificate.appointment_id)
    const testResults = await testResultRepo.findByAppointmentId(certificate.appointment_id!)
    
    // ========== DEBUGGING: Log raw test results ==========
    console.log('🔍 DEBUG: API - Raw test results from database:', {
      count: testResults.length,
      results: testResults.map(r => ({
        id: r.id,
        test_code: r.test_code,
        has_results: !!r.results,
        results_type: typeof r.results
      }))
    })

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
        
        const enrichedResult = {
          ...testResult,
          test_name: testName,
          results: parsedResults
        }
        
        // ========== DEBUGGING: Log enriched result ==========
        console.log('🔍 DEBUG: API - Enriched test result:', {
          test_code: testResult.test_code,
          test_name: enrichedResult.test_name,
          results_count: Object.keys(parsedResults).length
        })
        
        return enrichedResult
      })
    )

    // ========== DEBUGGING: Log final enriched results ==========
    console.log('🔍 DEBUG: API - Final enriched test results:', {
      count: enrichedTestResults.length,
      results: enrichedTestResults.map(r => ({
        test_name: r.test_name,
        test_code: r.test_code,
        results: r.results
      }))
    })

    const [patient, clinic, doctor, branch] = await Promise.all([
      patientRepo.findById(certificate.patient_id),
      clinicRepo.findById(certificate.clinic_id),
      userRepo.findById(certificate.issued_by),
      // Get branch from appointment if available
      appointment?.branch_id ? branchRepo.findById(appointment.branch_id) : Promise.resolve(null),
    ])

    if (!patient || !clinic || !doctor) {
      return NextResponse.json({ error: "Required data not found" }, { status: 404 })
    }

    // Get certificate settings from clinic settings
    const certificateSettings = clinic.settings?.certificate_settings as CertificateSettings | undefined

    // ========== DEBUGGING: Log PDF generation data ==========
    console.log('🔍 DEBUG: API - Generating PDF with:', {
      certificate_number: certificate.certificate_number,
      test_results_count: enrichedTestResults.length,
      certificate_settings: !!certificateSettings,
      show_test_results_section: certificateSettings?.show_test_results_section
    })

    // Generate PDF using server-side generator WITH TEST RESULTS
    const pdfBuffer = await serverCertificateGenerator.generateCertificate({
      certificate,
      patient,
      clinic,
      doctor,
      branch: branch || undefined,
      settings: certificateSettings,
      testResults: enrichedTestResults  // <-- CRITICAL: PASS TEST RESULTS HERE!
    })

    console.log('✅ DEBUG: API - PDF generated successfully, buffer size:', pdfBuffer.length)

    // Convert Buffer to Uint8Array for File constructor
    const pdfUint8Array = new Uint8Array(pdfBuffer)

    // Upload to storage using server storage service
    const fileName = `certificate_${certificate.certificate_number}_${Date.now()}.pdf`
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
    })
  } catch (error) {
    console.error("Error generating certificate PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}