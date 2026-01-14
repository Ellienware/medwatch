// lib/pdf/server-certificate-generator.ts - UPDATED
import { jsPDF } from 'jspdf';
import type { Certificate, Patient, Clinic, Branch, TestResult, User } from "@/lib/types/database"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

export class ServerCertificateGenerator {
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
  }): Promise<Buffer> { // Return Buffer instead of Uint8Array
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

    // Create PDF directly using jsPDF (server-side compatible)
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
    })

    // Return as Buffer for server-side usage
    const arrayBuffer = pdf.output('arraybuffer')
    return Buffer.from(arrayBuffer)
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
    }
  ): void {
    const { certificate, patient, clinic, branch, doctor, testResults, settings } = data
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

    // Add medical findings
    if (settings.show_diagnosis_section || settings.show_validity_dates) {
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
        this.addWrappedText(pdf, certificate.diagnosis, margin, yPosition, pageWidth - (2 * margin))
        yPosition += 20
      }

      yPosition += 10
    }

    // Add test results
    if (settings.show_test_results_section && testResults.length > 0) {
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Test Results', margin, yPosition)
      yPosition += 10

      testResults.forEach((test, index) => {
        if (yPosition > pageHeight - 100) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize((settings.body_font_size || 11) + 1)
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
        addText(test.test_name || 'Test', margin, yPosition)
        
        const status = test.is_normal === true ? 'NORMAL' : 
                      test.is_normal === false ? 'ABNORMAL' : 'PENDING'
        const statusColor = test.is_normal === true ? '#166534' : 
                           test.is_normal === false ? '#991B1B' : '#92400E'
        
        pdf.setTextColor(statusColor)
        addText(status, pageWidth - margin, yPosition, { align: 'right' })
        pdf.setTextColor(settings.text_color || '#1F2937')
        
        yPosition += 6
        pdf.setFontSize(settings.body_font_size || 11)
        pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')

        if (test.results) {
          Object.entries(test.results).forEach(([key, value]) => {
            addText(`${key}: ${String(value)}`, margin + 5, yPosition)
            yPosition += 5
          })
        }

        if (test.findings) {
          yPosition += 2
          addText('Findings:', margin + 5, yPosition)
          yPosition += 5
          this.addWrappedText(pdf, test.findings, margin + 10, yPosition, pageWidth - (2 * margin) - 10)
          yPosition += 15
        }

        yPosition += 10
      })
    }

    // Add restrictions
    if (settings.show_restrictions_section && certificate.restrictions) {
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Work Restrictions', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      this.addWrappedText(pdf, certificate.restrictions, margin, yPosition, pageWidth - (2 * margin))
      yPosition += 25
    }

    // Add recommendations
    if (settings.show_recommendations_section && certificate.recommendations) {
      pdf.setFontSize(settings.title_font_size || 24)
      pdf.setFont(settings.title_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
      pdf.setTextColor(settings.accent_color || '#14B8A6')
      addText('Medical Recommendations', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(settings.body_font_size || 11)
      pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
      pdf.setTextColor(settings.text_color || '#1F2937')

      this.addWrappedText(pdf, certificate.recommendations, margin, yPosition, pageWidth - (2 * margin))
      yPosition += 25
    }

    // Add signature section
    const signatureY = pageHeight - 60
    addLine(pageWidth - margin - 100, signatureY, pageWidth - margin, signatureY)
    
    pdf.setFontSize((settings.body_font_size || 11) + 2)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'bold')
    addText(doctor.full_name, pageWidth - margin - 50, signatureY + 8, { align: 'center' })
    
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setFont(settings.body_font_family?.split(',')[0].trim() || 'Helvetica', 'normal')
    
    if (doctor.professional_registration_number) {
      addText(`Registration: ${doctor.professional_registration_number}`, pageWidth - margin - 50, signatureY + 14, { align: 'center' })
    }
    
    addText(settings.clinic_name || clinic.name, pageWidth - margin - 50, signatureY + 20, { align: 'center' })
    addText(`Date: ${this.formatDate(certificate.issue_date)}`, pageWidth - margin - 50, signatureY + 26, { align: 'center' })

    // Add footer
    pdf.setFontSize(settings.body_font_size || 11)
    pdf.setTextColor(settings.secondary_text_color || '#6B7280')
    addText(
      settings.footer_text || 'This is an official medical certificate issued by our facility.',
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    )

    // Add disclaimer if available
    if (settings.disclaimer_text) {
      addText(
        settings.disclaimer_text,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center', fontStyle: 'italic' }
      )
    }
  }

  private addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
    const lines = pdf.splitTextToSize(text, maxWidth)
    pdf.text(lines, x, y)
    return lines.length * 6 // Approximate line height
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

  // Generate sample certificate for testing
  async generateSampleCertificate(settings: CertificateSettings): Promise<Buffer> {
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
        doctor_signature_url: null,
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
export const serverCertificateGenerator = new ServerCertificateGenerator()