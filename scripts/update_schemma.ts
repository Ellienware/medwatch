// scripts/update_schemma.ts - UPDATED FOR CLOUD APPWRITE
import { Client, Databases } from 'node-appwrite'
import * as dotenv from 'dotenv'

// Load from .env.local
dotenv.config({ path: '.env.local' })

console.log('🔧 Connecting to Cloud Appwrite...')
console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
console.log('API Key:', process.env.APPWRITE_API_KEY ? '✓ Set' : '✗ Missing')

// Create client with Cloud Appwrite settings
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)
  .setSelfSigned(true) // Important for HTTPS

const databases = new Databases(client)
const DATABASE_ID = 'medsurv_db'

async function verifyConnection() {
  try {
    console.log('\n📡 Testing connection to Cloud Appwrite...')
    
    // Try a simple API call
    const response = await databases.list()
    console.log('✅ Connection successful!')
    console.log(`Found ${response.total} database(s)`)
    
    // Verify our database exists
    try {
      const db = await databases.get(DATABASE_ID)
      console.log(`✅ Database "${db.name}" found`)
      return true
    } catch (dbError) {
      console.error(`❌ Database "${DATABASE_ID}" not found`)
      console.error('Please create the database first in Appwrite Console')
      return false
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error))
    
    // Provide troubleshooting tips
    console.log('\n🔧 Troubleshooting tips:')
    console.log('1. Check your API key has proper permissions (Databases Read/Write)')
    console.log('2. Verify project ID is correct')
    console.log('3. Make sure you\'re using the correct endpoint for your region')
    console.log('   - fra.cloud.appwrite.io for Frankfurt')
    console.log('   - us.cloud.appwrite.io for USA')
    console.log('   - asia.cloud.appwrite.io for Asia')
    
    return false
  }
}

async function updateDatabase() {
  console.log('\n🚀 Starting database schema update...')
  
  // First verify connection
  if (!await verifyConnection()) {
    console.error('\n❌ Cannot proceed without valid connection')
    process.exit(1)
  }
  
  try {
    console.log('\n📊 Updating collections...')
    
    // Batch updates with error handling
    const updates = [
      { collection: 'test_results', fields: getTestResultFields() },
      { collection: 'certificates', fields: getCertificateFields() },
      { collection: 'appointments', fields: getAppointmentFields() },
      { collection: 'patients', fields: getPatientFields() },
    ]
    
    for (const update of updates) {
      await updateCollection(update.collection, update.fields)
    }
    
    console.log('\n🎉 Database update completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run appwrite:check')
    console.log('2. Update repository mapping functions')
    console.log('3. Test with your application')
    
  } catch (error) {
    console.error('\n❌ Update failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function getTestResultFields(): [string, string, any?][] {
  return [
    ['test_code', 'string', 100],
    ['test_name', 'string', 200],
    ['is_sensitive', 'boolean', false],
    ['test_price', 'float'],
    ['validation_warnings', 'string', 2000],
    ['requires_review', 'boolean', false],
    ['is_critical', 'boolean', false],
    ['validation_status', 'string', 50],
  ]
}

function getCertificateFields(): [string, string, any?][] {
  return [
    ['fitness_status', 'string', 50],
    ['medical_type', 'string', 50],
    ['template_type', 'string', 50],
    ['settings_override', 'string', 2000],
    ['lung_function_results', 'string', 1000],
    ['audiometry_results', 'string', 1000],
    ['vision_results', 'string', 500],
    ['urinalysis_results', 'string', 500],
    ['referrals', 'string', 500],
    ['rules_evaluation', 'string', 3000],
    ['suggested_fitness_decision', 'string', 50],
    ['evaluation_confidence', 'float'],
    ['doctor_decision_override', 'boolean', false],
    ['override_reason', 'string', 500],
    ['decision_validation', 'string', 1000],
    ['chest_xray_normal', 'boolean', true],
  ]
}

function getAppointmentFields(): [string, string, any?][] {
  return [
    ['last_test_at', 'datetime'],
    ['requires_doctor_review', 'boolean', false],
  ]
}

function getPatientFields(): [string, string, any?][] {
  return [
    ['merged_into', 'string', 36],
    ['merged_at', 'datetime'],
    ['merged_by', 'string', 36],
  ]
}

async function updateCollection(collectionId: string, fields: [string, string, any?][]) {
  console.log(`\n📝 Updating ${collectionId}...`)
  
  let added = 0
  let skipped = 0
  let failed = 0
  
  for (const [name, type, sizeOrDefault] of fields) {
    try {
      console.log(`  + ${name} (${type})`)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
      switch (type) {
        case 'string':
          await databases.createStringAttribute(DATABASE_ID, collectionId, name, sizeOrDefault || 255, false)
          break
        case 'boolean':
          await databases.createBooleanAttribute(DATABASE_ID, collectionId, name, false, sizeOrDefault || false)
          break
        case 'float':
          await databases.createFloatAttribute(DATABASE_ID, collectionId, name, false)
          break
        case 'datetime':
          await databases.createDatetimeAttribute(DATABASE_ID, collectionId, name, false)
          break
      }
      
      added++
      console.log(`    ✅ Added`)
      
    } catch (error: any) {
      if (error.code === 409) {
        skipped++
        console.log(`    ⚠️ Already exists`)
      } else if (error.code === 404) {
        failed++
        console.log(`    ❌ Collection not found`)
        break
      } else {
        failed++
        console.log(`    ❌ Error: ${error.message}`)
      }
    }
  }
  
  console.log(`  Results: ${added} added, ${skipped} skipped, ${failed} failed`)
}

// Run with error handling
updateDatabase().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})