import { NextRequest, NextResponse } from "next/server"
import { completeAssessmentAndCreateCertificate } from "@/lib/actions/assessment-actions"
import { logger } from "@/lib/services/logging-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessmentId } = body
    
    if (!assessmentId) {
      return NextResponse.json(
        { success: false, error: "Assessment ID is required" },
        { status: 400 }
      )
    }
    
    const result = await completeAssessmentAndCreateCertificate(assessmentId)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      assessment: result.assessment,
      certificate: result.certificate,
      rulesEvaluation: result.rulesEvaluation,
      message: result.message,
    })
    
  } catch (error) {
    logger.error("API Error completing assessment:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}