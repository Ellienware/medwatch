-- Seed Data for Testing and Development (v2)

-- =====================================================
-- CREATE A DEMO CLINIC FIRST
-- =====================================================

-- Insert a demo/template clinic
INSERT INTO clinics (
  id,
  name,
  registration_number,
  email,
  phone,
  address,
  subscription_status,
  subscription_start_date,
  subscription_end_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Clinic',
  'DEMO-001',
  'demo@clinic.com',
  '+27123456789',
  '123 Medical Street, Johannesburg, Gauteng, 2000, South Africa',
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year'
) ON CONFLICT (id) DO NOTHING;

-- Insert a demo branch for the clinic
INSERT INTO branches (
  clinic_id,
  name,
  code,
  email,
  phone,
  address,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Main Branch',
  'DEMO-MAIN',
  'main@democlinic.com',
  '+27123456789',
  '123 Medical Street, Johannesburg, Gauteng, 2000',
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED CLINICAL TESTS FOR DEMO CLINIC
-- =====================================================

-- Audiometry Test
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AUDIO-001',
  'Audiometry (Hearing Test)',
  'Audiology',
  'Pure tone audiometry to assess hearing ability',
  250.00,
  '[
    {"name": "Right Ear (250Hz)", "unit": "dB", "type": "number"},
    {"name": "Right Ear (500Hz)", "unit": "dB", "type": "number"},
    {"name": "Right Ear (1000Hz)", "unit": "dB", "type": "number"},
    {"name": "Right Ear (2000Hz)", "unit": "dB", "type": "number"},
    {"name": "Right Ear (4000Hz)", "unit": "dB", "type": "number"},
    {"name": "Right Ear (8000Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (250Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (500Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (1000Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (2000Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (4000Hz)", "unit": "dB", "type": "number"},
    {"name": "Left Ear (8000Hz)", "unit": "dB", "type": "number"}
  ]'::jsonb,
  '{"normal_threshold": "0-25 dB"}'::jsonb,
  true,
  20
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- Spirometry Test
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SPIRO-001',
  'Spirometry (Lung Function)',
  'Respiratory',
  'Measures lung function and capacity',
  300.00,
  '[
    {"name": "FVC (Forced Vital Capacity)", "unit": "L", "type": "number"},
    {"name": "FEV1 (Forced Expiratory Volume)", "unit": "L", "type": "number"},
    {"name": "FEV1/FVC Ratio", "unit": "%", "type": "number"},
    {"name": "PEF (Peak Expiratory Flow)", "unit": "L/min", "type": "number"}
  ]'::jsonb,
  '{"FVC": ">80%", "FEV1": ">80%", "FEV1/FVC": ">70%"}'::jsonb,
  true,
  15
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- Vision Test
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'VISION-001',
  'Vision Screening',
  'Ophthalmology',
  'Visual acuity and color vision testing',
  150.00,
  '[
    {"name": "Right Eye (Distance)", "unit": "", "type": "text"},
    {"name": "Left Eye (Distance)", "unit": "", "type": "text"},
    {"name": "Both Eyes (Distance)", "unit": "", "type": "text"},
    {"name": "Right Eye (Near)", "unit": "", "type": "text"},
    {"name": "Left Eye (Near)", "unit": "", "type": "text"},
    {"name": "Color Vision", "unit": "", "type": "text"}
  ]'::jsonb,
  '{"normal": "6/6 or 20/20"}'::jsonb,
  false,
  10
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- Chest X-Ray
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'XRAY-001',
  'Chest X-Ray',
  'Radiology',
  'Chest radiograph for TB screening and lung assessment',
  400.00,
  '[
    {"name": "Heart Size", "unit": "", "type": "text"},
    {"name": "Lung Fields", "unit": "", "type": "text"},
    {"name": "Costophrenic Angles", "unit": "", "type": "text"},
    {"name": "Bony Structures", "unit": "", "type": "text"},
    {"name": "Overall Impression", "unit": "", "type": "textarea"}
  ]'::jsonb,
  '{}'::jsonb,
  true,
  30
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- Blood Pressure
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'BP-001',
  'Blood Pressure',
  'Vitals',
  'Blood pressure measurement',
  50.00,
  '[
    {"name": "Systolic", "unit": "mmHg", "type": "number"},
    {"name": "Diastolic", "unit": "mmHg", "type": "number"},
    {"name": "Pulse", "unit": "bpm", "type": "number"}
  ]'::jsonb,
  '{"systolic": "90-120", "diastolic": "60-80", "pulse": "60-100"}'::jsonb,
  false,
  5
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- Drug & Alcohol Screening
INSERT INTO clinical_tests (
  clinic_id,
  test_code,
  test_name,
  test_category,
  description,
  price,
  parameters,
  normal_ranges,
  requires_equipment,
  estimated_duration_minutes
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'DRUG-001',
  'Drug & Alcohol Screening',
  'Toxicology',
  'Urine/breath test for substance detection',
  350.00,
  '[
    {"name": "Alcohol (Breath)", "unit": "mg/L", "type": "number"},
    {"name": "Cannabis", "unit": "", "type": "select", "options": ["Negative", "Positive"]},
    {"name": "Cocaine", "unit": "", "type": "select", "options": ["Negative", "Positive"]},
    {"name": "Opiates", "unit": "", "type": "select", "options": ["Negative", "Positive"]},
    {"name": "Amphetamines", "unit": "", "type": "select", "options": ["Negative", "Positive"]}
  ]'::jsonb,
  '{"alcohol": "0.00", "substances": "Negative"}'::jsonb,
  true,
  15
) ON CONFLICT (clinic_id, test_code) DO NOTHING;

-- =====================================================
-- DEMO ACCOUNTS INFORMATION
-- =====================================================

-- Users need to be created through Supabase Auth (sign up via the app)
-- After running the SQL scripts, create these test accounts via the signup page:

-- DEMO ACCOUNTS TO CREATE:
-- 
-- 1. Super Admin:
--    Email: admin@medsurveillance.com
--    Password: Admin123!
--    (After signup, manually set role to 'super_admin' in users table)
--
-- 2. Clinic Admin:
--    Email: admin@democlinic.com
--    Password: Clinic123!
--    Clinic: Demo Clinic (00000000-0000-0000-0000-000000000001)
--    Role: clinic_admin
--
-- 3. Doctor:
--    Email: doctor@democlinic.com
--    Password: Doctor123!
--    Clinic: Demo Clinic
--    Role: doctor
--
-- 4. Nurse:
--    Email: nurse@democlinic.com
--    Password: Nurse123!
--    Clinic: Demo Clinic
--    Role: nurse
--
-- 5. Receptionist:
--    Email: receptionist@democlinic.com
--    Password: Reception123!
--    Clinic: Demo Clinic
--    Role: receptionist
--
-- 6. Employer:
--    Email: employer@company.com
--    Password: Employer123!
--    Role: employer

COMMENT ON TABLE clinical_tests IS 'Clinical test templates available per clinic';
COMMENT ON TABLE clinics IS 'Demo clinic created with ID 00000000-0000-0000-0000-000000000001';
