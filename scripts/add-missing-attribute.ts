// scripts/add-employer-sync-attributes.ts
import { Client, Databases, ID, IndexType } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
const API_KEY = process.env.APPWRITE_API_KEY!
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("❌ Missing environment variables")
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const databases = new Databases(client)

async function addStringAttribute(
  collection: string,
  name: string,
  required: boolean = false,
  size: number = 255,
  defaultValue?: string
) {
  try {
    console.log(`➕ Adding ${collection}.${name} (string, required: ${required})...`)
    
    await databases.createStringAttribute(
      DATABASE_ID,
      collection,
      name,
      size,
      required,
      defaultValue
    )
    
    console.log(`✅ Added ${collection}.${name}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ ${collection}.${name} already exists`)
    } else {
      console.error(`❌ Error adding ${collection}.${name}:`, error.message)
    }
  }
}

async function addBooleanAttribute(
  collection: string,
  name: string,
  required: boolean = false,
  defaultValue: boolean = false
) {
  try {
    console.log(`➕ Adding ${collection}.${name} (boolean, required: ${required}, default: ${defaultValue})...`)
    
    await databases.createBooleanAttribute(
      DATABASE_ID,
      collection,
      name,
      required,
      defaultValue
    )
    
    console.log(`✅ Added ${collection}.${name}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ ${collection}.${name} already exists`)
    } else {
      console.error(`❌ Error adding ${collection}.${name}:`, error.message)
    }
  }
}

async function addIntegerAttribute(
  collection: string,
  name: string,
  required: boolean = false,
  defaultValue?: number
) {
  try {
    console.log(`➕ Adding ${collection}.${name} (integer, required: ${required})...`)
    
    await databases.createIntegerAttribute(
      DATABASE_ID,
      collection,
      name,
      required,
      defaultValue
    )
    
    console.log(`✅ Added ${collection}.${name}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ ${collection}.${name} already exists`)
    } else {
      console.error(`❌ Error adding ${collection}.${name}:`, error.message)
    }
  }
}

async function addJsonAttribute(
  collection: string,
  name: string,
  required: boolean = false
) {
  try {
    console.log(`➕ Adding ${collection}.${name} (JSON, required: ${required})...`)
    
    // For Appwrite, JSON is stored as a string attribute
    await databases.createStringAttribute(
      DATABASE_ID,
      collection,
      name,
      5000, // Large enough for JSON
      required
    )
    
    console.log(`✅ Added ${collection}.${name}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ ${collection}.${name} already exists`)
    } else {
      console.error(`❌ Error adding ${collection}.${name}:`, error.message)
    }
  }
}

async function createIndex(
  collection: string,
  key: string
) {
  try {
    const indexId = `${collection}_${key}_idx`
    console.log(`📊 Creating index ${indexId} on ${collection}.${key}...`)
    
    // Use the enum values
    await databases.createIndex(
      DATABASE_ID,
      collection,
      indexId,
      IndexType.Key,  // Use the enum value
      [key],
      []
    )
    
    console.log(`✅ Created index on ${collection}.${key}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ Index on ${collection}.${key} already exists`)
    } else {
      console.error(`❌ Error creating index on ${collection}.${key}:`, error.message)
    }
  }
}

async function createFulltextIndex(
  collection: string,
  key: string
) {
  try {
    const indexId = `${collection}_${key}_fulltext_idx`
    console.log(`📊 Creating fulltext index ${indexId} on ${collection}.${key}...`)
    
    // Use the enum values
    await databases.createIndex(
      DATABASE_ID,
      collection,
      indexId,
      IndexType.Fulltext,  // Use the enum value
      [key],
      []
    )
    
    console.log(`✅ Created fulltext index on ${collection}.${key}`)
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ Fulltext index on ${collection}.${key} already exists`)
    } else {
      console.error(`❌ Error creating fulltext index on ${collection}.${key}:`, error.message)
    }
  }
}

async function main() {
  console.log('🚀 Adding employer-user sync database attributes...\n')

  // 1. Add employer-specific fields to USERS collection
  console.log('\n📋 USERS COLLECTION - Employer Fields')
  console.log('======================================')
  
  // Add employer business fields
  await addStringAttribute('users', 'company_name', false, 255)
  await addStringAttribute('users', 'registration_number', false, 100)
  await addStringAttribute('users', 'industry', false, 100)
  await addStringAttribute('users', 'billing_email', false, 255)
  await addIntegerAttribute('users', 'payment_terms', false, 30)
  
  // Add employer portal fields
  await addBooleanAttribute('users', 'portal_enabled', false, false)
  await addBooleanAttribute('users', 'auto_receive_certificates', false, false)
  
  // Add employer notification preferences (stored as JSON string)
  await addJsonAttribute('users', 'notification_preferences', false)
  
  // Create indexes for faster lookups
  await createIndex('users', 'email')
  await createFulltextIndex('users', 'company_name')

  // 2. Add user linking fields to EMPLOYERS collection
  console.log('\n📋 EMPLOYERS COLLECTION - User Linking')
  console.log('=======================================')
  
  // Add link to user collection
  await addStringAttribute('employers', 'linked_user_id', false, 36)
  
  // Add role field to employers (for consistency)
  await addStringAttribute('employers', 'role', false, 20, 'employer')
  
  // Create indexes for fast joins and lookups
  await createIndex('employers', 'linked_user_id')
  await createIndex('employers', 'auth_user_id')
  await createFulltextIndex('employers', 'company_name')

  // 3. Optional: Add migration flag to track migrated employers
  console.log('\n📋 EMPLOYERS COLLECTION - Migration Tracking')
  console.log('============================================')
  
  await addBooleanAttribute('employers', 'user_migrated', false, false)
  await addStringAttribute('employers', 'migration_date', false, 50)

  console.log('\n🎉 All employer-user sync attributes have been added/verified!')
  
  console.log('\n📋 Summary:')
  console.log('==========')
  console.log('✅ USERS COLLECTION - Added employer fields:')
  console.log('   - company_name (string, optional)')
  console.log('   - registration_number (string, optional)')
  console.log('   - industry (string, optional)')
  console.log('   - billing_email (string, optional)')
  console.log('   - payment_terms (integer, optional, default: 30)')
  console.log('   - portal_enabled (boolean, optional, default: false)')
  console.log('   - auto_receive_certificates (boolean, optional, default: false)')
  console.log('   - notification_preferences (JSON string, optional)')
  console.log('   - ✅ Index on email for fast lookups')
  console.log('   - ✅ Fulltext index on company_name for search')
  
  console.log('\n✅ EMPLOYERS COLLECTION - Added user linking:')
  console.log('   - linked_user_id (string, optional) - links to users.id')
  console.log('   - role (string, optional, default: "employer") - for consistency')
  console.log('   - user_migrated (boolean, optional, default: false) - migration tracking')
  console.log('   - migration_date (string, optional) - when migrated')
  console.log('   - ✅ Index on linked_user_id for fast joins')
  console.log('   - ✅ Index on auth_user_id for auth lookups')
  console.log('   - ✅ Fulltext index on company_name for search')
  
  console.log('\n⚙️ Next steps:')
  console.log('1. Run the employer migration script to link existing employers to users')
  console.log('2. Update your createEmployer action to create user entries')
  console.log('3. Update getCurrentUser() to only check users collection')
  console.log('4. Test employer authentication flow')
}

main().catch(console.error)