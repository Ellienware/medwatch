# Appwrite Functions Setup Guide

This guide explains how to set up and deploy the secure CRUD Appwrite Functions.

## Overview

Appwrite Functions provide server-side execution for sensitive operations:
- **Encryption/Decryption** - Handled server-side, never in browser
- **Access Control** - Enforced before any data access
- **Audit Logging** - Automatic tracking of all operations
- **Data Isolation** - Clinic-scoped queries enforced

## Prerequisites

1. Appwrite Cloud or Self-Hosted instance
2. Appwrite CLI installed: `npm install -g appwrite-cli`
3. Project created in Appwrite Console
4. Database and collections set up

## Setup Instructions

### 1. Login to Appwrite CLI

\`\`\`bash
appwrite login
\`\`\`

### 2. Initialize Appwrite Project

\`\`\`bash
appwrite init project
\`\`\`

Select your project when prompted.

### 3. Create the Function

\`\`\`bash
appwrite init function
\`\`\`

Configuration:
- **Function ID**: `secure-patient-operations`
- **Name**: Secure Patient Operations
- **Runtime**: Node.js 18.x
- **Entrypoint**: `src/main.ts`
- **Execute Access**: Any (authentication required)
- **Timeout**: 15 seconds

### 4. Set Environment Variables

In Appwrite Console → Functions → secure-patient-operations → Settings:

Add the following environment variables:
- `ENCRYPTION_KEY`: Your base64-encoded 32-byte encryption key
- `APPWRITE_DATABASE_ID`: Your database ID
- `APPWRITE_API_KEY`: API key with database permissions

### 5. Deploy the Function

\`\`\`bash
cd appwrite-functions/secure-patient-operations
npm install
appwrite deploy function
\`\`\`

### 6. Get Function Endpoint

After deployment, note the function execution endpoint:
\`\`\`
https://cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions
\`\`\`

Add this to your `.env.local`:
\`\`\`env
NEXT_PUBLIC_SECURE_PATIENT_FUNCTION_ENDPOINT=https://cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions
\`\`\`

## Creating Additional Secure Functions

You can create similar functions for other entities:

1. **Secure Appointment Operations** - `appwrite-functions/secure-appointment-operations`
2. **Secure Test Result Operations** - `appwrite-functions/secure-test-result-operations`
3. **Secure Certificate Operations** - `appwrite-functions/secure-certificate-operations`

Each follows the same pattern:
- Encryption/decryption of sensitive fields
- Role-based access control
- Audit logging
- Clinic-scoped data access

## Testing the Function

### Test via cURL

\`\`\`bash
curl -X POST \
  https://cloud.appwrite.io/v1/functions/[FUNCTION_ID]/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: [PROJECT_ID]" \
  -H "X-Appwrite-Key: [API_KEY]" \
  -d '{
    "action": "list",
    "userId": "user123",
    "userEmail": "user@example.com",
    "userRole": "doctor",
    "clinicId": "clinic123"
  }'
\`\`\`

### Test via Frontend

\`\`\`typescript
import { securePatientService } from '@/lib/services/secure-patient-service'

// Create patient
const patient = await securePatientService.create({
  first_name: 'John',
  last_name: 'Doe',
  id_number: '8901015800083',
  // ... other fields
})

// Read patient
const patientData = await securePatientService.read(patient.id)

// Update patient
await securePatientService.update(patient.id, {
  phone: '+27123456789'
})

// List patients
const patients = await securePatientService.list()
\`\`\`

## Monitoring and Logs

### View Function Logs

In Appwrite Console:
1. Go to Functions → secure-patient-operations
2. Click "Executions" tab
3. View execution logs and status

### Monitor Performance

Track:
- Execution time (should be < 1 second for most operations)
- Success rate (should be > 99%)
- Error patterns

### Audit Logs

All operations are logged in the `audit_logs` collection:
- View in Appwrite Console → Databases → audit_logs
- Query via API for security monitoring
- Export for compliance reporting

## Security Best Practices

1. **API Keys** - Use separate API keys for each function with minimal permissions
2. **Session Validation** - Always validate user session before executing
3. **Rate Limiting** - Implement rate limiting on function executions
4. **Input Validation** - Validate all input data before processing
5. **Error Handling** - Never expose sensitive error details to clients
6. **Encryption Keys** - Rotate encryption keys periodically
7. **Audit Review** - Regularly review audit logs for suspicious activity

## Troubleshooting

### Function Fails to Execute
- Check environment variables are set correctly
- Verify API key has required permissions
- Check function logs for specific errors

### Encryption Errors
- Verify ENCRYPTION_KEY is base64-encoded 32-byte key
- Ensure key matches between environments
- Check that encrypted fields exist in database

### Permission Errors
- Verify user role is correctly set
- Check access control logic in function
- Review audit logs for failed attempts

### Performance Issues
- Monitor execution times in Console
- Consider caching frequently accessed data
- Optimize database queries

## Next Steps

1. Deploy functions for other entities (appointments, certificates, etc.)
2. Set up automated testing for functions
3. Implement monitoring and alerting
4. Create backup/restore procedures
5. Document recovery procedures
