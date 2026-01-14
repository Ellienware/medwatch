# MedSurv - Database Design Documentation

## Overview

This document provides a comprehensive overview of the database architecture for the MedSurv Medical Surveillance Management System. The application uses **Appwrite** as the database backend with a document-based NoSQL structure while maintaining relational patterns through references.

## Database Architecture

### Multi-Tenancy Model

The system implements a **clinic-based multi-tenancy** model where:
- Each clinic is a separate tenant with isolated data
- The `clinic_id` field acts as the tenant identifier across all collections
- Users, patients, appointments, and all related data are scoped to specific clinics
- Super admins can access all clinics; other users only access their assigned clinic

### Design Principles

1. **Separation of Concerns**: Each collection has a single responsibility
2. **Data Integrity**: Foreign key relationships maintained through document IDs
3. **Scalability**: Indexed fields for fast queries as data grows
4. **Security**: Role-based access control at the application layer
5. **POPIA Compliance**: Audit logs and data retention policies
6. **Performance**: Caching layer and optimized queries

---

## Collections Structure

### 1. Clinics Collection

**Purpose**: Root tenant table storing clinic/practice information

**Collection ID**: `clinics`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique clinic identifier (auto-generated) |
| name | string | Yes | Clinic/practice name |
| registration_number | string | No | Official registration number |
| email | string | Yes | Primary clinic email |
| phone | string | No | Primary phone number |
| address | string | No | Physical address |
| logo_url | string | No | URL to clinic logo |
| subscription_plan | string | Yes | Plan: basic, professional, enterprise |
| subscription_status | string | Yes | Status: active, trial, cancelled, suspended, expired |
| subscription_start_date | datetime | No | Subscription start date |
| subscription_end_date | datetime | No | Subscription expiry date |
| monthly_patient_limit | integer | Yes | Max patients per month (default: 100) |
| current_month_patients | integer | Yes | Current month patient count (default: 0) |
| paystack_customer_id | string | No | Paystack customer reference |
| paystack_subscription_id | string | No | Paystack subscription reference |
| settings | object | No | Clinic-specific settings (JSON) |
| is_active | boolean | Yes | Active status (default: true) |
| data_retention_days | integer | Yes | POPIA retention period (default: 2555 = 7 years) |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `is_active` (for filtering active clinics)
- `subscription_status` (for billing queries)
- `email` (unique, for lookups)

**Relationships**:
- One-to-Many: Branches, Users, Employers, Patients, Appointments

---

### 2. Branches Collection

**Purpose**: Store multiple locations/branches for a clinic

**Collection ID**: `branches`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique branch identifier |
| clinic_id | string | Yes | Parent clinic ID (foreign key) |
| name | string | Yes | Branch name |
| code | string | Yes | Branch code (unique per clinic) |
| email | string | No | Branch email |
| phone | string | No | Branch phone |
| address | string | No | Branch address |
| latitude | float | No | GPS latitude |
| longitude | float | No | GPS longitude |
| operating_hours | object | No | Operating schedule (JSON) |
| is_active | boolean | Yes | Active status (default: true) |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id` (for filtering by clinic)
- `is_active`
- Compound: `clinic_id + code` (unique)

**Relationships**:
- Many-to-One: Clinic
- One-to-Many: Appointments, Users (assigned staff)

---

### 3. Users Collection

**Purpose**: All system users (staff and employer portal users)

**Collection ID**: `users`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique user identifier |
| clinic_id | string | No | Assigned clinic (null for super_admin) |
| branch_id | string | No | Assigned branch |
| clerk_user_id | string | Yes | Clerk authentication ID (unique) |
| email | string | Yes | User email (unique) |
| full_name | string | Yes | Full name |
| phone | string | No | Phone number |
| role | string | Yes | Role: super_admin, clinic_admin, receptionist, nurse, doctor, employer |
| permissions | object | No | Custom permissions (JSON) |
| professional_registration_number | string | No | Medical registration number (doctors/nurses) |
| specialization | string | No | Medical specialization |
| avatar_url | string | No | Profile photo URL |
| is_active | boolean | Yes | Active status (default: true) |
| last_login | datetime | No | Last login timestamp |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `clerk_user_id` (unique)
- `email` (unique)
- `role`

**Relationships**:
- Many-to-One: Clinic, Branch
- One-to-Many: Appointments (assigned), Test Results (performed_by), Certificates (issued_by)

**Roles**:
- **super_admin**: Full system access
- **clinic_admin**: Manages their clinic
- **receptionist**: Patient registration, appointments
- **nurse**: Vitals, tests
- **doctor**: Medical assessment, certificates
- **employer**: Portal access to employee health data

---

### 4. Employers Collection

**Purpose**: Companies sending employees for medical assessments

**Collection ID**: `employers`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique employer identifier |
| clinic_id | string | Yes | Parent clinic ID |
| company_name | string | Yes | Company name |
| registration_number | string | No | Company registration number |
| industry | string | No | Industry type |
| email | string | Yes | Company email |
| phone | string | No | Company phone |
| address | string | No | Company address |
| billing_email | string | No | Billing contact email |
| payment_terms | integer | Yes | Payment terms in days (default: 30) |
| portal_user_id | string | No | Associated user for portal access |
| portal_enabled | boolean | Yes | Portal access enabled (default: true) |
| auto_receive_certificates | boolean | Yes | Auto-send certificates (default: true) |
| notification_preferences | object | No | Notification settings (JSON) |
| is_active | boolean | Yes | Active status (default: true) |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `is_active`
- `email`

**Relationships**:
- Many-to-One: Clinic
- One-to-Many: Patients, Appointments, Invoices

---

### 5. Patients Collection

**Purpose**: Employee/worker records undergoing medical assessments

**Collection ID**: `patients`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique patient identifier |
| clinic_id | string | Yes | Parent clinic ID |
| employer_id | string | No | Associated employer ID |
| id_number | string | Yes | SA ID number |
| passport_number | string | No | Passport number (for foreigners) |
| first_name | string | Yes | First name |
| last_name | string | Yes | Last name |
| date_of_birth | date | Yes | Date of birth |
| gender | string | No | Gender |
| email | string | No | Patient email |
| phone | string | No | Patient phone |
| address | string | No | Residential address |
| employee_number | string | No | Employee number at company |
| job_title | string | No | Job title |
| department | string | No | Department |
| employment_start_date | date | No | Employment start date |
| blood_type | string | No | Blood type |
| allergies | string | No | Known allergies |
| chronic_conditions | string | No | Chronic conditions |
| emergency_contact_name | string | No | Emergency contact name |
| emergency_contact_phone | string | No | Emergency contact phone |
| consent_given | boolean | Yes | POPIA consent (default: false) |
| consent_date | datetime | No | Consent date |
| photo_url | string | No | Patient photo URL |
| notes | string | No | Additional notes |
| is_active | boolean | Yes | Active status (default: true) |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `employer_id`
- `id_number`
- Compound: `clinic_id + id_number` (unique)

**Relationships**:
- Many-to-One: Clinic, Employer
- One-to-Many: Appointments, Test Results, Certificates

---

### 6. Appointments Collection

**Purpose**: Medical assessment appointments with workflow tracking

**Collection ID**: `appointments`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique appointment identifier |
| clinic_id | string | Yes | Parent clinic ID |
| branch_id | string | Yes | Branch where appointment occurs |
| patient_id | string | Yes | Patient ID |
| employer_id | string | No | Associated employer ID |
| appointment_date | date | Yes | Appointment date |
| appointment_time | time | Yes | Appointment time |
| appointment_type | string | Yes | Type: routine_medical, pre_employment, etc. |
| reason | string | No | Reason for visit |
| status | string | Yes | Workflow status (see below) |
| checked_in_at | datetime | No | Check-in timestamp |
| checked_in_by | string | No | User who checked in patient |
| nurse_assigned_id | string | No | Assigned nurse ID |
| nurse_started_at | datetime | No | Nurse started timestamp |
| nurse_completed_at | datetime | No | Nurse completed timestamp |
| doctor_assigned_id | string | No | Assigned doctor ID |
| doctor_started_at | datetime | No | Doctor started timestamp |
| doctor_completed_at | datetime | No | Doctor completed timestamp |
| completed_at | datetime | No | Overall completion timestamp |
| reception_notes | string | No | Reception notes |
| nurse_notes | string | No | Nurse notes |
| doctor_notes | string | No | Doctor notes |
| created_by | string | No | User who created appointment |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Status Values**:
- `scheduled`: Appointment booked
- `checked_in`: Patient arrived
- `with_nurse`: Nurse assessment in progress
- `tests_in_progress`: Tests being conducted
- `with_doctor`: Doctor consultation
- `completed`: Assessment complete
- `cancelled`: Appointment cancelled
- `no_show`: Patient didn't arrive

**Indexes**:
- `clinic_id`
- `branch_id`
- `patient_id`
- `appointment_date`
- `status`
- `doctor_assigned_id`

**Relationships**:
- Many-to-One: Clinic, Branch, Patient, Employer
- One-to-Many: Test Results, Certificates

---

### 7. Clinical Tests Collection

**Purpose**: Test catalog (audiometry, spirometry, vision, etc.)

**Collection ID**: `clinical_tests`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique test identifier |
| clinic_id | string | Yes | Parent clinic ID |
| test_code | string | Yes | Test code (unique per clinic) |
| test_name | string | Yes | Test name |
| test_category | string | No | Category: hearing, respiratory, vision, etc. |
| description | string | No | Test description |
| price | float | Yes | Test price (default: 0) |
| parameters | array | No | Test parameters (JSON array) |
| normal_ranges | object | No | Normal range values (JSON) |
| requires_equipment | boolean | Yes | Equipment required (default: false) |
| estimated_duration_minutes | integer | No | Estimated duration |
| is_active | boolean | Yes | Active status (default: true) |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- Compound: `clinic_id + test_code` (unique)
- `is_active`

**Relationships**:
- Many-to-One: Clinic
- One-to-Many: Test Results

---

### 8. Test Results Collection

**Purpose**: Store results from clinical tests performed

**Collection ID**: `test_results`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique result identifier |
| clinic_id | string | Yes | Parent clinic ID |
| appointment_id | string | Yes | Associated appointment ID |
| patient_id | string | Yes | Patient ID |
| test_id | string | Yes | Clinical test ID |
| performed_by | string | No | User who performed test |
| performed_at | datetime | Yes | Test performance timestamp |
| results | object | Yes | Test results data (JSON) |
| is_normal | boolean | No | Results within normal range |
| findings | string | No | Clinical findings |
| recommendations | string | No | Recommendations |
| attachments | array | No | File URLs (audiograms, X-rays, etc.) |
| reviewed_by | string | No | Doctor who reviewed |
| reviewed_at | datetime | No | Review timestamp |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `appointment_id`
- `patient_id`
- `test_id`

**Relationships**:
- Many-to-One: Clinic, Appointment, Patient, Clinical Test

---

### 9. Certificates Collection

**Purpose**: Medical fitness certificates (Annexure 3, Fit-to-Work)

**Collection ID**: `certificates`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique certificate identifier |
| clinic_id | string | Yes | Parent clinic ID |
| appointment_id | string | Yes | Associated appointment ID |
| patient_id | string | Yes | Patient ID |
| certificate_number | string | Yes | Certificate number (unique) |
| certificate_type | string | Yes | Type: fit_to_work, unfit_to_work, fit_with_restrictions |
| issue_date | date | Yes | Issue date |
| valid_from | date | No | Valid from date |
| valid_until | date | No | Expiry date |
| diagnosis | string | No | Medical diagnosis |
| restrictions | string | No | Work restrictions |
| recommendations | string | No | Recommendations |
| issued_by | string | Yes | Doctor user ID |
| doctor_name | string | Yes | Doctor full name |
| doctor_registration_number | string | No | Doctor HPCSA number |
| doctor_signature_url | string | No | Signature image URL |
| pdf_url | string | No | Generated PDF URL |
| sent_to_employer | boolean | Yes | Sent status (default: false) |
| sent_at | datetime | No | Sent timestamp |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `patient_id`
- `appointment_id`
- `certificate_number` (unique)

**Relationships**:
- Many-to-One: Clinic, Appointment, Patient

---

### 10. Invoices Collection

**Purpose**: Billing and invoices for services

**Collection ID**: `invoices`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique invoice identifier |
| clinic_id | string | Yes | Parent clinic ID |
| employer_id | string | No | Associated employer ID |
| invoice_number | string | Yes | Invoice number (unique) |
| invoice_date | date | Yes | Invoice date |
| due_date | date | Yes | Payment due date |
| subtotal | float | Yes | Subtotal amount |
| tax_amount | float | Yes | Tax amount (default: 0) |
| total_amount | float | Yes | Total amount |
| payment_status | string | Yes | Status: pending, paid, overdue, cancelled |
| paid_amount | float | Yes | Amount paid (default: 0) |
| paid_at | datetime | No | Payment timestamp |
| payment_method | string | No | Payment method |
| paystack_reference | string | No | Paystack payment reference |
| line_items | array | Yes | Invoice line items (JSON array) |
| notes | string | No | Additional notes |
| created_at | datetime | Yes | Record creation timestamp |
| updated_at | datetime | Yes | Last update timestamp |

**Indexes**:
- `clinic_id`
- `employer_id`
- `payment_status`
- `invoice_number` (unique)

**Relationships**:
- Many-to-One: Clinic, Employer

---

### 11. Notifications Collection

**Purpose**: System notifications for users

**Collection ID**: `notifications`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique notification identifier |
| clinic_id | string | Yes | Parent clinic ID |
| user_id | string | No | Target user ID |
| type | string | Yes | Notification type |
| title | string | Yes | Notification title |
| message | string | Yes | Notification message |
| email_sent | boolean | Yes | Email sent status (default: false) |
| sms_sent | boolean | Yes | SMS sent status (default: false) |
| whatsapp_sent | boolean | Yes | WhatsApp sent status (default: false) |
| in_app_read | boolean | Yes | In-app read status (default: false) |
| metadata | object | No | Additional metadata (JSON) |
| created_at | datetime | Yes | Record creation timestamp |

**Indexes**:
- `clinic_id`
- `user_id`
- `created_at`

**Relationships**:
- Many-to-One: Clinic, User

---

### 12. Audit Logs Collection

**Purpose**: POPIA compliance and security audit trail

**Collection ID**: `audit_logs`

| Field Name | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Unique log identifier |
| clinic_id | string | No | Parent clinic ID (null for super_admin actions) |
| user_id | string | No | User who performed action |
| user_email | string | No | User email at time of action |
| user_role | string | No | User role at time of action |
| action | string | Yes | Action performed: CREATE, READ, UPDATE, DELETE |
| entity_type | string | Yes | Entity type: patients, appointments, etc. |
| entity_id | string | No | Entity ID |
| old_values | object | No | Old values before change (JSON) |
| new_values | object | No | New values after change (JSON) |
| ip_address | string | No | User IP address |
| user_agent | string | No | Browser/client user agent |
| created_at | datetime | Yes | Action timestamp |

**Indexes**:
- `clinic_id`
- `user_id`
- `created_at`
- Compound: `entity_type + entity_id`

**POPIA Compliance**:
- All access to patient data is logged
- Logs retained for audit period
- Cannot be deleted by regular users

---

## Relationships Diagram

\`\`\`
Clinics (Root Tenant)
├── Branches
├── Users (Staff)
├── Employers
│   ├── Patients
│   └── Invoices
├── Patients
│   ├── Appointments
│   │   ├── Test Results
│   │   └── Certificates
│   └── Test Results
├── Clinical Tests
└── Audit Logs

Authentication (Clerk)
└── Users (clerk_user_id reference)
\`\`\`

---

## Data Access Patterns

### Multi-Tenancy Enforcement

Every query must include `clinic_id` filter (except super_admin):

\`\`\`typescript
// Example query
const patients = await databases.listDocuments(
  APPWRITE_DATABASE_ID,
  COLLECTIONS.PATIENTS,
  [Query.equal('clinic_id', userClinicId)]
)
\`\`\`

### Caching Strategy

- User profiles: 15 minutes TTL
- Clinic settings: 30 minutes TTL
- Test catalogs: 1 hour TTL
- Stats/dashboard: 5 minutes TTL

### Performance Optimization

1. **Indexed Queries**: All frequent filters are indexed
2. **Batch Loading**: Use DataLoader for related entities
3. **Pagination**: Limit 25-100 records per page
4. **Aggregations**: Cache expensive computations

---

## Security Considerations

### Role-Based Access Control (RBAC)

Implemented at application layer using middleware and RoleGate components.

**Permission Hierarchy**:
\`\`\`
super_admin > clinic_admin > doctor > nurse > receptionist
employer (separate branch - limited to own employees)
\`\`\`

### Data Protection

1. **Encryption**: All data encrypted at rest (Appwrite default)
2. **HTTPS**: All API calls over SSL/TLS
3. **Authentication**: Clerk handles auth with JWT tokens
4. **Authorization**: Application-layer checks before data access
5. **Audit Trail**: All patient data access logged

### POPIA Compliance

1. **Consent Management**: Patient consent recorded before data capture
2. **Data Retention**: Automatic cleanup after retention period
3. **Access Logs**: Complete audit trail
4. **Right to be Forgotten**: Patient data deletion workflow
5. **Data Portability**: Export patient data functionality

---

## Backup and Recovery

### Backup Strategy

1. **Frequency**: Daily automated backups (Appwrite Cloud)
2. **Retention**: 30 days rolling backup
3. **Point-in-Time Recovery**: Available through Appwrite
4. **Disaster Recovery**: Multi-region replication

### Data Migration

When migrating from Supabase to Appwrite:
1. Export data from Supabase as JSON
2. Transform data to match Appwrite schema
3. Import using batch operations
4. Verify data integrity
5. Update auth references (Supabase auth_user_id → Clerk clerk_user_id)

---

## Monitoring and Maintenance

### Health Checks

- Database connectivity: Every 30 seconds
- Collection counts: Daily
- Index performance: Weekly analysis
- Query performance: Real-time monitoring

### Optimization Tasks

1. **Monthly**: Review slow queries and add indexes
2. **Quarterly**: Archive old audit logs
3. **Annually**: Review data retention policies

---

## Scaling Considerations

### Horizontal Scaling

- Appwrite automatically scales based on load
- Application servers can be replicated
- Clerk auth scales independently

### Vertical Scaling

- Increase Appwrite plan as clinic count grows
- Monitor collection sizes
- Implement archival strategy for old data

### Performance Targets

- Query response: < 200ms (p95)
- Page load: < 2s (p95)
- API calls: < 500ms (p95)
- Concurrent users: 1000+ per clinic

---

## Future Enhancements

1. **Read Replicas**: For analytics queries
2. **Event Sourcing**: Detailed action replay
3. **GraphQL API**: Alternative to REST
4. **Real-time Updates**: WebSocket subscriptions
5. **Advanced Search**: Full-text search with Algolia/Meilisearch
6. **Data Warehouse**: Separate analytics database

---

## Conclusion

This database design provides a robust, scalable foundation for a multi-tenant medical surveillance SaaS. The document-based approach with Appwrite offers flexibility while maintaining relational integrity through careful schema design and application-layer enforcement of relationships and business rules.
