import { emailService } from '@/lib/email/email-service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing email service...')
    
    // Test 1: Appointment confirmation
    const result1 = await emailService.sendAppointmentConfirmation(
      'haward2307@gmail.com',
      {
        patientName: 'John Doe',
        appointmentDate: '2026-01-13',
        appointmentTime: '10:00 AM',
        appointmentType: 'Medical Checkup',
        clinicName: 'Test Medical Clinic',
        clinicAddress: '123 Health Street, Johannesburg',
        clinicPhone: '011 123 4567',
        doctorName: 'Dr. Smith',
      }
    )
    
    console.log('Appointment email result:', result1)
    
    // Test 2: Certificate email
    const result2 = await emailService.sendCertificateEmail(
      'haward2307@gmail.com',
      {
        patientName: 'Jane Smith',
        certificateNumber: 'CERT-2026-001',
        certificateType: 'fit_to_work',
        issueDate: '2026-01-12',
        expiryDate: '2027-01-12',
        doctorName: 'Dr. Johnson',
        clinicName: 'Test Medical Clinic',
        downloadUrl: 'https://example.com/certificate.pdf',
      }
    )
    
    console.log('Certificate email result:', result2)
    
    // Test 3: Employer invitation
    const result3 = await emailService.sendEmployerInvitation(
      'haward2307@gmail.com',
      {
        companyName: 'Test Company Ltd',
        contactName: 'Mr. Employer',
        clinicName: 'Test Medical Clinic',
        loginUrl: 'http://localhost:3000/auth/sign-in',
        temporaryPassword: 'TempPass123!',
        email: 'haward2307@gmail.com',
      }
    )
    
    console.log('Employer invitation result:', result3)
    
    return NextResponse.json({
      success: true,
      message: 'Test emails sent via your email service!',
      results: {
        appointment: result1,
        certificate: result2,
        employer: result3,
      },
      note: 'Check your email inbox (and spam folder) for all 3 test emails'
    })
    
  } catch (error: any) {
    console.error('Email service test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
