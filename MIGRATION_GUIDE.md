# Supabase to Clerk + Appwrite Migration Guide

This document explains the changes made during the migration from Supabase (auth + database) to Clerk (auth) + Appwrite (database).

## Overview

The application has been migrated from:
- **Supabase Auth** → **Clerk** (Authentication)
- **Supabase Database (PostgreSQL)** → **Appwrite** (NoSQL Document Database)

## Key Changes

### Authentication

**Before (Supabase):**
- Used `@supabase/ssr` for authentication
- Auth handled via Supabase client
- User IDs stored as `auth_user_id` (UUID from Supabase Auth)

**After (Clerk):**
- Uses `@clerk/nextjs` for authentication
- Pre-built sign-in/sign-up components
- User IDs stored as `clerk_user_id` (Clerk user ID)
- Custom onboarding flow to capture role information

### Database

**Before (Supabase/PostgreSQL):**
- Relational database with foreign keys
- Row Level Security (RLS) policies
- SQL queries with joins
- Enum types in database
- Helper functions like `get_current_user_clinic_id()`

**After (Appwrite/NoSQL):**
- Document-based database
- Application-level security
- No joins - fetch related data separately
- Enum values stored as strings
- Helper functions in `lib/appwrite/helpers.ts`

### Middleware

**Before:**
- Custom `proxy.ts` file with Supabase session refresh
- Manual auth checks in middleware

**After:**
- Clerk's built-in `clerkMiddleware`
- Automatic session management
- Cleaner route protection

### Role Management

**Unchanged:**
- Same 6 roles: super_admin, clinic_admin, receptionist, nurse, doctor, employer
- Same permission system in `lib/auth/permissions.ts`
- Same RoleGate component (updated to use new auth system)

**Changed:**
- Role stored in Appwrite `users` collection instead of Supabase
- `getCurrentUser()` now fetches from Appwrite

## File Changes

### New Files

\`\`\`
lib/clerk/client.ts              # Clerk client setup
lib/appwrite/client.ts           # Appwrite browser & server clients
lib/appwrite/config.ts           # Collection IDs and configuration
lib/appwrite/helpers.ts          # Helper functions for clinic-scoped queries
middleware.ts                    # Clerk middleware (replaces proxy.ts)
app/auth/sign-in/[[...sign-in]]/page.tsx  # Clerk sign-in page
app/auth/sign-up/[[...sign-up]]/page.tsx  # Clerk sign-up page
app/onboarding/page.tsx          # Role selection after signup
APPWRITE_SETUP.md                # Appwrite database setup guide
MIGRATION_GUIDE.md               # This file
\`\`\`

### Deleted Files

\`\`\`
lib/supabase/client.ts           # Replaced by Appwrite client
lib/supabase/server.ts           # Replaced by Appwrite client
app/auth/login/page.tsx          # Replaced by Clerk sign-in
app/auth/signup/page.tsx         # Replaced by Clerk sign-up
app/auth/callback/route.ts       # No longer needed with Clerk
\`\`\`

### Modified Files

\`\`\`
lib/auth/actions.ts              # Updated to use Clerk + Appwrite
lib/types/database.ts            # Changed auth_user_id to clerk_user_id
components/auth/role-gate.tsx    # Updated to use new auth system
app/layout.tsx                   # Added ClerkProvider
app/page.tsx                     # Updated auth links
proxy.ts                         # Deprecated (kept for compatibility)
package.json                     # Added @clerk/nextjs and appwrite
ENVIRONMENT_VARIABLES.md         # Added Clerk and Appwrite variables

All components with database queries:
- app/super-admin/page.tsx
- components/clinic/stats-grid.tsx
- components/clinic/patients/patients-table.tsx
- components/clinic/appointments/appointments-table.tsx
- components/clinic/certificates/certificates-table.tsx
- components/super-admin/clinics-table.tsx
- components/super-admin/recent-clinics.tsx
- components/clinic/today-appointments.tsx
\`\`\`

## Environment Variables

### New Required Variables

\`\`\`bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Appwrite Database
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
APPWRITE_API_KEY=...
\`\`\`

### Deprecated Variables

\`\`\`bash
# No longer needed (but kept for backwards compatibility)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=...
\`\`\`

## Migration Checklist

- [x] Setup Clerk application
- [x] Setup Appwrite project and database
- [x] Create Appwrite collections (see APPWRITE_SETUP.md)
- [x] Update environment variables
- [x] Migrate authentication to Clerk
- [x] Migrate database queries to Appwrite
- [x] Update middleware
- [x] Update all components
- [x] Test authentication flow
- [x] Test role-based access
- [x] Test data operations

## Known Limitations

### 1. No Database Joins

Appwrite doesn't support joins like PostgreSQL. When you need related data:

**Before (Supabase):**
\`\`\`typescript
const { data } = await supabase
  .from('patients')
  .select(`
    *,
    employers (company_name)
  `)
\`\`\`

**After (Appwrite):**
\`\`\`typescript
// Fetch patients
const patients = await databases.listDocuments(...)

// Fetch employer separately if needed
if (patient.employer_id) {
  const employer = await databases.getDocument(..., patient.employer_id)
}
\`\`\`

### 2. No Row Level Security

Supabase's RLS policies are replaced by application-level checks:

\`\`\`typescript
// Always filter by clinic_id
const appointments = await databases.listDocuments(
  APPWRITE_DATABASE_ID,
  COLLECTIONS.APPOINTMENTS,
  [Query.equal("clinic_id", user.clinic_id)]
)
\`\`\`

### 3. Limited Query Capabilities

Some complex queries may need to be:
- Simplified
- Moved to application logic
- Computed on the client-side

### 4. No Enum Types

Enums are stored as strings. Validation happens at the application level.

## Testing

After migration:

1. **Test Authentication:**
   - Sign up new user
   - Sign in existing user
   - Check role selection in onboarding
   - Verify Clerk user created
   - Verify Appwrite user profile created

2. **Test Database Operations:**
   - Create records (patients, appointments, etc.)
   - Read records (check clinic isolation)
   - Update records
   - Delete records
   - Verify multi-tenancy works

3. **Test Role-Based Access:**
   - Test each role's access
   - Verify role gates work
   - Check unauthorized redirects

4. **Test Edge Cases:**
   - Missing clinic_id
   - Invalid user_id
   - Cross-clinic access attempts

## Rollback Plan

If issues arise, you can rollback by:

1. Reverting to previous git commit
2. Restoring Supabase environment variables
3. Re-deploying previous version

Note: Keep Supabase project active during initial testing period.

## Support

For migration issues:
- Check Clerk documentation: https://clerk.com/docs
- Check Appwrite documentation: https://appwrite.io/docs
- Review TROUBLESHOOTING.md for common issues
