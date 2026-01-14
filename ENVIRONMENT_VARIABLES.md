# Environment Variables Guide

This document explains all environment variables required for MedSurv.

## Required Variables

### Appwrite Authentication & Database

MedSurv uses Appwrite for both authentication and database. Get your credentials from the Appwrite console at: `https://cloud.appwrite.io`

\`\`\`bash
# Appwrite Configuration (Required)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
APPWRITE_API_KEY=your_api_key_here
\`\`\`

**Important Notes:**
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`: Your Appwrite server endpoint (usually https://cloud.appwrite.io/v1)
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: Your project ID from Appwrite console
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`: Generated when you run the setup script
- `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID`: Storage bucket for files (single bucket with prefixes)
- `APPWRITE_API_KEY`: Server-only API key with full permissions (NEVER expose to client)

**Getting your Appwrite credentials:**
1. Sign up at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Create a new project
3. Copy the Project ID
4. Create an API key with full database and storage permissions (see APPWRITE_COMPLETE_SETUP.md)
5. Run `npm run appwrite:setup` to create database and get the Database ID
6. Add the generated Database ID to your `.env.local` file

### Encryption Key (Critical Security)

**REQUIRED** for encrypting PHI (Protected Health Information) at rest:

\`\`\`bash
ENCRYPTION_KEY=your_base64_encoded_32_byte_key_here
\`\`\`

**Generating your encryption key:**

Using Node.js:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

Using OpenSSL:
\`\`\`bash
openssl rand -base64 32
\`\`\`

Using the app (run once):
\`\`\`bash
npx tsx -e "import('./lib/security/encryption').then(m => m.generateEncryptionKey().then(console.log))"
\`\`\`

**Critical Security Notes:**
- Generate a unique key for each environment (dev, staging, production)
- NEVER commit this key to version control
- Store securely in environment variables or secrets manager
- Rotating this key requires re-encrypting all existing data
- Losing this key means permanent data loss - backup securely!
- Key must be exactly 32 bytes (256 bits) when decoded from base64

### Email Service (Resend)

Required for transactional emails (certificates, appointments, invitations, test results):

\`\`\`bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
\`\`\`

**Getting your Resend API key:**
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy and add to your `.env.local` file

**Important:**
- Resend offers 100 free emails per day on the free tier
- Perfect for transactional emails like appointment confirmations
- Production-ready with high deliverability rates

### Application URL

Used for email links and password recovery:

\`\`\`bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://yourapp.com  # Production
\`\`\`

## Optional Variables

### Paystack Payment Integration

Required for subscription billing and payments:

\`\`\`bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
\`\`\`

**Getting your Paystack keys:**
1. Sign up at [paystack.com](https://paystack.com)
2. Go to Settings → API Keys & Webhooks
3. Copy your Test keys for development
4. Use Live keys for production

**Important:**
- Start with Test keys (pk_test_ and sk_test_)
- Never expose `PAYSTACK_SECRET_KEY` to the client
- Switch to Live keys (pk_live_ and sk_live_) when ready for production

### SMS/WhatsApp Notifications

For SMS and WhatsApp notifications via Twilio or Africa's Talking:

\`\`\`bash
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Africa's Talking
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
\`\`\`

### Custom Email Configuration

Override default email settings:

\`\`\`bash
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=Your App Name
SUPPORT_EMAIL=support@yourapp.com
\`\`\`

## Setup Instructions

### Local Development

1. Copy the example file:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. Fill in your Appwrite credentials:
   - Add Project ID and API Key from Appwrite console
   - Run `npm run appwrite:setup` to create the database
   - Copy the generated Database ID to your `.env.local`
   - Create storage bucket and add its ID

3. Generate your encryption key:
   \`\`\`bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   \`\`\`
   - Copy the generated key to `.env.local` as `ENCRYPTION_KEY`
   - Keep this key secure and never commit it!

4. Add your Resend API key:
   - Sign up at resend.com and get your API key
   - Add it to `.env.local` as `RESEND_API_KEY`

5. Restart your development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable with its corresponding value
4. **Critical**: Add `ENCRYPTION_KEY` securely - never expose it in logs or client
5. Redeploy your application

## Quick Start Guide

### First Time Setup

1. **Create Appwrite Project**:
   \`\`\`bash
   # Visit https://cloud.appwrite.io
   # Create new project
   # Copy Project ID to .env.local
   \`\`\`

2. **Generate Appwrite API Key**:
   \`\`\`bash
   # In Appwrite Console → Settings → API Keys
   # Create key with ALL scopes (we'll restrict later)
   # Copy to .env.local as APPWRITE_API_KEY
   \`\`\`

3. **Generate Encryption Key**:
   \`\`\`bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # Copy output to .env.local as ENCRYPTION_KEY
   # KEEP THIS SECURE!
   \`\`\`

4. **Setup Database**:
   \`\`\`bash
   npm install
   npm run appwrite:setup
   # Copy the generated Database ID to .env.local
   \`\`\`

5. **Create Storage Bucket**:
   \`\`\`bash
   # In Appwrite Console → Storage
   # Create bucket named "medsurv_storage"
   # Copy bucket ID to .env.local
   # Set permissions: Read: role:all, Create/Update/Delete: role:member
   \`\`\`

6. **Setup Email Service**:
   \`\`\`bash
   # Sign up at resend.com
   # Get API key and add to .env.local as RESEND_API_KEY
   \`\`\`

7. **Start Development**:
   \`\`\`bash
   npm run dev
   \`\`\`

### Your .env.local should look like:

\`\`\`bash
# Appwrite (Required)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=65abc123def456
NEXT_PUBLIC_APPWRITE_DATABASE_ID=medsurv_db
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=medsurv_storage
APPWRITE_API_KEY=standard_xxxxxxxxxxxxx

# Encryption (Required - KEEP SECURE!)
ENCRYPTION_KEY=abc123XYZ789...==

# Email Service (Required for notifications)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Paystack (for payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
\`\`\`

## Security Best Practices

- **NEVER** commit `.env.local` to version control (it's in .gitignore)
- **NEVER** expose `APPWRITE_API_KEY`, `ENCRYPTION_KEY`, `PAYSTACK_SECRET_KEY`, or `RESEND_API_KEY` to the client
- Use `NEXT_PUBLIC_` prefix ONLY for variables that are safe to expose to the browser
- Rotate API keys regularly, especially if compromised
- Use different keys for development and production environments
- **CRITICAL**: Backup your `ENCRYPTION_KEY` securely - losing it means permanent data loss
- Use a secrets manager (AWS Secrets Manager, Vercel Secrets, etc.) for production
- Restrict API key permissions in production (remove unused scopes)
- Monitor for unauthorized access attempts in audit logs

## Troubleshooting

### "Invalid API key" errors
- Verify you've copied the correct keys from Appwrite dashboard
- Check for extra spaces or line breaks in your `.env.local` file
- Ensure you've restarted your development server after adding variables
- Verify API key has necessary permissions (database, storage)

### "ENCRYPTION_KEY environment variable is not set"
- Ensure `ENCRYPTION_KEY` is added to `.env.local`
- Generate a new key using: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Verify the key is exactly 32 bytes when decoded from base64
- Restart your development server after adding the key

### "Failed to decrypt data" errors
- Verify `ENCRYPTION_KEY` matches the key used to encrypt the data
- If you changed the key, you'll need to re-encrypt all existing data
- Check that encrypted fields have all three components: _enc, _iv, _tag
- Ensure data wasn't corrupted during storage or transmission

### Authentication not working
- Verify Appwrite project ID is correct
- Check Appwrite console → Settings → Platforms and ensure your domain is added
- Ensure email/password auth is enabled in Appwrite console
- Clear browser cookies and try again

### Database connection errors
- Ensure Appwrite project ID and database ID are correct
- Verify API key has database read/write permissions
- Run `npm run appwrite:setup` if database doesn't exist
- Check Appwrite console for any service outages

### "Database not found" error
- Ensure `NEXT_PUBLIC_APPWRITE_DATABASE_ID` is set in `.env.local`
- Run `npm run appwrite:setup` to create the database
- Verify the Database ID matches what's in Appwrite console

### Storage/file upload errors
- Verify `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID` is correct
- Check bucket exists in Appwrite console → Storage
- Ensure bucket permissions allow authenticated users to upload
- Verify file size is under bucket limit (default: 50MB)

### Email not sending
- Verify `RESEND_API_KEY` is correct and valid
- Check Resend dashboard for API usage and errors
- Ensure you haven't exceeded free tier limits (100 emails/day)
- Check application logs for email service errors
- Verify email addresses are valid and not on blocklists

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Complete Setup Guide](./APPWRITE_COMPLETE_SETUP.md) - Detailed setup instructions
- [Database Design](./DATABASE_DESIGN.md) - Detailed schema documentation
- [Migration Guide](./MIGRATION_GUIDE.md) - Supabase to Appwrite migration notes
- [Security Guide](./SECURITY.md) - Encryption and POPIA compliance details

## Environment Variables Checklist

Before deploying, ensure you have:

- ✅ `NEXT_PUBLIC_APPWRITE_ENDPOINT` - Appwrite server URL
- ✅ `NEXT_PUBLIC_APPWRITE_PROJECT_ID` - Your project ID
- ✅ `NEXT_PUBLIC_APPWRITE_DATABASE_ID` - Database ID from setup script
- ✅ `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID` - Storage bucket ID
- ✅ `APPWRITE_API_KEY` - Server API key (secret!)
- ✅ `ENCRYPTION_KEY` - 32-byte encryption key (secret!)
- ✅ `RESEND_API_KEY` - Email service API key (secret!)
- ✅ `NEXT_PUBLIC_APP_URL` - Your application URL
- ⚠️ `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Optional, for payments
- ⚠️ `PAYSTACK_SECRET_KEY` - Optional, for payments

**Note:** Variables marked with ⚠️ are optional and only needed if you're using those features.
