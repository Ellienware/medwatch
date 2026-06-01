export class ValidationService {
  static isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  static sanitizeText(text: string): string {
    if (!text) return ''
    return text
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
  }

  static validateCertificateData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    const requiredFields = [
      'certificate_number',
      'patient_name',
      'provider_name',
      'provider_address',
      'exam_date',
      'medical_type',
      'fitness_status'
    ]

    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    })

    // Validate dates
    if (data.exam_date && !this.isValidDate(data.exam_date)) {
      errors.push('Invalid exam date')
    }

    if (data.valid_from && !this.isValidDate(data.valid_from)) {
      errors.push('Invalid valid from date')
    }

    if (data.valid_until && !this.isValidDate(data.valid_until)) {
      errors.push('Invalid valid until date')
    }

    // Validate medical type
    const validMedicalTypes = ['pre_employment', 'annual', 'exit', 'transfer']
    if (!validMedicalTypes.includes(data.medical_type)) {
      errors.push('Invalid medical type')
    }

    // Validate fitness status
    const validFitnessStatuses = ['fit', 'fit_with_conditions', 'fit_with_restrictions', 'temporarily_unfit']
    if (!validFitnessStatuses.includes(data.fitness_status)) {
      errors.push('Invalid fitness status')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static validateCertificateSettings(settings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (settings.header_color && !this.isValidHexColor(settings.header_color)) {
      errors.push('Invalid header color format')
    }

    if (settings.accent_color && !this.isValidHexColor(settings.accent_color)) {
      errors.push('Invalid accent color format')
    }

    if (settings.body_background_color && !this.isValidHexColor(settings.body_background_color)) {
      errors.push('Invalid background color format')
    }

    if (settings.text_color && !this.isValidHexColor(settings.text_color)) {
      errors.push('Invalid text color format')
    }

    if (settings.watermark_opacity !== undefined) {
      const opacity = Number(settings.watermark_opacity)
      if (isNaN(opacity) || opacity < 0 || opacity > 100) {
        errors.push('Watermark opacity must be between 0 and 100')
      }
    }

    if (settings.border_width !== undefined) {
      const width = Number(settings.border_width)
      if (isNaN(width) || width < 0 || width > 10) {
        errors.push('Border width must be between 0 and 10')
      }
    }

    if (settings.title_font_size !== undefined) {
      const size = Number(settings.title_font_size)
      if (isNaN(size) || size < 8 || size > 72) {
        errors.push('Title font size must be between 8 and 72')
      }
    }

    if (settings.body_font_size !== undefined) {
      const size = Number(settings.body_font_size)
      if (isNaN(size) || size < 8 || size > 24) {
        errors.push('Body font size must be between 8 and 24')
      }
    }

    if (settings.validity_period_days !== undefined) {
      const days = Number(settings.validity_period_days)
      if (isNaN(days) || days < 1 || days > 3650) {
        errors.push('Validity period must be between 1 and 3650 days')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  static sanitizeCertificateSettings(settings: any): any {
    const sanitized = { ...settings }

    // Sanitize text fields
    if (sanitized.footer_text) {
      sanitized.footer_text = this.sanitizeText(sanitized.footer_text)
    }

    if (sanitized.disclaimer_text) {
      sanitized.disclaimer_text = this.sanitizeText(sanitized.disclaimer_text)
    }

    if (sanitized.watermark_text) {
      sanitized.watermark_text = this.sanitizeText(sanitized.watermark_text)
    }

    // Ensure numeric values are numbers
    if (sanitized.watermark_opacity !== undefined) {
      sanitized.watermark_opacity = Number(sanitized.watermark_opacity)
    }

    if (sanitized.border_width !== undefined) {
      sanitized.border_width = Number(sanitized.border_width)
    }

    if (sanitized.title_font_size !== undefined) {
      sanitized.title_font_size = Number(sanitized.title_font_size)
    }

    if (sanitized.body_font_size !== undefined) {
      sanitized.body_font_size = Number(sanitized.body_font_size)
    }

    if (sanitized.validity_period_days !== undefined) {
      sanitized.validity_period_days = Number(sanitized.validity_period_days)
    }

    // Ensure boolean values are booleans
    const booleanFields = [
      'include_logo',
      'include_watermark',
      'show_border',
      'show_clinic_address',
      'show_clinic_phone',
      'show_clinic_email',
      'show_registration_number',
      'show_branch_info',
      'show_qr_code',
      'show_patient_details_section',
      'show_test_results_section',
      'show_diagnosis_section',
      'show_restrictions_section',
      'show_recommendations_section',
      'show_validity_dates',
      'include_stamp'
    ]

    booleanFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        sanitized[field] = Boolean(sanitized[field])
      }
    })

    return sanitized
  }
}
