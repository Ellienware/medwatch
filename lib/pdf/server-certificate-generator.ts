// lib/pdf/server-certificate-generator.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Certificate, Patient, Clinic, Branch, TestResult, User, CertificateTemplate } from "@/lib/types/database"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

// Extended settings interface for template support
interface ExtendedCertificateSettings extends CertificateSettings {
  force_one_page?: boolean
  compact_tables?: boolean
  max_sections?: number
  abbreviate_text?: boolean
  patient_details_layout?: 'compact' | 'detailed' | 'two_column'
}

export class ServerCertificateGenerator {
  private defaultSettings: ExtendedCertificateSettings = {
    // Branding & Colors
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

    // Layout Options
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
    
    // Sections to Show/Hide
    show_patient_details_section: true,
    show_test_results_section: true,
    show_diagnosis_section: true,
    show_restrictions_section: true,
    show_recommendations_section: true,
    show_validity_dates: true,
    show_qr_code: false,
    
    // Font Settings
    title_font_family: "Helvetica, Arial, sans-serif",
    body_font_family: "Helvetica, Arial, sans-serif",
    title_font_size: 24,
    body_font_size: 11,
    
    // Template-specific extensions
    force_one_page: false,
    compact_tables: false,
    max_sections: 6,
    abbreviate_text: false,
    patient_details_layout: 'detailed',
  }

  async generateCertificate(data: {
    certificate: Certificate;
    patient: Patient;
    clinic: Clinic;
    branch?: Branch;
    doctor: User;
    testResults?: TestResult[];
    settings?: CertificateSettings;
    template?: CertificateTemplate;
  }): Promise<Buffer> {
    const {
      certificate,
      patient,
      clinic,
      branch,
      doctor,
      testResults = [],
      settings = {},
      template
    } = data

    // Merge settings with defaults and template settings
    const templateSettings = template?.settings as ExtendedCertificateSettings || {}
    const mergedSettings: ExtendedCertificateSettings = { 
      ...this.defaultSettings, 
      ...settings, 
      ...templateSettings 
    }

    // Apply template-specific overrides
    if (template) {
      // Override section visibility based on template sections_included
      if (template.sections_included) {
        mergedSettings.show_patient_details_section = template.sections_included.includes('patient_info')
        mergedSettings.show_test_results_section = template.sections_included.includes('test_results')
        mergedSettings.show_diagnosis_section = template.sections_included.includes('diagnosis')
        mergedSettings.show_restrictions_section = template.sections_included.includes('restrictions')
        mergedSettings.show_recommendations_section = template.sections_included.includes('recommendations')
      }
      
      // Apply template layout settings
      if (template.layout === 'compact') {
        mergedSettings.title_font_size = Math.min(mergedSettings.title_font_size || 24, 20)
        mergedSettings.body_font_size = Math.min(mergedSettings.body_font_size || 11, 10)
        mergedSettings.compact_tables = true
        mergedSettings.patient_details_layout = 'compact'
      } else if (template.layout === 'two_column') {
        mergedSettings.patient_details_layout = 'two_column'
      }
      
      // Force one-page if template specifies
      if (template.is_one_page) {
        mergedSettings.force_one_page = true
        mergedSettings.compact_tables = true
        mergedSettings.max_sections = 4
        mergedSettings.abbreviate_text = true
      }
    }

    // Create PDF
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

    // Add content to PDF based on template requirements
    if (mergedSettings.force_one_page) {
      this.generateOnePageCertificate(pdf, {
        certificate,
        patient,
        clinic,
        branch,
        doctor,
        testResults,
        settings: mergedSettings,
        template
      })
    } else {
      this.generateMultiPageCertificate(pdf, {
        certificate,
        patient,
        clinic,
        branch,
        doctor,
        testResults,
        settings: mergedSettings,
        template
      })
    }

    // Return as Buffer for server-side usage
    const arrayBuffer = pdf.output('arraybuffer')
    return Buffer.from(arrayBuffer)
  }

  private generateOnePageCertificate(
    pdf: jsPDF,
    data: {
    certificate: Certificate;
    patient: Patient;
    clinic: Clinic;
    branch?: Branch;
    doctor: User;
    testResults: TestResult[];
    settings: ExtendedCertificateSettings;
    template?: CertificateTemplate;
    }
  ): void {
    const { certificate, patient, clinic, branch, doctor, testResults, settings, template } = data
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const margin = 12
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
      } else {
        pdf.rect(x, y, w, h)
      }
    }

    // Set compact font sizes
    const titleFontSize = Math.min(settings.title_font_size || 24, 20)
    const bodyFontSize = Math.min(settings.body_font_size || 11, 9)
    
    // Add watermark if enabled
    if (settings.include_watermark) {
      pdf.setFontSize(80)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      const watermarkText = settings.watermark_text || 'MEDICAL CERTIFICATE'
      pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45 
      })
      pdf.setTextColor(settings.text_color || '#1F2937')
    }
    
    // Add border if enabled
    if (settings.show_border) {
      pdf.setDrawColor(settings.border_color || '#E5E7EB')
      pdf.setLineWidth(settings.border_width || 1)
      const borderMargin = 5
      addRectangle(
        borderMargin, 
        borderMargin, 
        pageWidth - (2 * borderMargin), 
        pageHeight - (2 * borderMargin)
      )
    }
    
    // Header
    pdf.setFillColor(settings.header_color || '#0D9488')
    addRectangle(0, 0, pageWidth, 40, 'F')
    
    // Add logo if enabled
    if (settings.include_logo && clinic.logo_url) {
      try {
        // Note: jsPDF doesn't support remote images directly
        // You would need to fetch and convert the image to base64
        // For now, we'll just add text
      } catch (error) {
        console.error('Error adding logo:', error)
      }
    }
    
    pdf.setTextColor(settings.header_text_color || '#FFFFFF')
    pdf.setFontSize(titleFontSize * 0.9)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(clinic.name, pageWidth / 2, 20, { align: 'center' })
    
    // Clinic info
    pdf.setFontSize(bodyFontSize)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    const clinicInfo = []
    
    if (settings.show_clinic_address) {
      const address = settings.show_branch_info && branch?.address ? branch.address : clinic.address
      if (address) clinicInfo.push(address)
    }
    if (settings.show_clinic_phone) {
      const phone = settings.show_branch_info && branch?.phone ? branch.phone : clinic.phone
      if (phone) clinicInfo.push(`Phone: ${phone}`)
    }
    if (settings.show_clinic_email) {
      const email = settings.show_branch_info && branch?.email ? branch.email : clinic.email
      if (email) clinicInfo.push(`Email: ${email}`)
    }
    if (settings.show_registration_number && clinic.registration_number) {
      clinicInfo.push(`Reg: ${clinic.registration_number}`)
    }
    
    clinicInfo.forEach((line, index) => {
      addText(line, pageWidth / 2, 28 + (index * 4), { align: 'center' })
    })
    
    yPosition = 50
    
    // Certificate Title
    pdf.setTextColor(settings.text_color || '#1F2937')
    pdf.setFontSize(titleFontSize)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText('MEDICAL CERTIFICATE', pageWidth / 2, yPosition, { align: 'center' })
    
    pdf.setFontSize(bodyFontSize)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    addText(
      `Certificate #${certificate.certificate_number} • ${this.formatDate(certificate.issue_date)}`,
      pageWidth / 2,
      yPosition + 6,
      { align: 'center' }
    )
    
    yPosition += 15
    
    // Add separator line
    pdf.setDrawColor(settings.accent_color || '#14B8A6')
    addLine(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
    
    // Patient Information - Compact Layout
    if (settings.show_patient_details_section) {
      pdf.setFontSize(bodyFontSize + 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      addText('PATIENT INFORMATION', margin, yPosition)
      yPosition += 8
      
      pdf.setFontSize(bodyFontSize)
      pdf.setTextColor(settings.text_color || '#1F2937')
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      
      const patientInfo = [
        [`Name:`, `${patient.first_name} ${patient.last_name}`],
        [`ID:`, patient.id_number],
        [`Exam Date:`, this.formatDate(certificate.issue_date)],
        ...(patient.employee_number ? [[`Emp #:`, patient.employee_number]] : []),
        ...(patient.job_title ? [[`Occupation:`, patient.job_title]] : []),
        ...(patient.department ? [[`Dept:`, patient.department]] : []),
        ...(patient.employer_company_name ? [[`Company:`, patient.employer_company_name]] : []),
      ]
      
      // Two column compact layout
      const colWidth = (pageWidth - (2 * margin)) / 2
      const maxRows = Math.min(6, patientInfo.length) // Limit rows for 1-page
      
      for (let i = 0; i < maxRows; i++) {
        const [label, value] = patientInfo[i]
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = margin + (col * colWidth)
        const y = yPosition + (row * 5)
        
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
        addText(this.abbreviateText(label, 15), x, y)
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
        addText(this.abbreviateText(value || '', 25), x + 18, y)
      }
      
      yPosition += Math.ceil(maxRows / 2) * 5 + 10
    }
    
    // Diagnosis - Compact
    if (settings.show_diagnosis_section && certificate.diagnosis) {
      pdf.setFontSize(bodyFontSize + 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      addText('DIAGNOSIS', margin, yPosition)
      yPosition += 8
      
      pdf.setFontSize(bodyFontSize)
      pdf.setTextColor(settings.text_color || '#1F2937')
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      
      const diagnosisText = settings.abbreviate_text 
        ? this.abbreviateText(certificate.diagnosis, 200)
        : certificate.diagnosis
      
      const diagnosisLines = pdf.splitTextToSize(
        diagnosisText,
        pageWidth - (2 * margin)
      )
      
      // Limit lines for 1-page
      const maxLines = Math.min(4, diagnosisLines.length)
      for (let i = 0; i < maxLines; i++) {
        addText(diagnosisLines[i], margin, yPosition)
        yPosition += 4
      }
      
      if (diagnosisLines.length > maxLines) {
        addText('...', margin, yPosition)
        yPosition += 4
      }
      
      yPosition += 6
    }
    
    // Test Results - Compact Table
    if (settings.show_test_results_section && testResults.length > 0) {
      pdf.setFontSize(bodyFontSize + 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      addText('TEST RESULTS', margin, yPosition)
      yPosition += 8
      
      // Limit to 3 tests for 1-page
      const limitedTests = testResults.slice(0, 3)
      
      limitedTests.forEach((test, index) => {
        if (yPosition > pageHeight - 60) return
        
        pdf.setFontSize(bodyFontSize)
        pdf.setTextColor(settings.text_color || '#1F2937')
        
        // Test name and status
        const testName = this.abbreviateText(test.test_name || 'Test', 30)
        const status = test.is_normal === true ? 'NORMAL' : 
                      test.is_normal === false ? 'ABNORMAL' : 'PENDING'
        
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
        addText(testName, margin, yPosition)
        
        const statusColor = test.is_normal === true ? '#166534' : 
                           test.is_normal === false ? '#991B1B' : '#92400E'
        pdf.setTextColor(statusColor)
        addText(status, pageWidth - margin, yPosition, { align: 'right' })
        pdf.setTextColor(settings.text_color || '#1F2937')
        
        yPosition += 4
        
        // Show only key abnormal results
        if (test.results && !test.is_normal && yPosition < pageHeight - 40) {
          const results = test.results
          const abnormalResults = Object.entries(results).filter(([key, value]) => 
            this.isResultAbnormal(test.test_code, key, String(value))
          ).slice(0, 2) // Limit to 2 abnormal results
          
          abnormalResults.forEach(([param, value]) => {
            if (yPosition > pageHeight - 40) return
            
            pdf.setFontSize(bodyFontSize - 1)
            pdf.setTextColor('#991B1B')
            addText(`  • ${this.formatParameterName(param)}: ${value}`, margin + 5, yPosition)
            yPosition += 3
          })
          pdf.setTextColor(settings.text_color || '#1F2937')
        }
        
        yPosition += 4
        
        // Add separator if not last test
        if (index < limitedTests.length - 1 && yPosition < pageHeight - 40) {
          pdf.setDrawColor(settings.border_color || '#E5E7EB')
          addLine(margin, yPosition, pageWidth - margin, yPosition)
          yPosition += 6
        }
      })
      
      if (testResults.length > 3) {
        pdf.setFontSize(bodyFontSize - 1)
        pdf.setTextColor(settings.secondary_text_color || '#6B7280')
        addText(`+ ${testResults.length - 3} more tests not shown`, margin, yPosition)
        yPosition += 5
      }
      
      yPosition += 6
    }
    
    // Restrictions - Compact
    if (settings.show_restrictions_section && certificate.restrictions) {
      pdf.setFontSize(bodyFontSize + 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      addText('WORK RESTRICTIONS', margin, yPosition)
      yPosition += 8
      
      pdf.setFontSize(bodyFontSize)
      pdf.setTextColor(settings.text_color || '#1F2937')
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      
      const restrictionText = settings.abbreviate_text
        ? this.abbreviateText(certificate.restrictions, 150)
        : certificate.restrictions
      
      const restrictionLines = pdf.splitTextToSize(
        restrictionText,
        pageWidth - (2 * margin)
      )
      
      const maxLines = Math.min(3, restrictionLines.length)
      for (let i = 0; i < maxLines; i++) {
        addText(restrictionLines[i], margin, yPosition)
        yPosition += 4
      }
      
      if (restrictionLines.length > maxLines) {
        addText('...', margin, yPosition)
        yPosition += 4
      }
      
      yPosition += 6
    }
    
    // Recommendations - Compact (only if space allows)
    if (settings.show_recommendations_section && certificate.recommendations && yPosition < pageHeight - 50) {
      pdf.setFontSize(bodyFontSize + 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      addText('RECOMMENDATIONS', margin, yPosition)
      yPosition += 8
      
      pdf.setFontSize(bodyFontSize)
      pdf.setTextColor(settings.text_color || '#1F2937')
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      
      const recommendationText = settings.abbreviate_text
        ? this.abbreviateText(certificate.recommendations, 100)
        : certificate.recommendations
      
      const recommendationLines = pdf.splitTextToSize(
        recommendationText,
        pageWidth - (2 * margin)
      )
      
      const maxLines = Math.min(2, recommendationLines.length)
      for (let i = 0; i < maxLines; i++) {
        addText(recommendationLines[i], margin, yPosition)
        yPosition += 4
      }
      
      yPosition += 6
    }
    
    // Signature Area - Compact
    const signatureY = Math.max(yPosition + 20, pageHeight - 40)
    pdf.setDrawColor(settings.accent_color || '#14B8A6')
    addLine(pageWidth - margin - 80, signatureY, pageWidth - margin, signatureY)
    
    pdf.setFontSize(bodyFontSize + 1)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(doctor.full_name, pageWidth - margin - 40, signatureY + 6, { align: 'center' })
    
    pdf.setFontSize(bodyFontSize)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    
    if (doctor.professional_registration_number) {
      addText(`Reg: ${doctor.professional_registration_number}`, pageWidth - margin - 40, signatureY + 12, { align: 'center' })
    }
    
    addText(clinic.name, pageWidth - margin - 40, signatureY + 18, { align: 'center' })
    addText(this.formatDate(certificate.issue_date), pageWidth - margin - 40, signatureY + 24, { align: 'center' })
    
    // Add stamp if enabled
    if (settings.include_stamp && settings.stamp_image_url) {
      // Note: Would need to handle image embedding
      // For now, add text stamp
      pdf.setFontSize(bodyFontSize - 1)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('[OFFICIAL STAMP]', pageWidth - margin - 100, signatureY + 30)
    }
    
    // Footer
    pdf.setFontSize(bodyFontSize - 1)
    pdf.setTextColor(settings.secondary_text_color || '#6B7280')
    
    if (settings.footer_text) {
      addText(
        settings.footer_text,
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      )
    }
    
    if (settings.disclaimer_text) {
      addText(
        settings.disclaimer_text,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center', fontStyle: 'italic' }
      )
    }
    
    // Add page number
    pdf.setFontSize(bodyFontSize - 2)
    addText('Page 1 of 1', pageWidth / 2, pageHeight - 4, { align: 'center' })
  }

  private generateMultiPageCertificate(
    pdf: jsPDF,
    data: {
      certificate: Certificate;
      patient: Patient;
      clinic: Clinic;
      branch?: Branch;
      doctor: User;
      testResults: TestResult[];
      settings: ExtendedCertificateSettings;
      template?: CertificateTemplate
    }
  ): void {
    const { certificate, patient, clinic, branch, doctor, testResults, settings, template } = data
    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const margin = 20
    let yPosition = margin
    let pageNumber = 1

    const addText = (text: string, x: number, y: number, options?: any) => {
      pdf.text(text, x, y, options)
    }

    const addLine = (x1: number, y1: number, x2: number, y2: number) => {
      pdf.line(x1, y1, x2, y2)
    }

    const addRectangle = (x: number, y: number, w: number, h: number, style?: string) => {
      if (style === 'F') {
        pdf.rect(x, y, w, h, 'F')
      } else {
        pdf.rect(x, y, w, h)
      }
    }

    const checkNewPage = () => {
      if (yPosition > pageHeight - 50) {
        pdf.addPage()
        yPosition = margin
        pageNumber++
        
        // Add header to new page
        this.addPageHeader(pdf, clinic.name, certificate.certificate_number, pageNumber, settings)
      }
    }

    // Add watermark if enabled
    if (settings.include_watermark) {
      pdf.setFontSize(80)
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      const watermarkText = settings.watermark_text || 'MEDICAL CERTIFICATE'
      pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, { 
        align: 'center',
        angle: 45 
      })
      pdf.setTextColor(settings.text_color || '#1F2937')
    }
    
    // Add border if enabled
    if (settings.show_border) {
      pdf.setDrawColor(settings.border_color || '#E5E7EB')
      pdf.setLineWidth(settings.border_width || 1)
      const borderMargin = 10
      addRectangle(
        borderMargin, 
        borderMargin, 
        pageWidth - (2 * borderMargin), 
        pageHeight - (2 * borderMargin)
      )
    }

    // Header
    pdf.setFillColor(settings.header_color || '#0D9488')
    addRectangle(0, 0, pageWidth, 60, 'F')

    // Add logo if enabled
    if (settings.include_logo && clinic.logo_url) {
      // Logo handling would go here
    }

    // Clinic name
    pdf.setTextColor(settings.header_text_color || '#FFFFFF')
    pdf.setFontSize((settings.title_font_size || 24) * 1.2)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(clinic.name, pageWidth / 2, 35, { align: 'center' })

    // Clinic info
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
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

    // Certificate title
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

    // Add separator
    pdf.setDrawColor(settings.accent_color || '#14B8A6')
    addLine(margin, yPosition + 15, pageWidth - margin, yPosition + 15)
    yPosition += 25

    // Patient Information
    if (settings.show_patient_details_section) {
      checkNewPage()
      
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
        ...(patient.employer_company_name ? [`Company: ${patient.employer_company_name}`] : []),
      ]

      patientInfo.forEach((info) => {
        checkNewPage()
        addText(info, margin, yPosition)
        yPosition += 6
      })

      yPosition += 10
    }

    // Medical Findings
    if (settings.show_diagnosis_section || settings.show_validity_dates) {
      checkNewPage()
      
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Medical Findings', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      const certificateType = certificate.certificate_type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')

      addText(`Certificate Type: ${certificateType}`, margin, yPosition)
      yPosition += 6

      if (settings.show_validity_dates && certificate.valid_from) {
        addText(`Valid From: ${this.formatDate(certificate.valid_from)}`, margin, yPosition)
        yPosition += 6
      }

      if (settings.show_validity_dates && certificate.valid_until) {
        addText(`Valid Until: ${this.formatDate(certificate.valid_until)}`, margin, yPosition)
        yPosition += 6
      }

      if (settings.show_diagnosis_section && certificate.diagnosis) {
        yPosition += 4
        addText('Diagnosis:', margin, yPosition)
        yPosition += 6
        
        const diagnosisLines = pdf.splitTextToSize(
          certificate.diagnosis,
          pageWidth - (2 * margin)
        )
        
        diagnosisLines.forEach((line: string) => {
          checkNewPage()
          addText(line, margin, yPosition)
          yPosition += 5
        })
        
        yPosition += 10
      }

      yPosition += 10
    }

    // Test Results with Tables
    if (settings.show_test_results_section && testResults.length > 0) {
      checkNewPage()
      
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Test Results', margin, yPosition)
      yPosition += 10

      testResults.forEach((test, index) => {
        checkNewPage()
        
        // Test header
        pdf.setFontSize((settings.body_font_size || 11) + 1)
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
        
        const testName = test.test_name || 'Test'
        addText(testName, margin, yPosition)
        
        const status = test.is_normal === true ? 'NORMAL' : 
                      test.is_normal === false ? 'ABNORMAL' : 'PENDING'
        const statusColor = test.is_normal === true ? '#166534' : 
                           test.is_normal === false ? '#991B1B' : '#92400E'
        
        pdf.setTextColor(statusColor)
        addText(status, pageWidth - margin, yPosition, { align: 'right' })
        pdf.setTextColor(settings.text_color || '#1F2937')
        
        yPosition += 8

        // Create table for test results if results exist
        if (test.results && Object.keys(test.results).length > 0) {
          // Define tableData with explicit type
          const tableData: Array<{
            parameter: string;
            value: string;
            unit: string;
            reference: string;
            isAbnormal: boolean;
          }> = []
          
          Object.entries(test.results).forEach(([key, value]) => {
            const isAbnormal = this.isResultAbnormal(test.test_code, key, String(value))
            tableData.push({
              parameter: this.formatParameterName(key),
              value: String(value),
              unit: this.getUnit(test.test_code, key),
              reference: this.getReferenceRange(test.test_code, key),
              isAbnormal
            })
          })
          
          if (tableData.length > 0) {
            // Convert to autoTable format
            const tableRows = tableData.map(row => [
              row.parameter,
              row.value,
              row.unit,
              row.reference
            ])
            
            autoTable(pdf, {
              startY: yPosition,
              head: [['Parameter', 'Result', 'Unit', 'Reference']],
              body: tableRows,
              theme: 'grid',
              headStyles: {
                fillColor: settings.header_color || '#0D9488',
                textColor: settings.header_text_color || '#FFFFFF',
                fontStyle: 'bold'
              },
              bodyStyles: {
                textColor: settings.text_color || '#1F2937',
              },
              alternateRowStyles: {
                fillColor: '#f8fafc'
              },
              didDrawCell: (data) => {
                // Color abnormal results red
                if (data.row.index >= 0 && data.column.index === 1) {
                  const rowData = tableData[data.row.index]
                  if (rowData.isAbnormal) {
                    pdf.setTextColor('#991B1B')
                    pdf.text(data.cell.text, data.cell.x + 2, data.cell.y + 8)
                    pdf.setTextColor(settings.text_color || '#1F2937')
                  }
                }
              },
              margin: { left: margin, right: margin }
            })
            
            yPosition = (pdf as any).lastAutoTable.finalY + 10
          }
        }

        // Skip findings and recommendations from test results as they're
        // duplicated in the main certificate sections
        yPosition += 3

        yPosition += 8
        
        // Add separator between tests
        if (index < testResults.length - 1) {
          checkNewPage()
          pdf.setDrawColor(settings.border_color || '#E5E7EB')
          addLine(margin, yPosition, pageWidth - margin, yPosition)
          yPosition += 10
        }
      })
    }

    // Restrictions
    if (settings.show_restrictions_section && certificate.restrictions) {
      checkNewPage()
      
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Work Restrictions', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      const restrictionLines = pdf.splitTextToSize(
        certificate.restrictions,
        pageWidth - (2 * margin)
      )
      
      restrictionLines.forEach((line: string) => {
        checkNewPage()
        addText(line, margin, yPosition)
        yPosition += 5
      })
      
      yPosition += 10
    }

    // Recommendations
    if (settings.show_recommendations_section && certificate.recommendations) {
      checkNewPage()
      
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Medical Recommendations', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      const recommendationLines = pdf.splitTextToSize(
        certificate.recommendations,
        pageWidth - (2 * margin)
      )
      
      recommendationLines.forEach((line: string) => {
        checkNewPage()
        addText(line, margin, yPosition)
        yPosition += 5
      })
      
      yPosition += 10
    }

    // Signature section
    checkNewPage()
    const signatureY = Math.max(yPosition + 20, pageHeight - 60)
    addLine(pageWidth - margin - 100, signatureY, pageWidth - margin, signatureY)
    
    pdf.setFontSize((settings.body_font_size || 11) + 2)
    pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(doctor.full_name, pageWidth - margin - 50, signatureY + 8, { align: 'center' })
    
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    
    if (doctor.professional_registration_number) {
      addText(`Registration: ${doctor.professional_registration_number}`, pageWidth - margin - 50, signatureY + 14, { align: 'center' })
    }
    
    addText(settings.clinic_name || clinic.name, pageWidth - margin - 50, signatureY + 20, { align: 'center' })
    addText(`Date: ${this.formatDate(certificate.issue_date)}`, pageWidth - margin - 50, signatureY + 26, { align: 'center' })

    // Add stamp if enabled
    if (settings.include_stamp && settings.stamp_image_url) {
      addText('[OFFICIAL STAMP]', pageWidth - margin - 150, signatureY + 15)
    }

    // Footer
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setTextColor(settings.secondary_text_color || '#6B7280')
    addText(
      settings.footer_text || 'This is an official medical certificate issued by our facility.',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    )

    // Disclaimer
    if (settings.disclaimer_text) {
      addText(
        settings.disclaimer_text,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center', fontStyle: 'italic' }
      )
    }

    // Add page numbers
    pdf.setFontSize(settings.body_font_size || 9)
    for (let i = 1; i <= pageNumber; i++) {
      pdf.setPage(i)
      addText(`Page ${i} of ${pageNumber}`, pageWidth / 2, pageHeight - 4, { align: 'center' })
    }
  }

  private addPageHeader(pdf: jsPDF, clinicName: string, certificateNumber: string, pageNumber: number, settings: ExtendedCertificateSettings): void {
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20
    
    pdf.setFontSize(settings.body_font_size || 10)
    pdf.setTextColor(settings.secondary_text_color || '#6B7280')
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    
    // Add continuation header
    pdf.text(`Medical Certificate #${certificateNumber} - Page ${pageNumber}`, margin, 15)
    pdf.text(clinicName, pageWidth - margin, 15, { align: 'right' })
    
    // Add separator line
    pdf.setDrawColor(settings.border_color || '#E5E7EB')
    pdf.line(margin, 20, pageWidth - margin, 20)
    
    pdf.setTextColor(settings.text_color || '#1F2937')
  }

  private abbreviateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
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

  private formatParameterName(parameter: string): string {
    const formatted = parameter
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace('Hz', 'Hz')
      .replace('Db', 'dB')
      .replace('Fvc', 'FVC')
      .replace('Fev1', 'FEV1')
      .replace('Pef', 'PEF')
      .replace('Alt', 'ALT')
      .replace('Ast', 'AST')
      .replace('Alp', 'ALP')
      .replace('Wbc', 'WBC')
      .replace('Hgb', 'HGB')
      .replace('Hct', 'HCT')
      .replace('Plt', 'PLT')
      .replace('Rbc', 'RBC')
      .replace('Mcv', 'MCV')
      .replace('Mch', 'MCH')
      .replace('Mchc', 'MCHC')
      .replace('RdW', 'RDW')
    
    if (parameter.includes('_250Hz') || parameter.includes('_500Hz') || 
        parameter.includes('_1000Hz') || parameter.includes('_2000Hz') ||
        parameter.includes('_4000Hz') || parameter.includes('_8000Hz')) {
      const parts = formatted.split(' ')
      if (parts.length >= 2) {
        return `${parts[0]} Ear ${parts[1]}`
      }
    }
    
    return formatted
  }

  private getUnit(testCode: string, parameter: string): string {
    const lowerParam = parameter.toLowerCase()
    
    switch (testCode) {
      case 'audiometry':
        return 'dB'
        
      case 'spirometry':
        if (lowerParam.includes('fvc') || lowerParam.includes('fev1') || lowerParam.includes('ratio')) {
          return 'L or %'
        }
        if (lowerParam.includes('pef')) {
          return 'L/s'
        }
        return ''
        
      case 'vision':
        if (lowerParam.includes('distance') || lowerParam.includes('acuity')) {
          return ''
        }
        return ''
        
      case 'blood_pressure':
        return 'mmHg'
        
      case 'cbc':
        if (lowerParam.includes('wbc')) return 'x10³/μL'
        if (lowerParam.includes('hgb')) return 'g/dL'
        if (lowerParam.includes('hct')) return '%'
        if (lowerParam.includes('plt')) return 'x10³/μL'
        return ''
        
      case 'liver_function':
        if (lowerParam.includes('alt') || lowerParam.includes('ast') || lowerParam.includes('alp')) {
          return 'U/L'
        }
        if (lowerParam.includes('bilirubin')) return 'mg/dL'
        if (lowerParam.includes('albumin')) return 'g/dL'
        return ''
        
      default:
        return ''
    }
  }

  private getReferenceRange(testCode: string, parameter: string): string {
    const lowerParam = parameter.toLowerCase()
    
    switch (testCode) {
      case 'audiometry':
        if (lowerParam.includes('250hz') || lowerParam.includes('500hz') || 
            lowerParam.includes('1000hz') || lowerParam.includes('2000hz')) {
          return '0-25'
        } else if (lowerParam.includes('4000hz') || lowerParam.includes('8000hz')) {
          return '0-35'
        }
        return '0-25'
        
      case 'spirometry':
        if (lowerParam.includes('fvc') || lowerParam.includes('fev1')) {
          return '> 80%'
        }
        if (lowerParam.includes('fev1_fvc_ratio') || lowerParam.includes('ratio')) {
          return '> 0.70'
        }
        if (lowerParam.includes('pef')) {
          return '> 80%'
        }
        return 'Refer'
        
      case 'vision':
        if (lowerParam.includes('distance') || lowerParam.includes('acuity')) {
          return '20/20'
        }
        if (lowerParam.includes('color')) {
          return 'Normal'
        }
        return 'Normal'
        
      case 'blood_pressure':
        if (lowerParam.includes('systolic')) return '< 120'
        if (lowerParam.includes('diastolic')) return '< 80'
        return '< 120/80'
        
      case 'cbc':
        if (lowerParam.includes('wbc')) return '4.0-11.0'
        if (lowerParam.includes('hgb')) return '13.5-17.5'
        if (lowerParam.includes('hct')) return '40-52'
        if (lowerParam.includes('plt')) return '150-450'
        return 'Refer'
        
      case 'liver_function':
        if (lowerParam.includes('alt')) return '7-56'
        if (lowerParam.includes('ast')) return '5-40'
        if (lowerParam.includes('alp')) return '44-147'
        if (lowerParam.includes('bilirubin')) return '< 1.2'
        if (lowerParam.includes('albumin')) return '3.5-5.0'
        return 'Refer'
        
      default:
        return 'Refer'
    }
  }

  private isResultAbnormal(testCode: string, parameter: string, value: string): boolean {
    try {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) return false
      
      const lowerParam = parameter.toLowerCase()
      
      switch (testCode) {
        case 'audiometry':
          if (lowerParam.includes('250hz') || lowerParam.includes('500hz') || 
              lowerParam.includes('1000hz') || lowerParam.includes('2000hz')) {
            return numValue > 25
          } else if (lowerParam.includes('4000hz') || lowerParam.includes('8000hz')) {
            return numValue > 35
          }
          return numValue > 25
          
        case 'spirometry':
          if (lowerParam.includes('fvc') || lowerParam.includes('fev1')) {
            return numValue < 0.80
          }
          if (lowerParam.includes('fev1_fvc_ratio') || lowerParam.includes('ratio')) {
            return numValue < 0.70
          }
          if (lowerParam.includes('pef')) {
            return numValue < 80
          }
          return false
          
        case 'blood_pressure':
          if (lowerParam.includes('systolic')) return numValue >= 120
          if (lowerParam.includes('diastolic')) return numValue >= 80
          return false
          
        case 'cbc':
          if (lowerParam.includes('wbc')) return numValue < 4.0 || numValue > 11.0
          if (lowerParam.includes('hgb')) return numValue < 13.5 || numValue > 17.5
          if (lowerParam.includes('hct')) return numValue < 40 || numValue > 52
          if (lowerParam.includes('plt')) return numValue < 150 || numValue > 450
          return false
          
        case 'liver_function':
          if (lowerParam.includes('alt')) return numValue > 56
          if (lowerParam.includes('ast')) return numValue > 40
          if (lowerParam.includes('alp')) return numValue < 44 || numValue > 147
          if (lowerParam.includes('bilirubin')) return numValue > 1.2
          if (lowerParam.includes('albumin')) return numValue < 3.5 || numValue > 5.0
          return false
          
        default:
          return false
      }
    } catch {
      return false
    }
  }
}

// Export a singleton instance
export const serverCertificateGenerator = new ServerCertificateGenerator()