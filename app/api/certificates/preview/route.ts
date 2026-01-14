// app/api/certificates/preview/route.ts
import { NextRequest, NextResponse } from "next/server"
import { CertificateGenerator } from "@/lib/pdf/certificate-generator"
import type { CertificateSettings } from "@/lib/types/certificate-settings"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Extract settings from query parameters
    const settings: CertificateSettings = {}
    
    // Color settings
    if (searchParams.get('header_color')) settings.header_color = searchParams.get('header_color')!
    if (searchParams.get('header_text_color')) settings.header_text_color = searchParams.get('header_text_color')!
    if (searchParams.get('accent_color')) settings.accent_color = searchParams.get('accent_color')!
    if (searchParams.get('body_background_color')) settings.body_background_color = searchParams.get('body_background_color')!
    if (searchParams.get('text_color')) settings.text_color = searchParams.get('text_color')!
    if (searchParams.get('secondary_text_color')) settings.secondary_text_color = searchParams.get('secondary_text_color')!
    
    // Layout settings
    if (searchParams.get('include_logo')) settings.include_logo = searchParams.get('include_logo') === 'true'
    if (searchParams.get('logo_url')) settings.logo_url = searchParams.get('logo_url')!
    if (searchParams.get('include_watermark')) settings.include_watermark = searchParams.get('include_watermark') === 'true'
    if (searchParams.get('watermark_text')) settings.watermark_text = searchParams.get('watermark_text')!
    if (searchParams.get('watermark_opacity')) settings.watermark_opacity = parseInt(searchParams.get('watermark_opacity')!)
    
    // Border settings
    if (searchParams.get('show_border')) settings.show_border = searchParams.get('show_border') === 'true'
    if (searchParams.get('border_style')) settings.border_style = searchParams.get('border_style') as any
    if (searchParams.get('border_color')) settings.border_color = searchParams.get('border_color')!
    if (searchParams.get('border_width')) settings.border_width = parseInt(searchParams.get('border_width')!)
    
    // Generate preview HTML with sample data
    const html = generatePreviewHTML(settings, searchParams.get('clinic_name') || 'Sample Clinic')
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error("Error generating preview:", error)
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    )
  }
}

function generatePreviewHTML(settings: CertificateSettings, clinicName: string): string {
  const styles = generateCertificateStyles(settings)
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Preview</title>
      <style>
        ${styles}
        
        /* Preview specific styles */
        body {
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        
        .certificate-preview {
          width: 8.5in;
          height: 11in;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transform-origin: top left;
        }
      </style>
    </head>
    <body>
      <div class="certificate-preview">
        ${generateCertificateContent(settings, clinicName)}
      </div>
    </body>
    </html>
  `
}

function generateCertificateStyles(settings: CertificateSettings): string {
  return `
    .certificate {
      width: 100%;
      height: 100%;
      background-color: ${settings.body_background_color || '#FFFFFF'};
      color: ${settings.text_color || '#1F2937'};
      font-family: ${settings.body_font_family || 'Helvetica, Arial, sans-serif'};
      position: relative;
      ${settings.show_border ? `border: ${settings.border_width || 1}px ${settings.border_style || 'solid'} ${settings.border_color || '#E5E7EB'};` : ''}
      box-sizing: border-box;
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
    }
    
    /* Header */
    .certificate-header {
      background-color: ${settings.header_color || '#0D9488'};
      color: ${settings.header_text_color || '#FFFFFF'};
      padding: 30px;
      text-align: center;
      position: relative;
      z-index: 2;
    }
    
    .clinic-logo {
      max-height: 80px;
      margin-bottom: 15px;
    }
    
    .clinic-name {
      font-size: ${settings.title_font_size || 24}px;
      font-weight: bold;
      margin-bottom: 10px;
      font-family: ${settings.title_font_family || 'Helvetica, Arial, sans-serif'};
    }
    
    .clinic-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 12px;
      margin-top: 10px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    /* Content Sections */
    .certificate-content {
      padding: 40px;
      position: relative;
      z-index: 2;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      color: ${settings.accent_color || '#14B8A6'};
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${settings.accent_color || '#14B8A6'};
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .info-item {
      margin-bottom: 10px;
    }
    
    .label {
      font-size: 12px;
      color: ${settings.secondary_text_color || '#6B7280'};
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 14px;
      font-weight: 500;
    }
    
    /* Test Results */
    .test-result {
      border: 1px solid ${settings.border_color || '#E5E7EB'};
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .test-name {
      font-weight: bold;
    }
    
    .test-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .normal {
      background-color: #DCFCE7;
      color: #166534;
    }
    
    .abnormal {
      background-color: #FEE2E2;
      color: #991B1B;
    }
    
    /* Signature Area */
    .signature-area {
      margin-top: 60px;
      text-align: right;
    }
    
    .signature-image {
      height: 60px;
      margin-bottom: 10px;
    }
    
    .doctor-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .doctor-info {
      font-size: 12px;
      color: ${settings.secondary_text_color || '#6B7280'};
    }
    
    /* Footer */
    .certificate-footer {
      padding: 20px 40px;
      border-top: 1px solid ${settings.border_color || '#E5E7EB'};
      font-size: 11px;
      color: ${settings.secondary_text_color || '#6B7280'};
      text-align: center;
    }
    
    /* QR Code */
    .qr-code-area {
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: ${settings.show_qr_code ? 'block' : 'none'};
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
    }
  `
}

function generateCertificateContent(settings: CertificateSettings, clinicName: string): string {
  return `
    <div class="certificate">
      <!-- Watermark -->
      <div class="watermark">
        <div class="watermark-text">${settings.watermark_text || 'MEDICAL CERTIFICATE'}</div>
      </div>
      
      <!-- Header -->
      <div class="certificate-header">
        ${settings.include_logo && settings.logo_url ? 
          `<img src="${settings.logo_url}" alt="Clinic Logo" class="clinic-logo" />` : 
          ''
        }
        <div class="clinic-name">${clinicName}</div>
        <div class="clinic-info">
          ${settings.show_clinic_address ? '<span>123 Medical Center Dr, City</span>' : ''}
          ${settings.show_clinic_phone ? '<span>Phone: (123) 456-7890</span>' : ''}
          ${settings.show_clinic_email ? '<span>Email: info@clinic.com</span>' : ''}
          ${settings.show_registration_number ? '<span>Reg: MED-123456</span>' : ''}
        </div>
      </div>
      
      <!-- Content -->
      <div class="certificate-content">
        <!-- Certificate Title -->
        <div class="section" style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 28px; color: ${settings.accent_color || '#14B8A6'}; margin-bottom: 10px;">
            MEDICAL CERTIFICATE
          </h1>
          <p style="color: ${settings.secondary_text_color || '#6B7280'};">
            Certificate #2024-001234 • Issued on January 15, 2024
          </p>
        </div>
        
        <!-- Patient Information -->
        ${settings.show_patient_details_section ? `
        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Full Name</div>
              <div class="value">John Michael Smith</div>
            </div>
            <div class="info-item">
              <div class="label">Date of Examination</div>
              <div class="value">January 15, 2024</div>
            </div>
            <div class="info-item">
              <div class="label">ID Number</div>
              <div class="value">ID-78901234</div>
            </div>
            <div class="info-item">
              <div class="label">Employee Number</div>
              <div class="value">EMP-5678</div>
            </div>
            <div class="info-item">
              <div class="label">Occupation</div>
              <div class="value">Software Engineer</div>
            </div>
            <div class="info-item">
              <div class="label">Company</div>
              <div class="value">TechCorp Solutions</div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Certificate Details -->
        ${settings.show_diagnosis_section ? `
        <div class="section">
          <div class="section-title">Medical Findings</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Certificate Type</div>
              <div class="value">Fit to Work</div>
            </div>
            <div class="info-item">
              <div class="label">Diagnosis</div>
              <div class="value">Routine health check completed. All parameters within normal limits.</div>
            </div>
            ${settings.show_validity_dates ? `
            <div class="info-item">
              <div class="label">Valid From</div>
              <div class="value">January 15, 2024</div>
            </div>
            <div class="info-item">
              <div class="label">Valid Until</div>
              <div class="value">January 14, 2025</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Test Results -->
        ${settings.show_test_results_section ? `
        <div class="section">
          <div class="section-title">Test Results</div>
          
          <div class="test-result">
            <div class="test-header">
              <div class="test-name">Complete Blood Count (CBC)</div>
              <div class="test-status normal">NORMAL</div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">White Blood Cells</div>
                <div class="value">7.2 x10³/μL (Normal: 4.0-11.0)</div>
              </div>
              <div class="info-item">
                <div class="label">Hemoglobin</div>
                <div class="value">14.5 g/dL (Normal: 13.5-17.5)</div>
              </div>
              <div class="info-item">
                <div class="label">Platelets</div>
                <div class="value">250 x10³/μL (Normal: 150-450)</div>
              </div>
            </div>
          </div>
          
          <div class="test-result">
            <div class="test-header">
              <div class="test-name">Liver Function Test</div>
              <div class="test-status normal">NORMAL</div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">ALT (SGPT)</div>
                <div class="value">25 U/L (Normal: 7-56)</div>
              </div>
              <div class="info-item">
                <div class="label">AST (SGOT)</div>
                <div class="value">28 U/L (Normal: 5-40)</div>
              </div>
              <div class="info-item">
                <div class="label">Albumin</div>
                <div class="value">4.2 g/dL (Normal: 3.5-5.0)</div>
              </div>
            </div>
          </div>
          
          <div class="test-result">
            <div class="test-header">
              <div class="test-name">Vision Test</div>
              <div class="test-status abnormal">ABNORMAL</div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Visual Acuity (Right)</div>
                <div class="value">20/40 (Requires correction)</div>
              </div>
              <div class="info-item">
                <div class="label">Visual Acuity (Left)</div>
                <div class="value">20/30 (Requires correction)</div>
              </div>
              <div class="info-item">
                <div class="label">Recommendation</div>
                <div class="value">Refer to ophthalmologist for eyeglasses prescription</div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Restrictions -->
        ${settings.show_restrictions_section ? `
        <div class="section">
          <div class="section-title">Work Restrictions</div>
          <div class="info-item">
            <div class="value" style="font-size: 14px;">
              No heavy lifting above 25kg. Requires corrected vision for computer work. Regular breaks recommended for extended screen time.
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Signature Area -->
        <div class="signature-area">
          ${settings.signature_image_url ? 
            `<img src="${settings.signature_image_url}" alt="Doctor Signature" class="signature-image" />` : 
            '<div style="height: 60px; border-bottom: 2px solid #000; width: 200px; margin-left: auto; margin-bottom: 10px;"></div>'
          }
          <div class="doctor-name">Dr. Sarah Johnson, MD</div>
          <div class="doctor-info">Medical Director • Registration: MED-789012</div>
          <div class="doctor-info">${clinicName} • Date: January 15, 2024</div>
          
          ${settings.include_stamp && settings.stamp_image_url ? 
            `<div style="margin-top: 20px;">
              <img src="${settings.stamp_image_url}" alt="Official Stamp" style="height: 80px; opacity: 0.9;" />
            </div>` : 
            ''
          }
        </div>
        
        <!-- QR Code -->
        <div class="qr-code-area">
          <div class="qr-code">
            [QR Code]
            <div style="margin-top: 5px; font-size: 8px;">Scan to verify</div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="certificate-footer">
        ${settings.footer_text || 'This is an official medical certificate issued by our facility.'}
        <div style="margin-top: 5px; font-size: 10px;">
          ${settings.disclaimer_text || 'This certificate is valid only when bearing the original signature and stamp.'}
        </div>
      </div>
    </div>
  `
}