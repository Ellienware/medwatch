/// lib/types/database.ts
// Core user and permission types
export type UserRole = "super_admin" | "clinic_admin" | "receptionist" | "nurse" | "doctor" | "employer"

// Core clinic types with billing
export interface Clinic {
  id: string
  name: string
  registration_number: string | null
  email: string
  phone: string | null
  address: string | null
  logo_url: string | null
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
  data_retention_days: number
  
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
// lib/types/database.ts - Update the User interface
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
  consent_given: boolean
  consent_date: string | null
  photo_url: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  employer_company_name?: string | null
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
  parameters: any[]
  normal_ranges: Record<string, any>
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
  results: Record<string, any>
  is_normal: boolean | null
  findings: string | null
  recommendations: string | null
  attachments: any[]
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  test_name?: string
}

// Core certificate types
export type CertificateType = "fit_to_work" | "unfit_to_work" | "fit_with_restrictions"

export interface Certificate {
  id: string
  clinic_id: string
  appointment_id: string
  patient_id: string
  certificate_number: string
  certificate_type: CertificateType
  issue_date: string
  valid_from: string | null
  valid_until: string | null
  diagnosis: string | null
  restrictions: string | null
  recommendations: string | null
  issued_by: string
  doctor_name: string
  doctor_registration_number: string | null
  doctor_signature_url: string | null
  pdf_url: string | null
  sent_to_employer: boolean
  sent_to_patient: boolean
  sent_at: string | null
  status: "draft" | "issued" | "revoked" | "expired"
  created_at: string
  updated_at: string
  test_results?: any[]
}

// Core employer types
// lib/types/database.ts
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
  linked_user_id: string | null // NEW: Link to user collection
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
  created_at: string
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