# Access Control Implementation Guide

This guide explains how to implement and use the access control system in MedSurv.

## Overview

The access control system provides:
- **Middleware-level** route protection
- **Role-based** access control (RBAC)
- **Data-level** permissions (clinic isolation)
- **Field-level** decryption controls
- **Automatic** audit logging of access attempts

## Components

### 1. Middleware (`middleware.ts`)
Runs on every request to enforce:
- Authentication requirements
- Route-level access control
- Session validation
- Security headers

### 2. Permissions (`lib/auth/permissions.ts`)
Defines what each role can do:
- Feature permissions (canManageUsers, canViewReports, etc.)
- Route access controls
- Data access rules
- Field decryption permissions

### 3. Access Control Utilities (`lib/middleware/access-control.ts`)
Server-side helpers for:
- Permission checking
- Clinic access validation
- Field decryption authorization
- Audit logging

### 4. API Wrapper (`lib/api/secure-api-wrapper.ts`)
Secures API routes with built-in access control

## Usage Examples

### Protecting Server Actions

\`\`\`typescript
import { requirePermission, requireClinicAccess, getUserContext } from '@/lib/middleware/access-control'
import { auditCreate } from '@/lib/security/audit-log'

export async function createPatient(data: PatientData) {
  // Check permission
  await requirePermission('canManagePatients')
  
  // Get user context
  const context = await getUserContext()
  
  // Ensure clinic access
  await requireClinicAccess(context.clinicId)
  
  // Create patient
  const patient = await db.createPatient({
    ...data,
    clinic_id: context.clinicId
  })
  
  // Audit the creation
  await auditCreate({
    ...context,
    entityType: 'patient',
    entityId: patient.id,
    entityDescription: `${data.first_name} ${data.last_name}`
  })
  
  return patient
}
\`\`\`

### Protecting API Routes

\`\`\`typescript
// app/api/patients/[id]/route.ts
import { withApiAuth } from '@/lib/api/secure-api-wrapper'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withApiAuth(
  async (req, { user, params }) => {
    const patientId = params.id
    
    // Your logic here - user is already authenticated and authorized
    const patient = await getPatient(patientId)
    
    return NextResponse.json({ data: patient })
  },
  {
    requiredRole: ['doctor', 'nurse', 'clinic_admin'],
    requiredPermission: 'canViewPatients'
  }
)
\`\`\`

### Field-Level Decryption Control

\`\`\`typescript
import { requireDecryptionPermission } from '@/lib/middleware/access-control'
import { decryptFields } from '@/lib/security'

export async function getPatientDetails(patientId: string) {
  const user = await getCurrentUser()
  const patient = await getPatientFromDb(patientId)
  
  // Determine which fields user can decrypt
  const fieldsToDecrypt = []
  
  for (const field of ['first_name', 'last_name', 'id_number', 'medical_history']) {
    try {
      await requireDecryptionPermission(field, 'patient')
      fieldsToDecrypt.push(field)
    } catch {
      // User doesn't have permission for this field
      continue
    }
  }
  
  // Decrypt only allowed fields
  return await decryptFields(patient, fieldsToDecrypt)
}
\`\`\`

### Using withAccessControl Helper

\`\`\`typescript
import { withAccessControl } from '@/lib/middleware/access-control'

export async function deletePatient(patientId: string) {
  return await withAccessControl(
    async () => {
      // Your deletion logic
      await db.deletePatient(patientId)
      return { success: true }
    },
    {
      permission: 'canDeleteRecords',
      entityType: 'patient',
      entityId: patientId,
      action: 'delete'
    }
  )
}
\`\`\`

## Permission Definitions

### Super Admin
- Full system access
- Can manage all clinics
- Can decrypt all fields
- Can view all audit logs

### Clinic Admin
- Full clinic access
- Can manage users, patients, appointments
- Can decrypt all fields in their clinic
- Can view clinic audit logs
- Can export data

### Receptionist
- Can manage patients and appointments
- Can decrypt basic contact info only
- Cannot view medical details
- Cannot issue certificates

### Nurse
- Can view patients and appointments
- Can record test results
- Can decrypt clinical fields
- Cannot issue certificates

### Doctor
- Can view all patient information
- Can issue certificates
- Can decrypt all clinical fields
- Can prescribe medications

### Employer
- Can view their employees only
- Can view certificates
- Cannot decrypt any fields
- Read-only access

## Route Protection

Routes are automatically protected by middleware:

| Route | Allowed Roles |
|---|---|
| /super-admin | super_admin |
| /clinic | clinic_admin |
| /dashboard | clinic_admin, receptionist, nurse, doctor |
| /employer | employer |
| /patients | clinic_admin, receptionist, nurse, doctor |
| /certificates | clinic_admin, doctor |
| /billing | clinic_admin |
| /audit-logs | super_admin, clinic_admin |

## Best Practices

1. **Always check permissions** before operations
2. **Validate clinic access** for all data operations
3. **Audit all sensitive operations** (create, read, update, delete)
4. **Use field-level decryption controls** for PHI
5. **Never bypass access control** for convenience
6. **Log all access failures** for security monitoring
7. **Test access control** for each role
8. **Review audit logs** regularly

## Testing Access Control

\`\`\`typescript
// Test as different roles
describe('Access Control', () => {
  it('should allow doctors to issue certificates', async () => {
    const user = await loginAs('doctor')
    expect(hasPermission(user.role, 'canIssueCertificates')).toBe(true)
  })
  
  it('should prevent receptionists from viewing medical history', async () => {
    const user = await loginAs('receptionist')
    expect(canDecryptField(user.role, 'medical_history', 'patient')).toBe(false)
  })
  
  it('should prevent cross-clinic data access', async () => {
    const user = await loginAs('doctor', { clinicId: 'clinic1' })
    await expect(
      accessPatientFromClinic('clinic2')
    ).rejects.toThrow('Access denied')
  })
})
\`\`\`

## Troubleshooting

### User Can't Access Route
- Check user role matches route permissions
- Verify session is valid
- Check if user account is active

### Permission Denied Errors
- Verify user has required permission in permissions.ts
- Check if clinic ID matches for data access
- Review audit logs for specific denial reason

### Decryption Failures
- Ensure user role has decryption permission for field
- Check if entity type matches
- Verify encryption key is correct
