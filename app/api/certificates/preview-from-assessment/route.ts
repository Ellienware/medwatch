import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { getAssessmentRepository, getPatientRepository, getClinicRepository } from "@/lib/repositories"
import { AssessmentToCertificateMapper } from "@/lib/services/assessment-to-certificate-mapper"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assessmentId } = await request.json()
    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID required" }, { status: 400 })
    }

    const assessmentRepo = getAssessmentRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()

    const assessment = await assessmentRepo.findById(assessmentId)
    if (!assessment || assessment.clinic_id !== user.clinic_id) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    const patient = await patientRepo.findById(assessment.patient_id)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const clinic = await clinicRepo.findById(assessment.clinic_id)
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
    }

    // Get test results
    const testResultRepo = (await import('@/lib/repositories')).getTestResultRepository()
    const testResults = await testResultRepo.findByAppointmentId(assessment.appointment_id)

    // Generate certificate preview
    const certificatePreview = AssessmentToCertificateMapper.createCertificateFromAssessment(
      assessment,
      patient,
      clinic,
      testResults
    )

    // Generate warnings if doctor decision differs from engine
    const warnings: string[] = []
    if (assessment.rules_engine_summary && assessment.doctor_decision) {
      if (assessment.doctor_decision !== assessment.rules_engine_summary.overallSuggestedDecision) {
        warnings.push(`Doctor's decision (${assessment.doctor_decision}) differs from clinical suggestion (${assessment.rules_engine_summary.overallSuggestedDecision}).`)
      }
      if (assessment.rules_engine_summary.criticalFindings.length > 0) {
        warnings.push(`${assessment.rules_engine_summary.criticalFindings.length} critical finding(s) identified.`)
      }
    }

    return NextResponse.json({
      certificate: certificatePreview,
      patient,
      clinic,
      warnings,
    })
  } catch (error) {
    console.error("Error generating preview from assessment:", error)
    return NextResponse.json(
      { error: "Failed to generate certificate preview" },
      { status: 500 }
    )
  }
}