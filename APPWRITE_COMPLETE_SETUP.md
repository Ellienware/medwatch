# MedSurv - Complete Appwrite Setup Guide

This guide explains how to set up Appwrite authentication and database for the MedSurv medical surveillance SaaS application.

## Overview

MedSurv uses **Appwrite** for both authentication and database management. This unified approach provides:

- Single service for auth and database
- Built-in security with permissions
- Server-side rendering support
- Cost-effective solution
- POPIA compliance ready

## Architecture

\`\`\`
┌─────────────────────────────────────────────┐
│          MedSurv Application                │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌────────────────┐ │
│  │   Appwrite   │      │    Appwrite    │ │
│  │     Auth     │      │    Database    │ │
│  │              │      │                │ │
│  │ - Sign Up    │      │ - 12 Collections │
│  │ - Sign In    │      │ - Multi-tenant │ │
│  │ - Sessions   │      │ - RLS Security │ │
│  │ - Password   │      │ - Full-text    │ │
│  │   Recovery   │      │   Search       │ │
│  └──────────────┘      └────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
\`\`\`

## Prerequisites

1. Node.js 18+ installed
2. Appwrite Cloud account (or self-hosted Appwrite instance)
3. Basic understanding of Next.js and TypeScript

---

## Step 1: Create Appwrite Project

### 1.1 Sign Up for Appwrite Cloud

1. Go to [https://cloud.appwrite.io](https://cloud.appwrite.io)
2. Click "Sign Up" and create an account
3. Verify your email address

### 1.2 Create a New Project

1. Click "Create Project"
2. Name it: **MedSurv** (or your preferred name)
3. Copy the **Project ID** - you'll need this later

---

## Step 2: Configure Authentication

### 2.1 Enable Email/Password Authentication

1. In your Appwrite project, go to **Auth** → **Settings**
2. Enable **Email/Password** authentication method
3. Configure email settings:
   - Set "From Name" to your clinic name
   - Customize email templates (optional)

### 2.2 Configure Session Settings

1. Go to **Auth** → **Settings** → **Sessions**
2. Set session duration: **30 days** (recommended)
3. Enable **Session Alerts** for security notifications

### 2.3 Add Platform (Web App)

1. Go to **Settings** → **Platforms**
2. Click **Add Platform** → **Web**
3. Add your domains:
   - Development: `http://localhost:3000`
   - Production: `https://yourapp.com` (add when deploying)

---

## Step 3: Create Database and Collections

### 3.1 Generate API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: **Database Setup Key**
4. Scopes: Select **ALL** (we'll restrict later)
5. Expiration: Set to **Never** or 1 year
6. Copy the **API Key** - you'll only see this once!

### 3.2 Set Up Environment Variables

Create a `.env.local` file in your project root:

\`\`\`bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Database ID (will be generated on first run)
NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db

# Storage Bucket ID (single bucket for all files)
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
\`\`\`

**Replace:**
- `your_project_id_here` with your actual Project ID
- `your_api_key_here` with your API key from step 3.1

### 3.3 Run Database Setup Script

The project includes an automated setup script that creates all collections, attributes, and indexes.

\`\`\`bash
# Install dependencies first
npm install

# Run the setup script
npm run appwrite:setup
\`\`\`

The script will:
- Create the database
- Create 12 collections (clinics, users, patients, etc.)
- Add all required attributes
- Create indexes for performance
- Set up permissions

**Expected output:**
\`\`\`
🚀 Starting Appwrite Database Setup...

⏳ Creating database...
✅ Creating database - Success

⏳ Creating Clinics collection...
✅ Creating Clinics collection - Success

⏳ Adding name...
✅ Adding name - Success

... (continues for all collections)

✨ Database setup completed successfully!

📝 Add this to your .env file:
NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db
\`\`\`

---

## Step 4: Create Storage Bucket

### 4.1 Create Single Storage Bucket

Since your plan limits you to one storage bucket, we'll use a single bucket with file prefixes:

1. Go to **Storage** in your Appwrite console
2. Click **Create Bucket**
3. Name it: **medsurv_storage**
4. Copy the **Bucket ID**
5. Add it to your `.env.local`:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
\`\`\`

### 4.2 Configure Bucket Permissions

Set these permissions for the bucket:

- **Read**: `role:all` (files accessible with signed URLs)
- **Create**: `role:member` (authenticated users can upload)
- **Update**: `role:member` (users can update their uploads)
- **Delete**: `role:member` (users can delete their uploads)

### 4.3 File Organization Strategy

Files are organized using prefixes in the single bucket:

\`\`\`
medsurv_storage/
├── avatars/{user_id}/{filename}
├── certificates/{clinic_id}/{patient_id}/{filename}
├── test_results/{clinic_id}/{patient_id}/{filename}
└── clinic_logos/{clinic_id}/{filename}
\`\`\`

The application automatically handles file prefixes using the `STORAGE_BUCKETS` configuration in `lib/appwrite/config.ts`.

---

## Step 5: Database Schema

### Collections Overview

The database contains 12 collections:

1. **clinics** - Root tenant table (clinic information)
2. **branches** - Clinic locations/branches
3. **users** - All system users (staff and employer portal users)
4. **employers** - Companies sending employees for medical assessments
5. **patients** - Employee/worker records
6. **appointments** - Medical assessment appointments
7. **clinical_tests** - Test catalog (audiometry, spirometry, etc.)
8. **test_results** - Results from clinical tests
9. **certificates** - Medical fitness certificates (Annexure 3)
10. **invoices** - Billing and invoices
11. **notifications** - System notifications
12. **audit_logs** - POPIA compliance audit trail

### Multi-Tenancy

Every collection (except super_admin data) includes a `clinic_id` field for data isolation:

\`\`\`typescript
// Example query - always filter by clinic_id
const patients = await databases.listDocuments(
  DATABASE_ID,
  'patients',
  [Query.equal('clinic_id', userClinicId)]
)
\`\`\`

### User Roles

The system supports 6 user roles:

- `super_admin` - Full system access
- `clinic_admin` - Manages their clinic
- `receptionist` - Patient registration, appointments
- `nurse` - Vitals, tests
- `doctor` - Medical assessment, certificates
- `employer` - Portal access to employee health data

---

## Step 6: Authentication Flow

### How Authentication Works

\`\`\`
User visits /auth/sign-in
        ↓
Enters email & password
        ↓
Appwrite validates credentials
        ↓
Session created (30-day cookie)
        ↓
Redirect to /dashboard or /onboarding
        ↓
Middleware checks session on every request
\`\`\`

### Sign Up Process

1. User visits `/auth/sign-up`
2. Enters email, password, full name
3. Appwrite creates auth account
4. User record created in `users` collection
5. Email verification sent (optional)
6. Redirect to `/onboarding` for role selection

### Sign In Process

1. User visits `/auth/sign-in`
2. Enters email and password
3. Session created with `createEmailSession()`
4. User data fetched from `users` collection
5. Redirect based on role:
   - `super_admin` → `/super-admin/dashboard`
   - `clinic_admin`, `doctor`, `nurse`, `receptionist` → `/clinic/dashboard`
   - `employer` → `/employer/dashboard`

### Password Recovery

1. User clicks "Forgot Password" on sign-in page
2. Enters email address
3. Appwrite sends recovery email
4. User clicks link in email
5. Redirected to password reset page
6. Sets new password
7. Session created automatically

---

## Step 7: Security Best Practices

### Environment Variables

**Never commit these to Git:**
- `APPWRITE_API_KEY` - Server-side only, full permissions
- Store in `.env.local` (gitignored)
- Use different keys for development and production

**Safe to commit/expose:**
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID`

### Database Permissions

All collections use these permission rules:

\`\`\`javascript
[
  Permission.read(Role.any()),      // Anyone can read (filtered by clinic_id in code)
  Permission.create(Role.users()),  // Only authenticated users can create
  Permission.update(Role.users()),  // Only authenticated users can update
  Permission.delete(Role.users()),  // Only authenticated users can delete
]
\`\`\`

Fine-grained permissions are enforced at the application layer using role checks.

### POPIA Compliance

The system includes several features for POPIA compliance:

1. **Consent Management** - `consent_given` field in patients table
2. **Audit Logs** - All data access logged in `audit_logs` collection
3. **Data Retention** - `data_retention_days` field in clinics table (default: 7 years)
4. **Right to be Forgotten** - Soft delete with `is_active` flags

---

## Step 8: Testing the Setup

### 8.1 Start the Development Server

\`\`\`bash
npm run dev
\`\`\`

### 8.2 Create Your First User

1. Visit `http://localhost:3000/auth/sign-up`
2. Enter your details:
   - Email: `admin@yourclinic.com`
   - Password: Strong password
   - Full Name: Your name
3. Click "Sign Up"

### 8.3 Set User Role (First Time Only)

After signup, you need to set your role manually:

1. Go to Appwrite Console → **Databases** → **medsurv_db** → **users**
2. Find your user record
3. Edit the document
4. Set `role` to `super_admin`
5. Add a `clinic_id` (you'll create a clinic next)

### 8.4 Create Your First Clinic

1. Sign in with your super admin account
2. Go to **Super Admin** → **Clinics**
3. Click "Add Clinic"
4. Fill in clinic details
5. The clinic ID will be generated automatically

---

## Step 9: Deployment

### 9.1 Vercel Deployment

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### 9.2 Add Production Domain to Appwrite

1. Go to Appwrite Console → **Settings** → **Platforms**
2. Add your production domain: `https://yourapp.vercel.app`

### 9.3 Update Environment Variables

In production, add:
\`\`\`bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
APPWRITE_API_KEY=your_production_api_key
\`\`\`

---

## Troubleshooting

### Issue: "Project not found" error

**Solution:** Check that your `NEXT_PUBLIC_APPWRITE_PROJECT_ID` matches your Appwrite project ID.

### Issue: "Unauthorized" errors

**Solution:** 
1. Ensure user is signed in
2. Check session cookie is being set
3. Verify middleware is running

### Issue: "Collection not found"

**Solution:** Run `npm run appwrite:setup` to create collections.

### Issue: File upload fails

**Solution:**
1. Check storage bucket ID is correct
2. Verify bucket permissions allow `role:member` to create
3. Ensure file size is under limit (default: 50MB)

### Issue: Can't sign in after deployment

**Solution:** Add your production domain to Appwrite platforms.

---

## Next Steps

1. **Customize Email Templates** - Go to Appwrite Auth settings
2. **Set Up Monitoring** - Enable Appwrite Analytics
3. **Configure Backups** - Set up automated database backups
4. **Add Custom Domain** - Configure your own domain for Appwrite (Pro plan)
5. **Enable Two-Factor Auth** - Add MFA for sensitive roles

---

## Support

- Appwrite Documentation: https://appwrite.io/docs
- MedSurv Issues: [Your GitHub repo]
- Email: support@yourapp.com

---

## Summary

You've successfully set up Appwrite for MedSurv with:

✅ Authentication (email/password)
✅ Database with 12 collections
✅ Multi-tenant architecture
✅ Single storage bucket with prefixes
✅ Role-based access control
✅ POPIA compliance features

Your application is now ready for development and testing!
