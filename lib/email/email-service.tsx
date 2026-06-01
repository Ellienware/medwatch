/// lib/email/email-service.ts

import logger from "@/lib/logging/logger"


// Configuration for Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY!
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

// Email configuration - Use Brevo's shared domain for development
const EMAIL_CONFIG = {
  FROM_EMAIL: process.env.EMAIL_FROM || "dev@sendinblue.com", // Brevo's shared domain
  FROM_NAME: process.env.EMAIL_FROM_NAME || "MedWatch",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@mewatch.com",
}

// ========== INTERFACES ==========

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface StaffInvitationEmailData {
  recipientName: string
  invitedBy: string
  role: string
  clinicName: string
  loginUrl: string
  temporaryPassword: string
  email: string
}

export interface EmployerInvitationEmailData {
  companyName: string
  contactName: string
  clinicName: string
  loginUrl: string
  temporaryPassword: string
  email: string
}

export interface AppointmentConfirmationEmailData {
  patientName: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
  instructions?: string
  doctorName?: string
  appointmentId?: string
}

export interface CertificateEmailData {
  patientName: string
  certificateNumber: string
  certificateType: string
  issueDate: string
  expiryDate?: string
  doctorName: string
  clinicName: string
  downloadUrl?: string
  employerName?: string
  templateName?: string;
  
  // Add these optional properties:
  isComputerAssisted?: boolean
  confidence?: number
  restrictions?: string | null
  requiresFollowUp?: boolean
  hasRestrictions?: boolean // If you still need this
}
export interface AppointmentReminderEmailData {
  patientName: string
  appointmentDate: string
  appointmentTime: string
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
}

export interface TestResultEmailData {
  patientName: string
  testName: string
  performedDate: string
  clinicName: string
  resultsSummary?: string
  doctorName?: string
}

export interface TrialEmailData {
  clinicName: string
  daysRemaining: number
  trialEndDate: string
  planName: string
  monthlyPrice: number
  billingUrl?: string
}

export interface BillingEmailData {
  clinicName: string
  amount: number
  reference: string
  date: string
  description: string
  invoiceUrl?: string
  planName?: string
  nextBillingDate?: string
}

export interface PaymentFailedData {
  clinicName: string
  planName: string
  monthlyPrice: number
  retryUrl: string
  supportEmail: string
}

export interface NoPaymentMethodData {
  clinicName: string
  daysRemaining: number
  trialEndDate: string
  planName: string
  monthlyPrice: number
  billingUrl?: string
}

export interface PasswordResetEmailData {
  recipientName: string
  resetLink: string
  clinicName: string
}

export interface InvitationEmailData {
  recipientName: string
  invitedBy: string
  role: string
  clinicName: string
  invitationLink: string
}

export interface TestResultNotificationEmailData {
  patientName: string
  testName: string
  performedDate: string
  isNormal: boolean
  clinicName: string
}

export interface EmployerWelcomeEmailData {
  companyName: string
  loginUrl: string
  email: string
  temporaryPassword: string
  clinicName: string
}

// ========== EMAIL SERVICE CLASS ==========
export class EmailService {
  /**
   * Send email via Brevo API
   */
private async sendEmail(options: EmailOptions): Promise<{ 
  success: boolean; 
  error?: string; 
  messageId?: string 
}> {
  try {
    // Check if Brevo is configured
    if (!BREVO_API_KEY) {
      logger.warn("Brevo API key not configured. Email not sent.", {
        to: options.to,
        subject: options.subject,
      })
      return { success: false, error: "Email service not configured" }
    }

    logger.info("Sending email via Brevo", {
      to: options.to,
      subject: options.subject,
    })

    // Prepare recipients for Brevo
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    const recipients = toArray.map(email => ({ email }))

    // Prepare CC if exists - ADD TYPE ANNOTATION HERE
    let ccRecipients: Array<{ email: string }> = []
    if (options.cc) {
      const ccArray = Array.isArray(options.cc) ? options.cc : [options.cc]
      ccRecipients = ccArray.map(email => ({ email }))
    }

    // Prepare BCC if exists - ADD TYPE ANNOTATION HERE
    let bccRecipients: Array<{ email: string }> = []
    if (options.bcc) {
      const bccArray = Array.isArray(options.bcc) ? options.bcc : [options.bcc]
      bccRecipients = bccArray.map(email => ({ email }))
    }

    // Brevo API request
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: EMAIL_CONFIG.FROM_NAME,
          email: EMAIL_CONFIG.FROM_EMAIL,
        },
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text || this.htmlToText(options.html),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Unknown error' }
      }
      
      logger.error("Failed to send email via Brevo", {
        status: response.status,
        error: errorData,
        to: options.to,
      })
      
      return {
        success: false,
        error: errorData.message || errorData.code || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    logger.info("Email sent successfully via Brevo", { 
      to: options.to, 
      messageId: data.messageId 
    })

    return { success: true, messageId: data.messageId }
  } catch (error) {
    logger.error("Failed to send email", error, { to: options.to })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

  /**
   * Convert HTML to plain text for textContent
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')           // Remove HTML tags
      .replace(/&nbsp;/g, ' ')            // Replace non-breaking spaces
      .replace(/\s+/g, ' ')               // Collapse multiple spaces
      .replace(/^\s+|\s+$/g, '')          // Trim
      .replace(/\\n/g, '\n')              // Preserve newlines
      .trim()
  }

  // ========== STAFF INVITATION ==========
  async sendStaffInvitation(
    to: string, 
    data: StaffInvitationEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderStaffInvitationEmail(data)
    const text = `You've been invited to join ${data.clinicName} as a ${data.role}. Login at: ${data.loginUrl} with Email: ${data.email} and Temporary Password: ${data.temporaryPassword}. Please change your password after first login.`

    return this.sendEmail({
      to,
      subject: `Invitation to join ${data.clinicName}`,
      html,
      text,
    })
  }

  // ========== EMPLOYER INVITATION ==========
  async sendEmployerInvitation(
    to: string,
    data: EmployerInvitationEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderEmployerInvitationEmail(data)
    const text = `Your company ${data.companyName} has been registered with ${data.clinicName}. Login at: ${data.loginUrl} with Email: ${data.email} and Temporary Password: ${data.temporaryPassword}. Please change your password after first login.`

    return this.sendEmail({
      to,
      subject: `Welcome to ${data.clinicName} Employer Portal`,
      html,
      text,
    })
  }

  // ========== APPOINTMENT CONFIRMATION ==========
  async sendAppointmentConfirmation(
    to: string,
    data: AppointmentConfirmationEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderAppointmentConfirmationEmail(data)
    const text = `Your appointment at ${data.clinicName} is confirmed for ${data.appointmentDate} at ${data.appointmentTime}. Appointment Type: ${data.appointmentType}. Please arrive 15 minutes early.${data.instructions ? ` Instructions: ${data.instructions}` : ''}`

    return this.sendEmail({
      to,
      subject: `Appointment Confirmed - ${data.clinicName}`,
      html,
      text,
    })
  }

  // ========== CERTIFICATE READY ==========
  async sendCertificateEmail(
    to: string,
    data: CertificateEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderCertificateEmail(data)
    const text = `Your medical certificate ${data.certificateNumber} is ready. Type: ${data.certificateType}. Issued by Dr. ${data.doctorName} on ${data.issueDate}. ${data.downloadUrl ? `Download: ${data.downloadUrl}` : ''}`

    return this.sendEmail({
      to,
      subject: `Medical Certificate Ready - ${data.certificateNumber}`,
      html,
      text,
    })
  }

  // ========== APPOINTMENT REMINDER ==========
  async sendAppointmentReminder(
    to: string,
    data: AppointmentReminderEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderAppointmentReminderEmail(data)
    const text = `Reminder: You have an appointment at ${data.appointmentTime} at ${data.clinicName}. Please arrive 15 minutes early.`

    return this.sendEmail({
      to,
      subject: `Appointment Reminder - ${data.clinicName}`,
      html,
      text,
    })
  }

  // ========== TEST RESULTS ==========
  async sendTestResultNotification(
    to: string,
    data: TestResultEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderTestResultEmail(data)
    const text = `Your test results for ${data.testName} performed on ${data.performedDate} are now available. Please log in to view them.`

    return this.sendEmail({
      to,
      subject: `Test Results Available - ${data.testName}`,
      html,
      text,
    })
  }

  // ========== PASSWORD RESET ==========
  async sendPasswordReset(
    to: string,
    data: PasswordResetEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderPasswordResetEmail(data)
    const text = `You requested a password reset for your ${data.clinicName} account. Click here to reset: ${data.resetLink}. This link expires in 1 hour.`

    return this.sendEmail({
      to,
      subject: `Password Reset Request - ${data.clinicName}`,
      html,
      text,
    })
  }

  // ========== TRIAL REMINDER ==========
  async sendTrialReminder(
    to: string,
    data: TrialEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderTrialReminderEmail(data)
    const dayText = data.daysRemaining === 1 ? 'day' : 'days'

    return this.sendEmail({
      to,
      subject: `Your MedSurv Trial Ends in ${data.daysRemaining} ${dayText}`,
      html,
      text: `Your MedSurv free trial for ${data.clinicName} ends in ${data.daysRemaining} ${dayText}. After trial: ${data.planName} Plan (R${data.monthlyPrice}/month).`,
    })
  }

  // ========== TRIAL CONVERTED ==========
  async sendTrialConverted(
    to: string,
    data: BillingEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderTrialConvertedEmail(data)

    return this.sendEmail({
      to,
      subject: 'Your MedSurv Subscription is Now Active',
      html,
      text: `Your trial has converted to a paid subscription. Plan: ${data.planName}, Monthly: R${data.amount}, Next billing: ${data.nextBillingDate}.`,
    })
  }

  // ========== PAYMENT FAILED ==========
  async sendPaymentFailed(
    to: string,
    data: PaymentFailedData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderPaymentFailedEmail(data)

    return this.sendEmail({
      to,
      subject: 'Payment Failed - Action Required',
      html,
      text: `Payment failed for ${data.clinicName}. Plan: ${data.planName} (R${data.monthlyPrice}/month). Please update payment method.`,
    })
  }

  // ========== NO PAYMENT METHOD ==========
  async sendNoPaymentMethod(
    to: string,
    data: NoPaymentMethodData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderNoPaymentMethodEmail(data)

    return this.sendEmail({
      to,
      subject: 'Your MedSurv Trial Has Ended',
      html,
      text: `Your MedSurv free trial for ${data.clinicName} ended on ${data.trialEndDate}. Please add a payment method to restore access.`,
    })
  }

  // ========== PAYMENT CONFIRMATION ==========
  async sendPaymentConfirmation(
    to: string,
    data: BillingEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderPaymentConfirmationEmail(data)

    return this.sendEmail({
      to,
      subject: 'Payment Confirmation - MedSurv',
      html,
      text: `Payment of R${data.amount} received for ${data.clinicName}. Reference: ${data.reference}.`,
    })
  }

  // ========== SUBSCRIPTION CANCELLED ==========
  async sendSubscriptionCancelled(
    to: string,
    data: { clinicName: string; endDate: string }
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderSubscriptionCancelledEmail(data)

    return this.sendEmail({
      to,
      subject: 'Subscription Cancelled - MedSurv',
      html,
      text: `Your subscription for ${data.clinicName} has been cancelled. Access ends on ${data.endDate}.`,
    })
  }

  // ========== LEGACY METHODS (for backward compatibility) ==========
  async sendInvitation(to: string, data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
    const html = this.renderInvitationEmail(data)

    return this.sendEmail({
      to,
      subject: `You've been invited to join ${data.clinicName}`,
      html,
      text: `${data.invitedBy} has invited you to join ${data.clinicName} as a ${data.role}. Click the link to accept: ${data.invitationLink}`,
    })
  }

  async sendTestResultReady(
    to: string,
    data: TestResultNotificationEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderTestResultReadyEmail(data)

    return this.sendEmail({
      to,
      subject: `Test Results Available - ${data.testName}`,
      html,
      text: `Your test results for ${data.testName} are now available. Please log in to view them.`,
    })
  }

  async sendEmployerWelcomeEmail(
    to: string,
    data: EmployerWelcomeEmailData
  ): Promise<{ success: boolean; error?: string }> {
    const html = this.renderEmployerWelcomeEmail(data)

    return this.sendEmail({
      to,
      subject: `Welcome to ${data.clinicName} Employer Portal`,
      html,
      text: `Welcome to ${data.clinicName} Employer Portal. Login URL: ${data.loginUrl}, Email: ${data.email}, Temporary Password: ${data.temporaryPassword}. Please change your password after first login.`,
    })
  }

  // ========== EMAIL TEMPLATE RENDERERS ==========
  
  private renderStaffInvitationEmail(data: StaffInvitationEmailData): string {
    const roleDisplay = data.role.replace("_", " ").toUpperCase()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Staff Invitation - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #0d9488; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .credentials-box { background-color: #f0f9ff; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #0ea5e9; }
            .button { display: inline-block; padding: 16px 32px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .password-display { background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0; font-size: 24px; font-weight: bold; color: #065f46; text-align: center; }
            .security-note { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706; margin: 20px 0; }
            .role-badge { display: inline-block; padding: 8px 20px; background-color: #dbeafe; color: #1e40af; border-radius: 20px; font-weight: 600; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to ${data.clinicName}</h1>
              <p style="margin-top: 10px; opacity: 0.9;">You've been invited to join our team</p>
            </div>
            <div class="content">
              <p>Hello ${data.recipientName},</p>
              <p><strong>${data.invitedBy}</strong> has invited you to join <strong>${data.clinicName}</strong>.</p>
              
              <div style="text-align: center;">
                <div class="role-badge">${roleDisplay}</div>
              </div>
              
              <div class="credentials-box">
                <h2 style="margin: 0 0 20px 0; color: #0369a1;">Your Login Credentials</h2>
                
                <p><strong>Login URL:</strong> <a href="${appUrl}/auth/sign-in">${appUrl}/auth/sign-in</a></p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong></p>
                
                <div class="password-display">${data.temporaryPassword}</div>
                
                <a href="${appUrl}/auth/sign-in" class="button">Login to Your Account</a>
              </div>
              
              <div class="security-note">
                <h3 style="margin-top: 0; color: #92400e;">⚠️ Important Security Notice</h3>
                <p>For security reasons, you <strong>must</strong> change your password immediately after your first login.</p>
              </div>
              
              <h3>What to expect:</h3>
              <ol>
                <li>Login with the credentials above</li>
                <li>You'll be prompted to change your password</li>
                <li>Complete your profile setup</li>
                <li>Start using the MedSurv platform</li>
              </ol>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${data.invitedBy} from ${data.clinicName}</p>
              <p>If you didn't expect this invitation, please ignore this email.</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderEmployerInvitationEmail(data: EmployerInvitationEmailData): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Employer Portal Access - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #1e40af; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .credentials-box { background-color: #eff6ff; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #3b82f6; }
            .button { display: inline-block; padding: 16px 32px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .password-display { background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0; font-size: 24px; font-weight: bold; color: #065f46; text-align: center; }
            .security-note { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to ${data.clinicName} Employer Portal</h1>
              <p style="margin-top: 10px; opacity: 0.9;">Manage your employees' medical certificates</p>
            </div>
            <div class="content">
              <p>Hello ${data.contactName},</p>
              <p>Your company <strong>${data.companyName}</strong> has been registered with <strong>${data.clinicName}</strong> for medical surveillance services.</p>
              
              <div class="credentials-box">
                <h2 style="margin: 0 0 20px 0; color: #1e40af;">Your Portal Access</h2>
                
                <p><strong>Portal URL:</strong> <a href="${appUrl}/auth/sign-in">${appUrl}/auth/sign-in</a></p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong></p>
                
                <div class="password-display">${data.temporaryPassword}</div>
                
                <a href="${appUrl}/auth/sign-in" class="button">Access Employer Portal</a>
              </div>
              
              <div class="security-note">
                <h3 style="margin-top: 0; color: #92400e;">⚠️ Security Notice</h3>
                <p>Please change your password immediately after your first login for security.</p>
              </div>
              
              <h3>Portal Features:</h3>
              <ul>
                <li>View and download employee medical certificates</li>
                <li>Track certificate expiry dates</li>
                <li>View employee medical status</li>
                <li>Generate compliance reports</li>
                <li>Manage notifications</li>
              </ul>
              
              <p>If you have any questions, please contact ${data.clinicName} directly.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ${data.clinicName}</p>
              <p>Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderAppointmentConfirmationEmail(data: AppointmentConfirmationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmation - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #10b981; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .appointment-details { background-color: #f0f9ff; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Appointment Confirmed</h1>
              <p style="margin-top: 10px; opacity: 0.9;">${data.clinicName}</p>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>Your medical appointment has been confirmed. Here are the details:</p>
              
              <div class="appointment-details">
                <h3 style="margin-top: 0; color: #065f46;">Appointment Details</h3>
                <p><strong>Date:</strong> ${data.appointmentDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                <p><strong>Type:</strong> ${data.appointmentType}</p>
                ${data.doctorName ? `<p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>` : ''}
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
                ${data.clinicAddress ? `<p><strong>Address:</strong> ${data.clinicAddress}</p>` : ''}
                ${data.clinicPhone ? `<p><strong>Phone:</strong> ${data.clinicPhone}</p>` : ''}
              </div>
              
              <h3>Important Instructions:</h3>
              <ul>
                <li>Please arrive 15 minutes before your appointment time</li>
                <li>Bring your ID document</li>
                <li>Bring any relevant medical records</li>
                <li>Fast for 8-10 hours if blood tests are required</li>
              </ul>
              
              ${data.instructions ? `<div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Additional Instructions:</strong><br>${data.instructions}
              </div>` : ''}
              
              <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            </div>
            <div class="footer">
              <p>We look forward to seeing you!</p>
              <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderCertificateEmail(data: CertificateEmailData): string {
    const certificateTypeText = data.certificateType === 'fit_to_work' ? 'Fit to Work' 
      : data.certificateType === 'unfit_to_work' ? 'Unfit to Work' 
      : 'Fit with Restrictions'
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medical Certificate - ${data.certificateNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #0d9488; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .certificate-box { background-color: #f0f9ff; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0d9488; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Medical Certificate Ready</h1>
              <p style="margin-top: 10px; opacity: 0.9;">${data.clinicName}</p>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>Your medical certificate has been issued and is now available.</p>
              
              <div class="certificate-box">
                <h3 style="margin-top: 0; color: #065f46;">Certificate Details</h3>
                <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
                <p><strong>Type:</strong> ${certificateTypeText}</p>
                <p><strong>Issue Date:</strong> ${data.issueDate}</p>
                ${data.expiryDate ? `<p><strong>Valid Until:</strong> ${data.expiryDate}</p>` : ''}
                <p><strong>Issued by:</strong> Dr. ${data.doctorName}</p>
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
              </div>
              
              ${data.downloadUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.downloadUrl}" class="button">Download Certificate</a>
                  <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">This link will expire in 7 days</p>
                </div>
              ` : ''}
              
              ${data.employerName ? `
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Note:</strong> A copy of this certificate has been sent to your employer (${data.employerName}).
                </div>
              ` : ''}
              
              <h3>Important Information:</h3>
              <ul>
                <li>Keep this certificate for your records</li>
                <li>Present this certificate to your employer if required</li>
                <li>Contact the clinic if you have any questions</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an official document issued by ${data.clinicName}</p>
              <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderAppointmentReminderEmail(data: AppointmentReminderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #f59e0b; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .reminder-box { background-color: #fef3c7; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⏰ Appointment Reminder</h1>
              <p style="margin-top: 10px; opacity: 0.9;">${data.clinicName}</p>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>This is a friendly reminder about your upcoming medical appointment.</p>
              
              <div class="reminder-box">
                <h3 style="margin-top: 0; color: #92400e;">Tomorrow at ${data.appointmentTime}</h3>
                <p><strong>Date:</strong> ${data.appointmentDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
                ${data.clinicAddress ? `<p><strong>Address:</strong> ${data.clinicAddress}</p>` : ''}
                ${data.clinicPhone ? `<p><strong>Contact:</strong> ${data.clinicPhone}</p>` : ''}
              </div>
              
              <h3>Please remember to:</h3>
              <ul>
                <li>Arrive 15 minutes early for registration</li>
                <li>Bring your ID document</li>
                <li>Bring any relevant medical records</li>
                <li>Fast for 8-10 hours if required for tests</li>
              </ul>
              
              <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
            </div>
            <div class="footer">
              <p>We look forward to seeing you tomorrow!</p>
              <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderTestResultEmail(data: TestResultEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Results Available - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #8b5cf6; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .result-box { background-color: #f5f3ff; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #8b5cf6; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Test Results Available</h1>
              <p style="margin-top: 10px; opacity: 0.9;">${data.clinicName}</p>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>Your medical test results are now available for review.</p>
              
              <div class="result-box">
                <h3 style="margin-top: 0; color: #5b21b6;">Test Information</h3>
                <p><strong>Test Name:</strong> ${data.testName}</p>
                <p><strong>Date Performed:</strong> ${data.performedDate}</p>
                ${data.doctorName ? `<p><strong>Reviewed by:</strong> Dr. ${data.doctorName}</p>` : ''}
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
              </div>
              
              ${data.resultsSummary ? `
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Results Summary:</strong><br>${data.resultsSummary}
                </div>
              ` : ''}
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Log in to your patient portal to view detailed results</li>
                <li>Schedule a follow-up appointment if recommended</li>
                <li>Contact the clinic if you have any questions</li>
              </ol>
              
              <p>Your doctor may contact you directly if any immediate action is required.</p>
            </div>
            <div class="footer">
              <p>Please contact ${data.clinicName} if you have any questions about your results.</p>
              <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderPasswordResetEmail(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - ${data.clinicName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; }
            .header { background-color: #ef4444; color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 40px 20px; }
            .button { display: inline-block; padding: 16px 32px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .footer { text-align: center; padding: 30px 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
            .security-note { background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Password Reset Request</h1>
              <p style="margin-top: 10px; opacity: 0.9;">${data.clinicName}</p>
            </div>
            <div class="content">
              <p>Hello ${data.recipientName},</p>
              <p>We received a request to reset your password for your ${data.clinicName} account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetLink}" class="button">Reset Your Password</a>
              </div>
              
              <div class="security-note">
                <h3 style="margin-top: 0; color: #b91c1c;">⚠️ Security Notice</h3>
                <p>This password reset link will expire in <strong>1 hour</strong>.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
              </div>
              
              <p>If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
                ${data.resetLink}
              </p>
            </div>
            <div class="footer">
              <p>This is an automated security message from ${data.clinicName}</p>
              <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderTrialReminderEmail(data: TrialEmailData): string {
    const dayText = data.daysRemaining === 1 ? 'day' : 'days'
    const billingUrl = data.billingUrl || `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/payment-methods`

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .alert-box { background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .plan-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Trial Ending Soon</h1>
            </div>
            <div class="content">
              <p>Dear ${data.clinicName} Team,</p>
              
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #92400e;">Your trial ends in ${data.daysRemaining} ${dayText}</h2>
                <p><strong>Trial End Date:</strong> ${new Date(data.trialEndDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <div class="plan-details">
                <h3>Selected Plan After Trial</h3>
                <p><strong>Plan:</strong> ${data.planName} Plan</p>
                <p><strong>Monthly Price:</strong> R${data.monthlyPrice}</p>
                <p><strong>Billing Cycle:</strong> Monthly</p>
              </div>
              
              <p>To continue using MedSurv without interruption, please ensure you have a valid payment method saved:</p>
              
              <a href="${billingUrl}" class="button">Add Payment Method</a>
              
              <p>If you no longer wish to continue, you can cancel your trial at any time before it ends.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from MedSurv. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderTrialConvertedEmail(data: BillingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .success-box { background-color: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .plan-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to MedWatch Premium!</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="margin-top: 0; color: #065f46;">Your trial has successfully converted to a paid subscription!</h2>
                <p>Thank you for choosing MedSurv. Your full access to all features continues uninterrupted.</p>
              </div>
              
              <div class="plan-details">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Monthly Price:</strong> R${data.amount}</p>
                <p><strong>Next Billing Date:</strong> ${new Date(data.nextBillingDate!).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Billing Reference:</strong> ${data.reference}</p>
              </div>
              
              <p>You can manage your subscription, update payment methods, and view invoices from your billing dashboard:</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing" style="color: #0d9488; text-decoration: underline;">Go to Billing Dashboard</a>
              
              <p style="margin-top: 20px;">If you have any questions about your subscription, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from MedWatch. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderPaymentFailedEmail(data: PaymentFailedData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .alert-box { background-color: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
            .button { display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .plan-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Failed</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #b91c1c;">We were unable to process your payment</h2>
                <p>Your subscription payment for ${data.clinicName} could not be processed. Please update your payment method to avoid service interruption.</p>
              </div>
              
              <div class="plan-details">
                <h3>Subscription Details</h3>
                <p><strong>Plan:</strong> ${data.planName}</p>
                <p><strong>Monthly Amount:</strong> R${data.monthlyPrice}</p>
              </div>
              
              <p>Click the button below to update your payment method:</p>
              
              <a href="${data.retryUrl}" class="button">Update Payment Method</a>
              
              <p style="margin-top: 20px;">If you continue to experience issues, please contact our support team at ${data.supportEmail}.</p>
              
              <p><strong>Note:</strong> Your access to MedSurv will be suspended if payment is not received within 7 days.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from MedSurv. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderNoPaymentMethodEmail(data: NoPaymentMethodData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .alert-box { background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Trial Ended</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <h2 style="margin-top: 0; color: #374151;">Your free trial has ended</h2>
                <p>Your MedSurv free trial for <strong>${data.clinicName}</strong> ended on ${new Date(data.trialEndDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              </div>
              
              <p>To restore access to your MedSurv account and continue using all features, please subscribe to a plan:</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing}" class="button">Subscribe Now</a>
              
              <p style="margin-top: 20px;"><strong>Selected Plan:</strong> ${data.planName} Plan (R${data.monthlyPrice}/month)</p>
              
              <p>All your data is safely stored and will be available once you subscribe.</p>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from MedSurv. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderPaymentConfirmationEmail(data: BillingEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .success-box { background-color: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .receipt-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Confirmation</h1>
            </div>
            <div class="content">
              <div class="success-box">
                <h2 style="margin-top: 0; color: #065f46;">Payment Received</h2>
                <p>Thank you for your payment to MedWatch.</p>
              </div>
              
              <div class="receipt-details">
                <h3>Payment Details</h3>
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
                <p><strong>Amount:</strong> R${data.amount}</p>
                <p><strong>Reference:</strong> ${data.reference}</p>
                <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Description:</strong> ${data.description}</p>
                ${data.planName ? `<p><strong>Plan:</strong> ${data.planName}</p>` : ''}
                ${data.nextBillingDate ? `<p><strong>Next Billing Date:</strong> ${new Date(data.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>` : ''}
              </div>
              
              <p>A receipt has been generated and is available in your billing dashboard:</p>
              
              <a href="${data.invoiceUrl || `${process.env.NEXT_PUBLIC_APP_URL}/clinic/billing/invoices`}" class="button">View Receipt</a>
            </div>
            <div class="footer">
              <p>This is an automated message from MedSurv. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderSubscriptionCancelledEmail(data: { clinicName: string; endDate: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .info-box { background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6b7280; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <h2 style="margin-top: 0; color: #374151;">Your subscription has been cancelled</h2>
                <p>We've received your request to cancel the MedWatch subscription for <strong>${data.clinicName}</strong>.</p>
              </div>
              
              <p><strong>Important Information:</strong></p>
              <ul>
                <li>Your subscription will remain active until <strong>${new Date(data.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></li>
                <li>You will have access to all features until this date</li>
                <li>No further charges will be applied to your account</li>
                <li>All your data will be retained for 30 days after cancellation</li>
              </ul>
              
              <p>If you changed your mind or need to resubscribe, you can do so at any time from your billing dashboard.</p>
              
              <p>We're sorry to see you go. If there's anything we could have done better, please let us know by replying to this email.</p>
              
              <p>Thank you for using MedWatch.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from MedWatch. Please do not reply to this email.</p>
              <p>If you need assistance, contact us at ${EMAIL_CONFIG.SUPPORT_EMAIL}</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderInvitationEmail(data: InvitationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .invitation-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hello ${data.recipientName},</p>
              <p><strong>${data.invitedBy}</strong> has invited you to join <strong>${data.clinicName}</strong>.</p>
              
              <div class="invitation-box">
                <h2>Join as ${data.role.replace("_", " ").toUpperCase()}</h2>
                <p>Click the button below to accept this invitation and set up your account.</p>
                <a href="${data.invitationLink}" class="button">Accept Invitation</a>
              </div>
              
              <p>This invitation link will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderTestResultReadyEmail(data: TestResultNotificationEmailData): string {
    const statusColor = data.isNormal ? "#10b981" : "#ef4444"
    const statusText = data.isNormal ? "Normal" : "Requires Review"

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .result-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; background-color: ${statusColor}; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Test Results Available</h1>
            </div>
            <div class="content">
              <p>Dear ${data.patientName},</p>
              <p>Your test results are now available:</p>
              
              <div class="result-box">
                <p><strong>Test:</strong> ${data.testName}</p>
                <p><strong>Performed:</strong> ${data.performedDate}</p>
                <p><strong>Status:</strong> <span class="status">${statusText}</span></p>
                <p><strong>Clinic:</strong> ${data.clinicName}</p>
              </div>
              
              <p>Please log in to your account to view the full results and any recommendations from your healthcare provider.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MedWatch. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private renderEmployerWelcomeEmail(data: EmployerWelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .credentials-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px dashed #0d9488; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { color: #d97706; background-color: #fef3c7; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${data.clinicName} Employer Portal</h1>
            </div>
            <div class="content">
              <p>Dear ${data.companyName} Team,</p>
              <p>Your employer portal access has been set up by ${data.clinicName}.</p>
              
              <div class="credentials-box">
                <h3 style="margin-top: 0;">Your Portal Credentials</h3>
                <p><strong>Portal URL:</strong> <a href="${data.loginUrl}">${data.loginUrl}</a></p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> For security reasons, please change your password immediately after first login.
              </div>
              
              <a href="${data.loginUrl}" class="button">Login to Employer Portal</a>
              
              <h3>Portal Features:</h3>
              <ul>
                <li>View all employees' health status</li>
                <li>Download medical certificates</li>
                <li>Track certificate expiry dates</li>
                <li>View compliance reports</li>
                <li>Manage notification preferences</li>
              </ul>
              
              <p>If you have any questions, please contact ${data.clinicName}.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from ${data.clinicName} Employer Portal.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Email templates enum for reference
export const EMAIL_TEMPLATES = {
  STAFF_INVITATION: "staff-invitation",
  EMPLOYER_INVITATION: "employer-invitation",
  APPOINTMENT_CONFIRMATION: "appointment-confirmation",
  APPOINTMENT_REMINDER: "appointment-reminder",
  CERTIFICATE_READY: "certificate-ready",
  TEST_RESULT_READY: "test-result-ready",
  PASSWORD_RESET: "password-reset",
  TRIAL_REMINDER: "trial-reminder",
  TRIAL_CONVERTED: "trial-converted",
  PAYMENT_FAILED: "payment-failed",
  NO_PAYMENT_METHOD: "no-payment-method",
  PAYMENT_CONFIRMATION: "payment-confirmation",
  SUBSCRIPTION_CANCELLED: "subscription-cancelled",
} as const

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES]
