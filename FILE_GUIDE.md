# MedSurv - File Guide

## Project Structure Overview

\`\`\`
medical-surveillance-saas/
├── app/                          # Next.js App Router pages and layouts
│   ├── auth/                     # Authentication pages
│   ├── clinic/                   # Clinic Admin Portal
│   ├── employer/                 # Employer Portal
│   ├── super-admin/              # Super Admin Portal
│   ├── dashboard/                # General dashboard redirect
│   ├── layout.tsx                # Root layout with fonts
│   ├── page.tsx                  # Landing/home page
│   └── globals.css               # Global styles and design tokens
│
├── components/                   # React components organized by feature
│   ├── auth/                     # Authentication components
│   ├── clinic/                   # Clinic portal components
│   ├── employer/                 # Employer portal components
│   ├── super-admin/              # Super admin components
│   └── ui/                       # Reusable UI components (shadcn/ui)
│
├── lib/                          # Utility functions and configurations
│   ├── auth/                     # Auth helpers and permissions
│   ├── supabase/                 # Supabase client configuration
│   └── types/                    # TypeScript type definitions
│
├── scripts/                      # Database SQL scripts
│   ├── 001_initial_schema.sql    # Core database tables
│   ├── 002_row_level_security.sql # RLS policies for multi-tenancy
│   └── 003_seed_data.sql         # Initial test data
│
├── proxy.ts                      # Middleware for auth (Next.js 16)
└── next.config.mjs               # Next.js configuration
\`\`\`

---

## Core Files Explained

### Root Configuration Files

- **`proxy.ts`** - Authentication middleware that protects routes and refreshes Supabase sessions
- **`next.config.mjs`** - Next.js configuration (caching, experimental features)
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`.env.local`** - Environment variables (you create this - see setup guide)

### App Directory (Routes)

#### `/app/layout.tsx`
- Root layout with Google Fonts (Geist, Geist Mono)
- Wraps entire application
- Sets up HTML structure

#### `/app/page.tsx`
- Landing page (redirects to login or dashboard)
- Entry point for the application

#### `/app/globals.css`
- Tailwind CSS v4 configuration
- Design tokens (colors, fonts, spacing, radius)
- Professional medical theme with teal primary color

---

## Authentication Flow

### `/app/auth/`
- **`login/page.tsx`** - Login page
- **`signup/page.tsx`** - Registration page (clinic admins only)
- **`forgot-password/page.tsx`** - Password reset page
- **`callback/route.ts`** - OAuth callback handler (handles email confirmation)

### `/components/auth/`
- **`login-form.tsx`** - Login form with email/password
- **`signup-form.tsx`** - Clinic registration form
- **`forgot-password-form.tsx`** - Password reset form
- **`role-gate.tsx`** - Component for role-based access control
- **`protected-route.tsx`** - HOC for protecting pages

### `/lib/auth/`
- **`actions.ts`** - Server actions for login, signup, logout
- **`permissions.ts`** - Permission definitions for each role

---

## Super Admin Portal

### `/app/super-admin/`
- **`layout.tsx`** - Super admin layout with sidebar
- **`page.tsx`** - Dashboard with system-wide statistics
- **`clinics/page.tsx`** - Manage all clinics

### `/components/super-admin/`
- **`sidebar.tsx`** - Navigation sidebar
- **`stats-card.tsx`** - Statistic display cards
- **`recent-clinics.tsx`** - Recently added clinics list
- **`system-health.tsx`** - System health monitoring
- **`clinics-table.tsx`** - Table of all clinics with actions

**Key Features:**
- View all clinics in the system
- Monitor system health and performance
- Manage subscriptions and billing
- User management across all clinics

---

## Clinic Admin Portal

### `/app/clinic/`
- **`layout.tsx`** - Clinic layout with responsive sidebar
- **`page.tsx`** - Clinic dashboard with today's stats
- **`patients/`** - Patient management pages
- **`appointments/`** - Appointment scheduling pages
- **`tests/`** - Clinical test recording pages
- **`certificates/`** - Certificate management pages

### `/components/clinic/`

#### Navigation Components
- **`sidebar.tsx`** - Main navigation sidebar (desktop)
- **`mobile-sidebar.tsx`** - Mobile hamburger navigation
- **`header.tsx`** - Top header with search and notifications
- **`user-menu.tsx`** - User dropdown menu

#### Dashboard Components
- **`stats-grid.tsx`** - Statistics cards for dashboard
- **`quick-actions.tsx`** - Quick action buttons
- **`today-appointments.tsx`** - Today's appointment list
- **`recent-activity.tsx`** - Recent activity feed

#### Patient Management (`/patients/`)
- **`patients-table.tsx`** - Searchable patient table
- **`new-patient-form.tsx`** - Comprehensive patient registration form
  - Personal information
  - Medical history
  - Employment details
  - Emergency contacts

#### Appointment Management (`/appointments/`)
- **`appointments-table.tsx`** - Appointment list with status filters
- **`appointment-filters.tsx`** - Filter by date, status, type
- **`new-appointment-form.tsx`** - Schedule appointments with date/time picker

#### Clinical Tests (`/tests/`)
- **`tests-overview.tsx`** - Test categories grid (Audiometry, Spirometry, Vision, X-Ray, etc.)
- **`record-test-form.tsx`** - Dynamic test recording form
  - Changes fields based on test type
  - Supports: Audiometry (Hz frequencies), Spirometry (FEV1, FVC), Vision (Snellen chart), X-Ray (findings), Blood Pressure, Drug Screening

#### Certificates (`/certificates/`)
- **`certificates-table.tsx`** - Issued certificates list
- **`issue-certificate-form.tsx`** - Generate fit-to-work certificates
  - Fitness status: Fit, Fit with restrictions, Unfit
  - Validity period
  - Restrictions/recommendations
  - Doctor signature

---

## Employer Portal

### `/app/employer/`
- **`layout.tsx`** - Employer layout with sidebar
- **`page.tsx`** - Employer dashboard (workforce health overview)
- **`employees/page.tsx`** - List of all employees
- **`certificates/page.tsx`** - All certificates for employees

### `/components/employer/`
- **`employer-sidebar.tsx`** - Employer navigation
- **`employer-header.tsx`** - Header with company info
- **`employer-stats.tsx`** - Workforce health statistics
- **`employee-health-status.tsx`** - Health status breakdown chart
- **`recent-certificates.tsx`** - Recent certificates with download
- **`employees-table.tsx`** - Employee list with health status
- **`employer-certificates-table.tsx`** - Certificate list with filtering

**Key Features:**
- View all employees and their health status
- Download certificates (Fit-to-Work, Medical Reports)
- Track compliance (employees due for medical exams)
- Monitor workforce health trends

---

## Database Schema (`/scripts/`)

### `001_initial_schema.sql`

**Core Tables:**

1. **`clinics`** - Multi-tenant clinic information
   - name, registration_number, address, contact_info
   - subscription_tier, status (active/suspended/trial)
   - billing_cycle, usage_limits

2. **`clinic_branches`** - Multiple locations per clinic
   - clinic_id (foreign key)
   - branch_name, address, contact_info

3. **`users`** - All system users (staff and employers)
   - clinic_id (null for super admins)
   - role (super_admin, clinic_admin, receptionist, nurse, doctor, employer)
   - email, full_name, phone_number

4. **`employers`** - Companies that send employees for medical exams
   - clinic_id (which clinic manages them)
   - company_name, registration_number, industry
   - contact_person, billing_info

5. **`patients`** - Individuals receiving medical exams
   - clinic_id, employer_id (which company they work for)
   - Personal info: first_name, last_name, id_number, dob, gender
   - Medical history: pre_existing_conditions, allergies, medications, past_surgeries
   - Employment: job_title, department, employment_start_date, risk_category
   - Emergency contact: name, relationship, phone

6. **`appointments`** - Scheduled medical examinations
   - clinic_id, branch_id, patient_id
   - appointment_date, appointment_time
   - appointment_type (pre-employment, annual, exit, periodic, incident)
   - status (scheduled, checked_in, in_progress, completed, cancelled, no_show)
   - workflow tracking: checked_in_at, nurse_assessment_at, tests_completed_at, doctor_review_at

7. **`clinical_tests`** - Test type definitions (seeded)
   - test_name (Audiometry, Spirometry, Vision Test, etc.)
   - test_category (hearing, respiratory, vision, etc.)
   - description, requirements

8. **`test_results`** - Actual test results for patients
   - appointment_id, patient_id, clinical_test_id
   - test_date, conducted_by (user_id of nurse/doctor)
   - result_data (JSONB - flexible for different test types)
   - result_summary, interpretation
   - attachments (file URLs for X-rays, reports)

9. **`certificates`** - Fit-to-Work certificates issued
   - patient_id, appointment_id, issued_by (doctor)
   - certificate_number, certificate_type
   - fitness_status (fit, fit_with_restrictions, unfit)
   - validity_period (start/end dates)
   - restrictions, recommendations
   - file_url (PDF storage)

10. **`notifications`** - System notifications
    - user_id, notification_type, title, message
    - read status, delivery status
    - scheduled_for (future notifications)

11. **`billing_invoices`** - Clinic subscription billing
    - clinic_id, invoice_number
    - billing_period, amount_due, payment_status
    - due_date, paid_date

12. **`audit_logs`** - POPIA compliance logging
    - user_id, action, table_name, record_id
    - old_data, new_data (JSONB)
    - ip_address, user_agent
    - created_at (auto-timestamp)

### `002_row_level_security.sql`

**Multi-Tenant Data Isolation:**
- RLS policies ensure users only see data from their own clinic
- Super admins can see all data
- Employers only see their own employees
- Policies on every table with clinic_id

**Key Functions:**
- `get_user_clinic_id()` - Returns current user's clinic
- `is_super_admin()` - Checks if user is super admin
- `is_employer_user()` - Checks if user is employer

### `003_seed_data.sql`

**Pre-populated Data:**
- Clinical test definitions (10 common tests)
- Sample super admin user
- Sample clinic and users for testing

---

## Library Files (`/lib/`)

### `/lib/supabase/`

#### `client.ts`
- Creates browser-side Supabase client
- Uses cookies for session management
- Singleton pattern to prevent multiple instances

\`\`\`typescript
const supabase = createBrowserClient()
\`\`\`

#### `server.ts`
- Creates server-side Supabase client
- For use in Server Components and API routes
- Handles cookie reading/writing

\`\`\`typescript
const supabase = await createServerClient()
\`\`\`

### `/lib/types/database.ts`

**TypeScript Interfaces:**
- `Database` - Complete database schema types
- `Clinic`, `User`, `Patient`, `Appointment` - Table row types
- `UserRole` - Role enum type
- `AppointmentStatus`, `FitnessStatus` - Status enum types

**Usage:**
\`\`\`typescript
import { Patient, Appointment } from '@/lib/types/database'
\`\`\`

---

## UI Components (`/components/ui/`)

**shadcn/ui Components** (pre-installed):
- `button.tsx` - Button variants (default, outline, ghost, destructive)
- `card.tsx` - Card container with header/content/footer
- `input.tsx` - Form input field
- `label.tsx` - Form label
- `select.tsx` - Dropdown select
- `textarea.tsx` - Multi-line text input
- `badge.tsx` - Status badges
- `avatar.tsx` - User avatar
- `dropdown-menu.tsx` - Dropdown menus
- `dialog.tsx` - Modal dialogs
- `table.tsx` - Data tables
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Notification toasts
- `calendar.tsx` - Date picker
- `skeleton.tsx` - Loading skeletons

**Usage:**
\`\`\`typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
\`\`\`

---

## Development Workflow

### Adding New Features

1. **Database Changes**
   - Create new SQL migration in `/scripts/` (e.g., `004_new_feature.sql`)
   - Run in Supabase SQL Editor
   - Update RLS policies if needed

2. **Type Definitions**
   - Add new types to `/lib/types/database.ts`

3. **API/Server Actions**
   - Create server actions in relevant feature folder
   - Use `createServerClient()` for database queries

4. **UI Components**
   - Create components in `/components/[feature]/`
   - Use shadcn/ui base components
   - Follow mobile-first responsive design

5. **Pages/Routes**
   - Add pages in `/app/[portal]/[feature]/`
   - Use Server Components by default
   - Add loading states (`loading.tsx`)

### Role-Based Access

**Protecting Routes:**
\`\`\`tsx
import { RoleGate } from '@/components/auth/role-gate'

<RoleGate allowedRoles={['clinic_admin', 'receptionist']}>
  <AdminContent />
</RoleGate>
\`\`\`

**Checking Permissions:**
\`\`\`typescript
import { hasPermission } from '@/lib/auth/permissions'

if (hasPermission(userRole, 'patients', 'create')) {
  // Show create button
}
\`\`\`

### Mobile Optimization

**All components use:**
- Mobile-first Tailwind breakpoints (`md:`, `lg:`)
- Responsive sidebar with hamburger menu
- Touch-friendly button sizes (min `h-11`)
- Horizontal scrolling tables on mobile
- Stacked forms on mobile, grid on desktop

**Test on mobile:**
- Chrome DevTools responsive mode
- Real device testing recommended

---

## Common Tasks

### Create a New Patient
1. Navigate to `/clinic/patients/new`
2. Fill in personal, medical, employment info
3. System creates patient record in database
4. Patient appears in patients table

### Schedule an Appointment
1. Navigate to `/clinic/appointments/new`
2. Select patient (or create new)
3. Choose appointment type and date/time
4. System creates appointment with status "scheduled"

### Record Test Results
1. Navigate to `/clinic/tests/new`
2. Select appointment and test type
3. Form dynamically shows relevant fields
4. Save results (stored as JSONB in `test_results`)

### Issue Certificate
1. Navigate to `/clinic/certificates/new`
2. Select appointment with completed tests
3. Set fitness status and restrictions
4. Doctor reviews and issues
5. PDF generated and stored

### Employer Views Employees
1. Employer logs in at `/auth/login`
2. Dashboard shows workforce health overview
3. Navigate to `/employer/employees`
4. View health status, download certificates

---

## Key Design Patterns

### Multi-Tenancy
- Every table has `clinic_id` column
- RLS policies filter by current user's clinic
- Super admins bypass RLS with `is_super_admin()` function

### Role Hierarchy
\`\`\`
Super Admin (system-wide access)
├── Clinic Admin (clinic management)
    ├── Receptionist (appointments, patients)
    ├── Nurse (assessments, tests)
    └── Doctor (results, certificates)
Employer (read-only for their employees)
\`\`\`

### Data Flow
1. **Reception** - Books appointment, registers patient
2. **Nurse** - Checks in patient, conducts tests
3. **Doctor** - Reviews results, issues certificate
4. **Employer** - Views certificate, downloads report

### File Storage
- Use Supabase Storage for:
  - X-ray images
  - Test result PDFs
  - Certificate PDFs
  - Profile pictures
- Files referenced by URL in database

---

## Environment Variables Needed

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Email Service (future)
# SMTP_HOST=smtp.example.com
# SMTP_USER=your_email
# SMTP_PASS=your_password

# Optional: SMS Service (future)
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token

# Optional: Paystack (future)
# PAYSTACK_SECRET_KEY=your_secret_key
# PAYSTACK_PUBLIC_KEY=your_public_key
\`\`\`

---

## Troubleshooting

### Common Issues

**1. "User not found" after login**
- Check if user exists in `users` table
- Verify `auth.users.id` matches `public.users.auth_id`

**2. RLS policies blocking queries**
- Check `get_user_clinic_id()` returns correct clinic
- Verify user has `clinic_id` set (except super admins)
- Test in Supabase SQL Editor with: `SELECT get_user_clinic_id();`

**3. Types not matching database**
- Re-generate types from Supabase CLI:
  \`\`\`bash
  npx supabase gen types typescript --project-id your-project-id > lib/types/database.ts
  \`\`\`

**4. Middleware redirect loop**
- Check `proxy.ts` public routes list
- Ensure `/auth/*` routes are not protected

**5. Mobile layout broken**
- Verify Tailwind breakpoints (`md:`, `lg:`)
- Check `use-mobile.tsx` hook is working
- Test in responsive mode

---

## Next Steps

### Features to Implement

1. **Paystack Integration** - Subscription billing
2. **Email Notifications** - Appointment reminders
3. **SMS/WhatsApp** - Test result notifications
4. **PDF Generation** - Certificate templates
5. **Reporting** - Analytics and compliance reports
6. **File Upload** - X-ray images, documents
7. **Calendar View** - Visual appointment scheduler
8. **Bulk Import** - Import patients from CSV
9. **Audit Trail UI** - View all data changes
10. **Mobile App** - React Native version

### Performance Optimization

- Implement SWR for data caching
- Add pagination to large tables
- Lazy load components
- Optimize images with Next.js Image
- Add database indexes for common queries

---

## Resources

- **Next.js Docs** - https://nextjs.org/docs
- **Supabase Docs** - https://supabase.com/docs
- **Tailwind CSS** - https://tailwindcss.com/docs
- **shadcn/ui** - https://ui.shadcn.com
- **TypeScript** - https://www.typescriptlang.org/docs

---

## Support

For questions or issues:
1. Check this file guide first
2. Review Supabase logs for errors
3. Check browser console for client errors
4. Review database RLS policies
5. Test queries in Supabase SQL Editor

**Happy coding! 🚀**
