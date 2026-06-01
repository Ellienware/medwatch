// lib/types/database.ts - COMPLETE FILE

import { CertificateSettings } from "./certificate-settings"

// Core user and permission types
export type UserRole = "super_admin" | "clinic_admin" | "receptionist" | "nurse" | "doctor" | "employer"

// Core clinic types with billing
export interface Clinic {
  id: string
  name: string
  registration_number: string | null
  vat_number: string | null
  email: string
  phone: string | null
  address: string | null
  logo_url: string | null
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  data_retention_days: number
  certificate_settings?: CertificateSettings;
  
  // Billing fields
  subscription_plan: "trial" | "single_branch" | "multi_branch"
  subscription_status: "trial" | "active" | "pending" | "cancelled" | "suspended" | "expired" | "past_due"
  trial_started_at: string | null
  trial_ends_at: string | null
  selected_plan: "single_branch" | "multi_branch" | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  next_billing_date: string | null
  monthly_patient_limit: number
  current_month_patients: number
  paystack_customer_id: string | null
  paystack_subscription_id: string | null
  payment_method_id: string | null
  max_branches: number
  current_branches: number
}

// Core user types
export interface User {
  id: string
  clinic_id: string | null
  branch_id: string | null
  auth_user_id: string | null
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  permissions: Record<string, any>
  professional_registration_number: string | null
  specialization: string | null
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  first_login_required: boolean
  temporary_password_set: boolean
  invitation_token: string | null
  invitation_sent_at: string | null
  invited_at: string | null
  invitation_status: "pending" | "sent" | "accepted" | "expired" | null
  created_at: string
  updated_at: string
  
  // Add these optional fields for employers
  company_name?: string | null
  registration_number?: string | null
  industry?: string | null
  billing_email?: string | null
  payment_terms?: number | null
  portal_enabled?: boolean
  auto_receive_certificates?: boolean
  notification_preferences?: Record<string, any> | string | null
}

// Core branch types
export interface Branch {
  id: string
  clinic_id: string
  name: string
  code: string
  email: string | null
  phone: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  operating_hours: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Core patient types
export interface Patient {
  id: string
  clinic_id: string
  employer_id: string | null
  id_number: string
  passport_number: string | null
  first_name: string
  last_name: string
  date_of_birth: string
  gender: string | null
  email: string | null
  phone: string | null
  address: string | null
  employee_number: string | null
  job_title: string | null
  department: string | null
  employment_start_date: string | null
  blood_type: string | null
  allergies: string | null
  chronic_conditions: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  consent_given: boolean
  consent_date: string | null
  photo_url: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  employer_company_name?: string | null

  
  medical_history?: string | null
  current_medications?: string | null

  created_by?: string | null
  updated_by?: string | null

  deactivated_at?: string | null
  deactivated_by?: string | null
  deactivation_reason?: string | null
  reactivated_at?: string | null
  reactivated_by?: string | null

  merged_into?: string | null
  merged_at?: string | null
  merged_by?: string | null
}

// Core appointment types
export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "with_nurse"
  | "tests_in_progress"
  | "with_doctor"
  | "completed"
  | "cancelled"
  | "no_show"

export interface Appointment {
  id: string
  clinic_id: string
  branch_id: string
  patient_id: string
  employer_id: string | null
  appointment_date: string
  appointment_time: string
  appointment_type: string
  reason: string | null
  status: AppointmentStatus
  checked_in_at: string | null
  checked_in_by: string | null
  nurse_assigned_id: string | null
  nurse_started_at: string | null
  nurse_completed_at: string | null
  doctor_assigned_id: string | null
  doctor_started_at: string | null
  doctor_completed_at: string | null
  completed_at: string | null
  reception_notes: string | null
  nurse_notes: string | null
  doctor_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string

  last_test_at?: string | null
  requires_doctor_review?: boolean
}

// Core clinical test types
export interface ClinicalTest {
  id: string
  clinic_id: string
  test_code: string
  test_name: string
  test_category: string | null
  description: string | null
  price: number
  parameters: string
  normal_ranges: string
  requires_equipment: boolean
  estimated_duration_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// Core test result types
export interface TestResult {
  id: string
  clinic_id: string
  appointment_id: string
  patient_id: string
  test_id: string
  performed_by: string | null
  performed_at: string
  results: string | Record<string, any>
  is_normal: boolean | null
  findings: string | null
  test_code?: string 
  test_name?: string
  recommendations: string | null
  attachments: any[]
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string

  is_sensitive?: boolean
  test_price?: number
  validation_warnings?: string[]
  requires_review?: boolean
}

// Certificate Types
export type CertificateType = "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"
export type MedicalType = "pre_employment" | "annual" | "exit" | "transfer"
export type FitnessStatus = "fit" | "fit_with_conditions" | "fit_with_restrictions" | "temporarily_unfit"

// Core certificate types - UPDATED FOR FITNESS CERTIFICATES
export interface Certificate {
  // Core Identification
  id: string
  clinic_id: string
  appointment_id: string
  patient_id: string
  
  // Certificate Identification
  certificate_number: string
  certificate_type: CertificateType

  template_type?: "fitness" | "basic" | "custom";
  settings_override?: CertificateSettings;
  
  // Dates
  issue_date: string
  exam_date: string  // Specific examination date
  valid_from: string | null
  valid_until: string | null
  
  // Medical Type (from reference image checkboxes)
  medical_type: MedicalType
  
  // Medical Information
  diagnosis: string | null
  restrictions: string | null
  recommendations: string | null
  
  // Doctor Information
  issued_by: string
  doctor_name: string
  doctor_registration_number: string | null
  doctor_signature_url: string | null
  
  // Fitness Status (from reference checkboxes)
  fitness_status: FitnessStatus


  
  
  // Test Results
  test_results?: any[]
  
  // Specific test results for fitness certificate
  lung_function_results?: {
    fvc_percent: string
    fev1_percent: string
    fev1_fvc_ratio: string
    pef_l_min: string
  }
  
  audiometry_results?: {
    left_ear: {
      '500HZ': string
      '1000HZ': string
      '2000HZ': string
      '3000HZ': string
      '4000HZ': string
      '6000HZ': string
      '8000HZ': string
    }
    right_ear: {
      '500HZ': string
      '1000HZ': string
      '2000HZ': string
      '3000HZ': string
      '4000HZ': string
      '6000HZ': string
      '8000HZ': string
    }
  }
  
  vision_results?: {
    right_acuity: string
    left_acuity: string
    color_vision: string
  }
  
  urinalysis_results?: {
    normal: boolean
    hgt_mmol: string
  }
  
  chest_xray_normal?: boolean
  
  // Referrals (from reference checkboxes)
  referrals?: {
    local_clinic: boolean
    audiologist: boolean
    optometrist: boolean
    lung_function: boolean
    omp: boolean
  }
  
  // PDF Document
  pdf_url: string | null
  
  // Email Status
  sent_to_employer: boolean
  sent_to_patient: boolean
  sent_at: string | null
  
  // Certificate Status
  status: "draft" | "issued" | "revoked" | "expired"
  
  // // Timestamps
  // created_at: string
  // updated_at: string
  
  // Provider Information (for certificate header)
  provider_info?: {
    name: string
    address: string
    registration_number: string
    phone: string
    vat_number: string
    email: string
    website: string
    tagline: string
  }
  
  // Practitioner Information (for certificate footer)
  practitioner_info?: {
    name: string
    practice_number: string
    qualifications: string
    hpcsa_registration: string
    occmed_number: string
  }

  show_border?: boolean
  border_width?: number
  border_color?: string
  border_style?: 'solid' | 'dashed' | 'dotted'
  include_watermark?: boolean
  watermark_text?: string
  watermark_opacity?: number
  footer_text?: string
  disclaimer_text?: string
  validity_period_days?: number
  show_qr_code?: boolean

  rules_evaluation?: RulesEngineSummary | null
  suggested_fitness_decision?: FitnessDecision | null
  evaluation_confidence?: number | null
  doctor_decision_override?: boolean
  override_reason?: string | null
  
  // Audit trail for decision validation
  decision_validation?: {
    doctor_decision: FitnessDecision
    engine_suggestion: FitnessDecision
    confidence: number
    warnings: string[]
    validated_at: string
}

}





export interface FitnessCertificateData {
  // Provider Information
  provider_name: string;
  provider_address: string;
  provider_registration: string;
  provider_phone: string;
  provider_vat: string;
  provider_email: string;
  provider_website: string;
  provider_tagline: string;
  
  // Certificate Information
  certificate_number: string;
  exam_date: string;
  issue_date: string;
  
  // Patient Information
  patient_name: string;
  id_number: string;
  passport_number?: string;
  occupation: string;
  company: string;
  recommendations?: string;
  diagnosis?: string;

    // Rules Engine Integration Fields
  evaluation_summary?: {
    engine_decision: FitnessDecision
    engine_confidence: number
    critical_findings: string[]
    abnormal_findings: string[]
    referrals: string[]
    reasoning: string
    test_evaluations: Array<{
      test: string
      status: string
      suggestion: FitnessDecision
      reasoning: string
    }>
  }
  
  evaluation_metadata?: {
    evaluated_at: string
    test_count: number
    critical_count: number
    abnormal_count: number
    confidence: number
    decision_alignment: 'aligned' | 'override'
    engine_version: string
  }
  
  disclaimer_text?: string
  
  // Rules engine fields from certificate
  rules_evaluation?: RulesEngineSummary
  suggested_fitness_decision?: FitnessDecision
  evaluation_confidence?: number
  doctor_decision_override?: boolean
  override_reason?: string | null
  decision_validation?: {
    doctor_decision: FitnessDecision
    engine_suggestion: FitnessDecision
    confidence: number
    warnings: string[]
    validated_at: string
  }
  
  // Internal data quality tracking
  _data_quality?: {
    test_results_source: {
      lungFunction: "actual" | "default"
      audiometry: "actual" | "default"
      vision: "actual" | "default"
      urinalysis: "actual" | "default"
      chestXray: "actual" | "default"
    }
    engine_used: boolean
    doctor_override: boolean
    confidence: number
    validation_warnings?: string[]
  }
  
  // Medical Type
  medical_type: 'pre_employment' | 'annual' | 'exit' | 'transfer';
  
  // Test Results
  lung_function: {
    fvc_percent: string;
    fev1_percent: string;
    fev1_fvc_ratio: string;
    pef_l_min: string;
  };
  
  audiometry: {
    left: {
      '500HZ': string;
      '1000HZ': string;
      '2000HZ': string;
      '3000HZ': string;
      '4000HZ': string;
      '6000HZ': string;
      '8000HZ': string;
    };
    right: {
      '500HZ': string;
      '1000HZ': string;
      '2000HZ': string;
      '3000HZ': string;
      '4000HZ': string;
      '6000HZ': string;
      '8000HZ': string;
    };
  };
  
  vision: {
    right_acuity: string;
    left_acuity: string;
    color_vision: string;
  };
  
  urinalysis: {
    normal: boolean;
    hgt_mmol: string;
  };
  
  chest_xray: boolean;
  
  // Referrals
  referrals: {
    local_clinic: boolean;
    audiologist: boolean;
    optometrist: boolean;
    lung_function: boolean;
    omp: boolean;
  };
  
  // Fitness Status
  fitness_status: 'fit' | 'fit_with_conditions' | 'fit_with_restrictions' | 'temporarily_unfit';
  restrictions?: string;
  
  // Validity
  valid_from: string;
  valid_until: string;
  
  // Practitioner Information
  practitioner_name: string;
  practitioner_number: string;
  practitioner_qualifications: string;
  practitioner_registration: string;
  omp_number: string;
}
// Core employer types
export interface Employer {
  id: string
  clinic_id: string
  company_name: string
  registration_number: string | null
  industry: string | null
  email: string
  phone: string | null
  address: string | null
  billing_email: string | null
  payment_terms: number
  portal_user_id: string | null
  auth_user_id: string | null
  linked_user_id: string | null
  portal_enabled: boolean
  auto_receive_certificates: boolean
  notification_preferences: Record<string, any> | string
  is_active: boolean
  first_login_required: boolean
  temporary_password_set: boolean
  created_at: string
  updated_at: string
}

// Core audit log types
export interface AuditLog {
  id: string
  clinic_id: string
  user_id: string
  user_email: string
  user_role: string
  action: string
  entity_type: string
  entity_id: string
  entity_description: string | null
  changes: string | null
  metadata: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: string
  success: boolean
  error_message: string | null
  risk_level: string | null
}

// Core activity log types
export type ActivityType = 
  | "patient_registered"
  | "patient_updated"
  | "patient_deleted"
  | "patient_activated"
  | "patient_deactivated"
  | "appointment_created"
  | "appointment_completed"
  | "appointment_cancelled"
  | "certificate_issued"
  | "test_result_uploaded"
  | "user_logged_in"
  | "user_logged_out"
  | "settings_updated"
  | "branch_created"
  | "branch_updated"

export interface Activity {
  id: string
  clinic_id: string
  user_id: string
  user_name: string
  user_role: string
  action_type: ActivityType
  description: string
  entity_type: string
  entity_id: string
  metadata: string | Record<string, any>
  created_at: string
}

// Types for fitness certificate data transformation
export interface FitnessCertificateInput {
  certificate: Certificate
  patient: Patient
  clinic: Clinic
  testResults: TestResult[]
}

// Types for the certificate generator
export interface FitnessCertificateOutput {
  // Provider Information
  provider_name: string
  provider_address: string
  provider_registration: string
  provider_phone: string
  provider_vat: string
  provider_email: string
  provider_website: string
  provider_tagline: string
  
  // Certificate Information
  certificate_number: string
  exam_date: string
  issue_date: string
  
  // Patient Information
  patient_name: string
  id_number: string
  passport_number?: string
  occupation: string
  company: string
  
  // Medical Type
  medical_type: MedicalType
  
  // Test Results
  lung_function: {
    fvc_percent: string
    fev1_percent: string
    fev1_fvc_ratio: string
    pef_l_min: string
  }
  
  audiometry: {
    left: {
      '500HZ': string
      '1000HZ': string
      '2000HZ': string
      '3000HZ': string
      '4000HZ': string
      '6000HZ': string
      '8000HZ': string
    }
    right: {
      '500HZ': string
      '1000HZ': string
      '2000HZ': string
      '3000HZ': string
      '4000HZ': string
      '6000HZ': string
      '8000HZ': string
    }
  }
  
  vision: {
    right_acuity: string
    left_acuity: string
    color_vision: string
  }
  
  urinalysis: {
    normal: boolean
    hgt_mmol: string
  }
  
  chest_xray: boolean
  
  // Referrals
  referrals: {
    local_clinic: boolean
    audiologist: boolean
    optometrist: boolean
    lung_function: boolean
    omp: boolean
  }
  
  // Fitness Status
  fitness_status: FitnessStatus
  restrictions?: string
  
  // Validity
  valid_from: string
  valid_until: string
  
  // Practitioner Information
  practitioner_name: string
  practitioner_number: string
  practitioner_qualifications: string
  practitioner_registration: string
  omp_number: string
}

// Clinical Assessment Types
export type AssessmentStatus = "in_progress" | "completed" | "cancelled"

export type FitnessDecision = 
  | "fit" 
  | "fit_with_conditions" 
  | "fit_with_restrictions" 
  | "temporarily_unfit" 
  | "permanently_unfit"

export interface ClinicalFinding {
  category: string
  finding: string
  severity: "normal" | "mild" | "moderate" | "severe"
  notes?: string
  requiresReferral?: boolean
  referralType?: string
}

export interface RulesEngineResult {
  testCode: string
  testName: string
  status: "normal" | "abnormal" | "critical"
  suggestedDecision: FitnessDecision
  reasoning: string
  referralSuggested: boolean
  referralType?: string
  confidence: number // 0-100
}

export interface RulesEngineSummary {
  overallSuggestedDecision: FitnessDecision
  overallConfidence: number
  criticalFindings: string[]
  abnormalFindings: string[]
  referralsRecommended: string[]
  reasoning: string
  testResults: RulesEngineResult[]
}

export interface ClinicalAssessment {
  id: string
  clinic_id: string
  appointment_id: string
  patient_id: string
  
  // Doctor performing assessment
  doctor_id: string
  doctor_name: string
  
  // Assessment timing
  started_at: string
  completed_at: string | null
  
  // Status
  status: AssessmentStatus


  
  // Clinical findings from doctor's examination
  clinical_findings: ClinicalFinding[]
  
  // Physical examination results
  physical_examination: {
    general_appearance?: string
    cardiovascular?: string
    respiratory?: string
    neurological?: string
    musculoskeletal?: string
    skin?: string
    vision?: string
    hearing?: string
    other?: string
  }
  
  // Medical history review
  medical_history_notes?: string
  current_medications?: string
  allergies_confirmed?: string
  
  // Rules engine suggestions (auto-populated)
  rules_engine_summary?: RulesEngineSummary,
  
  // Doctor's final decisions (may differ from rules engine)
  doctor_decision: FitnessDecision | null
  doctor_reasoning: string | null
  override_rules_engine: boolean
  override_reason?: string
  
  // Restrictions (if applicable)
  restrictions: string[]
  restriction_duration?: string // e.g., "6 months", "permanent"
  
  // Referrals recommended
  referrals: {
    type: string
    reason: string
    priority: "routine" | "urgent" | "emergency"
  }[]
  
  // Follow-up recommendations
  follow_up_required: boolean
  follow_up_date?: string
  follow_up_notes?: string
  
  // Additional notes
  additional_notes?: string
  
  // Certificate link (after certificate is generated)
  certificate_id: string | null
  
  // // Audit trail
  // created_at: string
  // updated_at: string
}

export type { CertificateSettings }
