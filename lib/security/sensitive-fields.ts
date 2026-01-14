/**
 * Defines which fields contain PHI/sensitive data and require encryption
 *
 * This centralized configuration ensures consistent encryption across all collections
 */

export const SENSITIVE_FIELDS = {
  // Patient collection - PHI fields
  PATIENTS: [
    "first_name",
    "last_name",
    "id_number",
    "passport_number",
    "phone",
    "email",
    "address",
    "emergency_contact_name",
    "emergency_contact_phone",
    "medical_history",
    "current_medications",
    "allergies",
  ] as const,

  // Appointments collection
  APPOINTMENTS: ["notes", "examination_findings"] as const,

  // Test Results collection
  TEST_RESULTS: [
    "test_data", // JSON field containing detailed test results
    "notes",
    "technician_notes",
  ] as const,

  // Certificates collection
  CERTIFICATES: ["medical_conditions", "restrictions", "recommendations", "doctor_notes"] as const,

  // Users collection (for clinic staff)
  USERS: ["phone", "email"] as const,

  // Employers collection
  EMPLOYERS: ["contact_person", "contact_email", "contact_phone"] as const,
} as const

export type PatientSensitiveField = (typeof SENSITIVE_FIELDS.PATIENTS)[number]
export type AppointmentSensitiveField = (typeof SENSITIVE_FIELDS.APPOINTMENTS)[number]
export type TestResultSensitiveField = (typeof SENSITIVE_FIELDS.TEST_RESULTS)[number]
export type CertificateSensitiveField = (typeof SENSITIVE_FIELDS.CERTIFICATES)[number]
export type UserSensitiveField = (typeof SENSITIVE_FIELDS.USERS)[number]
export type EmployerSensitiveField = (typeof SENSITIVE_FIELDS.EMPLOYERS)[number]
