// Email configuration
export const EMAIL_CONFIG = {
   FROM_EMAIL: process.env.EMAIL_FROM || "nelisatest@gmail.com", 
  FROM_NAME: process.env.EMAIL_FROM_NAME || "MedWatch",
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "support@medwatch.com",
}

export const EMAIL_TEMPLATES = {
  CERTIFICATE_READY: "certificate-ready",
  APPOINTMENT_REMINDER: "appointment-reminder",
  APPOINTMENT_CONFIRMATION: "appointment-confirmation",
  TEST_RESULT_READY: "test-result-ready",
  INVITATION: "invitation",
  PASSWORD_RESET: "password-reset",
  WELCOME: "welcome",
} as const

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES]
