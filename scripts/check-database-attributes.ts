// scripts/check-database-attributes.ts
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"

// Define expected fields based on your TypeScript interfaces
const EXPECTED_FIELDS: Record<string, Array<{
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'datetime' | 'null';
  optional?: boolean;
}>> = {
  [COLLECTIONS.USERS]: [
    { name: 'id', type: 'string' },
    { name: 'clinic_id', type: 'string', optional: true },
    { name: 'branch_id', type: 'string', optional: true },
    { name: 'auth_user_id', type: 'string', optional: true },
    { name: 'email', type: 'string' },
    { name: 'full_name', type: 'string' },
    { name: 'phone', type: 'string', optional: true },
    { name: 'role', type: 'string' },
    { name: 'permissions', type: 'object' },
    { name: 'professional_registration_number', type: 'string', optional: true },
    { name: 'specialization', type: 'string', optional: true },
    { name: 'avatar_url', type: 'string', optional: true },
    { name: 'is_active', type: 'boolean' },
    { name: 'last_login', type: 'datetime', optional: true },
    { name: 'first_login_required', type: 'boolean' },
    { name: 'temporary_password_set', type: 'boolean' },
    { name: 'invitation_token', type: 'string', optional: true },
    { name: 'invitation_sent_at', type: 'datetime', optional: true },
    { name: 'invited_at', type: 'datetime', optional: true },
    { name: 'invitation_status', type: 'string', optional: true },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  [COLLECTIONS.CLINICS]: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'registration_number', type: 'string', optional: true },
    { name: 'email', type: 'string' },
    { name: 'phone', type: 'string', optional: true },
    { name: 'address', type: 'string', optional: true },
    { name: 'logo_url', type: 'string', optional: true },
    { name: 'settings', type: 'object' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
    { name: 'data_retention_days', type: 'number' },
    { name: 'subscription_plan', type: 'string' },
    { name: 'subscription_status', type: 'string' },
    { name: 'trial_started_at', type: 'datetime', optional: true },
    { name: 'trial_ends_at', type: 'datetime', optional: true },
    { name: 'selected_plan', type: 'string', optional: true },
    { name: 'subscription_start_date', type: 'datetime', optional: true },
    { name: 'subscription_end_date', type: 'datetime', optional: true },
    { name: 'next_billing_date', type: 'datetime', optional: true },
    { name: 'monthly_patient_limit', type: 'number' },
    { name: 'current_month_patients', type: 'number' },
    { name: 'paystack_customer_id', type: 'string', optional: true },
    { name: 'paystack_subscription_id', type: 'string', optional: true },
    { name: 'payment_method_id', type: 'string', optional: true },
    { name: 'max_branches', type: 'number' },
    { name: 'current_branches', type: 'number' }
  ],
  [COLLECTIONS.PATIENTS]: [
    { name: 'id', type: 'string' },
    { name: 'clinic_id', type: 'string' },
    { name: 'employer_id', type: 'string', optional: true },
    { name: 'id_number', type: 'string' },
    { name: 'passport_number', type: 'string', optional: true },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'date_of_birth', type: 'datetime' },
    { name: 'gender', type: 'string', optional: true },
    { name: 'email', type: 'string', optional: true },
    { name: 'phone', type: 'string', optional: true },
    { name: 'address', type: 'string', optional: true },
    { name: 'employee_number', type: 'string', optional: true },
    { name: 'job_title', type: 'string', optional: true },
    { name: 'department', type: 'string', optional: true },
    { name: 'employment_start_date', type: 'datetime', optional: true },
    { name: 'blood_type', type: 'string', optional: true },
    { name: 'allergies', type: 'string', optional: true },
    { name: 'chronic_conditions', type: 'string', optional: true },
    { name: 'emergency_contact_name', type: 'string', optional: true },
    { name: 'emergency_contact_phone', type: 'string', optional: true },
    { name: 'consent_given', type: 'boolean' },
    { name: 'consent_date', type: 'datetime', optional: true },
    { name: 'photo_url', type: 'string', optional: true },
    { name: 'notes', type: 'string', optional: true },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  [COLLECTIONS.CERTIFICATES]: [
    { name: 'id', type: 'string' },
    { name: 'clinic_id', type: 'string' },
    { name: 'appointment_id', type: 'string' },
    { name: 'patient_id', type: 'string' },
    { name: 'certificate_number', type: 'string' },
    { name: 'certificate_type', type: 'string' },
    { name: 'issue_date', type: 'datetime' },
    { name: 'valid_from', type: 'datetime', optional: true },
    { name: 'valid_until', type: 'datetime', optional: true },
    { name: 'diagnosis', type: 'string', optional: true },
    { name: 'restrictions', type: 'string', optional: true },
    { name: 'recommendations', type: 'string', optional: true },
    { name: 'issued_by', type: 'string' },
    { name: 'doctor_name', type: 'string' },
    { name: 'doctor_registration_number', type: 'string', optional: true },
    { name: 'doctor_signature_url', type: 'string', optional: true },
    { name: 'pdf_url', type: 'string', optional: true },
    { name: 'sent_to_employer', type: 'boolean' },
    { name: 'sent_to_patient', type: 'boolean' },
    { name: 'sent_at', type: 'datetime', optional: true },
    { name: 'status', type: 'string' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' },
    { name: 'test_results', type: 'array', optional: true }
  ],
  [COLLECTIONS.EMPLOYERS]: [
    { name: 'id', type: 'string' },
    { name: 'clinic_id', type: 'string' },
    { name: 'company_name', type: 'string' },
    { name: 'registration_number', type: 'string', optional: true },
    { name: 'industry', type: 'string', optional: true },
    { name: 'email', type: 'string' },
    { name: 'phone', type: 'string', optional: true },
    { name: 'address', type: 'string', optional: true },
    { name: 'billing_email', type: 'string', optional: true },
    { name: 'payment_terms', type: 'number' },
    { name: 'portal_user_id', type: 'string', optional: true },
    { name: 'auth_user_id', type: 'string', optional: true },
    { name: 'portal_enabled', type: 'boolean' },
    { name: 'auto_receive_certificates', type: 'boolean' },
    { name: 'notification_preferences', type: 'object' },
    { name: 'is_active', type: 'boolean' },
    { name: 'first_login_required', type: 'boolean' },
    { name: 'temporary_password_set', type: 'boolean' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  [COLLECTIONS.BRANCHES]: [
    { name: 'id', type: 'string' },
    { name: 'clinic_id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'code', type: 'string' },
    { name: 'email', type: 'string', optional: true },
    { name: 'phone', type: 'string', optional: true },
    { name: 'address', type: 'string', optional: true },
    { name: 'latitude', type: 'number', optional: true },
    { name: 'longitude', type: 'number', optional: true },
    { name: 'operating_hours', type: 'object' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ]
}

// Skip system fields
const SYSTEM_FIELDS = ['$id', '$collectionId', '$databaseId', '$createdAt', '$updatedAt', '$permissions']

async function checkCollection(collectionId: string) {
  console.log(`\n🔍 Checking: ${collectionId}`)
  
  try {
    // Create server client
    const appwrite = createServerClient()
    
    // Get a few sample documents
    const response = await appwrite.databases.listDocuments(
      APPWRITE_DATABASE_ID,
      collectionId,
      [Query.limit(3)]
    )

    if (response.documents.length === 0) {
      console.log(`⚠️ No documents found`)
      return { collection: collectionId, hasDocuments: false }
    }

    console.log(`📊 Found ${response.documents.length} document(s)`)

    const expectedFields = EXPECTED_FIELDS[collectionId] || []
    
    // Analyze all documents
    const allDocFields = new Set<string>()
    
    response.documents.forEach((doc: any) => {
      Object.keys(doc).forEach(field => {
        if (!SYSTEM_FIELDS.includes(field)) {
          allDocFields.add(field)
        }
      })
    })

    const actualFields = Array.from(allDocFields)
    const expectedFieldNames = expectedFields.map(f => f.name)
    
    // Find missing fields
    const missingFields = expectedFields.filter(expected => 
      !actualFields.some(actual => actual === expected.name)
    )
    
    // Find unexpected fields
    const unexpectedFields = actualFields.filter(actual => 
      !expectedFieldNames.includes(actual)
    )

    console.log(`📋 Expected fields: ${expectedFieldNames.length}`)
    console.log(`📋 Actual fields in DB: ${actualFields.length}`)
    
    if (missingFields.length > 0) {
      console.log(`\n❌ MISSING FIELDS (${missingFields.length}):`)
      missingFields.forEach(field => {
        const status = field.optional ? 'optional' : 'required'
        console.log(`   - ${field.name} (${field.type}, ${status})`)
      })
    } else {
      console.log(`✅ No missing fields`)
    }

    if (unexpectedFields.length > 0) {
      console.log(`\n⚠️ UNEXPECTED FIELDS (${unexpectedFields.length}):`)
      unexpectedFields.forEach(field => {
        console.log(`   - ${field}`)
      })
    } else {
      console.log(`✅ No unexpected fields`)
    }

    // Show a sample document
    if (response.documents.length > 0) {
      console.log(`\n📄 SAMPLE DOCUMENT (first of ${response.documents.length}):`)
      const sampleDoc = response.documents[0] as any
      
      expectedFields.forEach(expectedField => {
        const fieldName = expectedField.name
        const value = sampleDoc[fieldName]
        const exists = value !== undefined
        const type = typeof value
        const isRequired = !expectedField.optional
        
        let status = '❓'
        if (exists) status = '✅'
        else if (isRequired) status = '❌'
        else status = '➖'
        
        console.log(`   ${status} ${fieldName}: ${type} = ${JSON.stringify(value)}`)
      })
    }

    return {
      collection: collectionId,
      hasDocuments: true,
      documentCount: response.documents.length,
      expectedFieldCount: expectedFieldNames.length,
      actualFieldCount: actualFields.length,
      missingFields: missingFields.map(f => ({ name: f.name, type: f.type, optional: f.optional || false })),
      unexpectedFields
    }

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`)
    return { collection: collectionId, error: error.message }
  }
}

async function main() {
  console.log('🔍 DATABASE ATTRIBUTE CHECKER')
  console.log('=============================')

  const collections = Object.keys(EXPECTED_FIELDS)
  const results = []
  
  for (const collectionId of collections) {
    const result = await checkCollection(collectionId)
    results.push(result)
  }

  console.log('\n📊 SUMMARY')
  console.log('==========')
  
  let totalMissing = 0
  let totalUnexpected = 0
  let collectionsWithDocs = 0

  results.forEach(result => {
    if (result.hasDocuments) {
      collectionsWithDocs++
      totalMissing += result.missingFields?.length || 0
      totalUnexpected += result.unexpectedFields?.length || 0
      
      console.log(`\n${result.collection}:`)
      console.log(`  Documents: ${result.documentCount}`)
      console.log(`  Expected fields: ${result.expectedFieldCount}`)
      console.log(`  Actual fields: ${result.actualFieldCount}`)
      console.log(`  Missing: ${result.missingFields?.length || 0}`)
      console.log(`  Unexpected: ${result.unexpectedFields?.length || 0}`)
      
      if (result.missingFields && result.missingFields.length > 0) {
        console.log(`  Missing fields: ${result.missingFields.map((f: any) => f.name).join(', ')}`)
      }
    }
  })

  console.log('\n🎯 TOTALS')
  console.log('========')
  console.log(`Collections checked: ${collections.length}`)
  console.log(`Collections with documents: ${collectionsWithDocs}`)
  console.log(`Total missing fields: ${totalMissing}`)
  console.log(`Total unexpected fields: ${totalUnexpected}`)

  // Generate simple recommendations
  if (totalMissing > 0) {
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('-----------------')
    
    results.forEach(result => {
      if (result.missingFields && result.missingFields.length > 0) {
        console.log(`\nFor ${result.collection}:`)
        result.missingFields.forEach((field: any) => {
          console.log(`  • Add "${field.name}" (${field.type}${field.optional ? ', optional' : ''})`)
        })
      }
    })
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { checkCollection }