//api/clinic/settings/certificate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { CertificateSettingsService } from "@/lib/services/certificate-settings-service"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settingsService = new CertificateSettingsService()
    const settings = await settingsService.getClinicSettings(user.clinic_id)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching certificate settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch certificate settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const settings: CertificateSettings = body.settings

    if (!settings) {
      return NextResponse.json({ error: "Settings are required" }, { status: 400 })
    }

    const settingsService = new CertificateSettingsService()
    await settingsService.updateClinicSettings(user.clinic_id, settings, user.id)

    return NextResponse.json({ 
      success: true, 
      message: "Certificate settings updated successfully" 
    })
  } catch (error) {
    console.error("Error updating certificate settings:", error)
    return NextResponse.json(
      { error: "Failed to update certificate settings" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settingsService = new CertificateSettingsService()
    
    // Reset to defaults
    const defaultSettings = {
      include_logo: true,
      include_watermark: true,
      watermark_text: "MEDICAL CERTIFICATE",
      watermark_opacity: 5,
      header_color: "#0D9488",
      header_text_color: "#FFFFFF",
      accent_color: "#14B8A6",
      body_background_color: "#FFFFFF",
      text_color: "#1F2937",
      secondary_text_color: "#6B7280",
      show_clinic_address: true,
      show_clinic_phone: true,
      show_clinic_email: true,
      show_registration_number: true,
      show_branch_info: true,
      show_border: true,
      border_style: 'solid' as const,
      border_color: "#E5E7EB",
      border_width: 1,
      include_stamp: false,
      validity_period_days: 365,
      footer_text: "This is an official medical certificate issued by our facility.",
      disclaimer_text: "This certificate is valid only when bearing the original signature and stamp.",
      show_patient_details_section: true,
      show_test_results_section: true,
      show_diagnosis_section: true,
      show_restrictions_section: true,
      show_recommendations_section: true,
      show_validity_dates: true,
      show_qr_code: false,
      title_font_family: "Helvetica, Arial, sans-serif",
      body_font_family: "Helvetica, Arial, sans-serif",
      title_font_size: 24,
      body_font_size: 11,
      template_type: "fitness"
    }

    await settingsService.updateClinicSettings(user.clinic_id, defaultSettings, user.id)

    return NextResponse.json({ 
      success: true, 
      message: "Certificate settings reset to defaults" 
    })
  } catch (error) {
    console.error("Error resetting certificate settings:", error)
    return NextResponse.json(
      { error: "Failed to reset certificate settings" },
      { status: 500 }
    )
  }
}
