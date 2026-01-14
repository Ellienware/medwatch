# MedSurv - Complete Setup Guide for VS Code

This guide will walk you through setting up and running the Medical Surveillance SaaS application on your local development environment using VS Code.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Appwrite Setup](#appwrite-setup)
4. [Project Installation](#project-installation)
5. [Running the Application](#running-the-application)
6. [Creating the First Super Admin](#creating-the-first-super-admin)
7. [Testing the Application](#testing-the-application)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v18.0.0 or higher)
  - Download: https://nodejs.org/
  - Verify installation: `node --version`
  
- **npm** (v9.0.0 or higher) or **pnpm** (recommended)
  - Comes with Node.js
  - Verify: `npm --version`
  - Install pnpm: `npm install -g pnpm`

- **Git**
  - Download: https://git-scm.com/
  - Verify: `git --version`

- **VS Code**
  - Download: https://code.visualstudio.com/

### Recommended VS Code Extensions
Install these extensions in VS Code for the best development experience:
- **ESLint** - Microsoft
- **Prettier - Code formatter** - Prettier
- **Tailwind CSS IntelliSense** - Tailwind Labs
- **TypeScript Vue Plugin (Volar)** - Vue
- **Error Lens** - Alexander
- **Auto Rename Tag** - Jun Han
- **Path Intellisense** - Christian Kohler

---

## Environment Setup

### 1. Create Appwrite Account
1. Go to https://cloud.appwrite.io/
2. Sign up for a free account
3. Create a new project named "MedSurv" or any name you prefer
4. Note down your **Project ID** (you'll need this later)

### 2. Generate Appwrite API Key
1. In your Appwrite project dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it "Server Key" or similar
4. Grant the following scopes:
   - `databases.*` (all database permissions)
   - `collections.*` (all collection permissions)
   - `documents.*` (all document permissions)
   - `files.*` (all file permissions)
   - `buckets.*` (all bucket permissions)
   - `users.*` (all user permissions)
5. Copy the generated API key (you won't be able to see it again)

### 3. Get Additional Service Keys

#### Resend (Email Service)
1. Go to https://resend.com/
2. Sign up for a free account
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key

#### Paystack (Payment Processing) - Optional
1. Go to https://paystack.com/
2. Sign up for an account
3. Navigate to **Settings** → **API Keys & Webhooks**
4. Copy your **Public Key** and **Secret Key**
5. Start in test mode

#### Generate Encryption Key
Run this command in your terminal:
```bash
openssl rand -base64 32
```
Copy the output - this is your encryption key for PHI data.

---

## Appwrite Setup

### 1. Clone the Repository
```bash
# Clone your project
git clone <your-repository-url>
cd medicalsurveillancesaas1

# Open in VS Code
code .
```

### 2. Install Dependencies
Open the integrated terminal in VS Code (`Ctrl + ` ` or `View → Terminal`):

```bash
# Using npm
npm install

# OR using pnpm (faster)
pnpm install
```

### 3. Configure Environment Variables
1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` in VS Code and fill in all values:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your_project_id_from_appwrite>
APPWRITE_API_KEY=<your_api_key_from_appwrite>
NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL_KEY=<your_paystack_public_key>
PAYSTACK_SECRET_KEY=<your_paystack_secret_key>

# Encryption=http://localhost:3000

# Email Configuration
RESEND_API_KEY=<your_resend_api_key>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Medical Surveillance
SUPPORT_EMAIL=support@yourdomain.com

# Payment Provider (Optional for now)
NEXT_PUBLIC_PAYSTACK_PUBLIC
ENCRYPTION_KEY=<your_generated_encryption_key>

# Node Environment
NODE_ENV=development
```

### 4. Run the Appwrite Setup Script
This script will create all necessary collections, attributes, and indexes in your Appwrite database:

```bash
# Using npm
npm run setup:appwrite

# OR using pnpm
pnpm setup:appwrite

# OR using ts-node directly
npx ts-node scripts/appwrite-setup.ts
```

**Expected Output:**
```
✓ Creating database
✓ Creating Clinics collection
✓ Creating Branches collection
✓ Creating Users collection
... (all collections)
✓ Database setup complete!
```

**Note:** If you see "already exists" errors, that's normal if you're running the script again. The script handles this gracefully.

---

## Project Installation

### 1. Verify Installation
Check that all dependencies are installed correctly:

```bash
npm list --depth=0
```

You should see all packages listed without errors.

### 2. TypeScript Check
Verify TypeScript compilation:

```bash
npx tsc --noEmit
```

If there are no errors, you're good to go!

---

## Running the Application

### 1. Start Development Server
In VS Code terminal:

```bash
# Using npm
npm run dev

# OR using pnpm
pnpm dev
```

### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

You should see the MedSurv landing page.

### 3. Development Tips

**Hot Reload**
- The application automatically reloads when you save files
- If changes don't appear, try refreshing the browser

**View Console Logs**
- Open browser DevTools (F12)
- Check the Console tab for any errors

**VS Code Debugging**
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

---

## Creating the First Super Admin

Since this is a multi-tenant system, you need to create the first super admin user manually.

### Method 1: Using Appwrite Console (Recommended)

1. **Go to Appwrite Console**
   - Navigate to your project at https://cloud.appwrite.io/

2. **Create Auth User**
   - Go to **Auth** → **Users**
   - Click **Create User**
   - Fill in:
     - Email: `admin@medsurv.com`
     - Password: `SecurePassword123!`
     - Name: `Super Admin`
   - Click **Create**
   - **Copy the User ID** that's generated

3. **Create User Document**
   - Go to **Databases** → **MedSurv DB** → **users** collection
   - Click **Add Document**
   - Fill in the following fields:
     ```json
     {
       "auth_user_id": "<paste_the_user_id_from_step_2>",
       "email": "admin@medsurv.com",
       "full_name": "Super Admin",
       "role": "super_admin",
       "is_active": true,
       "permissions": {},
       "clinic_id": null,
       "branch_id": null,
       "phone": null,
       "professional_registration_number": null,
       "specialization": null,
       "avatar_url": null,
       "last_login": null
     }
     ```
   - Click **Create**

4. **Login to Application**
   - Go to http://localhost:3000/auth/sign-in
   - Email: `admin@medsurv.com`
   - Password: `SecurePassword123!`
   - You should be redirected to the Super Admin dashboard

### Method 2: Using Seed Script (Alternative)

You can also run the seed script (if available):
```bash
npm run seed:super-admin
```

---

## Testing the Application

### 1. Super Admin Functions
After logging in as super admin, test these features:
- **Dashboard**: View overview of all clinics
- **Clinics**: Create a new clinic
  - Name: "Test Clinic"
  - Email: "test@clinic.com"
  - Plan: "Professional"
- **Verify**: Check that the clinic appears in the list

### 2. Create Clinic Admin
1. Go to **Clinics** → Select your test clinic
2. Create a new user:
   - Email: `clinicadmin@test.com`
   - Full Name: `Clinic Administrator`
   - Role: `clinic_admin`
3. The system will send them an invitation email (if Resend is configured)

### 3. Test Clinic Features
1. Logout and login as clinic admin
2. Test these features:
   - **Dashboard**: View clinic overview
   - **Patients**: Add a new patient
   - **Appointments**: Schedule an appointment
   - **Staff**: Create receptionist/nurse/doctor users
   - **Reports**: Generate reports
   - **Settings**: Update clinic settings

### 4. Test Different User Roles

**Receptionist:**
- Can schedule appointments
- Can check in patients
- Cannot access billing

**Nurse:**
- Can view appointments
- Can add test results
- Cannot issue certificates

**Doctor:**
- Can review test results
- Can issue certificates
- Has full clinical access

### 5. Test Employer Portal
1. Create an employer in the clinic portal
2. Note the portal credentials
3. Login at `/employer` route
4. Verify they can see their employees' certificates

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Cannot connect to Appwrite"
**Solution:**
- Check your internet connection
- Verify `NEXT_PUBLIC_APPWRITE_ENDPOINT` is correct
- Verify `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is correct
- Check Appwrite status at https://status.appwrite.io/

#### Issue: "API Key invalid"
**Solution:**
- Regenerate your API key in Appwrite Console
- Ensure all required scopes are granted
- Update `.env.local` with the new key
- Restart the development server

#### Issue: "Collection not found"
**Solution:**
- Run the setup script again: `npm run setup:appwrite`
- Check that all collections exist in Appwrite Console
- Verify `NEXT_PUBLIC_APPWRITE_DATABASE_ID` matches your database ID

#### Issue: "Port 3000 already in use"
**Solution:**
- Kill the process using port 3000:
  ```bash
  # On Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # On Mac/Linux
  lsof -ti:3000 | xargs kill -9
  ```
- Or use a different port:
  ```bash
  PORT=3001 npm run dev
  ```

#### Issue: "TypeScript errors"
**Solution:**
- Run type checking: `npx tsc --noEmit`
- Fix any errors shown
- Restart VS Code's TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

#### Issue: "Module not found"
**Solution:**
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Clear Next.js cache:
  ```bash
  rm -rf .next
  npm run dev
  ```

#### Issue: "Emails not sending"
**Solution:**
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Verify email domain is verified (if using custom domain)
- Check spam folder for test emails
- For development, emails will log to console if Resend is not configured

#### Issue: "Authentication not working"
**Solution:**
- Clear browser cookies and cache
- Check that the auth user ID matches the user document in the database
- Verify the user's `is_active` field is `true`
- Check browser console for detailed error messages

---

## Development Workflow

### Recommended Workflow
1. **Make changes** to code in VS Code
2. **Save file** (Ctrl+S) - auto-reload triggers
3. **Check browser** for changes
4. **Check console** for errors
5. **Test feature** thoroughly
6. **Commit changes** to Git

### Git Best Practices
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### Code Quality Checks
Before committing, run:
```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix

# Type check
npx tsc --noEmit

# Run tests (if available)
npm test
```

---

## Production Deployment

### Deploying to Vercel (Recommended)

1. **Push code to GitHub**
2. **Go to vercel.com** and sign in
3. **Import your repository**
4. **Configure environment variables** (same as `.env.local`)
5. **Deploy**

### Environment Variables in Production
Make sure to set all environment variables in your deployment platform:
- Change `NEXT_PUBLIC_APP_URL` to your production URL
- Use production API keys (not test keys)
- Set `NODE_ENV=production`

---

## Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Appwrite Documentation**: https://appwrite.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **React**: https://react.dev/

---

## Support

If you encounter issues not covered in this guide:
1. Check the `TROUBLESHOOTING.md` file
2. Review error logs in browser console
3. Check Appwrite console for database errors
4. Open an issue in the project repository

---

## Next Steps

After successfully setting up the application:
1. Explore the codebase structure (see `FILE_GUIDE.md`)
2. Read the `APPLICATION_FLOW_GUIDE.md` for user workflows
3. Review the `CLINIC_PRESENTATION.md` for feature explanations
4. Customize the application for your specific needs

**Happy Coding!** 🚀
