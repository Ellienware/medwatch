# Appwrite Database Setup Guide

This document provides step-by-step instructions for setting up your Appwrite database for MedSurv.

## Prerequisites

1. An Appwrite Cloud account or self-hosted Appwrite instance
2. Project created in Appwrite Console
3. Database created in your project

## Environment Variables

Make sure you have these environment variables set:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
\`\`\`

## Collections Setup

Create the following collections in your Appwrite database. For each collection:
1. Go to your Database in Appwrite Console
2. Click "Add Collection"
3. Set the Collection ID and Name
4. Add the attributes listed below
5. Configure permissions

---

### 1. Clinics Collection

**Collection ID:** `clinics`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| name | String | 255 | Yes | No | - |
| registration_number | String | 100 | No | No | - |
| email | Email | 255 | Yes | No | - |
| phone | String | 50 | No | No | - |
| address | String | 1000 | No | No | - |
| logo_url | URL | 2000 | No | No | - |
| subscription_plan | Enum | - | Yes | No | basic |
| subscription_status | Enum | - | Yes | No | trial |
| subscription_start_date | DateTime | - | No | No | - |
| subscription_end_date | DateTime | - | No | No | - |
| monthly_patient_limit | Integer | - | Yes | No | 100 |
| current_month_patients | Integer | - | Yes | No | 0 |
| paystack_customer_id | String | 255 | No | No | - |
| paystack_subscription_id | String | 255 | No | No | - |
| settings | String (JSON) | 10000 | No | No | {} |
| is_active | Boolean | - | Yes | No | true |
| data_retention_days | Integer | - | Yes | No | 2555 |

**Enums:**
- `subscription_plan`: basic, professional, enterprise
- `subscription_status`: active, trial, cancelled, suspended, expired

**Indexes:**
- `is_active` (key: is_active, type: key, ASC)
- `subscription_status` (key: subscription_status, type: key, ASC)

**Permissions:**
- Read: Role: any
- Create: Role: any (users can create their own clinic)
- Update: Owner (clinic admins for their clinic)
- Delete: Admin only

---

### 2. Branches Collection

**Collection ID:** `branches`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| name | String | 255 | Yes | No | - |
| code | String | 50 | Yes | No | - |
| email | Email | 255 | No | No | - |
| phone | String | 50 | No | No | - |
| address | String | 1000 | No | No | - |
| latitude | Float | - | No | No | - |
| longitude | Float | - | No | No | - |
| operating_hours | String (JSON) | 5000 | No | No | {} |
| is_active | Boolean | - | Yes | No | true |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `is_active` (key: is_active, type: key, ASC)

---

### 3. Users Collection

**Collection ID:** `users`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clerk_user_id | String | 100 | Yes | No | - |
| clinic_id | String | 36 | No | No | - |
| branch_id | String | 36 | No | No | - |
| email | Email | 255 | Yes | No | - |
| full_name | String | 255 | Yes | No | - |
| phone | String | 50 | No | No | - |
| role | Enum | - | Yes | No | clinic_admin |
| permissions | String (JSON) | 5000 | No | No | {} |
| professional_registration_number | String | 100 | No | No | - |
| specialization | String | 255 | No | No | - |
| avatar_url | URL | 2000 | No | No | - |
| is_active | Boolean | - | Yes | No | true |
| last_login | DateTime | - | No | No | - |

**Enums:**
- `role`: super_admin, clinic_admin, receptionist, nurse, doctor, employer

**Indexes:**
- `clerk_user_id` (key: clerk_user_id, type: unique, ASC)
- `clinic_id` (key: clinic_id, type: key, ASC)
- `email` (key: email, type: unique, ASC)
- `role` (key: role, type: key, ASC)

---

### 4. Employers Collection

**Collection ID:** `employers`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| company_name | String | 255 | Yes | No | - |
| registration_number | String | 100 | No | No | - |
| industry | String | 255 | No | No | - |
| email | Email | 255 | Yes | No | - |
| phone | String | 50 | No | No | - |
| address | String | 1000 | No | No | - |
| billing_email | Email | 255 | No | No | - |
| payment_terms | Integer | - | Yes | No | 30 |
| portal_user_id | String | 36 | No | No | - |
| portal_enabled | Boolean | - | Yes | No | true |
| auto_receive_certificates | Boolean | - | Yes | No | true |
| notification_preferences | String (JSON) | 5000 | No | No | {} |
| is_active | Boolean | - | Yes | No | true |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `is_active` (key: is_active, type: key, ASC)

---

### 5. Patients Collection

**Collection ID:** `patients`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| employer_id | String | 36 | No | No | - |
| id_number | String | 50 | Yes | No | - |
| passport_number | String | 50 | No | No | - |
| first_name | String | 255 | Yes | No | - |
| last_name | String | 255 | Yes | No | - |
| date_of_birth | DateTime | - | Yes | No | - |
| gender | String | 20 | No | No | - |
| email | Email | 255 | No | No | - |
| phone | String | 50 | No | No | - |
| address | String | 1000 | No | No | - |
| employee_number | String | 100 | No | No | - |
| job_title | String | 255 | No | No | - |
| department | String | 255 | No | No | - |
| employment_start_date | DateTime | - | No | No | - |
| blood_type | String | 10 | No | No | - |
| allergies | String | 2000 | No | No | - |
| chronic_conditions | String | 2000 | No | No | - |
| emergency_contact_name | String | 255 | No | No | - |
| emergency_contact_phone | String | 50 | No | No | - |
| consent_given | Boolean | - | Yes | No | false |
| consent_date | DateTime | - | No | No | - |
| photo_url | URL | 2000 | No | No | - |
| notes | String | 5000 | No | No | - |
| is_active | Boolean | - | Yes | No | true |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `employer_id` (key: employer_id, type: key, ASC)
- `id_number` (key: id_number, type: key, ASC)
- `is_active` (key: is_active, type: key, ASC)

---

### 6. Appointments Collection

**Collection ID:** `appointments`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| branch_id | String | 36 | Yes | No | - |
| patient_id | String | 36 | Yes | No | - |
| employer_id | String | 36 | No | No | - |
| appointment_date | DateTime | - | Yes | No | - |
| appointment_time | String | 10 | Yes | No | - |
| appointment_type | String | 255 | Yes | No | routine_medical |
| reason | String | 1000 | No | No | - |
| status | Enum | - | Yes | No | scheduled |
| checked_in_at | DateTime | - | No | No | - |
| checked_in_by | String | 36 | No | No | - |
| nurse_assigned_id | String | 36 | No | No | - |
| nurse_started_at | DateTime | - | No | No | - |
| nurse_completed_at | DateTime | - | No | No | - |
| doctor_assigned_id | String | 36 | No | No | - |
| doctor_started_at | DateTime | - | No | No | - |
| doctor_completed_at | DateTime | - | No | No | - |
| completed_at | DateTime | - | No | No | - |
| reception_notes | String | 5000 | No | No | - |
| nurse_notes | String | 5000 | No | No | - |
| doctor_notes | String | 5000 | No | No | - |
| created_by | String | 36 | No | No | - |

**Enums:**
- `status`: scheduled, checked_in, with_nurse, tests_in_progress, with_doctor, completed, cancelled, no_show

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `branch_id` (key: branch_id, type: key, ASC)
- `patient_id` (key: patient_id, type: key, ASC)
- `appointment_date` (key: appointment_date, type: key, ASC)
- `status` (key: status, type: key, ASC)
- `doctor_assigned_id` (key: doctor_assigned_id, type: key, ASC)

---

### 7. Clinical Tests Collection

**Collection ID:** `clinical_tests`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| test_code | String | 50 | Yes | No | - |
| test_name | String | 255 | Yes | No | - |
| test_category | String | 100 | No | No | - |
| description | String | 2000 | No | No | - |
| price | Float | - | Yes | No | 0 |
| parameters | String (JSON) | 10000 | No | No | [] |
| normal_ranges | String (JSON) | 5000 | No | No | {} |
| requires_equipment | Boolean | - | Yes | No | false |
| estimated_duration_minutes | Integer | - | No | No | - |
| is_active | Boolean | - | Yes | No | true |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `test_code` (key: test_code, type: key, ASC)
- `is_active` (key: is_active, type: key, ASC)

---

### 8. Test Results Collection

**Collection ID:** `test_results`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| appointment_id | String | 36 | Yes | No | - |
| patient_id | String | 36 | Yes | No | - |
| test_id | String | 36 | Yes | No | - |
| performed_by | String | 36 | No | No | - |
| performed_at | DateTime | - | Yes | No | - |
| results | String (JSON) | 10000 | Yes | No | {} |
| is_normal | Boolean | - | No | No | - |
| findings | String | 5000 | No | No | - |
| recommendations | String | 5000 | No | No | - |
| attachments | String (JSON) | 10000 | No | No | [] |
| reviewed_by | String | 36 | No | No | - |
| reviewed_at | DateTime | - | No | No | - |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `appointment_id` (key: appointment_id, type: key, ASC)
- `patient_id` (key: patient_id, type: key, ASC)

---

### 9. Certificates Collection

**Collection ID:** `certificates`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| appointment_id | String | 36 | Yes | No | - |
| patient_id | String | 36 | Yes | No | - |
| certificate_number | String | 100 | Yes | No | - |
| certificate_type | Enum | - | Yes | No | - |
| issue_date | DateTime | - | Yes | No | - |
| valid_from | DateTime | - | No | No | - |
| valid_until | DateTime | - | No | No | - |
| diagnosis | String | 5000 | No | No | - |
| restrictions | String | 5000 | No | No | - |
| recommendations | String | 5000 | No | No | - |
| attachments | String (JSON) | 10000 | No | No | [] |
| issued_by | String | 36 | Yes | No | - |
| doctor_name | String | 255 | Yes | No | - |
| doctor_registration_number | String | 100 | No | No | - |
| doctor_signature_url | URL | 2000 | No | No | - |
| pdf_url | URL | 2000 | No | No | - |
| sent_to_employer | Boolean | - | Yes | No | false |
| sent_at | DateTime | - | No | No | - |

**Enums:**
- `certificate_type`: fit_to_work, unfit_to_work, fit_with_restrictions

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `patient_id` (key: patient_id, type: key, ASC)
- `appointment_id` (key: appointment_id, type: key, ASC)
- `certificate_number` (key: certificate_number, type: unique, ASC)

---

### 10. Invoices Collection

**Collection ID:** `invoices`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| employer_id | String | 36 | No | No | - |
| invoice_number | String | 100 | Yes | No | - |
| invoice_date | DateTime | - | Yes | No | - |
| due_date | DateTime | - | Yes | No | - |
| subtotal | Float | - | Yes | No | - |
| tax_amount | Float | - | Yes | No | 0 |
| total_amount | Float | - | Yes | No | - |
| payment_status | String | 50 | Yes | No | pending |
| paid_amount | Float | - | Yes | No | 0 |
| paid_at | DateTime | - | No | No | - |
| payment_method | String | 50 | No | No | - |
| paystack_reference | String | 255 | No | No | - |
| line_items | String (JSON) | 20000 | Yes | No | [] |
| notes | String | 2000 | No | No | - |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `employer_id` (key: employer_id, type: key, ASC)
- `invoice_number` (key: invoice_number, type: unique, ASC)
- `payment_status` (key: payment_status, type: key, ASC)

---

### 11. Notifications Collection

**Collection ID:** `notifications`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | Yes | No | - |
| user_id | String | 36 | No | No | - |
| type | String | 50 | Yes | No | - |
| title | String | 255 | Yes | No | - |
| message | String | 2000 | Yes | No | - |
| email_sent | Boolean | - | Yes | No | false |
| sms_sent | Boolean | - | Yes | No | false |
| whatsapp_sent | Boolean | - | Yes | No | false |
| in_app_read | Boolean | - | Yes | No | false |
| metadata | String (JSON) | 5000 | No | No | {} |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `user_id` (key: user_id, type: key, ASC)

---

### 12. Audit Logs Collection

**Collection ID:** `audit_logs`

**Attributes:**

| Key | Type | Size | Required | Array | Default |
|-----|------|------|----------|-------|---------|
| clinic_id | String | 36 | No | No | - |
| user_id | String | 36 | No | No | - |
| user_email | Email | 255 | No | No | - |
| user_role | String | 50 | No | No | - |
| action | String | 100 | Yes | No | - |
| entity_type | String | 100 | Yes | No | - |
| entity_id | String | 36 | No | No | - |
| old_values | String (JSON) | 20000 | No | No | - |
| new_values | String (JSON) | 20000 | No | No | - |
| ip_address | String | 50 | No | No | - |
| user_agent | String | 500 | No | No | - |

**Indexes:**
- `clinic_id` (key: clinic_id, type: key, ASC)
- `user_id` (key: user_id, type: key, ASC)
- `entity_type` (key: entity_type, type: key, ASC)

---

## Storage Buckets

Create the following storage buckets for file uploads:

1. **avatars** - User profile pictures
2. **certificates** - Generated certificates (PDFs)
3. **test_results** - X-rays, audiograms, and other test result files
4. **clinic_logos** - Clinic logo images

For each bucket:
1. Go to Storage in Appwrite Console
2. Click "Add Bucket"
3. Set appropriate file size limits and allowed file types
4. Configure permissions appropriately

---

## Security & Permissions

Appwrite doesn't have Row Level Security like Supabase, so you'll need to handle security at the application level:

1. Always check the user's clinic_id before performing operations
2. Use server-side functions to validate access
3. The helper functions in `lib/appwrite/helpers.ts` provide clinic-scoped queries
4. Consider using Appwrite Functions for additional security layers

---

## Migration Notes

1. **No Joins**: Unlike PostgreSQL, Appwrite doesn't support joins. Fetch related data separately when needed.
2. **No Complex Queries**: Some complex SQL queries may need to be simplified or moved to application logic.
3. **Document Size Limits**: Appwrite has document size limits. Keep JSON fields reasonable.
4. **Indexes**: Create indexes for frequently queried fields to improve performance.

---

## Testing Your Setup

After creating all collections, test your setup:

1. Sign up a new user through the app
2. Complete the onboarding process
3. Verify that a clinic and user profile are created in Appwrite
4. Try creating a patient record
5. Verify role-based access controls are working

---

## Support

For Appwrite-specific questions, visit:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord](https://discord.gg/appwrite)
