// lib/types/certificate-settings.ts
export interface CertificateSettings {
  // Branding & Colors
  logo_url?: string
  clinic_name?: string
  header_color?: string // Hex color for header background
  header_text_color?: string // Text color for header
  accent_color?: string // Hex color for accents and borders
  body_background_color?: string // Certificate background color
  text_color?: string // Main text color
  secondary_text_color?: string // For less important text

  // Layout Options
  include_logo?: boolean
  include_watermark?: boolean
  watermark_text?: string
  watermark_opacity?: number // 0-100
  footer_text?: string
  show_border?: boolean
  border_style?: 'solid' | 'dashed' | 'dotted'
  border_color?: string
  border_width?: number // in pixels

  // Certificate Details
  show_clinic_address?: boolean
  show_clinic_phone?: boolean
  show_clinic_email?: boolean
  show_registration_number?: boolean
  show_branch_info?: boolean // Show branch-specific info
  show_qr_code?: boolean // For certificate verification
  qr_code_url?: string // URL for QR code generation

  // Sections to Show/Hide
  show_patient_details_section?: boolean
  show_test_results_section?: boolean
  show_diagnosis_section?: boolean
  show_restrictions_section?: boolean
  show_recommendations_section?: boolean
  show_validity_dates?: boolean

  // Signature Options
  signature_image_url?: string
  signature_text?: string
  include_stamp?: boolean
  stamp_image_url?: string
  stamp_position?: 'left' | 'center' | 'right'
  
  // Font Settings
  title_font_family?: string
  body_font_family?: string
  title_font_size?: number // in points
  body_font_size?: number // in points

  // Additional Info
  disclaimer_text?: string
  validity_period_days?: number
  custom_css?: string // For advanced customization
}

export const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  include_logo: true,
  include_watermark: true,
  watermark_text: "MEDICAL CERTIFICATE",
  watermark_opacity: 5,
  header_color: "#0D9488", // Teal
  header_text_color: "#FFFFFF",
  accent_color: "#14B8A6",
  body_background_color: "#FFFFFF",
  text_color: "#1F2937", // Gray-800
  secondary_text_color: "#6B7280", // Gray-500
  show_clinic_address: true,
  show_clinic_phone: true,
  show_clinic_email: true,
  show_registration_number: true,
  show_branch_info: true,
  show_border: true,
  border_style: 'solid',
  border_color: "#E5E7EB", // Gray-200
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
}
