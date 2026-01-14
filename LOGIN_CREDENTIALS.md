# Demo Login Credentials

After setting up the database with the SQL scripts, you need to **create user accounts manually** through the application's signup page.

## Why Manual Creation?

User accounts in this system are created through **Supabase Auth**, which requires proper password hashing and authentication setup. You cannot insert users directly into the database via SQL.

## How to Create Demo Accounts

### Step 1: Run the SQL Scripts

First, ensure you've run all the database scripts in order:
1. `001_initial_schema.sql`
2. `002_row_level_security.sql`
3. `003_seed_data_v2.sql`
4. `004_billing_tables.sql`

### Step 2: Create User Accounts

Visit your application at `http://localhost:3000/auth/signup` and create these demo accounts:

---

## 1. Super Admin Account

**Purpose:** Manage all clinics in the system, view analytics, manage subscriptions

\`\`\`
Email: admin@medsurveillance.com
Password: Admin123!
\`\`\`

**After signup:**
- Go to your Supabase Dashboard
- Navigate to **Table Editor → users**
- Find this user and manually set:
  - `role` = `super_admin`
  - `clinic_id` = NULL (leave empty)

---

## 2. Clinic Admin Account

**Purpose:** Manage clinic operations, staff, patients, and appointments

\`\`\`
Email: admin@democlinic.com
Password: Clinic123!
\`\`\`

**After signup:**
- Go to Supabase Dashboard → **Table Editor → users**
- Find this user and set:
  - `role` = `clinic_admin`
  - `clinic_id` = `00000000-0000-0000-0000-000000000001` (Demo Clinic)

---

## 3. Doctor Account

**Purpose:** Review test results, issue certificates, manage patient care

\`\`\`
Email: doctor@democlinic.com
Password: Doctor123!
\`\`\`

**After signup:**
- Set `role` = `doctor`
- Set `clinic_id` = `00000000-0000-0000-0000-000000000001`

---

## 4. Nurse Account

**Purpose:** Record vitals, conduct clinical tests, manage workflows

\`\`\`
Email: nurse@democlinic.com
Password: Nurse123!
\`\`\`

**After signup:**
- Set `role` = `nurse`
- Set `clinic_id` = `00000000-0000-0000-0000-000000000001`

---

## 5. Receptionist Account

**Purpose:** Register patients, schedule appointments, manage check-ins

\`\`\`
Email: receptionist@democlinic.com
Password: Reception123!
\`\`\`

**After signup:**
- Set `role` = `receptionist`
- Set `clinic_id` = `00000000-0000-0000-0000-000000000001`

---

## 6. Employer Account

**Purpose:** View employee health status, download certificates

\`\`\`
Email: employer@company.com
Password: Employer123!
\`\`\`

**After signup:**
- Set `role` = `employer`
- Set `clinic_id` = NULL
- Create an employer record in the `employers` table linking to this user

---

## Quick Setup Guide

### Via Supabase Dashboard:

1. **Create each account:**
   - Visit `http://localhost:3000/auth/signup`
   - Enter the email and password
   - Confirm email (check Supabase Auth logs)

2. **Update user roles:**
   - Go to Supabase Dashboard
   - Click **Table Editor → users**
   - Find the user by email
   - Click **Edit**
   - Set the `role` field
   - Set the `clinic_id` field (use `00000000-0000-0000-0000-000000000001` for Demo Clinic staff)
   - Click **Save**

3. **Test login:**
   - Visit `http://localhost:3000/auth/login`
   - Use the credentials above
   - You should be redirected to the appropriate portal

---

## Portal Access by Role

| Role | Portal URL | Access Level |
|------|-----------|--------------|
| Super Admin | `/super-admin` | System-wide management |
| Clinic Admin | `/clinic` | Full clinic operations |
| Doctor | `/clinic` | Patients, tests, certificates |
| Nurse | `/clinic` | Patients, tests, vitals |
| Receptionist | `/clinic` | Appointments, check-ins |
| Employer | `/employer` | Read-only employee health |

---

## Security Notes

- These are **demo credentials** for development/testing only
- **Never use these in production**
- Change all passwords before deploying to production
- Enable email confirmation in Supabase for production
- Set up proper role assignment workflow for production

---

## Troubleshooting

### Can't log in after creating account?

1. Check Supabase Auth logs to ensure account was created
2. Verify email was confirmed (or disable email confirmation in Supabase settings for dev)
3. Check that the `role` and `clinic_id` fields are set correctly in the `users` table

### Getting "Unauthorized" errors?

1. Verify the user's `role` matches their intended access level
2. Check that `clinic_id` is set for clinic staff
3. Ensure RLS policies are enabled (run `002_row_level_security.sql` again)

### User created but role is NULL?

1. Manually update the role in Supabase Dashboard
2. The default role is set by the database trigger, but you can override it

---

## What's Next?

After creating these demo accounts:

1. **Test each role:** Log in with different accounts to see different portals
2. **Add data:** Create patients, schedule appointments, record tests
3. **Test workflows:** Follow a patient through the complete journey
4. **Test billing:** Add branches and test Paystack integration

For production deployment, see `SETUP.md` for complete instructions.
