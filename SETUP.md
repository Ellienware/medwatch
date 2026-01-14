# Complete Setup Guide for MedSurv

Step-by-step instructions to get your Medical Surveillance SaaS running locally and in production.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
   - Download from https://nodejs.org/
   - Verify installation:
     \`\`\`bash
     node --version
     npm --version
     \`\`\`

2. **Text Editor** (VS Code recommended)
   - Download from https://code.visualstudio.com/
   - Recommended extensions:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense

3. **Appwrite Account**
   - Sign up at https://cloud.appwrite.io
   - Free tier is sufficient for development

4. **Resend Account** (for emails)
   - Sign up at https://resend.com
   - Free tier: 100 emails/day

## Quick Start (5 Minutes)

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Create Appwrite Project

1. Go to https://cloud.appwrite.io
2. Click "Create Project"
3. Name it "MedSurv" (or your preferred name)
4. Copy your **Project ID**

### 3. Generate API Key

1. In Appwrite Console → Settings → API Keys
2. Click "Create API Key"
3. Name it "MedSurv Development"
4. Enable ALL scopes (we'll restrict in production)
5. Copy your **API Key** (secret key)

### 4. Setup Environment Variables

Create `.env.local` in the root directory:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

Edit `.env.local` and fill in your credentials:

\`\`\`bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
APPWRITE_API_KEY=your_api_key_here

# Generate encryption key (run this command and paste the output)
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_KEY=your_generated_encryption_key

# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 5. Generate Encryption Key

Run this command to generate a secure encryption key:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

Copy the output and paste it as the `ENCRYPTION_KEY` value in `.env.local`.

### 6. Setup Database and Storage

Run the automated setup script:

\`\`\`bash
npm run appwrite:setup
\`\`\`

This script will:
- Create the database
- Create all collections with proper attributes
- Set up indexes for performance
- Configure Row Level Security (RLS)
- Create storage bucket
- Add seed data (optional)

**Copy the Database ID** that's printed at the end and add it to `.env.local`:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_DATABASE_ID=the_generated_database_id
\`\`\`

### 7. Configure Storage Bucket

The setup script creates a storage bucket. Copy the bucket ID to `.env.local`:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
\`\`\`

### 8. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

### 9. Test Login

The setup script creates a default super admin account:

**Default Credentials:**
- Email: `admin@medsurv.com`
- Password: `Admin@123`

Visit http://localhost:3000/auth/login and sign in.

---

## Detailed Setup Instructions

### Step 1: Clone or Download Project

If you received the project as a ZIP:
\`\`\`bash
# Extract the ZIP file
# Navigate to the extracted directory
cd medsurv
\`\`\`

If using Git:
\`\`\`bash
git clone <repository-url>
cd medsurv
\`\`\`

### Step 2: Install Dependencies

Install all required packages:

\`\`\`bash
npm install
\`\`\`

This installs:
- Next.js 16 (React framework)
- Appwrite SDK (backend services)
- Resend (email service)
- Tailwind CSS v4 (styling)
- shadcn/ui components
- TypeScript, Zod, and more

### Step 3: Create Appwrite Project

#### 3.1 Sign Up for Appwrite Cloud

1. Visit https://cloud.appwrite.io
2. Sign up with email or GitHub
3. Verify your email address

#### 3.2 Create New Project

1. Click "Create Project" button
2. Enter project details:
   - **Name**: MedSurv (or your preferred name)
   - **Project ID**: Auto-generated or custom
3. Click "Create"
4. **Copy your Project ID** - you'll need it for `.env.local`

#### 3.3 Generate API Key

1. In your project, go to **Settings** → **API Keys**
2. Click "Create API Key"
3. Configure the key:
   - **Name**: MedSurv Development
   - **Expiration**: Never (for development)
   - **Scopes**: Select ALL scopes for development
     - databases.*
     - collections.*
     - documents.*
     - files.*
     - users.*
     - teams.*
     - etc.
4. Click "Create"
5. **Copy the API Key** immediately (you won't see it again!)

**Security Note**: This key is SECRET. Never commit it or expose it to the browser.

### Step 4: Configure Environment Variables

#### 4.1 Create .env.local File

Copy the example file:

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

#### 4.2 Add Appwrite Credentials

Open `.env.local` in your editor and update:

\`\`\`bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=65abc123def456  # Your Project ID
APPWRITE_API_KEY=standard_xxxxxxxxxxxxxxxxxxxxx  # Your API Key
\`\`\`

#### 4.3 Generate Encryption Key

This key encrypts sensitive PHI (Protected Health Information) data:

**Option 1: Using Node.js**
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

**Option 2: Using OpenSSL**
\`\`\`bash
openssl rand -base64 32
\`\`\`

Copy the output and add to `.env.local`:

\`\`\`bash
ENCRYPTION_KEY=AbCdEf123456...==
\`\`\`

**Critical**: Never lose this key! Backup securely. Without it, encrypted data is unrecoverable.

#### 4.4 Setup Email Service (Resend)

1. Sign up at https://resend.com
2. Go to **API Keys** section
3. Click "Create API Key"
4. Copy the key (starts with `re_`)
5. Add to `.env.local`:

\`\`\`bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
\`\`\`

**What emails are sent:**
- Certificate notifications to patients
- Appointment reminders
- Staff invitation emails
- Test result notifications
- Password reset emails

#### 4.5 Set Application URL

\`\`\`bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

For production, change this to your actual domain (e.g., `https://yourapp.com`).

### Step 5: Setup Database and Storage

#### 5.1 Run Setup Script

The project includes an automated setup script that creates everything:

\`\`\`bash
npm run appwrite:setup
\`\`\`

**What this does:**
1. Connects to your Appwrite project
2. Creates database: `medsurv_db`
3. Creates all collections:
   - clinics
   - users  
   - patients (with encrypted PHI fields)
   - appointments
   - clinical_tests
   - test_results (with encrypted fields)
   - certificates
   - employers
   - clinic_branches
   - notifications
   - billing_invoices
   - audit_logs
4. Creates attributes for each collection (with _enc suffix for encrypted fields)
5. Sets up indexes for performance
6. Configures Row Level Security (RLS)
7. Creates storage bucket with permissions
8. Seeds initial data:
   - Default super admin user
   - Sample clinical test types
   - Demo clinic (optional)

#### 5.2 Copy Database ID

At the end of the script, you'll see:

\`\`\`bash
✅ Database created: medsurv_db
📋 Database ID: 65abc123def456
\`\`\`

Copy this Database ID and add to `.env.local`:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_DATABASE_ID=65abc123def456
\`\`\`

#### 5.3 Verify in Appwrite Console

1. Go to Appwrite Console → **Databases**
2. You should see `medsurv_db`
3. Click on it to see all collections
4. Click on `clinical_tests` to verify seed data

### Step 6: Configure Authentication

#### 6.1 Enable Email/Password Auth

1. In Appwrite Console → **Auth** → **Settings**
2. Ensure "Email/Password" is enabled
3. Configure email settings:
   - **Sender Name**: MedSurv
   - **Sender Email**: noreply@yourapp.com (Resend handles this)

#### 6.2 Add Platform (Web App)

1. In Appwrite Console → **Settings** → **Platforms**
2. Click "Add Platform" → "Web App"
3. Configure:
   - **Name**: MedSurv Web
   - **Hostname**: `localhost` (for development)
4. Click "Create"

**For production**, add your production domain as another platform.

### Step 7: Start the Application

#### 7.1 Run Development Server

\`\`\`bash
npm run dev
\`\`\`

You should see:

\`\`\`bash
▲ Next.js 16.0.7
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.1s
\`\`\`

#### 7.2 Open in Browser

Navigate to http://localhost:3000

You should see the MedSurv landing page.

### Step 8: Test the Application

#### 8.1 Login as Super Admin

1. Go to http://localhost:3000/auth/login
2. Enter default credentials:
   - **Email**: admin@medsurv.com
   - **Password**: Admin@123
3. Click "Sign in"
4. You should be redirected to `/super-admin/dashboard`

#### 8.2 Explore Super Admin Portal

Features available:
- View all clinics
- System statistics
- User management
- Audit logs
- System settings

#### 8.3 Create Test Clinic

1. Go to http://localhost:3000/auth/signup
2. Fill in clinic registration form:
   - Clinic name
   - Admin email (use a different email)
   - Password
   - Contact details
3. Submit form
4. Check email for verification (if Resend is configured)
5. Login with new credentials

#### 8.4 Test Patient Management

1. Login as clinic admin
2. Go to **Patients** → **Add Patient**
3. Fill in patient details
4. Submit form
5. Verify encryption:
   - Open Appwrite Console → Databases → patients
   - Check that sensitive fields (address, id_number) are encrypted
   - You should see format: `encrypted_data.iv.tag`

#### 8.5 Test Certificate Generation

1. Create an appointment
2. Record test results
3. Generate certificate
4. Download PDF
5. Verify QR code includes certificate ID

### Step 9: Test Email Functionality

#### 9.1 Verify Resend Configuration

\`\`\`bash
# Check if RESEND_API_KEY is set
echo $RESEND_API_KEY
\`\`\`

#### 9.2 Test Certificate Email

1. Generate a certificate for a patient
2. Click "Send via Email"
3. Check Resend dashboard for delivery status
4. Verify patient receives email with certificate

#### 9.3 Test Appointment Reminders

1. Create appointment for tomorrow
2. Email reminder should be sent automatically
3. Check Resend dashboard for sent emails

### Step 10: Test Responsive Design

#### 10.1 Mobile Testing

1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select device:
   - iPhone 12 Pro
   - iPad Air
   - Samsung Galaxy S20
4. Navigate through app
5. Verify layout adjusts properly

#### 10.2 Test Key Mobile Features

- Login form
- Patient list
- Certificate viewing
- Navigation menu

---

## Production Deployment

### Deploy to Vercel

#### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/medsurv.git
git push -u origin main
\`\`\`

#### 2. Import to Vercel

1. Go to https://vercel.com
2. Sign up or login
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Vercel auto-detects Next.js configuration

#### 3. Configure Environment Variables

In Vercel project settings → Environment Variables, add:

\`\`\`bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
APPWRITE_API_KEY=your_api_key
ENCRYPTION_KEY=your_encryption_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
\`\`\`

**Important**: Use the SAME encryption key as development, or you won't be able to decrypt existing data!

#### 4. Add Production Platform in Appwrite

1. In Appwrite Console → Settings → Platforms
2. Add new Web App platform:
   - **Name**: MedSurv Production
   - **Hostname**: your-app.vercel.app
3. Click "Create"

#### 5. Deploy

Click "Deploy" in Vercel. Your app will be live in ~2 minutes.

#### 6. Test Production App

1. Visit your Vercel URL
2. Test login
3. Test key features
4. Verify emails are sent

### Deploy to Other Platforms

MedSurv can be deployed to any Node.js hosting platform:

**Options:**
- **Vercel** (recommended, automatic Next.js optimization)
- **Netlify** (good alternative)
- **Railway** (includes database hosting)
- **Fly.io** (Docker-based)
- **AWS Amplify** (AWS ecosystem)
- **DigitalOcean App Platform** (simple VPS)

All require:
1. Node.js 18+ runtime
2. Environment variables configured
3. Build command: `npm run build`
4. Start command: `npm start`

---

## Troubleshooting

### Issue: "Appwrite service is unreachable"

**Symptoms**: Cannot connect to Appwrite, API calls fail

**Solutions**:
1. Check internet connection
2. Verify `NEXT_PUBLIC_APPWRITE_ENDPOINT` is correct
3. Check Appwrite Cloud status: https://status.appwrite.io
4. Verify project isn't paused (free tier limitation)
5. Check firewall/proxy settings

### Issue: "Invalid API key"

**Symptoms**: API calls return 401 Unauthorized

**Solutions**:
1. Verify `APPWRITE_API_KEY` is correct (no extra spaces)
2. Check API key hasn't expired
3. Verify API key has necessary scopes (databases, collections, documents)
4. Regenerate API key in Appwrite Console if needed
5. Restart dev server after changing `.env.local`

### Issue: "Database not found"

**Symptoms**: Error: "Database medsurv_db does not exist"

**Solutions**:
1. Verify you ran `npm run appwrite:setup`
2. Check `NEXT_PUBLIC_APPWRITE_DATABASE_ID` in `.env.local` matches actual database ID
3. Check database exists in Appwrite Console → Databases
4. Verify database ID format (no extra characters)
5. Restart dev server after adding database ID

### Issue: "Collection not found"

**Symptoms**: Error: "Collection patients does not exist"

**Solutions**:
1. Re-run setup script: `npm run appwrite:setup`
2. Check collections exist in Appwrite Console → Databases → medsurv_db
3. Verify collection IDs match what's in `lib/appwrite/config.ts`
4. Check for typos in collection names

### Issue: "ENCRYPTION_KEY is not set"

**Symptoms**: Error about missing encryption key

**Solutions**:
1. Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Add to `.env.local` as `ENCRYPTION_KEY`
3. Verify no spaces or line breaks in the key
4. Restart dev server
5. Make sure `.env.local` is in the root directory

### Issue: "Failed to decrypt data"

**Symptoms**: Cannot read patient data, errors about decryption

**Solutions**:
1. Verify `ENCRYPTION_KEY` hasn't changed
2. Check encrypted fields have all three parts: `encrypted_data.iv.tag`
3. Verify data wasn't corrupted during storage
4. If you changed the key, you'll need to re-encrypt all data
5. Check encryption service is properly initialized

### Issue: Emails not sending

**Symptoms**: No emails received, Resend errors

**Solutions**:
1. Verify `RESEND_API_KEY` is correct and active
2. Check Resend dashboard for error logs
3. Verify you haven't exceeded free tier (100 emails/day)
4. Check spam folder
5. Verify email addresses are valid
6. Check application logs for email service errors
7. Test with Resend API directly to isolate issue

### Issue: "Row Level Security policy violation"

**Symptoms**: Cannot read/write data, permission errors

**Solutions**:
1. Verify user is authenticated (check `userId` exists)
2. Check user has `clinic_id` set (if clinic-scoped resource)
3. Verify RLS policies were created by setup script
4. Check user role matches required permission
5. For super admin, verify role is `super_admin`
6. Check audit logs for access attempts

### Issue: "Port 3000 already in use"

**Symptoms**: Cannot start dev server

**Solutions**:
\`\`\`bash
# Option 1: Kill process on port 3000
npx kill-port 3000

# Option 2: Use different port
npm run dev -- -p 3001
\`\`\`

### Issue: Build errors or TypeScript errors

**Symptoms**: Red squiggly lines, build fails

**Solutions**:
1. Delete `.next` folder and rebuild:
   \`\`\`bash
   rm -rf .next
   npm run dev
   \`\`\`
2. Reinstall dependencies:
   \`\`\`bash
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`
3. Check for missing imports
4. Verify all types are correctly defined
5. Update TypeScript: `npm install typescript@latest`

### Issue: Blank page or white screen

**Symptoms**: Page loads but shows nothing

**Solutions**:
1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Clear browser cache and reload
4. Try incognito/private window
5. Verify environment variables are set correctly
6. Check Network tab for failed API calls

### Issue: Certificate PDF not generating

**Symptoms**: Error when trying to download certificate

**Solutions**:
1. Check browser console for errors
2. Verify jsPDF library is installed
3. Check certificate data is complete
4. Verify QR code generation works
5. Test in different browser
6. Check for CORS issues with images

### Issue: "Cannot read properties of undefined"

**Symptoms**: JavaScript errors about undefined

**Solutions**:
1. Check data is loaded before rendering
2. Use optional chaining: `data?.property`
3. Add loading states
4. Verify API responses have expected structure
5. Check for race conditions in data fetching

---

## Security Checklist

Before deploying to production:

### Environment Variables
- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets in code or committed files
- [ ] Production uses different keys than development
- [ ] `ENCRYPTION_KEY` is securely backed up
- [ ] API keys have minimum required permissions

### Appwrite Configuration
- [ ] API key permissions restricted to only what's needed
- [ ] Row Level Security (RLS) policies are active
- [ ] User roles and permissions properly configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain only

### Application Security
- [ ] All sensitive fields use _enc suffix (encrypted)
- [ ] Audit logging is active
- [ ] Password requirements enforced
- [ ] Session management is secure
- [ ] File uploads are validated and scanned
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF protection enabled

### Compliance (POPIA/GDPR)
- [ ] Audit logs capture all PHI access
- [ ] Data encryption at rest (via _enc fields)
- [ ] Data encryption in transit (HTTPS)
- [ ] User consent mechanisms in place
- [ ] Data retention policies configured
- [ ] Patient data export functionality works
- [ ] Patient data deletion functionality works

---

## Performance Optimization

### Development
- Fast Refresh enabled (automatic with Next.js 16)
- Turbopack bundler for faster builds
- SWR for efficient data fetching and caching
- React 19 compiler optimizations

### Production
Before deploying, consider:

1. **Image Optimization**
   - Use Next.js Image component
   - Properly size images
   - Enable lazy loading

2. **Code Splitting**
   - Dynamic imports for large components
   - Route-based code splitting (automatic)

3. **Caching**
   - Configure SWR cache strategies
   - Use React Query for complex data flows
   - Enable CDN caching for static assets

4. **Database**
   - Ensure indexes exist (created by setup script)
   - Monitor query performance in Appwrite
   - Use pagination for large lists

5. **Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (Sentry)
   - Monitor Appwrite usage and limits

---

## Development Commands

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Setup Appwrite (initial setup)
npm run appwrite:setup

# Type checking
npx tsc --noEmit
\`\`\`

---

## Useful Resources

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Appwrite Docs](https://appwrite.io/docs)
- [Resend Docs](https://resend.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

### Project Documentation
- `ENVIRONMENT_VARIABLES.md` - Detailed environment variable guide
- `IMPLEMENTATION_STATUS.md` - Feature completion status
- `SYSTEM_OVERVIEW.md` - Architecture and design decisions
- `BILLING_GUIDE.md` - Paystack integration guide

### Appwrite Resources
- [Appwrite Cloud Console](https://cloud.appwrite.io)
- [Appwrite Discord](https://discord.gg/appwrite)
- [Appwrite GitHub](https://github.com/appwrite/appwrite)

### Getting Help
- Check browser console (F12) for errors
- Check terminal for server errors
- Review Appwrite logs in console
- Check Resend dashboard for email delivery
- Search GitHub issues for similar problems

---

## Next Steps

Now that your app is running:

1. **Customize Branding**
   - Update logo in `public/` directory
   - Modify colors in `app/globals.css`
   - Edit company name throughout app

2. **Add Your Data**
   - Create clinic accounts
   - Add patients
   - Configure clinical test types
   - Set up clinic branches

3. **Configure Billing**
   - Sign up for Paystack
   - Add API keys to `.env.local`
   - Test subscription flow
   - Configure pricing tiers

4. **Setup Production**
   - Deploy to Vercel
   - Configure custom domain
   - Enable SSL/HTTPS
   - Setup monitoring

5. **Train Your Team**
   - Create user accounts
   - Document workflows
   - Setup support channels

---

**Congratulations!** Your Medical Surveillance SaaS is ready to use. Start managing occupational health with confidence.

For questions or support, refer to the documentation files or check the project repository.
