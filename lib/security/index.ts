/**
 * Central export for security utilities
 */

export {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  generateEncryptionKey,
  validateEncryptionConfig,
} from "./encryption"

export {
  SENSITIVE_FIELDS,
  type PatientSensitiveField,
  type AppointmentSensitiveField,
  type TestResultSensitiveField,
  type CertificateSensitiveField,
  type UserSensitiveField,
  type EmployerSensitiveField,
} from "./sensitive-fields"
