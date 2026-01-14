# Frontend Integration Guide

This guide explains how to update frontend components to use the secure data access patterns.

## Overview

The new security architecture requires:
- All data access via secure API endpoints
- No direct database queries from frontend
- Role-based UI rendering
- Audit trail visibility for compliance

## Migration Steps

### Step 1: Replace Direct Database Access

**Before (Insecure):**
\`\`\`typescript
// ❌ DON'T DO THIS
import { createServerClient } from '@/lib/appwrite/client'

async function PatientDetails({ patientId }: Props) {
  const appwrite = await createServerClient()
  const patient = await appwrite.databases.getDocument(
    DATABASE_ID,
    'patients',
    patientId
  )
  
  return <div>{patient.first_name}</div>
}
\`\`\`

**After (Secure):**
\`\`\`typescript
// ✅ DO THIS INSTEAD
'use client'
import { useSecurePatient } from '@/lib/hooks/use-secure-data'

function PatientDetails({ patientId }: Props) {
  const { patient, isLoading, isError } = useSecurePatient(patientId)
  
  if (isLoading) return <Spinner />
  if (isError) return <ErrorMessage />
  
  // Data is already decrypted based on user permissions
  return <div>{patient.first_name}</div>
}
\`\`\`

### Step 2: Update Data Mutations

**Before:**
\`\`\`typescript
// ❌ Old way
async function updatePatient(id: string, data: any) {
  const appwrite = await createServerClient()
  await appwrite.databases.updateDocument(DATABASE_ID, 'patients', id, data)
}
\`\`\`

**After:**
\`\`\`typescript
// ✅ New way
'use client'
import { useSecureMutation } from '@/lib/hooks/use-secure-data'
import { toast } from 'sonner'

function UpdatePatientForm({ patientId }: Props) {
  const { mutate, isLoading } = useSecureMutation()
  
  const handleSubmit = async (data: PatientData) => {
    try {
      await mutate(`/api/secure/patients/${patientId}`, 'PUT', data)
      toast.success('Patient updated successfully')
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  // ... form JSX
}
\`\`\`

### Step 3: Add Audit Trail UI

\`\`\`typescript
'use client'
import { useAuditLogs } from '@/lib/hooks/use-secure-data'
import { formatDistanceToNow } from 'date-fns'

function AuditTrail({ entityType, entityId }: Props) {
  const { auditLogs, isLoading } = useAuditLogs(entityType, entityId)
  
  if (isLoading) return <Spinner />
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activity History</h3>
      {auditLogs.map((log: any) => (
        <div key={log.$id} className="border-l-2 pl-4 py-2">
          <div className="flex justify-between">
            <span className="font-medium">{log.user_email}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm">
            {log.action} {log.entity_type}: {log.entity_description}
          </p>
          {log.risk_level === 'high' || log.risk_level === 'critical' ? (
            <Badge variant="destructive">{log.risk_level}</Badge>
          ) : null}
        </div>
      ))}
    </div>
  )
}
\`\`\`

### Step 4: Role-Based UI Rendering

\`\`\`typescript
import { getCurrentUser } from '@/lib/auth/actions'
import { hasPermission } from '@/lib/auth/permissions'

async function PatientActions({ patientId }: Props) {
  const user = await getCurrentUser()
  
  return (
    <div className="flex gap-2">
      {/* Show edit button only if user can manage patients */}
      {hasPermission(user.role, 'canManagePatients') && (
        <Button onClick={() => editPatient(patientId)}>
          Edit Patient
        </Button>
      )}
      
      {/* Show delete button only for admins */}
      {hasPermission(user.role, 'canDeleteRecords') && (
        <Button variant="destructive" onClick={() => deletePatient(patientId)}>
          Delete Patient
        </Button>
      )}
      
      {/* Show certificate issuance only for doctors */}
      {hasPermission(user.role, 'canIssueCertificates') && (
        <Button onClick={() => issueCertificate(patientId)}>
          Issue Certificate
        </Button>
      )}
    </div>
  )
}
\`\`\`

### Step 5: Handle Partial Data Access

Some fields may not be decrypted based on user role:

\`\`\`typescript
function PatientContact({ patient }: Props) {
  return (
    <div>
      {/* Always available (non-encrypted) */}
      <p>Patient ID: {patient.id}</p>
      
      {/* May be null if user doesn't have permission */}
      {patient.phone ? (
        <p>Phone: {patient.phone}</p>
      ) : (
        <p className="text-muted-foreground italic">
          Phone number restricted
        </p>
      )}
      
      {/* Sensitive medical info */}
      {patient.medical_history ? (
        <div>
          <h4>Medical History</h4>
          <p>{patient.medical_history}</p>
        </div>
      ) : hasPermission(user.role, 'canViewMedicalHistory') ? (
        <p>No medical history recorded</p>
      ) : (
        <p className="text-muted-foreground italic">
          Medical history access restricted
        </p>
      )}
    </div>
  )
}
\`\`\`

## Common Patterns

### List with Filters

\`\`\`typescript
'use client'
import { useSecurePatients } from '@/lib/hooks/use-secure-data'
import { useState } from 'react'

function PatientsList() {
  const [search, setSearch] = useState('')
  const [employerId, setEmployerId] = useState('')
  
  const { patients, isLoading } = useSecurePatients({
    search,
    employerId
  })
  
  return (
    <div>
      <Input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search patients..."
      />
      
      {isLoading ? (
        <Spinner />
      ) : (
        <Table>
          {patients.map(patient => (
            <TableRow key={patient.id}>
              <TableCell>{patient.first_name} {patient.last_name}</TableCell>
              {/* ... */}
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  )
}
\`\`\`

### Create with Validation

\`\`\`typescript
'use client'
import { useSecureMutation } from '@/lib/hooks/use-secure-data'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const patientSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  id_number: z.string().length(13),
  // ... other fields
})

function CreatePatientForm() {
  const { mutate, isLoading } = useSecureMutation()
  const form = useForm({
    resolver: zodResolver(patientSchema)
  })
  
  const onSubmit = async (data: z.infer<typeof patientSchema>) => {
    try {
      const result = await mutate('/api/secure/patients', 'POST', data)
      toast.success('Patient created successfully')
      router.push(`/patients/${result.id}`)
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Patient'}
        </Button>
      </form>
    </Form>
  )
}
\`\`\`

## Security Checklist

When updating components:

- [ ] Removed all direct database queries
- [ ] Using secure API endpoints
- [ ] Handling partial data access gracefully
- [ ] Showing/hiding UI based on permissions
- [ ] Displaying audit trails where appropriate
- [ ] Error messages don't leak sensitive info
- [ ] Loading states handled properly
- [ ] Client/server components used appropriately

## Component Migration Priority

Migrate in this order:

1. **Critical PHI components** (patient details, medical records)
2. **Data mutation forms** (create/update/delete operations)
3. **List/table components** (patient lists, appointment lists)
4. **Report/export features** (must audit all exports)
5. **Settings/admin pages** (permission-controlled features)

## Testing

Test each migrated component with different roles:

\`\`\`typescript
describe('Patient Details - Access Control', () => {
  it('shows full details to doctors', async () => {
    await loginAs('doctor')
    render(<PatientDetails patientId="123" />)
    expect(screen.getByText(/medical history/i)).toBeInTheDocument()
  })
  
  it('hides medical details from receptionists', async () => {
    await loginAs('receptionist')
    render(<PatientDetails patientId="123" />)
    expect(screen.queryByText(/medical history/i)).not.toBeInTheDocument()
  })
  
  it('prevents cross-clinic access', async () => {
    await loginAs('doctor', { clinicId: 'clinic1' })
    const { getByText } = render(<PatientDetails patientId="patient-from-clinic2" />)
    expect(getByText(/access denied/i)).toBeInTheDocument()
  })
})
\`\`\`

## Troubleshooting

### "Permission Denied" Errors
- Check user role has required permission
- Verify API route has correct role requirements
- Check audit logs for specific denial reason

### Missing Data Fields
- User may not have permission to decrypt field
- Check getAllowedDecryptionFields for user role
- Show appropriate "restricted" message

### Performance Issues
- Use SWR for caching
- Implement pagination for large lists
- Consider server-side rendering for initial load

## Next Steps

After migrating frontend:

1. Remove old direct database access code
2. Update documentation
3. Train staff on new UI
4. Monitor audit logs
5. Review performance metrics
