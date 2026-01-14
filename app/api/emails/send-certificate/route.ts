import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email/email-service"
import { getCurrentUser } from "@/lib/auth/actions"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certificateId } = await request.json()

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 })
    }

    const { databases } = createServerClient()

    // Get certificate details
    const certificate = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, certificateId)

    // Get patient details
    const patient = await databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, certificate.patient_id)

    if (!patient.email) {
      return NextResponse.json({ error: "Patient email not found" }, { status: 400 })
    }

    // Send email
    const result = await emailService.sendCertificateEmail(patient.email, {
      patientName: `${patient.first_name} ${patient.last_name}`,
      certificateNumber: certificate.certificate_number,
      certificateType: certificate.certificate_type,
      issueDate: new Date(certificate.issue_date).toLocaleDateString(),
      doctorName: certificate.doctor_name,
      downloadUrl: certificate.pdf_url,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Send certificate email error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
