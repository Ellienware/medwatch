import { jsPDF } from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'
import type { FitnessCertificateData } from '@/lib/types/database'
import type { CertificateSettings } from '@/lib/types/certificate-settings'


interface ExtendedShowSections {
  patientDetails: boolean;
  testResults: boolean;
  diagnosis: boolean;
  restrictions: boolean;
  recommendations: boolean;
  validityDates: boolean;
  qrCode: boolean;
  border?: boolean;
  watermark?: boolean;
}

export class FitnessCertificateGenerator {

  
  // A4 dimensions in mm
  private readonly PAGE_WIDTH = 210
  private readonly PAGE_HEIGHT = 297
  private readonly MARGIN = 20
  private readonly CONTENT_WIDTH = 170 // PAGE_WIDTH - 2*MARGIN
  private readonly MAX_CONTENT_HEIGHT = 267 // PAGE_HEIGHT - 2*MARGIN - footer space
  
  // Colors with defaults
  private headerColor: string = '#0000FF'
  private textColor: string = '#000000'
  private backgroundColor: string = '#FFFFFF'
  private accentColor: string = '#0000FF'
  private secondaryTextColor: string = '#666666'
  private checkboxColor: string = '#000000'
  
  // Fonts with defaults
  private titleFontFamily: string = 'helvetica'
  private bodyFontFamily: string = 'helvetica'
  private titleFontSize: number = 16
  private bodyFontSize: number = 11
  
  // Font sizes in points (pt) - scaled from settings
  private fontSizes = {
    tiny: 6,
    small: 8,
    normal: 11,
    medium: 11,
    large: 12,
    xlarge: 14,
    title: 16
  }
  
  // Dynamic scaling factor (1.0 = normal, <1.0 = compressed)
  private scaleFactor: number = 1.0
  private baseSpacing: number = 6 // Base spacing between sections in mm
  
  // Section visibility with defaults
  private showSections: ExtendedShowSections = {
    patientDetails: true,
    testResults: true,
    diagnosis: true,
    restrictions: true,
    recommendations: true,
    validityDates: true,
    qrCode: false
  }

  
  
  // Section positions in mm from top
  private positions: Record<string, number> = {}
  
  // Track current Y position for dynamic layout
  private currentY: number = 10
  
  // Content height tracking for dynamic scaling
  private estimatedContentHeight: number = 0

  constructor(private settings?: CertificateSettings) {
    // Initialize with settings or defaults
    this.applySettings(settings)
    this.calculateSectionPositions()
  }


  

  /**
   * Apply certificate settings to the generator
   */
private applySettings(settings?: CertificateSettings): void {
  if (!settings) return
  
  // Colors
  if (settings.header_color) this.headerColor = settings.header_color
  if (settings.text_color) this.textColor = settings.text_color
  if (settings.body_background_color) this.backgroundColor = settings.body_background_color
  if (settings.accent_color) this.accentColor = settings.accent_color
  if (settings.secondary_text_color) this.secondaryTextColor = settings.secondary_text_color
  
  // Fonts - map CSS fonts to PDF fonts
  if (settings.title_font_family) this.titleFontFamily = this.mapFontFamily(settings.title_font_family)
  if (settings.body_font_family) this.bodyFontFamily = this.mapFontFamily(settings.body_font_family)
  
  // Font sizes
  if (settings.body_font_size) {
    this.bodyFontSize = settings.body_font_size
    this.updateFontSizes()
  }
  
  if (settings.title_font_size) {
    this.titleFontSize = settings.title_font_size
    this.fontSizes.title = settings.title_font_size
  }
  
  // Section visibility
  if (settings.show_patient_details_section !== undefined) {
    this.showSections.patientDetails = settings.show_patient_details_section
  }
  if (settings.show_test_results_section !== undefined) {
    this.showSections.testResults = settings.show_test_results_section
  }
  if (settings.show_diagnosis_section !== undefined) {
    this.showSections.diagnosis = settings.show_diagnosis_section
  }
  if (settings.show_restrictions_section !== undefined) {
    this.showSections.restrictions = settings.show_restrictions_section
  }
  if (settings.show_recommendations_section !== undefined) {
    this.showSections.recommendations = settings.show_recommendations_section
  }
  if (settings.show_validity_dates !== undefined) {
    this.showSections.validityDates = settings.show_validity_dates
  }
  if (settings.show_qr_code !== undefined) {
    this.showSections.qrCode = settings.show_qr_code
  }
  
  // Extend showSections with border and watermark
  if (settings.show_border !== undefined) {
    (this.showSections as ExtendedShowSections).border = settings.show_border
  }
  if (settings.include_watermark !== undefined) {
    (this.showSections as ExtendedShowSections).watermark = settings.include_watermark
  }
}

  /**
   * Map CSS font families to PDF font families
   */
  private mapFontFamily(cssFont: string): string {
    const font = cssFont.toLowerCase()
    
    if (font.includes('helvetica') || font.includes('arial') || font.includes('sans-serif')) {
      return 'helvetica'
    } else if (font.includes('times') || font.includes('serif')) {
      return 'times'
    } else if (font.includes('courier') || font.includes('monospace')) {
      return 'courier'
    }
    
    return 'helvetica' // Default
  }

  /**
   * Update font sizes based on base body font size
   */
  private updateFontSizes(): void {
    this.fontSizes = {
      tiny: Math.max(6, Math.round(this.bodyFontSize * 0.55)),
      small: Math.max(8, Math.round(this.bodyFontSize * 0.73)),
      normal: this.bodyFontSize,
      medium: Math.max(11, Math.round(this.bodyFontSize * 1.0)),
      large: Math.max(12, Math.round(this.bodyFontSize * 1.09)),
      xlarge: Math.max(14, Math.round(this.bodyFontSize * 1.27)),
      title: this.titleFontSize
    }
  }

  /**
   * Estimate total content height based on visible sections
   * Returns estimated height in mm
   */
  private estimateContentHeight(data: FitnessCertificateData): number {
    let height = 10 // Start position
    
    // Header section
    height += 25
    
    // Title bar
    height += 8
    
    // Personal details
    if (this.showSections.patientDetails) {
      height += 18
    }
    
    // Medical type
    height += 8
    
    // Test results sections
    if (this.showSections.testResults) {
      height += 25 // Lung function
      height += 38 // Audiometry
      height += 22 // Vision
      height += 12 // Urinalysis
      height += 10 // Chest X-ray
      height += 22 // Referrals
    }
    
    // Fitness status
    height += 22
    
    // Restrictions (if present)
    if (this.showSections.restrictions && data.restrictions) {
      const restrictionLines = Math.ceil((data.restrictions?.length || 0) / 80)
      height += 8 + (restrictionLines * 4)
    }
    
    // Validity period
    if (this.showSections.validityDates) {
      height += 10
    }
    
    // Signatures
    height += 55 // Two signature blocks
    
    // Footer
    height += 15
    
    return height
  }
  
  /**
   * Calculate optimal scale factor to fit content on single page
   */
  private calculateScaleFactor(data: FitnessCertificateData): number {
    this.estimatedContentHeight = this.estimateContentHeight(data)
    
    // If content fits comfortably, no scaling needed
    if (this.estimatedContentHeight <= this.MAX_CONTENT_HEIGHT) {
      return 1.0
    }
    
    // Calculate scale factor to fit content
    const rawScale = this.MAX_CONTENT_HEIGHT / this.estimatedContentHeight
    
    // Clamp scale factor between 0.7 and 1.0 (don't compress more than 30%)
    return Math.max(0.7, Math.min(1.0, rawScale))
  }
  
  /**
   * Apply scale factor to spacing values
   */
  private scaledSpacing(baseValue: number): number {
    return Math.round(baseValue * this.scaleFactor)
  }
  
  /**
   * Calculate section positions based on which sections are visible
   * Uses dynamic scaling to fit content on single page
   */
  private calculateSectionPositions(data?: FitnessCertificateData): void {
    // Calculate scale factor if data is provided
    if (data) {
      this.scaleFactor = this.calculateScaleFactor(data)
      
      // Adjust font sizes based on scale factor
      if (this.scaleFactor < 1.0) {
        this.fontSizes = {
          tiny: Math.max(5, Math.round(6 * this.scaleFactor)),
          small: Math.max(6, Math.round(8 * this.scaleFactor)),
          normal: Math.max(8, Math.round(11 * this.scaleFactor)),
          medium: Math.max(8, Math.round(11 * this.scaleFactor)),
          large: Math.max(9, Math.round(12 * this.scaleFactor)),
          xlarge: Math.max(10, Math.round(14 * this.scaleFactor)),
          title: Math.max(12, Math.round(16 * this.scaleFactor))
        }
      }
    }
    
    this.currentY = 10 // Start position
    
    this.positions = {
      headerTop: this.currentY,
      providerInfo: this.currentY + this.scaledSpacing(5),
      contactInfo: this.currentY + this.scaledSpacing(10),
      tagline: this.currentY + this.scaledSpacing(17)
    }
    
    this.currentY += this.scaledSpacing(25) // Space for header
    
    // Title bar
    this.positions.titleBar = this.currentY
    this.currentY += this.scaledSpacing(8)
    
    // Personal details (if shown)
    if (this.showSections.patientDetails) {
      this.positions.personalDetails = this.currentY
      this.currentY += this.scaledSpacing(18)
    }
    
    // Medical type (always shown)
    this.positions.medicalType = this.currentY
    this.currentY += this.scaledSpacing(8)
    
    // Test results sections (if shown)
    if (this.showSections.testResults) {
      this.positions.lungFunction = this.currentY
      this.currentY += this.scaledSpacing(25) // Lung function table
      
      this.positions.audiometry = this.currentY
      this.currentY += this.scaledSpacing(38) // Audiometry table
      
      this.positions.vision = this.currentY
      this.currentY += this.scaledSpacing(22) // Vision screening
      
      this.positions.urinalysis = this.currentY
      this.currentY += this.scaledSpacing(12)
      
      this.positions.chestXray = this.currentY
      this.currentY += this.scaledSpacing(10)
      
      this.positions.referrals = this.currentY
      this.currentY += this.scaledSpacing(22)
    }
    
    // Fitness status
    this.positions.fitnessStatus = this.currentY
    this.currentY += this.scaledSpacing(22)
    
    // Restrictions (if shown)
    if (this.showSections.restrictions) {
      this.positions.restrictions = this.currentY
      // Calculate space needed for restrictions text
      const restrictionSpace = data?.restrictions 
        ? Math.max(8, Math.ceil((data.restrictions.length / 80) * 4) + 8)
        : 8
      this.currentY += this.scaledSpacing(restrictionSpace)
    }
    
    // Validity period (if shown)
    if (this.showSections.validityDates) {
      this.positions.validity = this.currentY
      this.currentY += this.scaledSpacing(10)
    }
    
    // Signatures
    this.positions.signature1 = this.currentY
    this.currentY += this.scaledSpacing(28)
    
    this.positions.signature2 = this.currentY
    this.currentY += this.scaledSpacing(28)
    
    // Footer - fixed position at bottom, but adjusted if content is compressed
    this.positions.footer = Math.max(this.currentY + 5, 280)
  }

  /**
   * Generate certificate PDF with applied settings
   * Uses dynamic scaling to ensure content fits on single A4 page
   */
  generateCertificate(data: FitnessCertificateData): Buffer {
    try {
      // Calculate section positions with dynamic scaling based on content
      this.calculateSectionPositions(data)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      })
      
      // Set document properties
      pdf.setProperties({
        title: `Certificate of Fitness - ${data.certificate_number}`,
        subject: 'Certificate of Fitness',
        author: 'Medical Certificate System',
        creator: 'Medical Certificate System'
      })
      
      // Log scaling info for debugging
      if (this.scaleFactor < 1.0) {
        console.log(`[Certificate Generator] Applied scale factor: ${this.scaleFactor.toFixed(2)} to fit content on single page`)
      }
      
      // Set background color if not white
      if (this.backgroundColor !== '#FFFFFF') {
        pdf.setFillColor(this.backgroundColor)
        pdf.rect(0, 0, this.PAGE_WIDTH, this.PAGE_HEIGHT, 'F')
      }
      
      // Add border if enabled
      if (this.settings?.show_border) {
        this.addDocumentBorder(pdf)
      }
      
      // Add watermark if enabled
      if (this.settings?.include_watermark && this.settings?.watermark_text) {
        this.addWatermark(pdf)
      }
      
      // Add all visible sections
      this.addProviderHeader(pdf, data)
      this.addCertificateTitle(pdf)
      
      if (this.showSections.patientDetails) {
        this.addPersonalDetails(pdf, data)
      }
      
      this.addMedicalType(pdf, data)
      
      if (this.showSections.testResults) {
        this.addTestResults(pdf, data)
      }
      
      this.addFitnessStatus(pdf, data)
      
      if (this.showSections.restrictions && data.restrictions) {
        this.addRestrictions(pdf, data)
      }
      
      if (this.showSections.validityDates) {
        this.addValidityPeriod(pdf, data)
      }
      
      this.addSignatures(pdf, data)
      
      // Add footer if enabled
      if (this.settings?.footer_text) {
        this.addFooter(pdf, data)
      }

      this.addEvaluationSummary(pdf, data)
      
      // Add QR code if enabled
      if (this.showSections.qrCode) {
        this.addQRCode(pdf, data)
      }
      
      // Verify single page - if still overflowing after scaling, log warning but don't throw
      const pageCount = pdf.getNumberOfPages()
      if (pageCount > 1) {
        console.warn(`[Certificate Generator] Content still exceeds single page after scaling. Pages: ${pageCount}. Consider reducing visible sections.`)
        // Remove extra pages to enforce single page
        while (pdf.getNumberOfPages() > 1) {
          pdf.deletePage(2)
        }
      }
      
      return Buffer.from(pdf.output('arraybuffer'))
    } catch (error) {
      console.error('Error generating certificate PDF:', error)
      throw error
    }
  }
  
  /**
   * Add document border if enabled
   */
  private addDocumentBorder(pdf: jsPDF): void {
    try {
      const borderWidth = this.settings?.border_width || 1
      const borderColor = this.settings?.border_color || '#E5E7EB'
      const borderStyle = this.settings?.border_style || 'solid'
      
      pdf.setDrawColor(borderColor)
      pdf.setLineWidth(borderWidth)
      
      // For solid border
      if (borderStyle === 'solid') {
        pdf.rect(5, 5, this.PAGE_WIDTH - 10, this.PAGE_HEIGHT - 10)
      }
    } catch (error) {
      console.warn('Failed to add document border:', error)
    }
  }
  
  /**
   * Add watermark if enabled
   */
private addWatermark(pdf: jsPDF): void {
  try {
    const watermarkText = this.settings?.watermark_text || 'MEDICAL CERTIFICATE'
    const opacity = (this.settings?.watermark_opacity || 5) / 100
    
    // Save current state
    const currentTextColor = pdf.getTextColor()
    const currentFont = pdf.getFont()
    const currentFontSize = pdf.getFontSize()
    
    // Set watermark text properties
    pdf.setFont(this.titleFontFamily, 'normal')
    pdf.setFontSize(48)
    pdf.setTextColor(this.accentColor)
    
    // Apply opacity using setGState (jsPDF method for graphics state)
    try {
      // @ts-ignore - setGState might not be in types but exists in jsPDF
      if (pdf.setGState) {
        // @ts-ignore
        pdf.setGState(new pdf.GState({ opacity }))
      }
    } catch (e) {
      // Fallback if setGState not available
      console.warn('GState not available for opacity')
    }
    
    // Center and rotate watermark
    pdf.text(watermarkText, this.PAGE_WIDTH / 2, this.PAGE_HEIGHT / 2, {
      align: 'center',
      angle: 45
    })
    
    // Reset graphics state
    try {
      // @ts-ignore
      if (pdf.setGState) {
        // @ts-ignore
        pdf.setGState(new pdf.GState({ opacity: 1 }))
      }
    } catch (e) {
      // Ignore error
    }
    
    // Restore original state - Fix the type issue
    if (currentFont && Array.isArray(currentFont) && currentFont.length >= 2) {
      pdf.setFont(currentFont[0], currentFont[1])
    } else {
      pdf.setFont(this.bodyFontFamily, 'normal')
    }
    
    pdf.setFontSize(currentFontSize)
    pdf.setTextColor(currentTextColor)
  } catch (error) {
    console.warn('Failed to add watermark:', error)
  }
}
  
  /**
   * Add provider header section
   */
  private addProviderHeader(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.headerTop
      
      // Provider name and address (left aligned)
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.normal)
      pdf.setTextColor(this.textColor)
      
      // Split address into lines if needed
      const addressLines = this.splitTextToLines(data.provider_address, 60)
      addressLines.forEach((line: string, index: number) => {
        pdf.text(line, this.MARGIN, y + (index * 4))
      })
      
      // Company registration on second line
      if (this.settings?.show_registration_number) {
        pdf.text(data.provider_registration, this.MARGIN, y + 8)
      }
      
      // Contact information (right aligned) - if enabled in settings
      const rightX = this.PAGE_WIDTH - this.MARGIN
      if (this.settings?.show_clinic_phone) {
        pdf.text(data.provider_phone, rightX, y, { align: 'right' })
      }
      
      if (this.settings?.show_clinic_address && data.provider_vat) {
        pdf.text(`VAT No: ${data.provider_vat}`, rightX, y + 4, { align: 'right' })
      }
      
      // Email and website (centered) - if enabled
      if (this.settings?.show_clinic_email || data.provider_website) {
        const contactInfo = []
        if (this.settings?.show_clinic_email) contactInfo.push(`E:${data.provider_email}`)
        if (data.provider_website) contactInfo.push(data.provider_website)
        
        if (contactInfo.length > 0) {
          pdf.text(contactInfo.join(' | '), this.PAGE_WIDTH / 2, y + 12, { align: 'center' })
        }
      }
      
      // Tagline (bold, centered)
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.large)
      pdf.text(data.provider_tagline, this.PAGE_WIDTH / 2, this.positions.tagline, { align: 'center' })
    } catch (error) {
      console.warn('Failed to add provider header:', error)
    }
  }
  
  /**
   * Add certificate title section
   */
  private addCertificateTitle(pdf: jsPDF): void {
    try {
      const y = this.positions.titleBar
      
      // Header bar background
      pdf.setFillColor(this.headerColor)
      pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 8, 'F')
      
      // Centered title text
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.xlarge)
      pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
      pdf.text("CERTIFICATE OF FITNESS", this.PAGE_WIDTH / 2, y + 6, { align: 'center' })
      
      // Reset text color for rest of document
      pdf.setTextColor(this.textColor)
    } catch (error) {
      console.warn('Failed to add certificate title:', error)
    }
  }
  
  // Add this method to the FitnessCertificateGenerator class:
private addEvaluationSummary(pdf: jsPDF, data: FitnessCertificateData): void {
  try {
    if (!data.evaluation_summary) return
    
    // Position at bottom of page, above footer
    const y = this.PAGE_HEIGHT - this.MARGIN - 15
    
    pdf.setFont(this.bodyFontFamily, 'italic')
    pdf.setFontSize(this.fontSizes.tiny)
    pdf.setTextColor(this.secondaryTextColor)
    
    // Evaluation summary line
    const summaryText = `Clinical Decision Support: ${this.getFitnessStatusText(data.evaluation_summary.engine_decision)} `
    pdf.text(summaryText, this.MARGIN, y)
    
    // Confidence indicator
    const confidenceX = this.MARGIN + pdf.getTextWidth(summaryText)
    pdf.setFont(this.bodyFontFamily, 'bold')
    pdf.text(`(${data.evaluation_summary.engine_confidence}% confidence)`, confidenceX, y)
    
    // Critical findings indicator
    if (data.evaluation_summary.critical_findings.length > 0) {
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setTextColor('#FF0000')
      pdf.text(
        ` • ${data.evaluation_summary.critical_findings.length} critical finding(s)`,
        confidenceX + 30,
        y
      )
    }
    
    // Reset text color
    pdf.setTextColor(this.textColor)
    
  } catch (error) {
    console.warn('Failed to add evaluation summary:', error)
  }
}

// Helper method to convert fitness decision to text
private getFitnessStatusText(decision: string): string {
  switch(decision) {
    case 'fit': return 'Fit'
    case 'fit_with_conditions': return 'Fit with Conditions'
    case 'fit_with_restrictions': return 'Fit with Restrictions'
    case 'temporarily_unfit': return 'Temporarily Unfit'
    case 'permanently_unfit': return 'Permanently Unfit'
    default: return decision
  }
}


  /**
   * Add personal details section
   */
  private addPersonalDetails(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.personalDetails
      
      // Create table layout
      const tableData: RowInput[] = [
        [
          { content: 'Date of examination:', styles: { fontStyle: 'bold' } },
          { content: data.exam_date },
          { content: 'ID No / Passport:', styles: { fontStyle: 'bold' } },
          { content: data.id_number }
        ],
        [
          { content: 'Name & Surname:', styles: { fontStyle: 'bold' } },
          { content: data.patient_name },
          { content: 'Occupation:', styles: { fontStyle: 'bold' } },
          { content: data.occupation }
        ],
        [
          { content: 'Company:', styles: { fontStyle: 'bold' } },
          { content: data.company, colSpan: 3 }
        ]
      ]
      
      autoTable(pdf, {
        startY: y,
        head: [],
        body: tableData,
        theme: 'plain',
        styles: {
          font: this.bodyFontFamily,
          fontSize: this.fontSizes.normal,
          cellPadding: 2,
          lineColor: this.textColor,
          lineWidth: 0.1,
          minCellHeight: 6
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 45 },
          2: { cellWidth: 40 },
          3: { cellWidth: 45 }
        },
        margin: { left: this.MARGIN, right: this.MARGIN },
        tableWidth: this.CONTENT_WIDTH
      })
    } catch (error) {
      console.warn('Failed to add personal details:', error)
    }
  }
  


  /**
   * Add medical type section
   */
  private addMedicalType(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.medicalType
      
      // Medical type label
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.normal)
      pdf.text('Medical Type:', this.MARGIN, y)
      
      // Checkbox positions
      const checkboxStartX = this.MARGIN + 30
      const checkboxY = y - 2
      const checkboxSpacing = 40
      
      const medicalTypes = [
        { key: 'pre_employment', label: 'Pre-employment Medical' },
        { key: 'annual', label: 'Annual Medical' },
        { key: 'exit', label: 'Exit Medical' },
        { key: 'transfer', label: 'Transfer Medical' }
      ]
      
      medicalTypes.forEach((type, index) => {
        const x = checkboxStartX + (index * checkboxSpacing)
        this.addCheckbox(pdf, x, checkboxY, data.medical_type === type.key, type.label)
      })
    } catch (error) {
      console.warn('Failed to add medical type:', error)
    }
  }
  
  /**
   * Add test results sections
   */
  private addTestResults(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      this.addLungFunction(pdf, data)
      this.addAudiometry(pdf, data)
      this.addVisionScreening(pdf, data)
      this.addUrinalysis(pdf, data)
      this.addChestXray(pdf, data)
      this.addReferrals(pdf, data)
    } catch (error) {
      console.warn('Failed to add test results:', error)
    }
  }
  
  /**
   * Add lung function section
   */
  private addLungFunction(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.lungFunction
      
      // Section header with background
      pdf.setFillColor(this.headerColor)
      pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 6, 'F')
      
      // Section title
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.medium)
      pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
      pdf.text("Lung Function", this.MARGIN + 5, y + 4)
      pdf.setTextColor(this.textColor)
      
      // Lung function table
      const lungData = data.lung_function
      const tableData: RowInput[] = [
        [
          { content: 'FVC %', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: lungData.fvc_percent, styles: { halign: 'center' } },
          { content: 'FEV1 %', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: lungData.fev1_percent, styles: { halign: 'center' } },
          { content: 'FEV1/FVC', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: lungData.fev1_fvc_ratio, styles: { halign: 'center' } },
          { content: 'PEF l/min', styles: { fontStyle: 'bold', halign: 'center' } },
          { content: lungData.pef_l_min, styles: { halign: 'center' } }
        ]
      ]
      
      autoTable(pdf, {
        startY: y + 7,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: {
          font: this.bodyFontFamily,
          fontSize: this.fontSizes.normal,
          cellPadding: 3,
          lineColor: this.textColor,
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 }
        },
        margin: { left: this.MARGIN, right: this.MARGIN },
        tableWidth: this.CONTENT_WIDTH
      })
    } catch (error) {
      console.warn('Failed to add lung function:', error)
    }
  }
  
  /**
   * Add audiometry section
   */
  private addAudiometry(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.audiometry
      
      // Section header with background
      pdf.setFillColor(this.headerColor)
      pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 6, 'F')
      
      // Section title
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.medium)
      pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
      pdf.text("Audiometry", this.MARGIN + 5, y + 4)
      pdf.setTextColor(this.textColor)
      
      // Frequencies
      const frequencies = ['500HZ', '1000HZ', '2000HZ', '3000HZ', '4000HZ', '6000HZ', '8000HZ']
      
      // Create table data
      const tableData: RowInput[] = [
        ['Frequency', ...frequencies],
        ['Left', ...frequencies.map(freq => data.audiometry.left[freq as keyof typeof data.audiometry.left])],
        ['Right', ...frequencies.map(freq => data.audiometry.right[freq as keyof typeof data.audiometry.right])]
      ]
      
      autoTable(pdf, {
        startY: y + 7,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: {
          font: this.bodyFontFamily,
          fontSize: this.fontSizes.normal,
          cellPadding: 3,
          lineColor: this.textColor,
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: this.headerColor,
          textColor: this.settings?.header_text_color || '#FFFFFF',
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25, fontStyle: 'bold' }
        },
        margin: { left: this.MARGIN, right: this.MARGIN },
        tableWidth: this.CONTENT_WIDTH
      })
    } catch (error) {
      console.warn('Failed to add audiometry:', error)
    }
  }
  
  /**
   * Add vision screening section
   */
  private addVisionScreening(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.vision
      
      // Section header with background
      pdf.setFillColor(this.headerColor)
      pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 6, 'F')
      
      // Section title
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.medium)
      pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
      pdf.text("Vision Screening (Shellen's chart) without glasses", this.MARGIN + 5, y + 4)
      pdf.setTextColor(this.textColor)
      
      // Vision data table
      const tableData: RowInput[] = [
        [
          { content: 'Acuity OD', styles: { fontStyle: 'bold' } },
          { content: data.vision.right_acuity, styles: { halign: 'center' } },
          { content: 'Acuity OS', styles: { fontStyle: 'bold' } },
          { content: data.vision.left_acuity, styles: { halign: 'center' } },
          { content: 'Colour', styles: { fontStyle: 'bold' } },
          { content: data.vision.color_vision, styles: { halign: 'center' } }
        ]
      ]
      
      autoTable(pdf, {
        startY: y + 7,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: {
          font: this.bodyFontFamily,
          fontSize: this.fontSizes.normal,
          cellPadding: 3,
          lineColor: this.textColor,
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        },
        margin: { left: this.MARGIN, right: this.MARGIN },
        tableWidth: this.CONTENT_WIDTH
      })
    } catch (error) {
      console.warn('Failed to add vision screening:', error)
    }
  }
  
  /**
   * Add urinalysis section
   */
private addUrinalysis(pdf: jsPDF, data: FitnessCertificateData): void {
  try {
    const y = this.positions.urinalysis
    
    // Section header with background
    pdf.setFillColor(this.headerColor)
    pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 6, 'F')
    
    // Section title
    pdf.setFont(this.titleFontFamily, 'bold')
    pdf.setFontSize(this.fontSizes.medium)
    pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
    pdf.text("Urinalysis", this.MARGIN + 5, y + 4)
    pdf.setTextColor(this.textColor)
    
    // Urinalysis checkboxes
    pdf.setFont(this.bodyFontFamily, 'normal')
    pdf.setFontSize(this.fontSizes.normal)
    
    // Convert string/normal to boolean safely
    const normalValue = data.urinalysis.normal
    const isNormal = typeof normalValue === 'boolean' 
      ? normalValue 
      : String(normalValue).toLowerCase() === 'true'
    
    this.addCheckbox(pdf, this.MARGIN, y + 8, isNormal, 'Normal')
    
    // HGT value - check if HGT is present and not empty
    const hgtValue = data.urinalysis.hgt_mmol || ''
    const hasHGT = hgtValue.trim() !== ''
    pdf.text(`HGT ${hasHGT ? hgtValue : '--'} mmol/l`, this.MARGIN + 50, y + 8)
    this.addCheckbox(pdf, this.MARGIN + 90, y + 8, hasHGT, '')
  } catch (error) {
    console.warn('Failed to add urinalysis:', error)
  }
}
  
  /**
   * Add chest X-ray section
   */
  private addChestXray(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.chestXray
      
      // Chest X-ray checkbox - checked by doctor if X-ray was normal
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.normal)
      pdf.text('Chest X-ray', this.MARGIN, y)
      this.addCheckbox(pdf, this.MARGIN + 30, y - 2, data.chest_xray, '')
    } catch (error) {
      console.warn('Failed to add chest X-ray:', error)
    }
  }
  
  /**
   * Add referrals section
   */
  private addReferrals(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.referrals
      
      // Section header with background
      pdf.setFillColor(this.headerColor)
      pdf.rect(this.MARGIN, y, this.CONTENT_WIDTH, 6, 'F')
      
      // Section title
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.medium)
      pdf.setTextColor(this.settings?.header_text_color || '#FFFFFF')
      pdf.text("Referrals", this.MARGIN + 5, y + 4)
      pdf.setTextColor(this.textColor)
      
      // Two-column layout for referrals
      const leftColumnX = this.MARGIN
      const rightColumnX = this.MARGIN + (this.CONTENT_WIDTH / 2)
      
      const referrals = [
        { key: 'local_clinic', label: 'Local Clinic / Hospital' },
        { key: 'audiologist', label: 'Referred to Audiologist' },
        { key: 'optometrist', label: 'Referred to Optometrist' },
        { key: 'lung_function', label: 'Referred for Lung Function' },
        { key: 'omp', label: 'Referred to OMP' }
      ]
      
      referrals.forEach((referral, index) => {
        const column = index < 3 ? leftColumnX : rightColumnX
        const rowOffset = index < 3 ? index : index - 3
        const yPos = y + 10 + (rowOffset * 6)
        
        // Checkboxes are checked by doctor when they refer the patient
        const isReferred = data.referrals[referral.key as keyof typeof data.referrals]
        this.addCheckbox(pdf, column, yPos - 2, isReferred, referral.label)
      })
    } catch (error) {
      console.warn('Failed to add referrals:', error)
    }
  }
  
  /**
   * Add fitness status section - This is where the doctor selects the fitness status
   */
  private addFitnessStatus(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y = this.positions.fitnessStatus
      
      // Fitness status checkboxes in a 2x2 grid
      // These checkboxes represent the doctor's selection
      const statuses = [
        { key: 'fit', label: 'Fit for duty' },
        { key: 'fit_with_conditions', label: 'Fit for duty with medical conditions' },
        { key: 'fit_with_restrictions', label: 'Fit for duty with restrictions' },
        { key: 'temporarily_unfit', label: 'Temporarily unfit' }
      ]
      
      statuses.forEach((status, index) => {
        const column = index % 2
        const row = Math.floor(index / 2)
        const x = this.MARGIN + (column * 90)
        const yPos = y + (row * 8)
        
        // Only check the box that matches the selected fitness status
        const isSelected = data.fitness_status === status.key
        this.addCheckbox(pdf, x, yPos - 2, isSelected, status.label)
      })
    } catch (error) {
      console.warn('Failed to add fitness status:', error)
    }
  }
  
  /**
   * Add restrictions section
   */
 private addRestrictions(pdf: jsPDF, data: FitnessCertificateData): void {
  try {
    if (!data.restrictions || !this.showSections.restrictions) return
    
    // Check if positions.restrictions exists, otherwise use default
    const y = this.positions.restrictions || this.positions.fitnessStatus + 20
    
    pdf.setFont(this.bodyFontFamily, 'normal')
    pdf.setFontSize(this.fontSizes.small)
    pdf.text(`Restrictions: ${data.restrictions}`, this.MARGIN, y)
  } catch (error) {
    console.warn('Failed to add restrictions:', error)
  }
}
  
  /**
   * Add validity period section
   */
  private addValidityPeriod(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      if (!this.showSections.validityDates) return
      
      const y = this.positions.validity
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.normal)
      
      pdf.text('Valid from:', this.MARGIN, y)
      pdf.text(data.valid_from, this.MARGIN + 25, y)
      
      pdf.text('Until:', this.MARGIN + 80, y)
      pdf.text(data.valid_until, this.MARGIN + 100, y)
    } catch (error) {
      console.warn('Failed to add validity period:', error)
    }
  }
  
  /**
   * Add signatures section
   */
  private addSignatures(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      const y1 = this.positions.signature1
      const y2 = this.positions.signature2
      
      // First signature block (Occupational Health Practitioner)
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.normal)
      pdf.text('Occupational Health Practitioner', this.MARGIN, y1)
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.small)
      pdf.text(`Practice No: ${data.practitioner_number}`, this.MARGIN, y1 + 5)
      
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.medium)
      pdf.text(data.practitioner_name, this.MARGIN, y1 + 12)
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.small)
      const qualifications = data.practitioner_qualifications.split(', ')
      qualifications.forEach((qual: string, index: number) => {
        pdf.text(qual, this.MARGIN, y1 + 17 + (index * 4))
      })
      
      pdf.text(`HPCSA: ${data.practitioner_registration}`, this.MARGIN, y1 + 25)
      pdf.text(`OCCMED: ${data.omp_number}`, this.MARGIN, y1 + 29)
      
      // Second signature block (Medical Doctor / OMP)
      pdf.setFont(this.titleFontFamily, 'bold')
      pdf.setFontSize(this.fontSizes.normal)
      pdf.text('Medical Doctor / OMP', this.MARGIN, y2)
      
      // Line for signature
      pdf.setDrawColor(this.textColor)
      pdf.setLineWidth(0.5)
      pdf.line(this.MARGIN, y2 + 10, this.MARGIN + 60, y2 + 10)
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.small)
      pdf.text('Signature:', this.MARGIN, y2 + 16)
      pdf.text('Date:', this.MARGIN, y2 + 20)
    } catch (error) {
      console.warn('Failed to add signatures:', error)
    }
  }
  
  /**
   * Add footer section
   */
  private addFooter(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      if (!this.settings?.footer_text) return
      
      const y = this.positions.footer
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.small)
      pdf.setTextColor(this.secondaryTextColor)
      pdf.text(this.settings.footer_text, this.PAGE_WIDTH / 2, y, { align: 'center' })
      
      if (this.settings.disclaimer_text) {
        pdf.setFontSize(this.fontSizes.tiny)
        pdf.text(this.settings.disclaimer_text, this.PAGE_WIDTH / 2, y + 5, { align: 'center' })
      }
      
      // Reset text color
      pdf.setTextColor(this.textColor)
    } catch (error) {
      console.warn('Failed to add footer:', error)
    }
  }
  
  /**
   * Add QR code section
   */
  private addQRCode(pdf: jsPDF, data: FitnessCertificateData): void {
    try {
      if (!this.showSections.qrCode) return
      
      // QR code would be implemented here
      // For now, just reserve space
      const qrSize = 20
      const qrX = this.PAGE_WIDTH - this.MARGIN - qrSize
      const qrY = this.positions.footer - qrSize - 5
      
      // Draw placeholder
      pdf.setDrawColor(this.secondaryTextColor)
      pdf.setFillColor('#F0F0F0')
      pdf.rect(qrX, qrY, qrSize, qrSize, 'F')
      pdf.rect(qrX, qrY, qrSize, qrSize)
      
      pdf.setFont(this.bodyFontFamily, 'normal')
      pdf.setFontSize(this.fontSizes.tiny)
      pdf.setTextColor(this.secondaryTextColor)
      pdf.text('QR Code', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' })
    } catch (error) {
      console.warn('Failed to add QR code:', error)
    }
  }
  
  /**
   * Add checkbox with label
   */
  private addCheckbox(pdf: jsPDF, x: number, y: number, checked: boolean, label: string): void {
    try {
      // Draw checkbox square (4x4 mm)
      pdf.setDrawColor(this.checkboxColor)
      pdf.setLineWidth(0.5)
      pdf.rect(x, y, 4, 4)
      
      if (checked) {
        // Add checkmark (✓)
        pdf.setFontSize(this.fontSizes.medium)
        pdf.text("✓", x + 1.2, y + 3.2)
      }
      
      // Add label if provided
      if (label) {
        pdf.setFont(this.bodyFontFamily, 'normal')
        pdf.setFontSize(this.fontSizes.normal)
        pdf.text(label, x + 7, y + 3)
      }
    } catch (error) {
      console.warn('Failed to add checkbox:', error)
    }
  }
  
  /**
   * Split text into lines for fixed-width display
   */
  private splitTextToLines(text: string, maxWidth: number): string[] {
    try {
      if (!text) return ['']
      
      const words = text.split(' ')
      const lines: string[] = []
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        if (testLine.length <= maxWidth / 2) {
          currentLine = testLine
        } else {
          if (currentLine) {
            lines.push(currentLine)
          }
          currentLine = word
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines
    } catch (error) {
      console.warn('Failed to split text to lines:', error)
      return [text]
    }
  }
}

export function generateFitnessCertificate(
  data: FitnessCertificateData,
  settings?: CertificateSettings
): Buffer {
  const generator = new FitnessCertificateGenerator(settings)
  return generator.generateCertificate(data)
}
