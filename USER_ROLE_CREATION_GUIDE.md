# User Role Creation Guide

This guide explains how users with different roles are created in the MedSurv application.

## Table of Contents
1. [Role Overview](#role-overview)
2. [User Creation Flows](#user-creation-flows)
3. [Technical Implementation](#technical-implementation)

---

## Role Overview

The system supports **6 distinct user roles**, each with specific permissions and access levels:

### 1. Super Admin
- **Purpose**: System-wide administration
- **Access**: All clinics and system settings
- **Permissions**: Full control over the entire platform

### 2. Clinic Admin
- **Purpose**: Clinic owner/manager
- **Access**: Full clinic management
- **Permissions**: Manage branches, staff, patients, billing, and settings

### 3. Doctor
- **Purpose**: Medical professional
- **Access**: Patient examinations and certifications
- **Permissions**: View patients, perform consultations, issue medical certificates

### 4. Nurse
- **Purpose**: Clinical support staff
- **Access**: Clinical tests and procedures
- **Permissions**: Conduct tests, record results, add nurse notes

### 5. Receptionist
- **Purpose**: Front desk operations
- **Access**: Patient management and scheduling
- **Permissions**: Manage appointments, check-in patients, register new patients

### 6. Employer
- **Purpose**: Corporate client
- **Access**: Employee health records portal
- **Permissions**: View employee certificates and reports

---

## User Creation Flows

### Flow 1: Clinic Administrator (Self-Registration)

**When**: A new clinic wants to join the platform

**Steps**:
1. User visits the application homepage
2. Clicks "Sign Up" button
3. Enters details in Clerk's sign-up form:
   - Email address
   - Password
   - Full name
4. Verifies email through Clerk
5. Redirected to `/onboarding` page
6. Selects role: **"Clinic Administrator"**
7. Clicks "Complete Setup"

**What Happens**:
\`\`\`typescript
// System automatically:
1. Creates a Clerk user account
2. Creates a new Clinic record in Appwrite with:
   - Clinic name: "{User's Name}'s Clinic"
   - Trial subscription (30 days)
   - Basic plan
   - 100 patient limit/month
3. Creates User profile in Appwrite with:
   - clerk_user_id (linked to Clerk)
   - role: "clinic_admin"
   - clinic_id (the newly created clinic)
   - is_active: true
4. Redirects to /clinic dashboard
\`\`\`

**Result**: User becomes a clinic admin with their own clinic and can start inviting staff.

---

### Flow 2: Doctor or Nurse (Self-Registration with Professional Details)

**When**: A medical professional joins through public sign-up

**Steps**:
1. User signs up through Clerk (same as above)
2. Redirected to `/onboarding` page
3. Selects role: **"Doctor"** or **"Nurse"**
4. Additional fields appear:
   - **Specialization** (e.g., "Occupational Health")
   - **Professional Registration Number** (e.g., medical license number)
5. Fills in professional details
6. Clicks "Complete Setup"

**What Happens**:
\`\`\`typescript
// System:
1. Creates Clerk user account
2. Creates User profile in Appwrite with:
   - role: "doctor" or "nurse"
   - clinic_id: NULL (waiting for clinic assignment)
   - specialization: entered value
   - professional_registration_number: entered value
   - is_active: false (needs clinic admin approval)
3. User cannot access clinic features until assigned to a clinic
\`\`\`

**Important**: Medical professionals created this way need a clinic admin to:
- Assign them to a clinic
- Activate their account
- Assign them to a branch (optional)

---

### Flow 3: Staff Invitation by Clinic Admin (Recommended)

**When**: A clinic admin wants to add staff (receptionist, nurse, doctor)

**Steps**:
1. Clinic admin logs in to `/clinic` dashboard
2. Navigates to "Team Management" or "Staff" section
3. Clicks "Invite Team Member"
4. Fills invitation form:
   - Email address
   - Full name
   - Role (Receptionist/Nurse/Doctor)
   - Branch (if applicable)
   - For Doctor/Nurse: Professional details
5. Clicks "Send Invitation"

**What Happens**:
\`\`\`typescript
// Backend (inviteStaffMember function):
1. Validates clinic admin permission
2. Stores invitation data with:
   - clinic_id (admin's clinic)
   - role, email, name, etc.
3. Sends invitation email via Clerk
4. Invitation contains unique link: /auth/sign-up?invitation={token}
\`\`\`

**Invited User's Experience**:
1. Receives email invitation
2. Clicks link → Directed to Clerk sign-up
3. Creates password and verifies email
4. Automatically redirected to onboarding
5. Role is **pre-filled** from invitation
6. Clicks "Complete Setup"
7. System creates user profile with:
   - Pre-assigned clinic_id
   - Pre-assigned role
   - is_active: true (admin pre-approved)
8. User immediately accesses appropriate dashboard

**Result**: Staff member is instantly active and can start working.

---

### Flow 4: Receptionist (Self-Registration or Invitation)

**Similar to Flow 2/3**, but:
- No special fields required (only email, name, role)
- If self-registered: needs clinic assignment
- If invited: immediately active with clinic

---

### Flow 5: Employer (Self-Registration or Clinic Admin Creation)

**Option A: Self-Registration**
1. Employer visits sign-up page
2. Creates account through Clerk
3. Selects role: **"Employer"**
4. Completes onboarding
5. System creates user profile with:
   - role: "employer"
   - clinic_id: NULL
6. Employer must contact a clinic to:
   - Create Employer company record
   - Link their user account to the company
   - Get assigned to a clinic

**Option B: Created by Clinic Admin**
1. Clinic admin navigates to "Employers" section
2. Clicks "Add New Employer"
3. Fills company details + portal user email
4. System sends invitation to employer
5. Employer signs up via invitation link
6. User profile created with:
   - role: "employer"
   - clinic_id: (admin's clinic)
   - Linked to Employer company record

---

### Flow 6: Super Admin (Manual Creation)

**When**: Platform administrators need system-wide access

**Process**:
1. Super admin accounts are **NOT created through normal sign-up**
2. Must be created manually by:
   - Directly in Appwrite database, OR
   - Via special admin API endpoint (protected), OR
   - Via database migration script

**Manual Steps**:
\`\`\`typescript
// In Appwrite console or via API:
1. Create Clerk user first (manually or via Clerk API)
2. Create User document in Appwrite:
   {
     clerk_user_id: "{clerk_id}",
     email: "admin@platform.com",
     full_name: "Super Admin",
     role: "super_admin",
     clinic_id: null,
     is_active: true,
     permissions: {}
   }
3. Super admin can now access /super-admin dashboard
\`\`\`

**Security**: Super admin creation should be restricted and logged.

---

## Technical Implementation

### Authentication Flow (Clerk + Appwrite)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     User Signs Up/In                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Clerk Auth   │ ← Handles authentication
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  Middleware   │ ← Validates JWT token
              └───────┬───────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  Has Appwrite Profile?  │
        └─────┬──────────────┬────┘
              │ NO           │ YES
              ▼              ▼
    ┌──────────────┐  ┌──────────────────┐
    │ /onboarding  │  │ Role-based       │
    │ Create       │  │ Dashboard        │
    │ Profile      │  │ Redirect         │
    └──────────────┘  └──────────────────┘
\`\`\`

### Role Assignment Logic

\`\`\`typescript
// File: lib/auth/actions.ts

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  additionalData?: {
    clinicId?: string
    branchId?: string
    specialization?: string
    professionalRegNumber?: string
  }
) {
  // Validate Clerk authentication
  const { userId } = await auth()
  if (!userId) throw new AuthenticationError()

  // Role-specific logic
  if (role === "clinic_admin") {
    // Create new clinic for admin
    const clinic = await clinicRepo.create({...})
    clinicId = clinic.id
  } else if (role === "super_admin") {
    // Super admin: no clinic association
    clinicId = null
  } else if (!additionalData?.clinicId) {
    // Other roles: require clinic_id (from invitation)
    throw new ValidationError("Clinic assignment required")
  }

  // Create user profile in Appwrite
  await userRepo.create({
    clerk_user_id: userId,
    email,
    full_name: fullName,
    role,
    clinic_id: clinicId,
    // Role-specific fields
    ...(role === "doctor" || role === "nurse" ? {
      specialization: additionalData?.specialization,
      professional_registration_number: additionalData?.professionalRegNumber
    } : {})
  })
}
\`\`\`

### Permission Check Example

\`\`\`typescript
// File: components/auth/role-gate.tsx

export async function RoleGate({ allowedRoles, children }) {
  const user = await getCurrentUser()
  
  if (!user) redirect("/auth/sign-in")
  if (!allowedRoles.includes(user.role)) redirect("/unauthorized")
  
  return <>{children}</>
}

// Usage:
<RoleGate allowedRoles={["clinic_admin", "doctor"]}>
  <CertificatesPage />
</RoleGate>
\`\`\`

---

## Best Practices

### For Clinic Admins
1. **Use staff invitations** instead of manual user creation
2. Assign users to appropriate branches
3. Verify professional credentials before activating doctors/nurses
4. Regularly audit active users and their permissions

### For Developers
1. Always validate role in both middleware AND server actions
2. Never trust client-side role claims
3. Use the Repository pattern for all database operations
4. Log all role assignments and permission changes
5. Implement rate limiting on user creation endpoints

### Security Considerations
1. **Super Admin**: Should only be created via secure, audited process
2. **Clinic Admin**: Can only manage users within their clinic
3. **Staff Invitation**: Includes expiring tokens and email verification
4. **Role Changes**: Should be logged and potentially require approval
5. **Soft Deletes**: Set `is_active: false` instead of hard deleting users

---

## Environment Variables Required

\`\`\`bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Appwrite Database
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_USERS_COLLECTION_ID=users_collection_id
APPWRITE_CLINICS_COLLECTION_ID=clinics_collection_id
\`\`\`

---

## Troubleshooting

### User Can't Access Dashboard After Sign-Up
**Cause**: Profile not created in Appwrite  
**Solution**: Check onboarding completion, verify `signUp()` logs

### Staff Invitation Not Working
**Cause**: Invitation token expired or invalid  
**Solution**: Resend invitation, check email delivery

### Role Permissions Not Applying
**Cause**: User profile not synced or cached  
**Solution**: Clear cache, verify user profile in Appwrite

### Doctor Can't Issue Certificates
**Cause**: Missing professional registration number  
**Solution**: Update user profile with required credentials

---

## Summary

Each role has a specific creation path designed for its use case:

- **Clinic Admin**: Self-service sign-up, instant clinic creation
- **Doctor/Nurse**: Self-registration with professional details OR invitation
- **Receptionist**: Best via invitation from clinic admin
- **Employer**: Self-registration OR created by clinic admin
- **Super Admin**: Manual creation only, highly restricted

The system uses **Clerk for authentication** (sign-up, sign-in, email verification) and **Appwrite for authorization** (roles, permissions, clinic associations). This separation ensures secure, scalable, and maintainable user management.
