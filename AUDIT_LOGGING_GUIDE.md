# Audit Logging Guide

This guide explains how to implement and use the audit logging system in MedSurv.

## Overview

The audit logging system provides:
- **Immutable audit trails** for all sensitive operations
- **Compliance support** for POPIA and healthcare regulations
- **Security monitoring** for detecting suspicious activity
- **Change tracking** for data modifications
- **User accountability** for all actions on PHI

## When to Create Audit Logs

Audit logs should be created for:

1. **All PHI Access** (required)
   - Reading patient records
   - Viewing test results
   - Accessing certificates
   - Decrypting sensitive fields

2. **Data Modifications** (required)
   - Creating new records
   - Updating existing records
   - Deleting records
   - Bulk operations

3. **Security Events** (required)
   - Login/logout
   - Permission changes
   - Failed access attempts
   - Role modifications

4. **Exports and Bulk Operations** (required)
   - Exporting data to CSV/PDF
   - Printing sensitive documents
   - Batch processing

## Usage Examples

### Basic CRUD Operations

\`\`\`typescript
import { auditCreate, auditRead, auditUpdate, auditDelete } from '@/lib/security/audit-log'
import { getCurrentUser } from '@/lib/auth/actions'

// When creating a patient record
async function createPatient(data: PatientData) {
  const user = await getCurrentUser()
  
  // Create the patient
  const patient = await createPatientInDb(data)
  
  // Audit the creation
  await auditCreate({
    clinicId: user.clinic_id!,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    entityType: 'patient',
    entityId: patient.id,
    entityDescription: `Patient: ${data.first_name} ${data.last_name}`,
    metadata: {
      id_number: data.id_number,
    },
  })
  
  return patient
}

// When reading a patient record
async function getPatient(patientId: string) {
  const user = await getCurrentUser()
  const patient = await getPatientFromDb(patientId)
  
  // Audit the read operation
  await auditRead({
    clinicId: user.clinic_id!,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    entityType: 'patient',
    entityId: patientId,
    entityDescription: `Patient: ${patient.first_name} ${patient.last_name}`,
  })
  
  return patient
}

// When updating a patient record
async function updatePatient(patientId: string, updates: Partial<PatientData>) {
  const user = await getCurrentUser()
  const oldPatient = await getPatientFromDb(patientId)
  
  // Update the patient
  const newPatient = await updatePatientInDb(patientId, updates)
  
  // Track what changed
  const changes: Record<string, { old: any; new: any }> = {}
  for (const key in updates) {
    if (oldPatient[key] !== newPatient[key]) {
      changes[key] = {
        old: oldPatient[key],
        new: newPatient[key],
      }
    }
  }
  
  // Audit the update
  await auditUpdate({
    clinicId: user.clinic_id!,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    entityType: 'patient',
    entityId: patientId,
    entityDescription: `Patient: ${newPatient.first_name} ${newPatient.last_name}`,
    changes,
  })
  
  return newPatient
}
\`\`\`

### Decryption Auditing

\`\`\`typescript
import { auditDecrypt } from '@/lib/security/audit-log'
import { decryptFields } from '@/lib/security'

async function getDecryptedPatient(patientId: string) {
  const user = await getCurrentUser()
  const encryptedPatient = await getPatientFromDb(patientId)
  
  const fieldsToDecrypt = ['first_name', 'last_name', 'id_number', 'phone']
  
  // Decrypt the fields
  const decryptedPatient = await decryptFields(encryptedPatient, fieldsToDecrypt)
  
  // Audit the decryption
  await auditDecrypt({
    clinicId: user.clinic_id!,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    entityType: 'patient',
    entityId: patientId,
    fieldsDecrypted: fieldsToDecrypt,
    reason: 'Viewing patient details',
  })
  
  return decryptedPatient
}
\`\`\`

### Export Operations

\`\`\`typescript
import { auditExport } from '@/lib/security/audit-log'

async function exportPatients(filters: any) {
  const user = await getCurrentUser()
  const patients = await getPatients(filters)
  
  // Generate export file
  const csvData = generateCSV(patients)
  
  // Audit the export
  await auditExport({
    clinicId: user.clinic_id!,
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    entityType: 'patient',
    exportFormat: 'CSV',
    recordCount: patients.length,
    metadata: {
      filters,
    },
  })
  
  return csvData
}
\`\`\`

### Failed Operations

\`\`\`typescript
import { auditFailure } from '@/lib/security/audit-log'

async function accessSensitiveData(entityId: string) {
  const user = await getCurrentUser()
  
  try {
    // Check permissions
    if (!hasPermission(user.role, 'patient', 'read')) {
      // Audit the failed attempt
      await auditFailure({
        clinicId: user.clinic_id!,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'read',
        entityType: 'patient',
        entityId,
        errorMessage: 'Insufficient permissions',
      })
      
      throw new Error('Access denied')
    }
    
    // ... proceed with operation
  } catch (error) {
    // Audit any other failures
    await auditFailure({
      clinicId: user.clinic_id!,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'read',
      entityType: 'patient',
      entityId,
      errorMessage: error.message,
    })
    
    throw error
  }
}
\`\`\`

## Viewing Audit Logs

### Get Audit Trail for an Entity

\`\`\`typescript
import { getAuditLogsForEntity } from '@/lib/security/audit-log'

const auditLogs = await getAuditLogsForEntity('patient', patientId, clinicId, 50)
\`\`\`

### Monitor Suspicious Activity

\`\`\`typescript
import { getSuspiciousActivity } from '@/lib/security/audit-log'

// Get high-risk activities from last 24 hours
const suspicious = await getSuspiciousActivity(clinicId, 24)
\`\`\`

## Best Practices

1. **Always audit PHI access** - Every time sensitive data is read, decrypted, or exported
2. **Include context** - Add entity descriptions and metadata for better traceability
3. **Track changes** - For updates, record what changed (old vs new values)
4. **Handle failures** - Audit failed attempts for security monitoring
5. **Never skip audits** - Even if the audit log creation fails, continue the operation
6. **Use descriptive messages** - Make audit logs human-readable
7. **Include IP addresses** - When available, record the user's IP address

## Security Monitoring Dashboard

The audit logs can be used to build a security monitoring dashboard showing:
- Recent access to sensitive data
- Failed access attempts
- High-risk operations
- User activity patterns
- Unusual access patterns (e.g., accessing many records quickly)

## Retention and Compliance

- Audit logs are **immutable** - they cannot be updated or deleted manually
- Retention period is set by the clinic's `data_retention_days` setting
- Implement automated archival/deletion via scheduled Appwrite Functions
- For compliance audits, export audit logs to long-term storage
