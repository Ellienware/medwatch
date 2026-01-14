# Encryption Setup Guide

This guide explains how to set up and use the AES-256-GCM encryption system for protecting PHI (Protected Health Information) in the MedSurv application.

## Overview

The encryption system provides:
- **AES-256-GCM** authenticated encryption for all sensitive data
- **Unique IVs** (Initialization Vectors) per record
- **Authentication tags** for data integrity verification
- **Centralized encryption/decryption** utilities
- **Type-safe field definitions** for encrypted data

## Initial Setup

### 1. Generate an Encryption Key

Run the following script to generate a secure 256-bit encryption key:

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

Or use the built-in utility (add this to a setup script):

\`\`\`typescript
import { generateEncryptionKey } from '@/lib/security'

const key = await generateEncryptionKey()
console.log('ENCRYPTION_KEY:', key)
\`\`\`

### 2. Add to Environment Variables

Add the generated key to your `.env.local` file:

\`\`\`env
ENCRYPTION_KEY=your_generated_key_here
\`\`\`

**IMPORTANT**: 
- NEVER commit this key to version control
- Use different keys for development, staging, and production
- Store production keys in Vercel environment variables
- Rotate keys periodically (requires data re-encryption)

### 3. Validate Configuration

Add this to your application startup (e.g., in middleware or root layout):

\`\`\`typescript
import { validateEncryptionConfig } from '@/lib/security'

if (!validateEncryptionConfig()) {
  throw new Error('Encryption is not properly configured')
}
\`\`\`

## Usage Examples

### Encrypting Patient Data

\`\`\`typescript
import { encryptFields, SENSITIVE_FIELDS } from '@/lib/security'

const patientData = {
  first_name: 'John',
  last_name: 'Doe',
  id_number: '8901015800083',
  phone: '+27123456789',
  // ... other fields
}

// Encrypt sensitive fields
const encryptedData = await encryptFields(
  patientData,
  SENSITIVE_FIELDS.PATIENTS
)

// Result will have:
// - first_name_enc, first_name_iv, first_name_tag
// - last_name_enc, last_name_iv, last_name_tag
// - etc.
\`\`\`

### Decrypting Patient Data

\`\`\`typescript
import { decryptFields, SENSITIVE_FIELDS } from '@/lib/security'

// Data from database with encrypted fields
const encryptedPatient = {
  id: '123',
  first_name_enc: '...',
  first_name_iv: '...',
  first_name_tag: '...',
  // ... other encrypted fields
}

// Decrypt sensitive fields
const decryptedData = await decryptFields(
  encryptedPatient,
  ['first_name', 'last_name', 'id_number', 'phone']
)

// Result will have plaintext fields:
// - first_name: 'John'
// - last_name: 'Doe'
// - etc.
\`\`\`

## Database Schema Changes

### Required Field Structure

For each sensitive field, you need three fields in your database:

\`\`\`
original_field     -> removed (or never stored)
original_field_enc -> stores encrypted ciphertext (string)
original_field_iv  -> stores initialization vector (string)
original_field_tag -> stores authentication tag (string)
\`\`\`

Example for `first_name`:
- `first_name_enc` (string, base64)
- `first_name_iv` (string, base64)
- `first_name_tag` (string, base64)

### Collection Updates Needed

Update the following collections in Appwrite:

1. **patients** collection:
   - Add _enc, _iv, _tag fields for: first_name, last_name, id_number, passport_number, phone, email, address, emergency_contact_name, emergency_contact_phone, medical_history, current_medications, allergies

2. **appointments** collection:
   - Add _enc, _iv, _tag fields for: notes, examination_findings

3. **test_results** collection:
   - Add _enc, _iv, _tag fields for: test_data, notes, technician_notes

4. **certificates** collection:
   - Add _enc, _iv, _tag fields for: medical_conditions, restrictions, recommendations, doctor_notes

5. **users** collection:
   - Add _enc, _iv, _tag fields for: phone, email

6. **employers** collection:
   - Add _enc, _iv, _tag fields for: contact_person, contact_email, contact_phone

## Security Best Practices

1. **Key Management**
   - Never hardcode encryption keys
   - Use environment variables for all keys
   - Different keys per environment
   - Implement key rotation policy

2. **Access Control**
   - Only decrypt data when necessary
   - Implement role-based access to encrypted data
   - Log all decryption operations (see audit logging)

3. **Error Handling**
   - Never expose encryption errors to users
   - Log encryption failures for monitoring
   - Have fallback strategies for decryption failures

4. **Performance**
   - Encrypt/decrypt in batches where possible
   - Cache decrypted data appropriately (with caution)
   - Use Appwrite Functions for server-side processing

## Migration Strategy

See the separate MIGRATION_STRATEGY.md document for step-by-step instructions on:
- Migrating existing plaintext data to encrypted format
- Zero-downtime migration approach
- Rollback procedures
- Testing and validation

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"
- Ensure ENCRYPTION_KEY is set in your .env.local file
- Check that the key is being loaded (verify with console.log in dev only)

### "Failed to decrypt data"
- Verify the encryption key matches the one used for encryption
- Check that IV and tag are being stored and retrieved correctly
- Ensure data hasn't been corrupted in storage

### Performance Issues
- Consider using Appwrite Functions for bulk encryption/decryption
- Implement caching strategies for frequently accessed data
- Use database indexes on non-encrypted searchable fields
