// lib/pdf/certificate-generator.ts
"use client"

import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import type { Certificate, Patient, Clinic, Branch, TestResult, User } from "@/lib/types/database"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

// QR Code generator (optional dependency)
// npm install qrcode
import QRCode from "qrcode"

export class CertificateGenerator {
  private defaultSettings: CertificateSettings = {
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
    border_style: 'solid',
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
  }

  async generateCertificate(data: {
    certificate: Certificate;
    patient: Patient;
    clinic: Clinic;
    branch?: Branch;
    doctor: User;
    testResults?: TestResult[];
    settings?: CertificateSettings;
  }): Promise<Blob> {
    const {
      certificate,
      patient,
      clinic,
      branch,
      doctor,
      testResults = [],
      settings = {}
    } = data

    // Merge settings with defaults
    const mergedSettings = { ...this.defaultSettings, ...settings }

    // Generate QR code if enabled
    let qrCodeDataUrl = ''
    if (mergedSettings.show_qr_code && mergedSettings.qr_code_url) {
      qrCodeDataUrl = await this.generateQRCode(
        `${mergedSettings.qr_code_url}${certificate.id}`,
        100
      )
    }

    // Create HTML for certificate
    const html = this.generateCertificateHTML({
      certificate,
      patient,
      clinic,
      branch,
      doctor,
      testResults,
      settings: mergedSettings,
      qrCodeDataUrl
    })

    // Create temporary element
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '794px' // A4 width in pixels (210mm)
    tempDiv.style.height = '1123px' // A4 height in pixels (297mm)
    tempDiv.innerHTML = html
    document.body.appendChild(tempDiv)

    try {
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Higher resolution for print
        useCORS: true,
        logging: false,
        backgroundColor: mergedSettings.body_background_color || '#FFFFFF',
        width: 794,
        height: 1123,
      })

      // Convert to PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
      
      // Return blob
      return pdf.output('blob')
    } finally {
      // Clean up
      document.body.removeChild(tempDiv)
    }
  }

  private async generateQRCode(text: string, size: number): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      return ''
    }
  }

  private generateCertificateHTML(data: {
    certificate: Certificate;
    patient: Patient;
    clinic: Clinic;
    branch?: Branch;
    doctor: User;
    testResults: TestResult[];
    settings: CertificateSettings;
    qrCodeDataUrl: string;
  }): string {
    const { certificate, patient, clinic, branch, doctor, testResults, settings, qrCodeDataUrl } = data

    // Format helper functions
    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) return 'N/A'
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch {
        return dateString
      }
    }

    const formatCertificateType = (type: string): string => {
      return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }

    // Generate sections based on settings
    const sections = []

    // Header section
    sections.push(this.generateHeaderSection(clinic, branch, settings))

    // Certificate title section
    sections.push(this.generateTitleSection(certificate, settings))

    // Patient information section
    if (settings.show_patient_details_section) {
      sections.push(this.generatePatientSection(patient, certificate, settings, formatDate))
    }

    // Medical findings section
    if (settings.show_diagnosis_section || settings.show_validity_dates) {
      sections.push(this.generateMedicalFindingsSection(certificate, settings, formatDate, formatCertificateType))
    }

    // Test results section
    if (settings.show_test_results_section && testResults.length > 0) {
      sections.push(this.generateTestResultsSection(testResults, settings))
    }

    // Restrictions section
    if (settings.show_restrictions_section && certificate.restrictions) {
      sections.push(this.generateRestrictionsSection(certificate, settings))
    }

    // Recommendations section
    if (settings.show_recommendations_section && certificate.recommendations) {
      sections.push(this.generateRecommendationsSection(certificate, settings))
    }

    // Signature section
    sections.push(this.generateSignatureSection(doctor, certificate, clinic, settings, formatDate))

    // QR Code section
    if (settings.show_qr_code && qrCodeDataUrl) {
      sections.push(this.generateQRCodeSection(qrCodeDataUrl))
    }

    // Footer section
    sections.push(this.generateFooterSection(settings))

    // Generate complete HTML
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medical Certificate #${certificate.certificate_number}</title>
        <style>
          ${this.generateStyles(settings)}
          ${settings.custom_css || ''}
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="certificate">
            ${sections.join('\n')}
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateStyles(settings: CertificateSettings): string {
    return `
      /* Reset and base styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: ${settings.body_font_family || 'Helvetica, Arial, sans-serif'};
        background-color: ${settings.body_background_color || '#FFFFFF'};
        color: ${settings.text_color || '#1F2937'};
        line-height: 1.5;
      }

      .certificate-container {
        width: 210mm;
        min-height: 297mm;
        position: relative;
      }

      .certificate {
        width: 100%;
        min-height: 100%;
        background-color: ${settings.body_background_color || '#FFFFFF'};
        ${settings.show_border ? 
          `border: ${settings.border_width || 1}px ${settings.border_style || 'solid'} ${settings.border_color || '#E5E7EB'};` : 
          ''
        }
        position: relative;
        overflow: hidden;
      }

      /* Watermark */
      .watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: ${settings.include_watermark ? 'flex' : 'none'};
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: ${(settings.watermark_opacity || 5) / 100};
        z-index: 1;
      }

      .watermark-text {
        font-size: 80px;
        font-weight: bold;
        color: ${settings.accent_color || '#14B8A6'};
        transform: rotate(-45deg);
        white-space: nowrap;
        opacity: 0.8;
      }

      /* Header Section */
      .certificate-header {
        background-color: ${settings.header_color || '#0D9488'};
        color: ${settings.header_text_color || '#FFFFFF'};
        padding: 25px 40px;
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .header-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }

      .logo-container {
        display: ${settings.include_logo ? 'block' : 'none'};
      }

      .clinic-logo {
        max-height: 70px;
        max-width: 200px;
        object-fit: contain;
      }

      .clinic-name {
        font-family: ${settings.title_font_family || 'Helvetica, Arial, sans-serif'};
        font-size: ${(settings.title_font_size || 24) * 1.2}px;
        font-weight: bold;
        margin: 0;
      }

      .clinic-info {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 20px;
        font-size: ${(settings.body_font_size || 11) + 1}px;
        margin-top: 10px;
        opacity: 0.9;
      }

      .clinic-info-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* Title Section */
      .title-section {
        padding: 30px 40px;
        text-align: center;
        border-bottom: 2px solid ${settings.accent_color || '#14B8A6'};
        margin: 0 40px 30px;
      }

      .certificate-title {
        font-family: ${settings.title_font_family || 'Helvetica, Arial, sans-serif'};
        font-size: ${(settings.title_font_size || 24) * 1.5}px;
        font-weight: bold;
        color: ${settings.accent_color || '#14B8A6'};
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .certificate-subtitle {
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.secondary_text_color || '#6B7280'};
      }

      /* Content Sections */
      .content-section {
        padding: 0 40px;
        margin-bottom: 25px;
      }

      .section-title {
        font-family: ${settings.title_font_family || 'Helvetica, Arial, sans-serif'};
        font-size: ${settings.title_font_size || 24}px;
        font-weight: bold;
        color: ${settings.accent_color || '#14B8A6'};
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid ${settings.accent_color || '#14B8A6'};
      }

      /* Patient Information Grid */
      .patient-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }

      @media (min-width: 768px) {
        .patient-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .info-item {
        margin-bottom: 10px;
      }

      .info-label {
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.secondary_text_color || '#6B7280'};
        font-weight: 500;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-value {
        font-size: ${settings.body_font_size || 11}px;
        font-weight: 500;
      }

      /* Test Results */
      .test-results-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .test-result-card {
        border: 1px solid ${settings.border_color || '#E5E7EB'};
        border-radius: 6px;
        padding: 15px;
        background-color: rgba(255, 255, 255, 0.05);
      }

      .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid ${settings.border_color || '#E5E7EB'};
      }

      .test-name {
        font-weight: bold;
        font-size: ${(settings.body_font_size || 11) + 1}px;
        color: ${settings.text_color || '#1F2937'};
      }

      .test-status {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: ${settings.body_font_size || 11}px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .test-status.normal {
        background-color: #DCFCE7;
        color: #166534;
      }

      .test-status.abnormal {
        background-color: #FEE2E2;
        color: #991B1B;
      }

      .test-status.pending {
        background-color: #FEF3C7;
        color: #92400E;
      }

      .test-parameters {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }

      .parameter {
        display: flex;
        justify-content: space-between;
        font-size: ${settings.body_font_size || 11}px;
        padding: 2px 0;
      }

      .parameter-name {
        color: ${settings.secondary_text_color || '#6B7280'};
      }

      .parameter-value {
        font-weight: 500;
      }

      .test-findings,
      .test-recommendations {
        margin-top: 10px;
        font-size: ${settings.body_font_size || 11}px;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.02);
        border-radius: 4px;
      }

      .test-findings-title,
      .test-recommendations-title {
        font-weight: bold;
        margin-bottom: 4px;
        color: ${settings.text_color || '#1F2937'};
      }

      /* Medical Advice Sections */
      .medical-advice {
        background-color: rgba(20, 184, 166, 0.05);
        border-left: 4px solid ${settings.accent_color || '#14B8A6'};
        padding: 15px;
        border-radius: 4px;
        margin-top: 10px;
      }

      .advice-content {
        font-size: ${settings.body_font_size || 11}px;
        line-height: 1.6;
      }

      /* Signature Section */
      .signature-section {
        margin-top: 50px;
        padding: 0 40px;
        display: flex;
        flex-direction: column;
        align-items: ${settings.stamp_position === 'left' ? 'flex-start' : 
                     settings.stamp_position === 'center' ? 'center' : 'flex-end'};
      }

      .signature-container {
        text-align: ${settings.stamp_position === 'left' ? 'left' : 
                     settings.stamp_position === 'center' ? 'center' : 'right'};
        min-width: 300px;
      }

      .signature-image {
        height: 60px;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .doctor-name {
        font-weight: bold;
        font-size: ${(settings.body_font_size || 11) + 2}px;
        margin-bottom: 5px;
      }

      .doctor-info {
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.secondary_text_color || '#6B7280'};
        margin-bottom: 3px;
      }

      .signature-date {
        margin-top: 10px;
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.text_color || '#1F2937'};
      }

      .stamp-container {
        margin-top: 20px;
        display: ${settings.include_stamp ? 'block' : 'none'};
      }

      .stamp-image {
        height: 80px;
        opacity: 0.9;
      }

      /* QR Code */
      .qr-code-section {
        position: absolute;
        bottom: 120px;
        left: 40px;
        display: ${settings.show_qr_code ? 'flex' : 'none'};
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .qr-code-image {
        width: 80px;
        height: 80px;
      }

      .qr-code-text {
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.secondary_text_color || '#6B7280'};
        text-align: center;
      }

      /* Footer */
      .certificate-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 20px 40px;
        border-top: 1px solid ${settings.border_color || '#E5E7EB'};
        background-color: ${settings.body_background_color || '#FFFFFF'};
      }

      .footer-text {
        font-size: ${settings.body_font_size || 11}px;
        color: ${settings.secondary_text_color || '#6B7280'};
        text-align: center;
        margin-bottom: 8px;
      }

      .disclaimer-text {
        font-size: ${(settings.body_font_size || 11) - 1}px;
        color: ${settings.secondary_text_color || '#6B7280'};
        text-align: center;
        font-style: italic;
      }

      /* Utility Classes */
      .text-muted {
        color: ${settings.secondary_text_color || '#6B7280'};
      }

      .mb-2 { margin-bottom: 8px; }
      .mb-3 { margin-bottom: 12px; }
      .mb-4 { margin-bottom: 16px; }
      .mb-5 { margin-bottom: 20px; }
      .mt-2 { margin-top: 8px; }
      .mt-3 { margin-top: 12px; }
      .mt-4 { margin-top: 16px; }
      .mt-5 { margin-top: 20px; }
    `
  }

  private generateHeaderSection(clinic: Clinic, branch: Branch | undefined, settings: CertificateSettings): string {
    const displayAddress = settings.show_branch_info && branch?.address ? branch.address : clinic.address
    const displayPhone = settings.show_branch_info && branch?.phone ? branch.phone : clinic.phone
    const displayEmail = settings.show_branch_info && branch?.email ? branch.email : clinic.email

    return `
      <div class="certificate-header">
        <div class="watermark">
          <div class="watermark-text">${settings.watermark_text || 'MEDICAL CERTIFICATE'}</div>
        </div>
        <div class="header-content">
          ${settings.include_logo && settings.logo_url ? `
            <div class="logo-container">
              <img src="${settings.logo_url}" alt="${clinic.name}" class="clinic-logo" />
            </div>
          ` : ''}
          
          <h1 class="clinic-name">${settings.clinic_name || clinic.name}</h1>
          
          <div class="clinic-info">
            ${settings.show_clinic_address && displayAddress ? `
              <div class="clinic-info-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>${displayAddress}</span>
              </div>
            ` : ''}
            
            ${settings.show_clinic_phone && displayPhone ? `
              <div class="clinic-info-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/>
                </svg>
                <span>${displayPhone}</span>
              </div>
            ` : ''}
            
            ${settings.show_clinic_email && displayEmail ? `
              <div class="clinic-info-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>${displayEmail}</span>
              </div>
            ` : ''}
            
            ${settings.show_registration_number && clinic.registration_number ? `
              <div class="clinic-info-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z"/>
                </svg>
                <span>Reg: ${clinic.registration_number}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `
  }

  private generateTitleSection(certificate: Certificate, settings: CertificateSettings): string {
    return `
      <div class="title-section">
        <h2 class="certificate-title">MEDICAL CERTIFICATE</h2>
        <div class="certificate-subtitle">
          Certificate #${certificate.certificate_number} • Issued on ${this.formatDate(certificate.issue_date)}
        </div>
      </div>
    `
  }

  private generatePatientSection(
    patient: Patient, 
    certificate: Certificate, 
    settings: CertificateSettings,
    formatDate: (date: string | null | undefined) => string
  ): string {
    return `
      <div class="content-section">
        <h3 class="section-title">Patient Information</h3>
        <div class="patient-grid">
          <div class="info-item">
            <div class="info-label">Full Name</div>
            <div class="info-value">${patient.first_name} ${patient.last_name}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">Date of Examination</div>
            <div class="info-value">${formatDate(certificate.issue_date)}</div>
          </div>
          
          <div class="info-item">
            <div class="info-label">ID Number</div>
            <div class="info-value">${patient.id_number}</div>
          </div>
          
          ${patient.employee_number ? `
            <div class="info-item">
              <div class="info-label">Employee Number</div>
              <div class="info-value">${patient.employee_number}</div>
            </div>
          ` : ''}
          
          ${patient.job_title ? `
            <div class="info-item">
              <div class="info-label">Occupation</div>
              <div class="info-value">${patient.job_title}</div>
            </div>
          ` : ''}
          
          ${patient.department ? `
            <div class="info-item">
              <div class="info-label">Department</div>
              <div class="info-value">${patient.department}</div>
            </div>
          ` : ''}
          
          <!-- Company Information -->
          ${patient.employer_id ? `
            <div class="info-item">
              <div class="info-label">Company</div>
              <div class="info-value">${patient.employer_id}</div>
            </div>
          ` : ''}
          
          ${patient.date_of_birth ? `
            <div class="info-item">
              <div class="info-label">Date of Birth</div>
              <div class="info-value">${formatDate(patient.date_of_birth)}</div>
            </div>
          ` : ''}
          
          ${patient.gender ? `
            <div class="info-item">
              <div class="info-label">Gender</div>
              <div class="info-value">${patient.gender}</div>
            </div>
          ` : ''}
          
          ${patient.phone ? `
            <div class="info-item">
              <div class="info-label">Contact Phone</div>
              <div class="info-value">${patient.phone}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  private generateMedicalFindingsSection(
    certificate: Certificate,
    settings: CertificateSettings,
    formatDate: (date: string | null | undefined) => string,
    formatCertificateType: (type: string) => string
  ): string {
    return `
      <div class="content-section">
        <h3 class="section-title">Medical Findings</h3>
        
        <div class="patient-grid">
          <div class="info-item">
            <div class="info-label">Certificate Type</div>
            <div class="info-value">${formatCertificateType(certificate.certificate_type)}</div>
          </div>
          
          ${settings.show_validity_dates && certificate.valid_from ? `
            <div class="info-item">
              <div class="info-label">Valid From</div>
              <div class="info-value">${formatDate(certificate.valid_from)}</div>
            </div>
          ` : ''}
          
          ${settings.show_validity_dates && certificate.valid_until ? `
            <div class="info-item">
              <div class="info-label">Valid Until</div>
              <div class="info-value">${formatDate(certificate.valid_until)}</div>
            </div>
          ` : ''}
        </div>
        
        ${settings.show_diagnosis_section && certificate.diagnosis ? `
          <div class="medical-advice mt-3">
            <div class="info-label">Diagnosis</div>
            <div class="advice-content">${certificate.diagnosis}</div>
          </div>
        ` : ''}
      </div>
    `
  }

  private generateTestResultsSection(testResults: TestResult[], settings: CertificateSettings): string {
    const testCards = testResults.map(test => {
      const statusClass = test.is_normal === true ? 'normal' : 
                         test.is_normal === false ? 'abnormal' : 'pending'
      const statusText = test.is_normal === true ? 'NORMAL' : 
                        test.is_normal === false ? 'ABNORMAL' : 'PENDING'

      const parameters = test.results ? Object.entries(test.results).map(([key, value]) => `
        <div class="parameter">
          <span class="parameter-name">${key}:</span>
          <span class="parameter-value">${String(value)}</span>
        </div>
      `).join('') : ''

      return `
        <div class="test-result-card">
          <div class="test-header">
            <div class="test-name">${test.test_name || 'Test Result'}</div>
            <div class="test-status ${statusClass}">${statusText}</div>
          </div>
          
          ${parameters ? `
            <div class="test-parameters">
              ${parameters}
            </div>
          ` : ''}
          
          ${test.findings ? `
            <div class="test-findings">
              <div class="test-findings-title">Findings:</div>
              <div>${test.findings}</div>
            </div>
          ` : ''}
          
          ${test.recommendations ? `
            <div class="test-recommendations">
              <div class="test-recommendations-title">Recommendations:</div>
              <div>${test.recommendations}</div>
            </div>
          ` : ''}
          
          <div class="text-muted mt-2" style="font-size: ${(settings.body_font_size || 11) - 1}px;">
            Performed on: ${this.formatDate(test.performed_at)}
            ${test.performed_by ? ` • By: ${test.performed_by}` : ''}
          </div>
        </div>
      `
    }).join('')

    return `
      <div class="content-section">
        <h3 class="section-title">Test Results</h3>
        <div class="test-results-container">
          ${testCards}
        </div>
      </div>
    `
  }

  private generateRestrictionsSection(certificate: Certificate, settings: CertificateSettings): string {
    return `
      <div class="content-section">
        <h3 class="section-title">Work Restrictions</h3>
        <div class="medical-advice">
          <div class="advice-content">${certificate.restrictions}</div>
        </div>
      </div>
    `
  }

  private generateRecommendationsSection(certificate: Certificate, settings: CertificateSettings): string {
    return `
      <div class="content-section">
        <h3 class="section-title">Medical Recommendations</h3>
        <div class="medical-advice">
          <div class="advice-content">${certificate.recommendations}</div>
        </div>
      </div>
    `
  }

  private generateSignatureSection(
    doctor: User,
    certificate: Certificate,
    clinic: Clinic,
    settings: CertificateSettings,
    formatDate: (date: string | null | undefined) => string
  ): string {
    return `
      <div class="signature-section">
        <div class="signature-container">
          ${settings.signature_image_url ? `
            <img src="${settings.signature_image_url}" alt="Doctor Signature" class="signature-image" />
          ` : `
            <div style="height: 60px; border-bottom: 2px solid #000; width: 200px; margin-bottom: 10px;"></div>
          `}
          
          <div class="doctor-name">${doctor.full_name}</div>
          
          ${doctor.specialization ? `
            <div class="doctor-info">${doctor.specialization}</div>
          ` : ''}
          
          ${doctor.professional_registration_number ? `
            <div class="doctor-info">Registration: ${doctor.professional_registration_number}</div>
          ` : ''}
          
          <div class="doctor-info">${settings.clinic_name || clinic.name}</div>
          
          <div class="signature-date">
            Date: ${formatDate(certificate.issue_date)}
          </div>
          
          ${settings.include_stamp && settings.stamp_image_url ? `
            <div class="stamp-container">
              <img src="${settings.stamp_image_url}" alt="Official Stamp" class="stamp-image" />
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  private generateQRCodeSection(qrCodeDataUrl: string): string {
    return `
      <div class="qr-code-section">
        <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code-image" />
        <div class="qr-code-text">Scan to verify</div>
      </div>
    `
  }

  private generateFooterSection(settings: CertificateSettings): string {
    return `
      <div class="certificate-footer">
        <div class="footer-text">${settings.footer_text || 'This is an official medical certificate issued by our facility.'}</div>
        ${settings.disclaimer_text ? `
          <div class="disclaimer-text">${settings.disclaimer_text}</div>
        ` : ''}
      </div>
    `
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Helper method to generate certificate without HTML2Canvas (server-side)
  async generateCertificateDirect(data: {
    certificate: Certificate;
    patient: Patient;
    clinic: Clinic;
    branch?: Branch;
    doctor: User;
    testResults?: TestResult[];
    settings?: CertificateSettings;
  }): Promise<Blob> {
    const {
      certificate,
      patient,
      clinic,
      branch,
      doctor,
      testResults = [],
      settings = {}
    } = data

    const mergedSettings = { ...this.defaultSettings, ...settings }

    // Generate QR code if enabled
    let qrCodeDataUrl = ''
    if (mergedSettings.show_qr_code && mergedSettings.qr_code_url) {
      qrCodeDataUrl = await this.generateQRCode(
        `${mergedSettings.qr_code_url}${certificate.id}`,
        100
      )
    }

    // Create PDF directly using jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    // Set PDF metadata
    pdf.setProperties({
      title: `Medical Certificate #${certificate.certificate_number}`,
      subject: 'Medical Certificate',
      author: clinic.name,
      keywords: 'medical, certificate, health, examination',
      creator: 'Medical Certificate Generator'
    })

    // Add content to PDF
    this.addContentToPDF(pdf, {
      certificate,
      patient,
      clinic,
      branch,
      doctor,
      testResults,
      settings: mergedSettings,
      qrCodeDataUrl
    })

    // Return blob
    return pdf.output('blob')
  }

  private addContentToPDF(
    pdf: jsPDF,
    data: {
      certificate: Certificate;
      patient: Patient;
      clinic: Clinic;
      branch?: Branch;
      doctor: User;
      testResults: TestResult[];
      settings: CertificateSettings;
      qrCodeDataUrl: string;
    }
  ): void {
    const { certificate, patient, clinic, branch, doctor, testResults, settings, qrCodeDataUrl } = data
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const margin = 20

    let yPosition = margin

    // Helper functions
    const addText = (text: string, x: number, y: number, options?: any) => {
      pdf.text(text, x, y, options)
    }

    const addLine = (x1: number, y1: number, x2: number, y2: number) => {
      pdf.line(x1, y1, x2, y2)
    }

    const addRectangle = (x: number, y: number, w: number, h: number, style?: string) => {
      if (style === 'F') {
        pdf.rect(x, y, w, h, 'F')
      } else if (style === 'FD') {
        pdf.rect(x, y, w, h, 'FD')
      } else {
        pdf.rect(x, y, w, h)
      }
    }

    // Set default font
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    pdf.setFontSize(settings.body_font_size || 11)

    // Add header background
    pdf.setFillColor(settings.header_color || '#0D9488')
    addRectangle(0, 0, pageWidth, 60, 'F')

    // Add clinic name
    pdf.setTextColor(settings.header_text_color || '#FFFFFF')
    pdf.setFontSize((settings.title_font_size || 24) * 1.2)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(settings.clinic_name || clinic.name, pageWidth / 2, 35, { align: 'center' })

    // Add clinic info
    pdf.setFontSize(settings.body_font_size || 11)
    const infoLines = []
    if (settings.show_clinic_address) {
      const address = settings.show_branch_info && branch?.address ? branch.address : clinic.address
      if (address) infoLines.push(address)
    }
    if (settings.show_clinic_phone) {
      const phone = settings.show_branch_info && branch?.phone ? branch.phone : clinic.phone
      if (phone) infoLines.push(`Phone: ${phone}`)
    }
    if (settings.show_clinic_email) {
      const email = settings.show_branch_info && branch?.email ? branch.email : clinic.email
      if (email) infoLines.push(`Email: ${email}`)
    }
    if (settings.show_registration_number && clinic.registration_number) {
      infoLines.push(`Reg: ${clinic.registration_number}`)
    }

    const infoY = 45
    infoLines.forEach((line, index) => {
      addText(line, pageWidth / 2, infoY + (index * 5), { align: 'center' })
    })

    // Reset text color
    pdf.setTextColor(settings.text_color || '#1F2937')
    yPosition = 80

    // Add certificate title
    pdf.setFontSize((settings.title_font_size || 24) * 1.5)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText('MEDICAL CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' })
    
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    addText(
      `Certificate #${certificate.certificate_number} • Issued on ${this.formatDate(certificate.issue_date)}`,
      pageWidth / 2,
      yPosition + 8,
      { align: 'center' }
    )

    // Add line separator
    pdf.setDrawColor(settings.accent_color || '#14B8A6')
    addLine(margin, yPosition + 15, pageWidth - margin, yPosition + 15)
    yPosition += 25

    // Add patient information
    if (settings.show_patient_details_section) {
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Patient Information', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      const patientInfo = [
        `Full Name: ${patient.first_name} ${patient.last_name}`,
        `Date of Examination: ${this.formatDate(certificate.issue_date)}`,
        `ID Number: ${patient.id_number}`,
        ...(patient.employee_number ? [`Employee Number: ${patient.employee_number}`] : []),
        ...(patient.job_title ? [`Occupation: ${patient.job_title}`] : []),
        ...(patient.department ? [`Department: ${patient.department}`] : []),
        ...(patient.employer_id ? [`Company: ${patient.employer_id}`] : []),
      ]

      patientInfo.forEach((info, index) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = margin
        }
        addText(info, margin, yPosition)
        yPosition += 6
      })

      yPosition += 10
    }

    // Add more sections similarly...

    // Add signature
    const signatureY = pageHeight - 60
    addLine(pageWidth - margin - 100, signatureY, pageWidth - margin, signatureY)
    addText(doctor.full_name, pageWidth - margin - 50, signatureY + 8, { align: 'center' })
    
    if (doctor.professional_registration_number) {
      addText(`Registration: ${doctor.professional_registration_number}`, pageWidth - margin - 50, signatureY + 14, { align: 'center' })
    }
    
    addText(settings.clinic_name || clinic.name, pageWidth - margin - 50, signatureY + 20, { align: 'center' })
    addText(`Date: ${this.formatDate(certificate.issue_date)}`, pageWidth - margin - 50, signatureY + 26, { align: 'center' })

    // Add QR code if enabled
    if (settings.show_qr_code && qrCodeDataUrl) {
      // Note: Adding images to jsPDF requires additional handling
      // This is a simplified version
      addText('Scan to verify', margin, pageHeight - 30)
    }

    // Add footer
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setTextColor(settings.secondary_text_color || '#6B7280')
    addText(
      settings.footer_text || 'This is an official medical certificate issued by our facility.',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    )
  }

  // Generate sample certificate for preview
  async generateSampleCertificate(settings: CertificateSettings): Promise<Blob> {
    const sampleData = {
      certificate: {
        id: 'sample-123',
        clinic_id: 'clinic-123',
        appointment_id: 'appointment-123',
        patient_id: 'patient-123',
        certificate_number: '2024-001234',
        certificate_type: 'fit_to_work',
        issue_date: new Date().toISOString(),
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: 'Routine health check completed. All parameters within normal limits.',
        restrictions: 'No heavy lifting above 25kg. Requires corrected vision for computer work.',
        recommendations: 'Annual health check recommended. Maintain regular exercise routine.',
        issued_by: 'doctor-123',
        doctor_name: 'Dr. Sarah Johnson',
        doctor_registration_number: 'MED-789012',
        doctor_signature_url: settings.signature_image_url || null,
        pdf_url: null,
        sent_to_employer: false,
        sent_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Certificate,
      patient: {
        id: 'patient-123',
        clinic_id: 'clinic-123',
        employer_id: 'TechCorp Solutions',
        id_number: 'ID-78901234',
        passport_number: null,
        first_name: 'John',
        last_name: 'Smith',
        date_of_birth: '1985-06-15',
        gender: 'Male',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, City',
        employee_number: 'EMP-5678',
        job_title: 'Software Engineer',
        department: 'Engineering',
        employment_start_date: '2020-01-15',
        blood_type: 'O+',
        allergies: 'None known',
        chronic_conditions: 'None',
        emergency_contact_name: 'Jane Smith',
        emergency_contact_phone: '+1 (555) 987-6543',
        consent_given: true,
        consent_date: '2024-01-15',
        photo_url: null,
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Patient,
      clinic: {
        id: 'clinic-123',
        name: 'City Medical Center',
        registration_number: 'MED-123456',
        email: 'info@citymedical.com',
        phone: '+1 (555) 789-0123',
        address: '123 Medical Center Dr, Medical City, MC 12345',
        logo_url: settings.logo_url || null,
        settings: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        data_retention_days: 365,
      } as Clinic,
      doctor: {
        id: 'doctor-123',
        clinic_id: 'clinic-123',
        branch_id: null,
        email: 'dr.johnson@citymedical.com',
        full_name: 'Dr. Sarah Johnson',
        phone: '+1 (555) 456-7890',
        role: 'doctor',
        permissions: {},
        professional_registration_number: 'MED-789012',
        specialization: 'General Medicine',
        avatar_url: null,
        is_active: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User,
      testResults: [
        {
          id: 'test-1',
          clinic_id: 'clinic-123',
          appointment_id: 'appointment-123',
          patient_id: 'patient-123',
          test_id: 'test-cbc',
          performed_by: 'Nurse Jane',
          performed_at: new Date().toISOString(),
          results: {
            'White Blood Cells': '7.2 x10³/μL',
            'Hemoglobin': '14.5 g/dL',
            'Platelets': '250 x10³/μL',
          },
          is_normal: true,
          findings: 'All parameters within normal range',
          recommendations: null,
          attachments: [],
          reviewed_by: 'doctor-123',
          reviewed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as TestResult,
        {
          id: 'test-2',
          clinic_id: 'clinic-123',
          appointment_id: 'appointment-123',
          patient_id: 'patient-123',
          test_id: 'test-vision',
          performed_by: 'Optometrist Mike',
          performed_at: new Date().toISOString(),
          results: {
            'Visual Acuity (Right)': '20/40',
            'Visual Acuity (Left)': '20/30',
          },
          is_normal: false,
          findings: 'Requires vision correction',
          recommendations: 'Refer to ophthalmologist for eyeglasses prescription',
          attachments: [],
          reviewed_by: 'doctor-123',
          reviewed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as TestResult,
      ],
      settings,
    }

    return this.generateCertificate(sampleData)
  }
}

// Export a singleton instance
export const certificateGenerator = new CertificateGenerator()

// Export helper functions
export async function generateCertificatePDF(
  certificate: Certificate,
  patient: Patient,
  clinic: Clinic,
  doctor: User,
  settings?: CertificateSettings,
  testResults?: TestResult[],
  branch?: Branch
): Promise<Blob> {
  const generator = new CertificateGenerator()
  return generator.generateCertificate({
    certificate,
    patient,
    clinic,
    doctor,
    testResults: testResults || [],
    settings,
    branch,
  })
}

export async function generateSampleCertificatePDF(settings: CertificateSettings): Promise<Blob> {
  const generator = new CertificateGenerator()
  return generator.generateSampleCertificate(settings)
}