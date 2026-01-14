# Database Schema Updates for Encryption

This document details the required changes to Appwrite collections to support encrypted fields.

## Overview

For each sensitive field, we need to add three new attributes:
- `{field}_enc` - Stores the encrypted ciphertext (string, base64)
- `{field}_iv` - Stores the initialization vector (string, base64)
- `{field}_tag` - Stores the authentication tag (string, base64)

The original plaintext field can be removed or kept empty for backward compatibility during migration.

---

## Collection: patients

### Sensitive Fields to Encrypt
1. first_name
2. last_name
3. id_number
4. passport_number
5. phone
6. email
7. address
8. emergency_contact_name
9. emergency_contact_phone
10. medical_history
11. current_medications
12. allergies

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| first_name_enc | string | 500 | false | null | Encrypted first name |
| first_name_iv | string | 100 | false | null | IV for first name |
| first_name_tag | string | 100 | false | null | Auth tag for first name |
| last_name_enc | string | 500 | false | null | Encrypted last name |
| last_name_iv | string | 100 | false | null | IV for last name |
| last_name_tag | string | 100 | false | null | Auth tag for last name |
| id_number_enc | string | 500 | false | null | Encrypted ID number |
| id_number_iv | string | 100 | false | null | IV for ID number |
| id_number_tag | string | 100 | false | null | Auth tag for ID number |
| passport_number_enc | string | 500 | false | null | Encrypted passport |
| passport_number_iv | string | 100 | false | null | IV for passport |
| passport_number_tag | string | 100 | false | null | Auth tag for passport |
| phone_enc | string | 500 | false | null | Encrypted phone |
| phone_iv | string | 100 | false | null | IV for phone |
| phone_tag | string | 100 | false | null | Auth tag for phone |
| email_enc | string | 500 | false | null | Encrypted email |
| email_iv | string | 100 | false | null | IV for email |
| email_tag | string | 100 | false | null | Auth tag for email |
| address_enc | string | 1000 | false | null | Encrypted address |
| address_iv | string | 100 | false | null | IV for address |
| address_tag | string | 100 | false | null | Auth tag for address |
| emergency_contact_name_enc | string | 500 | false | null | Encrypted emergency contact |
| emergency_contact_name_iv | string | 100 | false | null | IV for emergency contact |
| emergency_contact_name_tag | string | 100 | false | null | Auth tag for emergency contact |
| emergency_contact_phone_enc | string | 500 | false | null | Encrypted emergency phone |
| emergency_contact_phone_iv | string | 100 | false | null | IV for emergency phone |
| emergency_contact_phone_tag | string | 100 | false | null | Auth tag for emergency phone |
| medical_history_enc | string | 5000 | false | null | Encrypted medical history |
| medical_history_iv | string | 100 | false | null | IV for medical history |
| medical_history_tag | string | 100 | false | null | Auth tag for medical history |
| current_medications_enc | string | 5000 | false | null | Encrypted medications |
| current_medications_iv | string | 100 | false | null | IV for medications |
| current_medications_tag | string | 100 | false | null | Auth tag for medications |
| allergies_enc | string | 5000 | false | null | Encrypted allergies |
| allergies_iv | string | 100 | false | null | IV for allergies |
| allergies_tag | string | 100 | false | null | Auth tag for allergies |

### Migration Notes
- Keep original fields during migration for backward compatibility
- After migration complete, original fields can be set to null or removed
- Add indexes on non-encrypted searchable fields only

---

## Collection: appointments

### Sensitive Fields to Encrypt
1. notes (examination_findings)

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| notes_enc | string | 10000 | false | null | Encrypted notes |
| notes_iv | string | 100 | false | null | IV for notes |
| notes_tag | string | 100 | false | null | Auth tag for notes |
| examination_findings_enc | string | 10000 | false | null | Encrypted findings |
| examination_findings_iv | string | 100 | false | null | IV for findings |
| examination_findings_tag | string | 100 | false | null | Auth tag for findings |

---

## Collection: test_results

### Sensitive Fields to Encrypt
1. test_data (JSON field)
2. notes
3. technician_notes

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| test_data_enc | string | 10000 | false | null | Encrypted test data JSON |
| test_data_iv | string | 100 | false | null | IV for test data |
| test_data_tag | string | 100 | false | null | Auth tag for test data |
| notes_enc | string | 5000 | false | null | Encrypted notes |
| notes_iv | string | 100 | false | null | IV for notes |
| notes_tag | string | 100 | false | null | Auth tag for notes |
| technician_notes_enc | string | 5000 | false | null | Encrypted technician notes |
| technician_notes_iv | string | 100 | false | null | IV for technician notes |
| technician_notes_tag | string | 100 | false | null | Auth tag for technician notes |

---

## Collection: certificates

### Sensitive Fields to Encrypt
1. medical_conditions
2. restrictions
3. recommendations
4. doctor_notes

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| medical_conditions_enc | string | 5000 | false | null | Encrypted conditions |
| medical_conditions_iv | string | 100 | false | null | IV for conditions |
| medical_conditions_tag | string | 100 | false | null | Auth tag for conditions |
| restrictions_enc | string | 5000 | false | null | Encrypted restrictions |
| restrictions_iv | string | 100 | false | null | IV for restrictions |
| restrictions_tag | string | 100 | false | null | Auth tag for restrictions |
| recommendations_enc | string | 5000 | false | null | Encrypted recommendations |
| recommendations_iv | string | 100 | false | null | IV for recommendations |
| recommendations_tag | string | 100 | false | null | Auth tag for recommendations |
| doctor_notes_enc | string | 5000 | false | null | Encrypted doctor notes |
| doctor_notes_iv | string | 100 | false | null | IV for doctor notes |
| doctor_notes_tag | string | 100 | false | null | Auth tag for doctor notes |

---

## Collection: users

### Sensitive Fields to Encrypt
1. phone
2. email

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| phone_enc | string | 500 | false | null | Encrypted phone |
| phone_iv | string | 100 | false | null | IV for phone |
| phone_tag | string | 100 | false | null | Auth tag for phone |
| email_enc | string | 500 | false | null | Encrypted email |
| email_iv | string | 100 | false | null | IV for email |
| email_tag | string | 100 | false | null | Auth tag for email |

---

## Collection: employers

### Sensitive Fields to Encrypt
1. contact_person
2. contact_email
3. contact_phone

### Required New Attributes

| Attribute Name | Type | Size | Required | Default | Description |
|---|---|---|---|---|---|
| contact_person_enc | string | 500 | false | null | Encrypted contact name |
| contact_person_iv | string | 100 | false | null | IV for contact name |
| contact_person_tag | string | 100 | false | null | Auth tag for contact name |
| contact_email_enc | string | 500 | false | null | Encrypted contact email |
| contact_email_iv | string | 100 | false | null | IV for contact email |
| contact_email_tag | string | 100 | false | null | Auth tag for contact email |
| contact_phone_enc | string | 500 | false | null | Encrypted contact phone |
| contact_phone_iv | string | 100 | false | null | IV for contact phone |
| contact_phone_tag | string | 100 | false | null | Auth tag for contact phone |

---

## Implementation Steps

### Step 1: Add Encrypted Attributes
For each collection above:
1. Go to Appwrite Console → Databases → [Collection]
2. Click "Add Attribute"
3. Select "String" type
4. Enter attribute name (e.g., `first_name_enc`)
5. Set size as specified in tables above
6. Set Required = false
7. Leave default as null
8. Repeat for _iv and _tag fields

### Step 2: Update Collection Permissions
Ensure collection permissions restrict direct access:
- Read: None (force use of Appwrite Functions)
- Create: None (force use of Appwrite Functions)
- Update: None (force use of Appwrite Functions)
- Delete: None (force use of Appwrite Functions)

Exception: Super Admin role can have read access for emergency recovery.

### Step 3: Test with Sample Data
1. Create test records with encrypted fields
2. Verify encryption/decryption works correctly
3. Test access control enforcement
4. Verify audit logs are created

### Step 4: Migrate Existing Data
See DATA_MIGRATION_STRATEGY.md for detailed migration procedures.

---

## Indexing Strategy

### DO Index (Non-Encrypted Fields Only)
- clinic_id (all collections)
- created_at, updated_at (all collections)
- appointment_date, status (appointments)
- certificate_number (certificates)
- is_active (all collections)

### DO NOT Index (Encrypted Fields)
- Any field with _enc, _iv, or _tag suffix
- These fields are not searchable and don't need indexes

### Search Fields
For searchable fields that need to be encrypted, create separate non-encrypted hash fields:
- `id_number_hash` - SHA-256 hash for exact match searches
- `phone_hash` - SHA-256 hash for phone lookups
- `email_hash` - SHA-256 hash for email lookups

This allows searches without decryption but doesn't reveal the actual values.

---

## Backup and Recovery

### Before Making Changes
1. Export all collections to JSON
2. Store backup in secure location
3. Document current schema
4. Test restore procedure

### Emergency Rollback
If issues occur:
1. Stop all operations
2. Restore from backup
3. Remove encrypted attributes
4. Resume normal operations
5. Investigate issues before retry

---

## Monitoring

After implementation, monitor:
- Query performance (should remain similar)
- Storage usage (will increase ~3x for encrypted fields)
- Function execution times
- Audit log growth rate
- Failed decryption attempts
