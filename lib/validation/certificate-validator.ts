import { z } from 'zod'
import type { 
  Certificate, 
  FitnessCertificateData,
  CertificateSettings 
} from '@/lib/types/database'

export const certificateSchema = z.object({
  clinic_id: z.string().min(1, 'Clinic ID is required'),
  appointment_id: z.string().min(1, 'Appointment ID is required'),
  patient_id: z.string().min(1, 'Patient ID is required'),
  certificate_number: z.string().min(1, 'Certificate number is required'),
  certificate_type: z.enum(['fit_to_work', 'unfit_to_work', 'fit_with_restrictions']),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  diagnosis: z.string().max(1000).optional().nullable(),
  restrictions: z.string().max(500).optional().nullable(),
  recommendations: z.string().max(500).optional().nullable(),
  doctor_name: z.string().min(1, 'Doctor name is required'),
  doctor_registration_number: z.string().optional().nullable(),
  fitness_status: z.enum(['fit', 'fit_with_conditions', 'fit_with_restrictions', 'temporarily_unfit']),
})

export const fitnessCertificateDataSchema = z.object({
  // Provider Information
  provider_name: z.string().min(1, 'Provider name is required'),
  provider_address: z.string().min(1, 'Provider address is required'),
  provider_registration: z.string().min(1, 'Provider registration is required'),
  provider_phone: z.string().min(1, 'Provider phone is required'),
  provider_vat: z.string().optional(),
  provider_email: z.string().email('Invalid email').optional(),
  provider_website: z.string().url('Invalid URL').optional(),
  provider_tagline: z.string().optional(),
  
  // Certificate Information
  certificate_number: z.string().min(1, 'Certificate number is required'),
  exam_date: z.string().regex(/^\d{2} \d{2} \d{4}$/, 'Date must be in DD MM YYYY format'),
  issue_date: z.string().regex(/^\d{2} \d{2} \d{4}$/, 'Date must be in DD MM YYYY format'),
  
  // Patient Information
  patient_name: z.string().min(1, 'Patient name is required'),
  id_number: z.string().min(1, 'ID number is required'),
  passport_number: z.string().optional(),
  occupation: z.string().min(1, 'Occupation is required'),
  company: z.string().min(1, 'Company is required'),
  
  // Medical Type
  medical_type: z.enum(['pre_employment', 'annual', 'exit', 'transfer']),
  
  // Test Results
  lung_function: z.object({
    fvc_percent: z.string(),
    fev1_percent: z.string(),
    fev1_fvc_ratio: z.string(),
    pef_l_min: z.string(),
  }),
  
  audiometry: z.object({
    left: z.object({
      '500HZ': z.string(),
      '1000HZ': z.string(),
      '2000HZ': z.string(),
      '3000HZ': z.string(),
      '4000HZ': z.string(),
      '6000HZ': z.string(),
      '8000HZ': z.string(),
    }),
    right: z.object({
      '500HZ': z.string(),
      '1000HZ': z.string(),
      '2000HZ': z.string(),
      '3000HZ': z.string(),
      '4000HZ': z.string(),
      '6000HZ': z.string(),
      '8000HZ': z.string(),
    }),
  }),
  
  vision: z.object({
    right_acuity: z.string(),
    left_acuity: z.string(),
    color_vision: z.string(),
  }),
  
  urinalysis: z.object({
    normal: z.boolean(),
    hgt_mmol: z.string().optional(),
  }),
  
  chest_xray: z.boolean(),
  
  // Referrals
  referrals: z.object({
    local_clinic: z.boolean(),
    audiologist: z.boolean(),
    optometrist: z.boolean(),
    lung_function: z.boolean(),
    omp: z.boolean(),
  }),
  
  // Fitness Status
  fitness_status: z.enum(['fit', 'fit_with_conditions', 'fit_with_restrictions', 'temporarily_unfit']),
  restrictions: z.string().optional(),
  
  // Validity
  valid_from: z.string().regex(/^\d{2} \d{2} \d{4}$/, 'Date must be in DD MM YYYY format'),
  valid_until: z.string().regex(/^\d{2} \d{2} \d{4}$/, 'Date must be in DD MM YYYY format'),
  
  // Practitioner Information
  practitioner_name: z.string().min(1, 'Practitioner name is required'),
  practitioner_number: z.string().min(1, 'Practitioner number is required'),
  practitioner_qualifications: z.string().min(1, 'Qualifications are required'),
  practitioner_registration: z.string().min(1, 'Registration is required'),
  omp_number: z.string().optional(),
})

export const searchQuerySchema = z.object({
  search: z.string().max(100).optional(),
  type: z.enum(['fit_to_work', 'unfit_to_work', 'fit_with_restrictions', 'all']).optional(),
  status: z.enum(['sent', 'pending', 'all']).optional(),
  page: z.coerce.number().int().positive().max(100).optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
})

export class CertificateValidator {
  static validateCertificate(data: Partial<Certificate>) {
    return certificateSchema.safeParse(data)
  }
  
  static validateFitnessCertificateData(data: FitnessCertificateData) {
    return fitnessCertificateDataSchema.safeParse(data)
  }
  
  static sanitizeSearchQuery(query: Record<string, unknown>) {
    const result = searchQuerySchema.safeParse(query)
    if (!result.success) {
      throw new Error(`Invalid search query: ${result.error.message}`)
    }
    return result.data
  }
  
  static sanitizeInput(input: string): string {
    if (!input) return ''
    
    // Remove dangerous characters and limit length
    return input
      .replace(/[<>"']/g, '') // Remove dangerous characters
      .substring(0, 1000) // Limit length
      .trim()
  }
}
