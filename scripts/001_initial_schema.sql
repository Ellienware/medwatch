-- MedSurv - Multi-Clinic Medical Surveillance Management System
-- Database Schema with Multi-Tenancy Support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- System-wide user roles
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'clinic_admin',
  'receptionist',
  'nurse',
  'doctor',
  'employer'
);

-- Appointment statuses
CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'checked_in',
  'with_nurse',
  'tests_in_progress',
  'with_doctor',
  'completed',
  'cancelled',
  'no_show'
);

-- Certificate types
CREATE TYPE certificate_type AS ENUM (
  'fit_to_work',
  'unfit_to_work',
  'fit_with_restrictions'
);

-- Subscription plans
CREATE TYPE subscription_plan AS ENUM (
  'basic',
  'professional',
  'enterprise'
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'active',
  'trial',
  'cancelled',
  'suspended',
  'expired'
);

-- =====================================================
-- 1. CLINICS TABLE (Root tenant table)
-- =====================================================
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  logo_url TEXT,
  
  -- Subscription info
  subscription_plan subscription_plan DEFAULT 'basic',
  subscription_status subscription_status DEFAULT 'trial',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  monthly_patient_limit INTEGER DEFAULT 100,
  current_month_patients INTEGER DEFAULT 0,
  
  -- Billing
  paystack_customer_id VARCHAR(255),
  paystack_subscription_id VARCHAR(255),
  
  -- Settings
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- POPIA compliance
  data_retention_days INTEGER DEFAULT 2555 -- 7 years
);

-- =====================================================
-- 2. BRANCHES TABLE (Clinic locations)
-- =====================================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Operating hours (JSONB for flexibility)
  operating_hours JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, code)
);

-- =====================================================
-- 3. USERS TABLE (All system users with RLS)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Auth info (linked to Supabase Auth)
  auth_user_id UUID UNIQUE, -- Supabase auth.users.id
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  
  -- Role & permissions
  role user_role NOT NULL,
  permissions JSONB DEFAULT '{}',
  
  -- Professional info (for medical staff)
  professional_registration_number VARCHAR(100),
  specialization VARCHAR(255),
  
  -- Profile
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. EMPLOYERS TABLE
-- =====================================================
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Company info
  company_name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  industry VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  
  -- Billing
  billing_email VARCHAR(255),
  payment_terms INTEGER DEFAULT 30, -- Days
  
  -- Portal access
  portal_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  portal_enabled BOOLEAN DEFAULT true,
  
  -- Settings
  auto_receive_certificates BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. PATIENTS TABLE (Workers)
-- =====================================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  
  -- Personal info
  id_number VARCHAR(50) NOT NULL,
  passport_number VARCHAR(50),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Employment info
  employee_number VARCHAR(100),
  job_title VARCHAR(255),
  department VARCHAR(255),
  employment_start_date DATE,
  
  -- Medical info
  blood_type VARCHAR(10),
  allergies TEXT,
  chronic_conditions TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  
  -- POPIA consent
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  
  -- Profile
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, id_number)
);

-- =====================================================
-- 6. APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  
  -- Appointment details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type VARCHAR(255) DEFAULT 'routine_medical',
  reason TEXT,
  
  -- Workflow tracking
  status appointment_status DEFAULT 'scheduled',
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES users(id),
  
  nurse_assigned_id UUID REFERENCES users(id),
  nurse_started_at TIMESTAMP WITH TIME ZONE,
  nurse_completed_at TIMESTAMP WITH TIME ZONE,
  
  doctor_assigned_id UUID REFERENCES users(id),
  doctor_started_at TIMESTAMP WITH TIME ZONE,
  doctor_completed_at TIMESTAMP WITH TIME ZONE,
  
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  reception_notes TEXT,
  nurse_notes TEXT,
  doctor_notes TEXT,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. CLINICAL TESTS TABLE
-- =====================================================
CREATE TABLE clinical_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Test info
  test_code VARCHAR(50) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  test_category VARCHAR(100),
  description TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0,
  
  -- Test parameters (JSONB for flexibility)
  parameters JSONB DEFAULT '[]',
  normal_ranges JSONB DEFAULT '{}',
  
  -- Settings
  requires_equipment BOOLEAN DEFAULT false,
  estimated_duration_minutes INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, test_code)
);

-- =====================================================
-- 8. TEST RESULTS TABLE
-- =====================================================
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES clinical_tests(id) ON DELETE CASCADE,
  
  -- Test execution
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Results (JSONB for flexible structure)
  results JSONB NOT NULL DEFAULT '{}',
  
  -- Interpretation
  is_normal BOOLEAN,
  findings TEXT,
  recommendations TEXT,
  
  -- Files (X-rays, audiograms, etc.)
  attachments JSONB DEFAULT '[]', -- Array of file URLs
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. CERTIFICATES TABLE (Fit-to-Work, Annexure 3)
-- =====================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Certificate details
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  certificate_type certificate_type NOT NULL,
  issue_date DATE NOT NULL,
  valid_from DATE,
  valid_until DATE,
  
  -- Medical findings
  diagnosis TEXT,
  restrictions TEXT,
  recommendations TEXT,
  
  -- Issuer
  issued_by UUID NOT NULL REFERENCES users(id),
  doctor_name VARCHAR(255) NOT NULL,
  doctor_registration_number VARCHAR(100),
  doctor_signature_url TEXT,
  
  -- Document
  pdf_url TEXT,
  
  -- Employer notification
  sent_to_employer BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. BILLING & INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES employers(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  
  -- References
  paystack_reference VARCHAR(255),
  
  -- Items (appointments/tests)
  line_items JSONB NOT NULL DEFAULT '[]',
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery channels
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  whatsapp_sent BOOLEAN DEFAULT false,
  in_app_read BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 12. AUDIT LOGS TABLE (POPIA Compliance)
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Who
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  
  -- What
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Clinics
CREATE INDEX idx_clinics_active ON clinics(is_active);
CREATE INDEX idx_clinics_subscription_status ON clinics(subscription_status);

-- Branches
CREATE INDEX idx_branches_clinic_id ON branches(clinic_id);
CREATE INDEX idx_branches_active ON branches(is_active);

-- Users
CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Employers
CREATE INDEX idx_employers_clinic_id ON employers(clinic_id);
CREATE INDEX idx_employers_active ON employers(is_active);

-- Patients
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_employer_id ON patients(employer_id);
CREATE INDEX idx_patients_id_number ON patients(id_number);
CREATE INDEX idx_patients_active ON patients(is_active);

-- Appointments
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_branch_id ON appointments(branch_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor_assigned ON appointments(doctor_assigned_id);

-- Clinical Tests
CREATE INDEX idx_clinical_tests_clinic_id ON clinical_tests(clinic_id);
CREATE INDEX idx_clinical_tests_active ON clinical_tests(is_active);

-- Test Results
CREATE INDEX idx_test_results_clinic_id ON test_results(clinic_id);
CREATE INDEX idx_test_results_appointment_id ON test_results(appointment_id);
CREATE INDEX idx_test_results_patient_id ON test_results(patient_id);

-- Certificates
CREATE INDEX idx_certificates_clinic_id ON certificates(clinic_id);
CREATE INDEX idx_certificates_patient_id ON certificates(patient_id);
CREATE INDEX idx_certificates_appointment_id ON certificates(appointment_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- Invoices
CREATE INDEX idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX idx_invoices_employer_id ON invoices(employer_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);

-- Notifications
CREATE INDEX idx_notifications_clinic_id ON notifications(clinic_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
