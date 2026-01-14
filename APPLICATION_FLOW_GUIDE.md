# MedSurv Application Flow & User Journey Guide

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [User Registration Flows](#user-registration-flows)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core Feature Workflows](#core-feature-workflows)
5. [Data Flow & Security](#data-flow--security)
6. [Technical Stack Details](#technical-stack-details)

---

## System Architecture Overview

### Multi-Tenant Architecture
MedSurv uses a multi-tenant SaaS architecture where each clinic operates as an isolated tenant:

```
┌─────────────────────────────────────────────────────────────┐
│                      MedSurv Platform                        │
├─────────────────────────────────────────────────────────────┤
│  Super Admin Dashboard                                       │
│  ├── Manage All Clinics                                     │
│  ├── Monitor Platform Health                                │
│  └── Analytics & Reporting                                  │
├─────────────────────────────────────────────────────────────┤
│  Clinic Tenant 1          │  Clinic Tenant 2 │  Clinic N    │
│  ├── Clinic Dashboard     │  ├── Dashboard   │  ├── ...     │
│  ├── Staff Users          │  ├── Staff       │  └── ...     │
│  ├── Patients             │  ├── Patients    │              │
│  ├── Appointments         │  ├── ...         │              │
│  └── Certificates         │  └── ...         │              │
├─────────────────────────────────────────────────────────────┤
│  Employer Portal Access (per employer)                      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 16 (App Router) + React 19.2 + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Appwrite (Authentication + Database + Storage)
- **Encryption**: AES-256-GCM for PHI data
- **Email**: Resend for transactional emails
- **Payments**: Paystack integration
- **Real-time**: Appwrite Realtime subscriptions

---

## User Registration Flows

### 1. Super Admin (Platform Administrator)

**Initial Setup - First User**:
The super admin is created during initial platform setup:

```bash
# Method 1: Via Appwrite Console (Recommended)
1. Go to Appwrite Console → Auth → Users
2. Create first user with email/password
3. Note the user's auth ID
4. Go to Database → users collection
5. Manually create document:
   {
     "auth_user_id": "<auth_id_from_step_3>",
     "email": "admin@medsurv.com",
     "full_name": "System Administrator",
     "role": "super_admin",
     "is_active": true,
     "clinic_id": null  // Super admin not tied to clinic
   }

# Method 2: Via Seed Script (after database setup)
npm run db:seed  # Runs scripts/003_seed_data_v2.sql
# Creates: admin@medsurv.com / SuperSecure123!
```

**Capabilities**:
- View all clinics on the platform
- Monitor system health and metrics
- Access audit logs across all tenants
- Manage platform-wide settings
- No access to individual clinic's patient data (POPIA compliance)

**Dashboard Location**: `/super-admin`

---

### 2. Clinic Admin (First Clinic User)

**Registration Flow**:

```
Step 1: Sign Up Page (/auth/sign-up)
┌────────────────────────────────────┐
│ 1. Email & Password                │
│ 2. Clinic Name                     │
│ 3. Registration Number (optional)  │
│ 4. Phone Number                    │
└────────────────────────────────────┘
         ↓
Step 2: System Creates
┌────────────────────────────────────┐
│ - Appwrite auth account            │
│ - Clinic document (tenant)         │
│ - User document (clinic_admin)     │
│ - Default branch (Main Branch)     │
│ - Trial subscription (14 days)     │
└────────────────────────────────────┘
         ↓
Step 3: Onboarding (/onboarding)
┌────────────────────────────────────┐
│ - Choose subscription plan         │
│ - Add clinic details               │
│ - Upload logo (optional)           │
│ - Set up first branch              │
└────────────────────────────────────┘
         ↓
Step 4: Redirected to Dashboard
         (/clinic)
```

**Implementation Details**:
- File: `components/auth/signup-form.tsx`
- Action: `lib/auth/actions.ts` → `signUp()`
- Creates clinic with `subscription_status: "trial"`
- Generates unique clinic ID
- Sets up default permissions

**Capabilities**:
- Full access to their clinic's data
- Manage staff (doctors, nurses, receptionists)
- Configure clinic settings
- Manage billing and subscription
- View analytics and reports
- Manage branches (multi-location support)

---

### 3. Staff Members (Doctors, Nurses, Receptionists)

**Registration Flow**:

```
Initiated by Clinic Admin
         ↓
Step 1: Admin clicks "Add Staff" (/clinic/settings/staff)
┌────────────────────────────────────┐
│ Input Staff Details:               │
│ - Full Name                        │
│ - Email                            │
│ - Role (doctor/nurse/receptionist) │
│ - Branch Assignment                │
│ - Professional Registration # (Dr) │
│ - Specialization (optional)        │
└────────────────────────────────────┘
         ↓
Step 2: System Actions
┌────────────────────────────────────┐
│ - Creates Appwrite auth account    │
│ - Sends invitation email           │
│ - Creates user document            │
│ - Links to clinic_id & branch_id   │
└────────────────────────────────────┘
         ↓
Step 3: Staff Receives Email
┌────────────────────────────────────┐
│ "Welcome to MedSurv"               │
│ - Temporary password OR            │
│ - Set password link                │
│ - Login instructions               │
└────────────────────────────────────┘
         ↓
Step 4: First Login
┌────────────────────────────────────┐
│ /auth/sign-in                      │
│ - Enter email & temp password      │
│ - Prompted to change password      │
│ - Redirected to role dashboard     │
└────────────────────────────────────┘
```

**Role-Based Access**:

**Doctor**:
- Review patient test results
- Issue medical certificates (fit/unfit)
- Complete appointment examinations
- View patient medical history
- Access: `/clinic/*` (full clinical access)

**Nurse**:
- Conduct clinical tests
- Record test results
- Update appointment status
- Take patient vitals
- Access: `/clinic/*` (limited to assigned patients)

**Receptionist**:
- Schedule appointments
- Check-in patients
- Manage patient registration
- Print certificates
- Access: `/clinic/*` (no clinical data entry)

---

### 4. Employer Portal User

**Registration Flow**:

```
Initiated by Clinic Admin
         ↓
Step 1: Add Employer (/clinic/employers)
┌────────────────────────────────────┐
│ Input Employer Details:            │
│ - Company Name                     │
│ - Registration Number              │
│ - Industry                         │
│ - Contact Email                    │
│ - Portal Access (toggle ON)        │
└────────────────────────────────────┘
         ↓
Step 2: System Creates
┌────────────────────────────────────┐
│ - Employer document                │
│ - Appwrite auth account            │
│ - User document (role: employer)   │
│ - Sends portal credentials         │
└────────────────────────────────────┘
         ↓
Step 3: Employer Receives Email
┌────────────────────────────────────┐
│ "Portal Access Granted"            │
│ - Login URL: /auth/sign-in         │
│ - Temporary credentials            │
│ - Portal features overview         │
└────────────────────────────────────┘
         ↓
Step 4: Employer Login
         (/employer)
```

**Employer Portal Features**:
- View all employees' health status
- Download medical certificates
- Track certificate expiry dates
- View compliance reports
- Manage notification preferences
- Access: `/employer/*` (only their employees)

---

## Authentication & Authorization

### Authentication Flow

```
User Login Request (/auth/sign-in)
         ↓
┌────────────────────────────────────┐
│ lib/auth/actions.ts                │
│ → signIn(email, password)          │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Appwrite Authentication            │
│ - Validates credentials            │
│ - Creates session                  │
│ - Returns auth token               │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Fetch User Profile                 │
│ - Query users collection           │
│ - Get role, clinic_id, branch_id   │
│ - Check is_active status           │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Role-Based Redirect                │
│ - super_admin → /super-admin       │
│ - clinic_admin → /clinic           │
│ - doctor → /clinic                 │
│ - nurse → /clinic                  │
│ - receptionist → /clinic           │
│ - employer → /employer             │
└────────────────────────────────────┘
```

### Authorization (Permission Checking)

**Implemented via**:
- `lib/auth/permissions.ts` - Permission checking functions
- `lib/middleware/access-control.ts` - Route protection
- `components/auth/role-gate.tsx` - UI component access control

**Example Permission Check**:
```typescript
// Before allowing certificate issuance
const canIssue = await canIssueCertificate(userId, patientId)
if (!canIssue) {
  return { error: "Unauthorized: Only doctors can issue certificates" }
}
```

**Multi-Tenant Isolation**:
All database queries automatically filter by `clinic_id`:
```typescript
const patients = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.PATIENTS,
  [
    Query.equal('clinic_id', userClinicId),  // ← Automatic isolation
    Query.equal('is_active', true)
  ]
)
```

---

## Core Feature Workflows

### Patient Registration Flow

```
Step 1: Receptionist clicks "New Patient"
         ↓
Step 2: Fill Registration Form
┌────────────────────────────────────┐
│ Personal Information (Encrypted):  │
│ - ID Number / Passport             │
│ - First Name, Last Name            │
│ - Date of Birth                    │
│ - Gender                           │
│ - Contact Details                  │
│                                    │
│ Employment Information:            │
│ - Link to Employer                 │
│ - Employee Number                  │
│ - Job Title                        │
│ - Department                       │
│                                    │
│ Medical History (Encrypted):       │
│ - Blood Type                       │
│ - Allergies                        │
│ - Chronic Conditions               │
│ - Emergency Contact                │
│                                    │
│ POPIA Consent:                     │
│ - Checkbox for data processing     │
│ - Timestamp recorded               │
└────────────────────────────────────┘
         ↓
Step 3: System Encrypts PHI
┌────────────────────────────────────┐
│ lib/security/encryption.ts         │
│ - AES-256-GCM encryption           │
│ - Separate IV per field            │
│ - Authentication tags              │
│ - Stores as: field_enc, _iv, _tag  │
└────────────────────────────────────┘
         ↓
Step 4: Save to Database
┌────────────────────────────────────┐
│ Creates patient document with:     │
│ - clinic_id (for isolation)        │
│ - employer_id (if applicable)      │
│ - Encrypted PHI fields             │
│ - consent_given: true              │
│ - consent_date: timestamp          │
└────────────────────────────────────┘
         ↓
Step 5: Audit Log Entry
         (POPIA compliance)
```

**Files Involved**:
- Form: `components/clinic/patients/new-patient-form.tsx`
- Action: `lib/actions/patient-actions.ts`
- Encryption: `lib/security/encryption.ts`
- Audit: `lib/security/audit-log.ts`

---

### Appointment Workflow

```
SCHEDULED → CHECKED_IN → WITH_NURSE → WITH_DOCTOR → COMPLETED
```

**Detailed Flow**:

1. **SCHEDULED** (Receptionist)
   ```
   - Create appointment
   - Assign patient
   - Set date/time
   - Select tests required
   - Status: "scheduled"
   ```

2. **CHECKED_IN** (Receptionist)
   ```
   - Patient arrives at clinic
   - Receptionist checks them in
   - Status: "checked_in"
   - Timestamp recorded
   ```

3. **WITH_NURSE** (Nurse)
   ```
   - Nurse claims appointment
   - Conducts clinical tests:
     • Audiometry
     • Spirometry
     • Vision screening
     • Blood pressure
     • Urinalysis
   - Records test results
   - Adds notes
   - Status: "with_nurse"
   ```

4. **WITH_DOCTOR** (Doctor)
   ```
   - Reviews all test results
   - Conducts physical examination
   - Reviews medical history
   - Makes fitness determination
   - Status: "with_doctor"
   ```

5. **COMPLETED** (Doctor)
   ```
   - Issues certificate:
     • Fit to work
     • Unfit to work
     • Fit with restrictions
   - Signs digitally
   - Status: "completed"
   - Certificate auto-sent to employer
   ```

**Real-time Updates**:
- Uses Appwrite Realtime subscriptions
- All staff see live appointment status
- Notifications sent at each stage
- Dashboard updates automatically

---

### Certificate Issuance Flow

```
Step 1: Doctor Reviews Patient
┌────────────────────────────────────┐
│ - All test results compiled        │
│ - Medical history visible          │
│ - Previous certificates shown      │
└────────────────────────────────────┘
         ↓
Step 2: Fitness Determination
┌────────────────────────────────────┐
│ Doctor selects:                    │
│ ○ Fit to Work                      │
│ ○ Fit with Restrictions            │
│ ○ Unfit to Work                    │
│                                    │
│ Add clinical findings              │
│ Add recommendations                │
│ Set validity period                │
└────────────────────────────────────┘
         ↓
Step 3: Certificate Generation
┌────────────────────────────────────┐
│ lib/pdf/certificate-generator.ts   │
│ - Creates PDF with:                │
│   • Patient details (decrypted)    │
│   • Test results summary           │
│   • Doctor's findings              │
│   • Fitness determination          │
│   • Doctor's digital signature     │
│   • Clinic stamp/logo              │
│   • Unique certificate number      │
│   • QR code for verification       │
└────────────────────────────────────┘
         ↓
Step 4: Storage & Distribution
┌────────────────────────────────────┐
│ - Store PDF in Appwrite Storage    │
│ - Create certificate document      │
│ - Send to employer (if enabled)    │
│ - Send to patient (optional)       │
│ - Update appointment status        │
└────────────────────────────────────┘
         ↓
Step 5: Employer Notification
┌────────────────────────────────────┐
│ Email to employer:                 │
│ "New Certificate Available"        │
│ - Employee name                    │
│ - Fitness status                   │
│ - Validity dates                   │
│ - Download link (portal)           │
│ - PDF attachment (if enabled)      │
└────────────────────────────────────┘
```

---

## Data Flow & Security

### Encryption Flow for PHI Data

```
Data Input (Form)
         ↓
┌────────────────────────────────────┐
│ Plain Text PHI                     │
│ "John Doe"                         │
│ "1980-01-01"                       │
│ "0123456789"                       │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Encryption Process                 │
│ lib/security/encryption.ts         │
│ - Generate random IV (12 bytes)    │
│ - AES-256-GCM encryption           │
│ - Generate auth tag                │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Encrypted Storage                  │
│ first_name_enc: "a8f3d9..."        │
│ first_name_iv: "7b2c..."           │
│ first_name_tag: "9e1f..."          │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Database (Appwrite)                │
│ Only encrypted data stored         │
│ No plain text PHI in database      │
└────────────────────────────────────┘
         ↓
┌────────────────────────────────────┐
│ Decryption (When Needed)           │
│ - Fetch all three components       │
│ - Decrypt using ENCRYPTION_KEY     │
│ - Verify authentication tag        │
│ - Return plain text to authorized  │
│   user only                        │
└────────────────────────────────────┘
```

### Audit Logging (POPIA Compliance)

Every sensitive action is logged:

```typescript
// Example: Viewing patient record
await logAuditEvent({
  userId: currentUser.id,
  clinicId: currentUser.clinic_id,
  action: 'read',
  entityType: 'patient',
  entityId: patientId,
  entityDescription: 'Patient record viewed',
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  success: true
})
```

**Audit Log Includes**:
- Who (user_id, role)
- What (action, entity_type)
- When (timestamp)
- Where (ip_address, user_agent)
- Why (context, metadata)
- Result (success/failure)

**Retention**: 7 years (POPIA requirement)

---

## Technical Stack Details

### Database Schema

**Collections** (12 total):
1. `clinics` - Tenant root
2. `branches` - Multi-location support
3. `users` - All system users
4. `employers` - Company records
5. `patients` - Worker health records
6. `appointments` - Screening sessions
7. `clinical_tests` - Test catalog
8. `test_results` - Test data
9. `certificates` - Fitness certificates
10. `invoices` - Billing records
11. `notifications` - Alert system
12. `audit_logs` - Compliance tracking

### API Routes

**Public Routes**:
- `/api/health` - Health check
- `/auth/sign-in` - Login
- `/auth/sign-up` - Registration
- `/auth/forgot-password` - Password recovery

**Protected Routes** (require authentication):
- `/api/secure/*` - Encrypted patient data operations
- `/api/certificates/generate-pdf` - Certificate PDF generation
- `/api/analytics/*` - Analytics and reports
- `/api/notifications/*` - Notification management
- `/api/paystack/*` - Payment processing

### Environment Variables Required

**Critical (Application won't work without these)**:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
APPWRITE_API_KEY=your_api_key
ENCRYPTION_KEY=your_32_byte_key_base64
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Optional (for additional features)**:
```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

---

## Setup Instructions for New Deployment

### Step-by-Step Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd medical-surveillance-saas
npm install

# 2. Create Appwrite project
# Visit https://cloud.appwrite.io
# Create new project, copy Project ID

# 3. Set up environment variables
cp .env.local.example .env.local
# Add your Appwrite credentials

# 4. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Add to .env.local as ENCRYPTION_KEY

# 5. Run database setup
npm run appwrite:setup
# This creates all collections and indexes
# Copy the generated Database ID to .env.local

# 6. Create storage bucket
# In Appwrite Console → Storage
# Create bucket: "medsurv_storage"
# Set permissions: Read: any(), Write: users()

# 7. (Optional) Seed sample data
npm run db:seed

# 8. Start development server
npm run dev
```

### First Login

```bash
# If you ran seed script:
Email: admin@medsurv.com
Password: SuperSecure123!
Role: super_admin

# To create first super admin manually:
# See "Super Admin Registration Flow" section above
```

---

## Production Readiness Checklist

- ✅ All Appwrite collections created
- ✅ Storage bucket configured
- ✅ Encryption key generated and secured
- ✅ Email service (Resend) configured
- ✅ Environment variables set
- ✅ Super admin account created
- ✅ SSL/TLS enabled (Appwrite Cloud default)
- ✅ Backup strategy in place
- ✅ Monitoring enabled
- ✅ Error boundaries implemented
- ✅ Audit logging active
- ✅ POPIA compliance verified

---

## Support & Troubleshooting

### Common Issues

**1. "Database not found"**
- Run `npm run appwrite:setup`
- Verify `NEXT_PUBLIC_APPWRITE_DATABASE_ID` in .env.local

**2. "Encryption key not set"**
- Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Add to .env.local as `ENCRYPTION_KEY`

**3. "Failed to decrypt data"**
- Verify encryption key matches the one used to encrypt
- Check all three fields exist: _enc, _iv, _tag

**4. "Unauthorized access"**
- Check user role in database
- Verify clinic_id matches
- Check `is_active` status

**5. "Email not sending"**
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Verify email addresses are valid

### Getting Help

- Check documentation in `/docs` folder
- Review error logs in Appwrite Console
- Check audit logs for security events
- Contact support at support@medsurv.com

---

## Version Information

- **Application Version**: 1.0.0
- **Last Updated**: January 2026
- **Appwrite Version**: 1.6+
- **Next.js Version**: 16.0+
- **Node Version**: 18.0+ required

---

## Conclusion

This application provides a complete, production-ready medical surveillance management system with:
- Enterprise-grade security
- POPIA compliance
- Multi-tenant architecture
- Real-time updates
- Comprehensive audit trails
- Professional certificate generation
- Automated notifications
- Subscription billing

All user flows are designed for simplicity while maintaining security and compliance standards.
