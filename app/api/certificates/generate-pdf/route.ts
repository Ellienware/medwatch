// app/api/certificates/generate-pdf/route.ts - FIXED
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { serverCertificateGenerator } from "@/lib/pdf/server-certificate-generator"
import { CertificateRepository, PatientRepository, ClinicRepository, UserRepository, BranchRepository, AppointmentRepository } from "@/lib/repositories"
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

    // Generate PDF using server-side generator
    const pdfBuffer = await serverCertificateGenerator.generateCertificate({
      certificate,
      patient,
      clinic,
      doctor,
      branch: branch || undefined,
      settings: certificateSettings,
    })

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