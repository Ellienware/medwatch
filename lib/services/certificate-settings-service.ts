import { ClinicRepository } from "@/lib/repositories/clinic-repository"
import type { CertificateSettings, Clinic } from "@/lib/types/database"
import { DEFAULT_CERTIFICATE_SETTINGS } from "@/lib/types/certificate-settings"
import { Query } from "appwrite"
import { ValidationService } from "./validation-service"
import { logger } from "./logging-service"

export class CertificateSettingsService {
  private clinicRepo: ClinicRepository

  constructor() {
    this.clinicRepo = new ClinicRepository()
  }

  /**
   * Get certificate settings for a clinic
   */
  async getClinicSettings(clinicId: string): Promise<CertificateSettings> {
    try {
      const clinic = await this.clinicRepo.findById(clinicId)
      if (!clinic) {
        logger.error(`Clinic ${clinicId} not found`)
        throw new Error(`Clinic ${clinicId} not found`)
      }

      // Return clinic settings or defaults
      if (clinic.certificate_settings) {
        const validatedSettings = this.validateSettings(clinic.certificate_settings)
        return this.mergeWithDefaults(validatedSettings)
      }
      
      return { ...DEFAULT_CERTIFICATE_SETTINGS }
    } catch (error) {
      logger.error("Error fetching clinic certificate settings:", { clinicId, error })
      return { ...DEFAULT_CERTIFICATE_SETTINGS }
    }
  }

  /**
   * Update certificate settings for a clinic
   */
  async updateClinicSettings(
    clinicId: string, 
    settings: CertificateSettings,
    updatedBy: string
  ): Promise<Clinic> {
    try {
      // Validate settings
      const validation = ValidationService.validateCertificateSettings(settings)
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
      }
      
      const validatedSettings = this.validateSettings(settings)
      
      // Sanitize settings
      const sanitizedSettings = ValidationService.sanitizeCertificateSettings(validatedSettings)
      
      // Merge with defaults to ensure all fields exist
      const completeSettings = this.mergeWithDefaults(sanitizedSettings)
      
      // Update clinic
      const updatedClinic = await this.clinicRepo.update(clinicId, {
        certificate_settings: completeSettings,
        updated_at: new Date().toISOString()
      })

      // Log template change
      await this.logTemplateChange(clinicId, completeSettings, updatedBy)

      logger.info('Certificate settings updated', {
        clinicId,
        updatedBy,
        settings: Object.keys(completeSettings)
      })

      return updatedClinic
    } catch (error) {
      logger.error("Error updating clinic certificate settings:", { clinicId, updatedBy, error })
      throw error
    }
  }

  /**
   * Get settings for certificate generation
   */
  async getCertificateSettings(
    clinicId: string, 
    certificateOverrides?: CertificateSettings
  ): Promise<CertificateSettings> {
    const clinicSettings = await this.getClinicSettings(clinicId)
    
    if (!certificateOverrides) {
      return clinicSettings
    }

    // Validate overrides
    const validation = ValidationService.validateCertificateSettings(certificateOverrides)
    if (!validation.valid) {
      logger.warn('Invalid certificate overrides', {
        clinicId,
        errors: validation.errors
      })
      return clinicSettings
    }

    // Deep merge: certificate overrides take precedence
    return this.deepMerge(clinicSettings, certificateOverrides)
  }

  /**
   * Validate certificate settings
   */
private validateSettings(settings: CertificateSettings): CertificateSettings {
  const validated: any = { ...settings }

  // Validate colors
  if (validated.header_color && !ValidationService.isValidHexColor(validated.header_color)) {
    validated.header_color = DEFAULT_CERTIFICATE_SETTINGS.header_color
  }

  if (validated.accent_color && !ValidationService.isValidHexColor(validated.accent_color)) {
    validated.accent_color = DEFAULT_CERTIFICATE_SETTINGS.accent_color
  }

  if (validated.body_background_color && !ValidationService.isValidHexColor(validated.body_background_color)) {
    validated.body_background_color = DEFAULT_CERTIFICATE_SETTINGS.body_background_color
  }

  if (validated.text_color && !ValidationService.isValidHexColor(validated.text_color)) {
    validated.text_color = DEFAULT_CERTIFICATE_SETTINGS.text_color
  }

  if (validated.secondary_text_color && !ValidationService.isValidHexColor(validated.secondary_text_color)) {
    validated.secondary_text_color = DEFAULT_CERTIFICATE_SETTINGS.secondary_text_color
  }

  if (validated.border_color && !ValidationService.isValidHexColor(validated.border_color)) {
    validated.border_color = DEFAULT_CERTIFICATE_SETTINGS.border_color
  }

  // Validate numeric ranges - add null checks
  if (validated.watermark_opacity !== undefined && validated.watermark_opacity !== null) {
    validated.watermark_opacity = Math.max(0, Math.min(100, Number(validated.watermark_opacity)))
  }

  if (validated.border_width !== undefined && validated.border_width !== null) {
    validated.border_width = Math.max(0, Math.min(10, Number(validated.border_width)))
  }

  if (validated.title_font_size !== undefined && validated.title_font_size !== null) {
    validated.title_font_size = Math.max(8, Math.min(72, Number(validated.title_font_size)))
  }

  if (validated.body_font_size !== undefined && validated.body_font_size !== null) {
    validated.body_font_size = Math.max(8, Math.min(24, Number(validated.body_font_size)))
  }

  // Validate border style
  if (validated.border_style && !['solid', 'dashed', 'dotted'].includes(validated.border_style)) {
    validated.border_style = DEFAULT_CERTIFICATE_SETTINGS.border_style
  }

  return validated as CertificateSettings
}

  /**
   * Merge settings with defaults
   */
  private mergeWithDefaults(settings: CertificateSettings): CertificateSettings {
    return {
      ...DEFAULT_CERTIFICATE_SETTINGS,
      ...settings
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target }
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key]
          } else {
            output[key] = this.deepMerge(target[key], source[key])
          }
        } else {
          output[key] = source[key]
        }
      })
    }
    
    return output
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  /**
   * Log template changes for audit trail
   */
  private async logTemplateChange(
    clinicId: string,
    settings: CertificateSettings,
    updatedBy: string
  ): Promise<void> {
    try {
      logger.info('Template updated', {
        clinicId,
        updatedBy,
        timestamp: new Date().toISOString(),
        settingsChanged: Object.keys(settings)
      })
    } catch (error) {
      logger.error("Error logging template change:", { clinicId, error })
    }
  }

  /**
   * Get certificate preview with settings applied
   */
  async generatePreview(
    clinicId: string,
    settings?: CertificateSettings
  ): Promise<string> {
    const effectiveSettings = settings 
      ? await this.getCertificateSettings(clinicId, settings)
      : await this.getClinicSettings(clinicId)

    // Generate HTML preview
    return this.generatePreviewHTML(effectiveSettings)
  }

  /**
   * Generate HTML preview of certificate with settings
   */
 private generatePreviewHTML(settings: CertificateSettings): string {
  // This would generate a visual preview of the certificate
  // For now, return a simple preview
  return `
    <div class="certificate-preview" style="
      border: ${settings.border_width || 1}px ${settings.border_style || 'solid'} ${settings.border_color || '#000000'};
      background-color: ${settings.body_background_color || '#FFFFFF'};
      color: ${settings.text_color || '#000000'};
      font-family: ${settings.body_font_family || 'Arial, sans-serif'};
      padding: 20px;
    ">
      <div class="header" style="
        background-color: ${settings.header_color || '#1e40af'};
        color: ${settings.header_text_color || '#FFFFFF'};
        padding: 10px;
        text-align: center;
      ">
        <h2 style="font-family: ${settings.title_font_family || 'Arial, sans-serif'}; font-size: ${settings.title_font_size || 18}pt;">
          CERTIFICATE PREVIEW
        </h2>
      </div>
      <div class="content" style="padding: 20px; font-size: ${settings.body_font_size || 12}pt;">
        <p>This is a preview of how your certificates will appear.</p>
        <p>Header Color: ${settings.header_color || '#1e40af'}</p>
        <p>Accent Color: ${settings.accent_color || '#3b82f6'}</p>
        <p>Font Family: ${settings.body_font_family || 'Arial, sans-serif'}</p>
      </div>
      ${settings.footer_text ? `
        <div class="footer" style="
          border-top: 1px solid ${settings.secondary_text_color || '#6b7280'};
          color: ${settings.secondary_text_color || '#6b7280'};
          padding-top: 10px;
          font-size: ${(settings.body_font_size || 12) - 2}pt;
        ">
          ${settings.footer_text}
        </div>
      ` : ''}
    </div>
  `
}

  /**
   * Export settings as JSON
   */
  exportSettings(settings: CertificateSettings): string {
    try {
      const sanitized = ValidationService.sanitizeCertificateSettings(settings)
      return JSON.stringify(sanitized, null, 2)
    } catch (error) {
      logger.error("Error exporting settings:", { error })
      throw new Error("Failed to export settings")
    }
  }

  /**
   * Import settings from JSON
   */
  importSettings(json: string): CertificateSettings {
    try {
      const parsed = JSON.parse(json)
      const validated = this.validateSettings(parsed)
      const sanitized = ValidationService.sanitizeCertificateSettings(validated)
      return sanitized
    } catch (error) {
      logger.error("Error importing settings:", { error })
      throw new Error("Invalid settings JSON format")
    }
  }
}
