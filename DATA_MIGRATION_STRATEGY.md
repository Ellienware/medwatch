# Data Migration Strategy

This document outlines the strategy for migrating existing plaintext data to encrypted format with zero downtime.

## Migration Phases

### Phase 1: Preparation (Week 1)
**Objective**: Set up encryption infrastructure without affecting existing operations

Tasks:
1. ✅ Add encrypted field attributes to all collections
2. ✅ Deploy Appwrite Functions for secure operations
3. ✅ Test encryption/decryption with sample data
4. ✅ Set up audit logging
5. ✅ Create rollback procedures
6. ✅ Train staff on new procedures

Status: No impact on production

---

### Phase 2: Dual-Write Implementation (Week 2)
**Objective**: Write to both plaintext and encrypted fields

Implementation:
\`\`\`typescript
// Modified create operation
async function createPatient(data: PatientData) {
  // Encrypt sensitive fields
  const encrypted = await encryptFields(data, SENSITIVE_FIELDS.PATIENTS)
  
  // Write BOTH plaintext and encrypted
  const patientData = {
    // Existing plaintext fields (for backward compatibility)
    first_name: data.first_name,
    last_name: data.last_name,
    // ... other plaintext fields
    
    // New encrypted fields
    ...encrypted
  }
  
  await db.createDocument('patients', patientData)
}
\`\`\`

Tasks:
1. Update all create/update operations to dual-write
2. Monitor for any issues
3. Verify encrypted data is valid
4. Test decryption in non-production code paths

Status: Production reads from plaintext, writes to both

---

### Phase 3: Background Migration (Week 3-4)
**Objective**: Encrypt all existing records

Implementation:
\`\`\`typescript
// Migration script
async function migrateExistingPatients() {
  const batchSize = 100
  let offset = 0
  let processed = 0
  
  while (true) {
    // Fetch batch of patients
    const patients = await db.listDocuments('patients', [
      Query.limit(batchSize),
      Query.offset(offset),
      Query.isNull('first_name_enc') // Only unmigrated records
    ])
    
    if (patients.documents.length === 0) break
    
    // Process batch
    for (const patient of patients.documents) {
      try {
        // Encrypt fields
        const encrypted = await encryptFields(patient, SENSITIVE_FIELDS.PATIENTS)
        
        // Update with encrypted data only (keep plaintext for now)
        await db.updateDocument('patients', patient.$id, encrypted)
        
        processed++
        
        // Audit the migration
        await auditUpdate({
          clinicId: patient.clinic_id,
          userId: 'system',
          userEmail: 'system@medserv.com',
          userRole: 'super_admin',
          entityType: 'patient',
          entityId: patient.$id,
          entityDescription: 'Encrypted during migration',
          metadata: { migration: true }
        })
      } catch (error) {
        console.error(`Failed to migrate patient ${patient.$id}:`, error)
        // Log failures for manual review
      }
    }
    
    offset += batchSize
    console.log(`Migrated ${processed} patients...`)
    
    // Rate limiting
    await sleep(1000)
  }
  
  console.log(`Migration complete: ${processed} patients`)
}
\`\`\`

Tasks:
1. Run migration script on non-production environment first
2. Validate migrated data
3. Run production migration during low-traffic hours
4. Monitor error rates and performance
5. Keep plaintext fields as backup

Status: All records have both plaintext and encrypted data

---

### Phase 4: Switch to Encrypted Reads (Week 5)
**Objective**: Start reading from encrypted fields

Implementation:
\`\`\`typescript
// Updated read operation
async function getPatient(patientId: string) {
  const patient = await db.getDocument('patients', patientId)
  
  // Check if encrypted data exists
  if (patient.first_name_enc) {
    // Decrypt and return
    return await decryptFields(patient, SENSITIVE_FIELDS.PATIENTS)
  } else {
    // Fallback to plaintext (for any unmigrated records)
    return patient
  }
}
\`\`\`

Tasks:
1. Update all read operations to prefer encrypted data
2. Keep fallback to plaintext for safety
3. Monitor decryption performance
4. Watch for any decryption errors

Status: Production reads from encrypted, plaintext still available as backup

---

### Phase 5: Plaintext Cleanup (Week 6-7)
**Objective**: Remove plaintext sensitive data

**Important**: This is irreversible. Ensure Phase 4 is stable for at least 1 week before proceeding.

Implementation:
\`\`\`typescript
// Cleanup script
async function clearPlaintextFields() {
  const batchSize = 100
  let offset = 0
  
  while (true) {
    const patients = await db.listDocuments('patients', [
      Query.limit(batchSize),
      Query.offset(offset),
      Query.isNotNull('first_name_enc') // Only migrated records
    ])
    
    if (patients.documents.length === 0) break
    
    for (const patient of patients.documents) {
      // Set plaintext fields to null
      await db.updateDocument('patients', patient.$id, {
        first_name: null,
        last_name: null,
        id_number: null,
        passport_number: null,
        phone: null,
        email: null,
        address: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        medical_history: null,
        current_medications: null,
        allergies: null,
      })
    }
    
    offset += batchSize
    await sleep(1000)
  }
}
\`\`\`

Tasks:
1. Create full database backup before cleanup
2. Run cleanup script
3. Verify application still functions correctly
4. Monitor for any issues
5. After 1 week of stability, remove plaintext attributes from schema

Status: Only encrypted data remains

---

## Rollback Procedures

### Rollback from Phase 2-3
**If issues found during dual-write or migration:**

1. Stop migration script
2. Revert code to read from plaintext only
3. Keep dual-write for future retry
4. Investigate and fix issues
5. Resume when ready

**Impact**: Minimal - plaintext still authoritative

### Rollback from Phase 4
**If decryption issues occur:**

1. Emergency code deployment to read from plaintext
2. Investigate decryption failures
3. Fix corrupt encrypted records
4. Resume encrypted reads when stable

**Impact**: Low - plaintext backup still exists

### Rollback from Phase 5
**If critical issues after plaintext cleanup:**

This is difficult but possible:
1. Restore from full database backup taken before cleanup
2. Lose any data created after cleanup
3. Re-run migration with fixes

**Impact**: High - potential data loss

**Prevention**: Wait at least 1 week of stable Phase 4 before Phase 5

---

## Monitoring During Migration

### Key Metrics
1. **Migration Progress**: Track % of records migrated
2. **Error Rate**: Failed encryption/decryption operations
3. **Performance**: Response times before/after
4. **Audit Logs**: Review for suspicious activity
5. **Storage Usage**: Monitor database size increase

### Alerts
Set up alerts for:
- Decryption failure rate > 0.1%
- Response time increase > 20%
- Migration script errors
- Disk space usage > 80%

---

## Testing Checklist

Before each phase:

- [ ] Test on non-production environment
- [ ] Verify encryption/decryption works correctly
- [ ] Check all user roles can access their permitted data
- [ ] Validate audit logs are created
- [ ] Test rollback procedure
- [ ] Performance test with realistic data volume
- [ ] Security review by qualified personnel
- [ ] Document any issues found

---

## Success Criteria

Migration is successful when:
1. ✅ All existing records have encrypted data
2. ✅ All new records use encrypted fields
3. ✅ Decryption success rate > 99.9%
4. ✅ Performance within 10% of baseline
5. ✅ No security vulnerabilities introduced
6. ✅ Audit logs tracking all operations
7. ✅ Rollback procedures tested and documented
8. ✅ Staff trained on new system

---

## Timeline Summary

| Phase | Duration | Risk Level | Rollback Difficulty |
|---|---|---|---|
| 1. Preparation | 1 week | None | Easy |
| 2. Dual-Write | 1 week | Low | Easy |
| 3. Background Migration | 1-2 weeks | Low | Easy |
| 4. Encrypted Reads | 1 week | Medium | Easy |
| 5. Plaintext Cleanup | 1-2 weeks | High | Difficult |

**Total Timeline**: 5-7 weeks for complete migration

**Recommendation**: Do not rush Phase 5. Better to keep plaintext backup longer than risk data loss.
