-- Seed Data for Testing and Development

-- =====================================================
-- SEED CLINICAL TESTS (Common occupational health tests)
-- =====================================================

-- Note: This will be inserted per clinic during onboarding
-- For now, we'll create a template that can be copied

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
  '00000000-0000-0000-0000-000000000000', -- Placeholder, will be replaced per clinic
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
) ON CONFLICT DO NOTHING;

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
  '00000000-0000-0000-0000-000000000000',
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
) ON CONFLICT DO NOTHING;

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
  '00000000-0000-0000-0000-000000000000',
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
) ON CONFLICT DO NOTHING;

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
  '00000000-0000-0000-0000-000000000000',
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
) ON CONFLICT DO NOTHING;

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
  '00000000-0000-0000-0000-000000000000',
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
) ON CONFLICT DO NOTHING;

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
  '00000000-0000-0000-0000-000000000000',
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
) ON CONFLICT DO NOTHING;
