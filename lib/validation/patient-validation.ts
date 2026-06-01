// lib/validations/patient-validation.ts (NEW FILE)
import { z } from "zod"

// Helper for RSA ID validation
const validateRSAID = (id: string) => {
  if (!/^\d{13}$/.test(id)) return false
  
  // Luhn algorithm for RSA ID (simplified)
  let sum = 0
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i])
    if (i % 2 === 0) { // Even position (0-indexed)
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  
  return sum % 10 === 0
}

export const PatientCreateSchema = z.object({
  // Personal Information
  first_name: z.string()
    .min(1, "First name is required")
    .max(100, "First name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  
  last_name: z.string()
    .min(1, "Last name is required")
    .max(100, "Last name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s\-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  
  id_number: z.string()
    .length(13, "ID number must be 13 digits")
    .regex(/^\d+$/, "ID number must contain only digits")
    .refine(validateRSAID, "Invalid RSA ID number"),
  
  passport_number: z.string()
    .max(20, "Passport number cannot exceed 20 characters")
    .optional()
    .nullable(),
  
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(date => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 120
    }, "Invalid date of birth (age 0-120)"),
  
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  
  // Contact Information
  email: z.string()
    .email("Invalid email address")
    .max(255, "Email cannot exceed 255 characters")
    .optional()
    .nullable(),
  
  phone: z.string()
    .regex(/^(\+27|0)[0-9]{9}$/, "Invalid South African phone number (e.g., +27123456789 or 0123456789)")
    .optional()
    .nullable(),
  
  address: z.string()
    .max(500, "Address cannot exceed 500 characters")
    .optional()
    .nullable(),
  
  // Medical Information
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional()
    .nullable(),
  
  allergies: z.string()
    .max(1000, "Allergies cannot exceed 1000 characters")
    .optional()
    .nullable(),
  
  chronic_conditions: z.string()
    .max(1000, "Chronic conditions cannot exceed 1000 characters")
    .optional()
    .nullable(),
  
  emergency_contact_name: z.string()
    .max(100, "Emergency contact name cannot exceed 100 characters")
    .optional()
    .nullable(),
  
  emergency_contact_phone: z.string()
    .regex(/^(\+27|0)[0-9]{9}$/, "Invalid South African phone number")
    .optional()
    .nullable(),
  
  // Employment Information
  employer_id: z.string()
    .max(50, "Employer ID cannot exceed 50 characters")
    .optional()
    .nullable(),
  
  employee_number: z.string()
    .max(50, "Employee number cannot exceed 50 characters")
    .optional()
    .nullable(),
  
  job_title: z.string()
    .max(100, "Job title cannot exceed 100 characters")
    .optional()
    .nullable(),
  
  department: z.string()
    .max(100, "Department cannot exceed 100 characters")
    .optional()
    .nullable(),
  
  // Consent
  consent_given: z.boolean()
    .default(false)
    .refine(val => val === true, "Patient consent is required for medical records"),
  
  consent_date: z.string()
    .optional()
    .nullable(),
  
  // Status
  is_active: z.boolean()
    .default(true),
})

export const PatientUpdateSchema = PatientCreateSchema.partial()

export const PatientSearchSchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  employer_id: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
})