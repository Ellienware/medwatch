// lib/actions/certificate-actions.ts
"use server"

import { 
  getCertificateRepository, 
  getAppointmentRepository, 
  getPatientRepository, 
  getClinicRepository, 
  getUserRepository, 
  getEmployerRepository, 
  getTestResultRepository, 
  getClinicalTestRepository 
} from "@/lib/repositories"

import { revalidatePath } from "next/cache"
import type { Certificate, Appointment, Patient, Clinic, User, CertificateType, CertificateTemplate, TemplateCategory, TemplateLayout } from "@/lib/types/database"
import type { CertificateSettings } from "@/lib/types/certificate-settings"
import { serverCertificateGenerator } from "@/lib/pdf/server-certificate-generator"
import { serverStorageService } from "@/lib/storage/storage-service"
import { getCurrentUser } from "@/lib/auth/actions"
import { emailService } from "@/lib/email/email-service"
import { format } from "date-fns"
import { Query } from "appwrite"
import { CertificateTemplateRepository } from "../repositories/template-repository"

// Helper function for certificate type text
function getCertificateTypeText(type: CertificateType): string {
  switch (type) {
    case 'fit_to_work': return 'Fit to Work'
    case 'unfit_to_work': return 'Unfit to Work'
    case 'fit_with_restrictions': return 'Fit with Restrictions'
    default: return type
  }
}

// Main certificate creation function with template support
export async function createCertificate(data: Partial<Certificate> & {
  sent_to_patient?: boolean
  status?: "draft" | "issued" | "revoked" | "expired"
  template_id?: string  // NEW: Template selection
}) {
  try {
    // Get current user to get clinic_id and other user info
    const currentUser = await getCurrentUser()
    if (!currentUser?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const certificateRepo = getCertificateRepository()
    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const userRepo = getUserRepository()
    const employerRepo = getEmployerRepository()
    const testResultRepo = getTestResultRepository()
    const clinicalTestRepo = getClinicalTestRepository()
    const templateRepo = new CertificateTemplateRepository()  // NEW

    // ========== DEBUGGING: Log input data ==========
    console.log('🔍 DEBUG: Creating certificate with data:', {
      appointment_id: data.appointment_id,
      certificate_type: data.certificate_type,
      patient_id: data.patient_id,
      template_id: data.template_id  // NEW
    })

    // ========== TEMPLATE HANDLING ==========
    let selectedTemplate: CertificateTemplate | null = null
    if (data.template_id) {
      // Get selected template
      selectedTemplate = await templateRepo.findById(data.template_id)
      if (!selectedTemplate || selectedTemplate.clinic_id !== currentUser.clinic_id) {
        throw new Error("Template not found or unauthorized")
      }
    } else {
      // Get default template for clinic
      selectedTemplate = await templateRepo.findDefaultTemplate(currentUser.clinic_id)
    }
    
    console.log('🔍 DEBUG: Using template:', {
      template_id: selectedTemplate?.id,
      template_name: selectedTemplate?.name,
      is_one_page: selectedTemplate?.is_one_page
    })

    // Get appointment details
    if (!data.appointment_id) {
      throw new Error("Appointment ID is required")
    }

    const appointment = await appointmentRepo.findById(data.appointment_id)
    if (!appointment) {
      throw new Error("Appointment not found")
    }

    // ========== DEBUGGING: Log appointment ==========
    console.log('🔍 DEBUG: Found appointment:', {
      id: appointment.id,
      patient_id: appointment.patient_id,
      status: appointment.status
    })

    // Get patient details
    const patient = await patientRepo.findById(appointment.patient_id)
    if (!patient) {
      throw new Error("Patient not found")
    }

    // ========== DEBUGGING: Log patient ==========
    console.log('🔍 DEBUG: Found patient:', {
      id: patient.id,
      name: `${patient.first_name} ${patient.last_name}`
    })

    // Get clinic details
    const clinic = await clinicRepo.findById(currentUser.clinic_id)
    if (!clinic) {
      throw new Error("Clinic not found")
    }

    // ========== DEBUGGING: Log clinic ==========
    console.log('🔍 DEBUG: Found clinic:', {
      id: clinic.id,
      name: clinic.name
    })

    // Fetch test results for this appointment
    console.log('🔍 DEBUG: Fetching test results for appointment:', data.appointment_id)
    const testResults = await testResultRepo.findByAppointmentId(data.appointment_id!)
    
    // ========== DEBUGGING: Log raw test results ==========
    console.log('🔍 DEBUG: Raw test results from database:', {
      count: testResults.length,
      results: testResults.map(r => ({
        id: r.id,
        test_code: r.test_code,
        has_results: !!r.results,
        results_type: typeof r.results
      }))
    })

    // Enrich test results with test names
    const enrichedTestResults = await Promise.all(
      testResults.map(async (testResult) => {
        let testName = 'Unknown Test'
        
        if (testResult.test_code) {
          try {
            const test = await clinicalTestRepo.findByTestCode(testResult.test_code, currentUser.clinic_id!)
            testName = test?.test_name || 'Unknown Test'
          } catch (error) {
            console.error('Error fetching test name:', error)
          }
        }
        
        // Parse results if they're strings
        let parsedResults = {}
        if (testResult.results) {
          try {
            parsedResults = typeof testResult.results === 'string' 
              ? JSON.parse(testResult.results || '{}')
              : testResult.results
          } catch (error) {
            console.error('Error parsing test results:', error)
            parsedResults = {}
          }
        }
        
        const enrichedResult = {
          ...testResult,
          test_name: testName,
          results: parsedResults
        }
        
        // ========== DEBUGGING: Log enriched result ==========
        console.log('🔍 DEBUG: Enriched test result:', {
          test_code: testResult.test_code,
          test_name: enrichedResult.test_name,
          results_count: Object.keys(parsedResults).length
        })
        
        return enrichedResult
      })
    )

    // ========== DEBUGGING: Log final enriched results ==========
    console.log('🔍 DEBUG: Final enriched test results:', {
      count: enrichedTestResults.length,
      results: enrichedTestResults.map(r => ({
        test_name: r.test_name,
        test_code: r.test_code,
        results: r.results
      }))
    })

    // Get doctor details
    let doctor: User | null = null
    try {
      doctor = await userRepo.findById(currentUser.id)
    } catch (error) {
      console.error("Error fetching doctor from user repo:", error)
    }

    // Create a complete User object with all required fields
    const doctorData: User = doctor || {
      id: currentUser.id,
      clinic_id: currentUser.clinic_id!,
      branch_id: currentUser.branch_id || null,
      auth_user_id: currentUser.auth_user_id,
      email: currentUser.email,
      full_name: currentUser.full_name,
      phone: currentUser.phone || null,
      role: currentUser.role,
      permissions: currentUser.permissions || {},
      professional_registration_number: currentUser.professional_registration_number || null,
      specialization: currentUser.specialization || null,
      avatar_url: currentUser.avatar_url || null,
      is_active: currentUser.is_active !== undefined ? currentUser.is_active : true,
      last_login: currentUser.last_login || null,
      created_at: currentUser.created_at || new Date().toISOString(),
      updated_at: currentUser.updated_at || new Date().toISOString(),
      first_login_required: false,
      temporary_password_set: false,
      invitation_token: null,
      invitation_sent_at: null,
      invited_at: null,
      invitation_status: null
    }

    // Generate certificate number if not provided
    if (!data.certificate_number) {
      data.certificate_number = await certificateRepo.generateCertificateNumber(currentUser.clinic_id)
    }

    // Format dates
    const now = new Date()
    const issueDate = format(now, "yyyy-MM-dd")
    const validFrom = data.valid_from ? format(new Date(data.valid_from), "yyyy-MM-dd") : null
    const validUntil = data.valid_until ? format(new Date(data.valid_until), "yyyy-MM-dd") : null

    // Create certificate with template_id
    const certificateData: Partial<Certificate> = {
      ...data,
      clinic_id: currentUser.clinic_id,
      patient_id: appointment.patient_id,
      appointment_id: data.appointment_id!,
      template_id: selectedTemplate?.id || null,  // NEW: Include template reference
      issue_date: issueDate,
      valid_from: validFrom,
      valid_until: validUntil,
      issued_by: currentUser.id,
      doctor_name: currentUser.full_name,
      doctor_registration_number: currentUser.professional_registration_number || null,
      sent_to_employer: false,
      sent_to_patient: false,
      sent_at: null,
      status: "issued",
      test_results: enrichedTestResults 
    }

    const certificate = await certificateRepo.create(certificateData)

    // ========== DEBUGGING: Log created certificate ==========
    console.log('🔍 DEBUG: Certificate created:', {
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      template_id: certificate.template_id,
      test_results_count: certificate.test_results?.length || 0
    })

    try {
      // Use template settings if available, otherwise clinic settings
      const certificateSettings = selectedTemplate?.settings as CertificateSettings || 
                                 (clinic.settings?.certificate_settings as CertificateSettings) || 
                                 undefined

      // Create certificate object for PDF generation with all required fields
      const certificateForPDF: Certificate = {
        id: certificate.id,
        clinic_id: certificate.clinic_id!,
        appointment_id: certificate.appointment_id!,
        patient_id: certificate.patient_id!,
        certificate_number: certificate.certificate_number!,
        certificate_type: certificate.certificate_type!,
        issue_date: certificate.issue_date!,
        valid_from: certificate.valid_from,
        valid_until: certificate.valid_until,
        diagnosis: certificate.diagnosis || null,
        restrictions: certificate.restrictions || null,
        recommendations: certificate.recommendations || null,
        issued_by: certificate.issued_by!,
        doctor_name: certificate.doctor_name!,
        doctor_registration_number: certificate.doctor_registration_number || null,
        doctor_signature_url: certificate.doctor_signature_url || null,
        pdf_url: certificate.pdf_url || null,
        template_id: certificate.template_id || null,  // NEW
        sent_to_employer: certificate.sent_to_employer!,
        sent_to_patient: certificate.sent_to_patient!,
        sent_at: certificate.sent_at || null,
        status: certificate.status!,
        created_at: certificate.created_at!,
        updated_at: certificate.updated_at!,
        test_results: certificate.test_results || []
      }

      // ========== DEBUGGING: Log PDF generation data ==========
      console.log('🔍 DEBUG: Generating PDF with:', {
        certificate_number: certificateForPDF.certificate_number,
        template_name: selectedTemplate?.name,
        template_is_one_page: selectedTemplate?.is_one_page,
        test_results_count: enrichedTestResults.length,
        certificate_settings: !!certificateSettings
      })

      // ========== KEY FIX: Use SERVER generator with template support ==========
      // Generate PDF using SERVER generator with template
      const pdfBuffer = await serverCertificateGenerator.generateCertificate({
        certificate: certificateForPDF,
        patient,
        clinic,
        doctor: doctorData,
        branch: undefined,
        settings: certificateSettings,
        template: selectedTemplate || undefined,  // NEW: Pass template
        testResults: enrichedTestResults
      })

      console.log('✅ DEBUG: PDF generated successfully, buffer size:', pdfBuffer.length)

      // Upload PDF to storage
      const fileName = `certificate_${certificate.certificate_number}_${Date.now()}.pdf`

      // Convert to Uint8Array
      const pdfUint8Array = new Uint8Array(pdfBuffer)
      const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })

      console.log('🔍 DEBUG: Uploading PDF to storage...')
      const uploadedFile = await serverStorageService.uploadFile(file, {
        prefix: "CERTIFICATES" as const
      })

      console.log('✅ DEBUG: PDF uploaded successfully:', uploadedFile.fileUrl)

      // Update certificate with PDF URL
      const updatedCertificate = await certificateRepo.update(certificate.id, {
        pdf_url: uploadedFile.fileUrl,
      })

      // ========== EMAIL SENDING SECTION ==========
      let emailsSent = {
        patient: false,
        employer: false
      }

      // Send email to patient
      if (patient.email) {
        try {
          const certificateTypeText = getCertificateTypeText(certificate.certificate_type!)

          const emailResult = await emailService.sendCertificateEmail(patient.email, {
            patientName: `${patient.first_name} ${patient.last_name}`,
            certificateNumber: certificate.certificate_number!,
            certificateType: certificateTypeText,
            issueDate: new Date(certificate.issue_date!).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            expiryDate: certificate.valid_until ? 
              new Date(certificate.valid_until).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : undefined,
            doctorName: certificate.doctor_name!,
            clinicName: clinic.name,
            downloadUrl: uploadedFile.fileUrl,
            templateName: selectedTemplate?.name,  // NEW: Include template name
          })

          if (emailResult.success) {
            emailsSent.patient = true
            await certificateRepo.update(certificate.id, {
              sent_to_patient: true,
              sent_at: new Date().toISOString()
            })
          }
        } catch (emailError) {
          console.error("Failed to send email to patient:", emailError)
        }
      }

      // Send email to employer
      if (patient.employer_id && patient.employer_id !== 'none') {
        try {
          const employer = await employerRepo.findById(patient.employer_id)
          
          if (employer && employer.email && (employer.auto_receive_certificates || employer.portal_enabled)) {
            const certificateTypeText = getCertificateTypeText(certificate.certificate_type!)

            const emailResult = await emailService.sendCertificateEmail(employer.email, {
              patientName: `${patient.first_name} ${patient.last_name}`,
              certificateNumber: certificate.certificate_number!,
              certificateType: certificateTypeText,
              issueDate: new Date(certificate.issue_date!).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }),
              expiryDate: certificate.valid_until ? 
                new Date(certificate.valid_until).toLocaleDateString('en-ZA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : undefined,
              doctorName: certificate.doctor_name!,
              clinicName: clinic.name,
              downloadUrl: uploadedFile.fileUrl,
              employerName: employer.company_name,
              templateName: selectedTemplate?.name,  // NEW: Include template name
            })

            if (emailResult.success) {
              emailsSent.employer = true
              await certificateRepo.update(certificate.id, {
                sent_to_employer: true,
                sent_at: new Date().toISOString()
              })
            }
          }
        } catch (emailError) {
          console.error("Failed to send email to employer:", emailError)
        }
      }

      // Prepare success message with template info
      let message = `Certificate created successfully using ${selectedTemplate?.name || 'default'} template.`
      if (emailsSent.patient && emailsSent.employer) {
        message += " Emails sent to patient and employer."
      } else if (emailsSent.patient) {
        message += " Email sent to patient."
      } else if (emailsSent.employer) {
        message += " Email sent to employer."
      } else if (patient.email || (patient.employer_id && patient.employer_id !== 'none')) {
        message += " Could not send emails."
      }

      revalidatePath("/clinic/certificates")
      
      console.log('✅ DEBUG: Certificate creation complete!', {
        success: true,
        certificate_number: updatedCertificate.certificate_number,
        template_used: selectedTemplate?.name,
        test_results_included: enrichedTestResults.length
      })
      
      return { 
        success: true, 
        certificate: updatedCertificate, 
        error: null,
        message: message,
        emailsSent: emailsSent,
        templateUsed: selectedTemplate?.name  // NEW: Return template info
      }

    } catch (pdfError) {
      console.error("❌ DEBUG: Error generating PDF:", pdfError)
      
      revalidatePath("/clinic/certificates")
      return { 
        success: true, 
        certificate, 
        error: "Certificate created but PDF generation failed",
        message: "Certificate created successfully, but PDF could not be generated.",
        emailsSent: { patient: false, employer: false },
        templateUsed: selectedTemplate?.name
      }
    }
  } catch (error) {
    console.error("❌ DEBUG: Error creating certificate:", error)
    return { 
      success: false, 
      certificate: null, 
      error: error instanceof Error ? error.message : "Failed to create certificate",
      message: null,
      emailsSent: { patient: false, employer: false },
      templateUsed: null
    }
  }
}

export async function sendCertificateEmail(certificateId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const certificateRepo = getCertificateRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const employerRepo = getEmployerRepository()
    const templateRepo = new CertificateTemplateRepository()  // NEW

    // Get certificate
    const certificate = await certificateRepo.findById(certificateId)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      throw new Error("Certificate not found or unauthorized")
    }

    // Get template info
    let templateName: string | null = null
    if (certificate.template_id) {
      try {
        const template = await templateRepo.findById(certificate.template_id)
        templateName = template?.name || null
      } catch (error) {
        console.error("Error fetching template:", error)
      }
    }

    // Get patient details
    const patient = await patientRepo.findById(certificate.patient_id)
    if (!patient) {
      throw new Error("Patient not found")
    }

    // Get clinic details
    const clinic = await clinicRepo.findById(user.clinic_id)
    if (!clinic) {
      throw new Error("Clinic not found")
    }

    // Check if certificate has PDF URL
    if (!certificate.pdf_url) {
      throw new Error("Certificate PDF not available")
    }

    let emailsSent = {
      patient: false,
      employer: false
    }
    let errors: string[] = []


// Send email to patient
if (patient.email) {
  try {
    const certificateTypeText = getCertificateTypeText(certificate.certificate_type)

    const emailResult = await emailService.sendCertificateEmail(patient.email, {
      patientName: `${patient.first_name} ${patient.last_name}`,
      certificateNumber: certificate.certificate_number,
      certificateType: certificateTypeText,
      issueDate: new Date(certificate.issue_date).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      expiryDate: certificate.valid_until ? 
        new Date(certificate.valid_until).toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : undefined,
      doctorName: certificate.doctor_name,
      clinicName: clinic.name,
      downloadUrl: certificate.pdf_url,
      templateName: templateName || undefined, // Use templateName variable (already defined above)
    })

    if (emailResult.success) {
      emailsSent.patient = true
      await certificateRepo.update(certificate.id, {
        sent_to_patient: true,
        sent_at: new Date().toISOString()
      })
    } else {
      errors.push(`Failed to send to patient: ${emailResult.error}`)
    }
  } catch (error) {
    errors.push(`Failed to send to patient: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} else {
  errors.push("Patient has no email address")
}

// Send email to employer
if (patient.employer_id && patient.employer_id !== 'none') {
  try {
    const employer = await employerRepo.findById(patient.employer_id)
    
    if (employer && employer.email && (employer.auto_receive_certificates || employer.portal_enabled)) {
      const certificateTypeText = getCertificateTypeText(certificate.certificate_type)

      const emailResult = await emailService.sendCertificateEmail(employer.email, {
        patientName: `${patient.first_name} ${patient.last_name}`,
        certificateNumber: certificate.certificate_number,
        certificateType: certificateTypeText,
        issueDate: new Date(certificate.issue_date).toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        expiryDate: certificate.valid_until ? 
          new Date(certificate.valid_until).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : undefined,
        doctorName: certificate.doctor_name,
        clinicName: clinic.name,
        downloadUrl: certificate.pdf_url,
        employerName: employer.company_name,
        templateName: templateName || undefined, // Use templateName variable
      })

      if (emailResult.success) {
        emailsSent.employer = true
        await certificateRepo.update(certificate.id, {
          sent_to_employer: true,
          sent_at: new Date().toISOString()
        })
      } else {
        errors.push(`Failed to send to employer: ${emailResult.error}`)
      }
    }
  } catch (error) {
    errors.push(`Failed to send to employer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

    // Send email to employer
    if (patient.employer_id && patient.employer_id !== 'none') {
      try {
        const employer = await employerRepo.findById(patient.employer_id)
        
        if (employer && employer.email && (employer.auto_receive_certificates || employer.portal_enabled)) {
          const certificateTypeText = getCertificateTypeText(certificate.certificate_type)

          const emailResult = await emailService.sendCertificateEmail(employer.email, {
            patientName: `${patient.first_name} ${patient.last_name}`,
            certificateNumber: certificate.certificate_number,
            certificateType: certificateTypeText,
            issueDate: new Date(certificate.issue_date).toLocaleDateString('en-ZA', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            expiryDate: certificate.valid_until ? 
              new Date(certificate.valid_until).toLocaleDateString('en-ZA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : undefined,
            doctorName: certificate.doctor_name,
            clinicName: clinic.name,
            downloadUrl: certificate.pdf_url,
            employerName: employer.company_name,
            templateName: templateName || undefined,  // NEW
          })

          if (emailResult.success) {
            emailsSent.employer = true
            await certificateRepo.update(certificate.id, {
              sent_to_employer: true,
              sent_at: new Date().toISOString()
            })
          } else {
            errors.push(`Failed to send to employer: ${emailResult.error}`)
          }
        }
      } catch (error) {
        errors.push(`Failed to send to employer: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    revalidatePath("/clinic/certificates")
    revalidatePath(`/clinic/certificates/${certificateId}`)

    const success = emailsSent.patient || emailsSent.employer
    const message = success 
      ? `Email${emailsSent.patient && emailsSent.employer ? 's' : ''} sent successfully${emailsSent.patient && emailsSent.employer ? ' to both patient and employer' : emailsSent.patient ? ' to patient' : ' to employer'}.`
      : 'Failed to send emails.'

    return { 
      success, 
      certificate: await certificateRepo.findById(certificateId),
      error: errors.length > 0 ? errors.join('; ') : null,
      message,
      emailsSent,
      templateUsed: templateName  // NEW
    }
  } catch (error) {
    console.error("Error sending certificate email:", error)
    return { 
      success: false, 
      certificate: null, 
      error: error instanceof Error ? error.message : "Failed to send certificate email",
      message: null,
      emailsSent: { patient: false, employer: false },
      templateUsed: null
    }
  }
}

export async function updateCertificateStatus(id: string, status: "draft" | "issued" | "revoked" | "expired") {
  try {
    const certificateRepo = getCertificateRepository()
    
    const certificate = await certificateRepo.update(id, { 
      status,
      updated_at: new Date().toISOString()
    })

    revalidatePath("/clinic/certificates")
    return { success: true, certificate, error: null }
  } catch (error) {
    console.error("Error updating certificate status:", error)
    return { 
      success: false, 
      certificate: null, 
      error: (error as Error).message 
    }
  }
}

// Helper function to get completed appointments
export async function getCompletedAppointments() {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, appointments: [], error: "User not associated with a clinic" }
    }

    const appointmentRepo = getAppointmentRepository()
    const patientRepo = getPatientRepository()

    // Use the correct query format for your repository
    const appointments = await appointmentRepo.find([
      Query.equal("clinic_id", user.clinic_id),
      Query.equal("status", "completed"),
      Query.orderDesc("appointment_date")
    ])
    
    // Enrich with patient details
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const patient = await patientRepo.findById(appointment.patient_id)
          return {
            id: appointment.id,
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            patient_name: patient 
              ? `${patient.first_name} ${patient.last_name}`
              : "Unknown Patient",
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            completed_at: appointment.completed_at || appointment.updated_at || appointment.created_at,
            display: `${patient?.first_name || "Patient"} ${patient?.last_name || ""} - ${appointment.appointment_date} ${appointment.appointment_time}`
          }
        } catch (error) {
          console.error("Error fetching patient:", error)
          return {
            id: appointment.id,
            appointment_id: appointment.id,
            patient_id: appointment.patient_id,
            patient_name: "Unknown Patient",
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            completed_at: appointment.completed_at || appointment.updated_at || appointment.created_at,
            display: `Patient - ${appointment.appointment_date} ${appointment.appointment_time}`
          }
        }
      })
    )

    return { 
      success: true, 
      appointments: enrichedAppointments, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching completed appointments:", error)
    return { 
      success: false, 
      appointments: [], 
      error: (error as Error).message 
    }
  }
}

// Update certificate with template support
export async function updateCertificateAction(data: {
  id: string
  certificate_type: "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"
  diagnosis?: string
  restrictions?: string
  recommendations?: string
  valid_from?: string
  valid_until?: string
  test_results?: any[]
  template_id?: string  // NEW: Optionally update template
}) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, error: "User is not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const patientRepo = getPatientRepository()
    const clinicRepo = getClinicRepository()
    const testResultRepo = getTestResultRepository()
    const clinicalTestRepo = getClinicalTestRepository()
    const templateRepo = new CertificateTemplateRepository()  // NEW

    // Get existing certificate
    const existingCertificate = await certificateRepo.findById(data.id)
    if (!existingCertificate) {
      return { success: false, error: "Certificate not found" }
    }

    // Verify access
    if (existingCertificate.clinic_id !== user.clinic_id) {
      return { success: false, error: "Unauthorized access" }
    }

    // Get template if specified
    let selectedTemplate: CertificateTemplate | null = null
    if (data.template_id) {
      selectedTemplate = await templateRepo.findById(data.template_id)
      if (!selectedTemplate || selectedTemplate.clinic_id !== user.clinic_id) {
        return { success: false, error: "Template not found or unauthorized" }
      }
    } else if (existingCertificate.template_id) {
      // Keep existing template
      selectedTemplate = await templateRepo.findById(existingCertificate.template_id)
    }

    // Prepare update data
    const updateData: Partial<Certificate> = {
      certificate_type: data.certificate_type,
      diagnosis: data.diagnosis || null,
      restrictions: data.restrictions || null,
      recommendations: data.recommendations || null,
      valid_from: data.valid_from || null,
      valid_until: data.valid_until || null,
      updated_at: new Date().toISOString(),
    }

    // Include template_id if provided
    if (data.template_id !== undefined) {
      updateData.template_id = data.template_id || null
    }

    // Format dates if provided
    if (data.valid_from) {
      updateData.valid_from = format(new Date(data.valid_from), "yyyy-MM-dd")
    }
    if (data.valid_until) {
      updateData.valid_until = format(new Date(data.valid_until), "yyyy-MM-dd")
    }

    // Update certificate
    const updatedCertificate = await certificateRepo.update(data.id, updateData)

    // Regenerate PDF with updated data and template
    try {
      const [patient, clinic] = await Promise.all([
        patientRepo.findById(updatedCertificate.patient_id),
        clinicRepo.findById(updatedCertificate.clinic_id),
      ])

      if (!patient || !clinic) {
        throw new Error("Patient or clinic not found")
      }

      // Get test results for this certificate
      console.log('🔍 DEBUG: Fetching test results for certificate:', updatedCertificate.appointment_id)
      const testResults = await testResultRepo.findByAppointmentId(updatedCertificate.appointment_id!)
      
      // Enrich test results with test names
      const enrichedTestResults = await Promise.all(
        testResults.map(async (testResult) => {
          let testName = 'Unknown Test'
          
          if (testResult.test_code) {
            try {
              const test = await clinicalTestRepo.findByTestCode(testResult.test_code, user.clinic_id!)
              testName = test?.test_name || 'Unknown Test'
            } catch (error) {
              console.error('Error fetching test name:', error)
            }
          }
          
          // Parse results if they're strings
          let parsedResults = {}
          if (testResult.results) {
            try {
              parsedResults = typeof testResult.results === 'string' 
                ? JSON.parse(testResult.results || '{}')
                : testResult.results
            } catch (error) {
              console.error('Error parsing test results:', error)
              parsedResults = {}
            }
          }
          
          return {
            ...testResult,
            test_name: testName,
            results: parsedResults
          }
        })
      )

      // Create a complete User object with all required fields
      const doctorData: User = {
        id: user.id,
        clinic_id: user.clinic_id!,
        branch_id: user.branch_id || null,
        auth_user_id: user.auth_user_id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || null,
        role: user.role,
        permissions: user.permissions || {},
        professional_registration_number: user.professional_registration_number || null,
        specialization: user.specialization || null,
        avatar_url: user.avatar_url || null,
        is_active: user.is_active !== undefined ? user.is_active : true,
        last_login: user.last_login || null,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        first_login_required: false,
        temporary_password_set: false,
        invitation_token: null,
        invitation_sent_at: null,
        invited_at: null,
        invitation_status: null
      }

      // Use template settings if available, otherwise clinic settings
      const certificateSettings = selectedTemplate?.settings as CertificateSettings || 
                                 (clinic.settings?.certificate_settings as CertificateSettings) || 
                                 undefined

      // Create certificate object for PDF generation
      const certificateForPDF: Certificate = {
        ...updatedCertificate,
        test_results: enrichedTestResults
      }

      // Regenerate PDF using serverCertificateGenerator with template
      const pdfBuffer = await serverCertificateGenerator.generateCertificate({
        certificate: certificateForPDF,
        patient,
        clinic,
        doctor: doctorData,
        branch: undefined,
        settings: certificateSettings,
        template: selectedTemplate || undefined,  // NEW: Pass template
        testResults: enrichedTestResults
      })

      console.log('✅ DEBUG: PDF regenerated successfully, buffer size:', pdfBuffer.length)

      // Upload updated PDF to storage
      const fileName = `certificate_${updatedCertificate.certificate_number}_${Date.now()}_updated.pdf`
      
      // Convert to Uint8Array and create File
      const pdfUint8Array = new Uint8Array(pdfBuffer)
      const file = new File([pdfUint8Array], fileName, { type: "application/pdf" })
      
      const uploadedFile = await serverStorageService.uploadFile(file, {
        prefix: "CERTIFICATES" as const
      })

      // Update certificate with new PDF URL
      const finalCertificate = await certificateRepo.update(updatedCertificate.id, {
        pdf_url: uploadedFile.fileUrl,
      })

      return { 
        success: true, 
        certificate: finalCertificate, 
        error: null,
        templateUsed: selectedTemplate?.name  // NEW: Return template info
      }

    } catch (pdfError) {
      console.error("Error regenerating PDF:", pdfError)
      return { 
        success: true, 
        certificate: updatedCertificate, 
        error: "Certificate updated but PDF regeneration failed",
        templateUsed: selectedTemplate?.name
      }
    }

  } catch (error) {
    console.error("Error updating certificate:", error)
    return { 
      success: false, 
      certificate: null, 
      error: (error instanceof Error ? error.message : "Failed to update certificate"),
      templateUsed: null
    }
  }
}

// Also export a simpler version if needed:
export async function updateCertificate(data: {
  id: string
  certificate_type: "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"
  diagnosis?: string
  restrictions?: string
  recommendations?: string
  valid_from?: string
  valid_until?: string
  template_id?: string  // NEW
}) {
  return updateCertificateAction(data)
}

export async function getCertificateById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, certificate: null, error: "User not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(id)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      return { success: false, certificate: null, error: "Certificate not found or unauthorized" }
    }

    // Get template info if available
    let templateInfo = null
    if (certificate.template_id) {
      try {
        const templateRepo = new CertificateTemplateRepository()
        const template = await templateRepo.findById(certificate.template_id)
        if (template) {
          templateInfo = {
            id: template.id,
            name: template.name,
            is_one_page: template.is_one_page,
            layout: template.layout
          }
        }
      } catch (error) {
        console.error("Error fetching template info:", error)
      }
    }

    return { 
      success: true, 
      certificate, 
      error: null,
      templateInfo  // NEW: Include template info
    }
  } catch (error) {
    console.error("Error fetching certificate:", error)
    return { success: false, certificate: null, error: (error as Error).message }
  }
}

export async function getCertificatesByPatient(patientId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, certificates: [], error: "User not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const certificates = await certificateRepo.findByPatientId(patientId)

    // Filter by clinic_id for security
    const clinicCertificates = certificates.filter(cert => cert.clinic_id === user.clinic_id)

    return { success: true, certificates: clinicCertificates, error: null }
  } catch (error) {
    console.error("Error fetching patient certificates:", error)
    return { success: false, certificates: [], error: (error as Error).message }
  }
}

export async function resendCertificateEmails(certificateId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, error: "User is not associated with a clinic" }
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(certificateId)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      return { success: false, error: "Certificate not found or unauthorized" }
    }

    // Check if certificate has PDF URL
    if (!certificate.pdf_url) {
      return { success: false, error: "Certificate PDF not available" }
    }

    // Send emails using the existing sendCertificateEmail function
    const result = await sendCertificateEmail(certificateId)

    revalidatePath("/clinic/certificates")
    revalidatePath(`/clinic/certificates/${certificateId}`)

    return result
  } catch (error) {
    console.error("Error resending certificate emails:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to resend emails",
      emailsSent: { patient: false, employer: false },
      templateUsed: null
    }
  }
}

export async function deleteCertificate(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(id)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      throw new Error("Certificate not found or unauthorized")
    }

    // Only allow deleting certificates that haven't been sent
    if (certificate.sent_to_patient || certificate.sent_to_employer) {
      throw new Error("Cannot delete certificate that has been sent")
    }

    // Delete the certificate
    await certificateRepo.delete(id)

    revalidatePath("/clinic/certificates")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error deleting certificate:", error)
    return { success: false, error: (error as Error).message }
  }
}

// NEW: Get available templates for current clinic
export async function getCertificateTemplates(category?: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      return { success: false, templates: [], error: "User not associated with a clinic" }
    }

    const templateRepo = new CertificateTemplateRepository()
    let templates: CertificateTemplate[] = []

    if (category) {
      templates = await templateRepo.findByClinicId(user.clinic_id, category as any)
    } else {
      templates = await templateRepo.findByClinicId(user.clinic_id)
    }

    return { 
      success: true, 
      templates, 
      error: null 
    }
  } catch (error) {
    console.error("Error fetching certificate templates:", error)
    return { 
      success: false, 
      templates: [], 
      error: (error as Error).message 
    }
  }
}

// NEW: Create a new certificate template
export async function createCertificateTemplate(data: {
  name: string;
  description?: string;
  category?: TemplateCategory; // CHANGE THIS
  layout?: TemplateLayout; // CHANGE THIS
  is_one_page?: boolean;
  sections_included?: string[];
  settings?: CertificateSettings;
}) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const templateRepo = new CertificateTemplateRepository()
    
    const template = await templateRepo.create({
      clinic_id: user.clinic_id,
      name: data.name,
      description: data.description || null,
      category: data.category || 'medical',
      layout: data.layout || 'single',
      is_one_page: data.is_one_page || false,
      sections_included: data.sections_included || ["patient_info", "test_results", "diagnosis", "restrictions", "recommendations", "signature"],
      settings: data.settings || {},
      is_default: false,
      created_by: user.id
    })

    revalidatePath("/clinic/settings/certificate-templates")
    return { 
      success: true, 
      template, 
      error: null 
    }
  } catch (error) {
    console.error("Error creating certificate template:", error)
    return { 
      success: false, 
      template: null, 
      error: (error instanceof Error ? error.message : "Failed to create template") 
    }
  }
}

// NEW: Regenerate certificate PDF with different template
export async function regenerateCertificateWithTemplate(certificateId: string, templateId: string) {
  try {
    const user = await getCurrentUser()
    if (!user?.clinic_id) {
      throw new Error("User is not associated with a clinic")
    }

    const certificateRepo = getCertificateRepository()
    const certificate = await certificateRepo.findById(certificateId)

    if (!certificate || certificate.clinic_id !== user.clinic_id) {
      throw new Error("Certificate not found or unauthorized")
    }

    // Update certificate with new template
    const result = await updateCertificateAction({
      id: certificateId,
      certificate_type: certificate.certificate_type,
      diagnosis: certificate.diagnosis || undefined,
      restrictions: certificate.restrictions || undefined,
      recommendations: certificate.recommendations || undefined,
      valid_from: certificate.valid_from || undefined,
      valid_until: certificate.valid_until || undefined,
      template_id: templateId
    })

    revalidatePath("/clinic/certificates")
    revalidatePath(`/clinic/certificates/${certificateId}`)

    return result
  } catch (error) {
    console.error("Error regenerating certificate with template:", error)
    return { 
      success: false, 
      certificate: null, 
      error: (error as Error).message,
      templateUsed: null
    }
  }
}