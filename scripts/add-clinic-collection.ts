// scripts/add-missing-clinic-attributes.ts
import { Client, Databases } from "node-appwrite"
import * as dotenv from "dotenv"

/* --------------------------------------------------
   LOAD ENV
-------------------------------------------------- */
dotenv.config({ path: '.env.local' })

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

// Validate environment variables
console.log("🔧 Checking environment variables...")
console.log(`   Endpoint: ${ENDPOINT ? "✓" : "✗"} ${ENDPOINT}`)
console.log(`   Project ID: ${PROJECT_ID ? "✓" : "✗"} ${PROJECT_ID}`)
console.log(`   Database ID: ${DATABASE_ID ? "✓" : "✗"} ${DATABASE_ID}`)
console.log(`   API Key: ${API_KEY ? "✓ Set" : "✗ Missing"}`)

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("\n❌ Missing required environment variables!")
  process.exit(1)
}

// After validation
const validatedEndpoint = ENDPOINT as string
const validatedProjectId = PROJECT_ID as string
const validatedApiKey = API_KEY as string
const validatedDatabaseId = DATABASE_ID as string

/* --------------------------------------------------
   CLIENT
-------------------------------------------------- */
console.log("\n🔗 Initializing Appwrite client...")
const client = new Client()
  .setEndpoint(validatedEndpoint)
  .setProject(validatedProjectId)
  .setKey(validatedApiKey)

const databases = new Databases(client)

/* --------------------------------------------------
   HELPER FUNCTIONS
-------------------------------------------------- */
async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function safeOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
  try {
    return await operation()
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`   ⚠ Already exists: ${operationName}`)
      return null
    } else if (error.code === 404) {
      console.log(`   ⚠ Not found: ${operationName}`)
      return null
    } else {
      console.error(`   ✗ Error in ${operationName}:`, error.message)
      throw error
    }
  }
}

async function getExistingAttributes(collectionId: string): Promise<string[]> {
  try {
    const collection = await databases.getCollection(validatedDatabaseId, collectionId)
    return collection.attributes.map((attr: any) => attr.key)
  } catch (error: any) {
    if (error.code === 404) {
      return []
    }
    throw error
  }
}

async function addStringAttribute(
  collectionId: string,
  attributeName: string,
  size: number = 255,
  required: boolean = false,
  defaultValue?: string,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createStringAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      size,
      required,
      defaultValue
    ),
    `${collectionId}.${attributeName} (string)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

async function addDatetimeAttribute(
  collectionId: string,
  attributeName: string,
  required: boolean = false,
  defaultValue?: string,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createDatetimeAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      required,
      defaultValue
    ),
    `${collectionId}.${attributeName} (datetime)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

async function addIntegerAttribute(
  collectionId: string,
  attributeName: string,
  required: boolean = false,
  min?: number,
  max?: number,
  defaultValue?: number,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createIntegerAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      required,
      min,
      max,
      defaultValue
    ),
    `${collectionId}.${attributeName} (integer)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

async function addBooleanAttribute(
  collectionId: string,
  attributeName: string,
  required: boolean = false,
  defaultValue?: boolean,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createBooleanAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      required,
      defaultValue
    ),
    `${collectionId}.${attributeName} (boolean)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

async function addFloatAttribute(
  collectionId: string,
  attributeName: string,
  required: boolean = false,
  min?: number,
  max?: number,
  defaultValue?: number,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createFloatAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      required,
      min,
      max,
      defaultValue
    ),
    `${collectionId}.${attributeName} (float)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

async function addEmailAttribute(
  collectionId: string,
  attributeName: string,
  required: boolean = false,
  defaultValue?: string,
  existingAttributes?: string[]
): Promise<boolean> {
  if (existingAttributes && existingAttributes.includes(attributeName)) {
    console.log(`   ⚠ Attribute already exists: ${collectionId}.${attributeName}`)
    return false
  }

  const result = await safeOperation(
    () => databases.createEmailAttribute(
      validatedDatabaseId,
      collectionId,
      attributeName,
      required,
      defaultValue
    ),
    `${collectionId}.${attributeName} (email)`
  )

  if (result !== null) {
    console.log(`   ✓ Added attribute: ${collectionId}.${attributeName}`)
    return true
  }
  return false
}

/* --------------------------------------------------
   CLINICS COLLECTION ATTRIBUTES
-------------------------------------------------- */
async function setupClinicsAttributes() {
  console.log("\n🏥 Setting up clinics collection attributes...")
  
  // Check if collection exists
  const collectionExists = await safeOperation(
    () => databases.getCollection(validatedDatabaseId, 'clinics'),
    'clinics collection check'
  )
  
  if (!collectionExists) {
    console.log("   ⚠ 'clinics' collection doesn't exist. Creating it first...")
    
    // Create the collection first
    const Permission = (await import('node-appwrite')).Permission
    const Role = (await import('node-appwrite')).Role
    const admin = Role.team('admin')
    
    const created = await safeOperation(
      () => databases.createCollection(
        validatedDatabaseId,
        'clinics',
        'Clinics',
        [Permission.read(admin), Permission.write(admin)],
        false
      ),
      'Create clinics collection'
    )
    
    if (!created) {
      console.error("   ✗ Failed to create clinics collection")
      return { added: 0, skipped: 0 }
    }
    
    console.log("   ✓ Created 'clinics' collection")
    await sleep(1000) // Wait for collection to be ready
  }
  
  // Get existing attributes
  const existingAttributes = await getExistingAttributes('clinics')
  console.log(`   Found ${existingAttributes.length} existing attributes`)
  
  // Define all required attributes for clinics
  const clinicAttributes = [
    // Basic Information
    { name: 'name', type: 'string', size: 255, required: true },
    { name: 'registration_number', type: 'string', size: 100, required: false },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'string', size: 50, required: false },
    { name: 'address', type: 'string', size: 500, required: false },
    { name: 'logo_url', type: 'string', size: 500, required: false },
    
    // Subscription & Billing
    { name: 'subscription_plan', type: 'string', size: 50, required: true, defaultValue: 'trial' },
    { name: 'subscription_status', type: 'string', size: 50, required: true, defaultValue: 'trial' },
    { name: 'selected_plan', type: 'string', size: 100, required: false },
    { name: 'trial_started_at', type: 'datetime', required: false },
    { name: 'trial_ends_at', type: 'datetime', required: false },
    { name: 'subscription_start_date', type: 'datetime', required: false },
    { name: 'subscription_end_date', type: 'datetime', required: false },
    { name: 'next_billing_date', type: 'datetime', required: false },
    { name: 'payment_method_id', type: 'string', size: 255, required: false },
    
    // Patient Limits
    { name: 'monthly_patient_limit', type: 'integer', required: true, defaultValue: 100 },
    { name: 'current_month_patients', type: 'integer', required: true, defaultValue: 0 },
    
    // Branch Management
    { name: 'max_branches', type: 'integer', required: true, defaultValue: 1 },
    { name: 'current_branches', type: 'integer', required: true, defaultValue: 0 },
    
    // Payment Integration
    { name: 'paystack_customer_id', type: 'string', size: 100, required: false },
    { name: 'paystack_subscription_id', type: 'string', size: 100, required: false },
    
    // Settings & Status
    { name: 'settings', type: 'string', size: 2000, required: false },
    { name: 'is_active', type: 'boolean', required: true, defaultValue: true },
    { name: 'data_retention_days', type: 'integer', required: true, defaultValue: 730 },
    
    // Timestamps (these should be auto-managed by Appwrite, but we define them)
    { name: 'created_at', type: 'datetime', required: true },
    { name: 'updated_at', type: 'datetime', required: true },
  ]
  
  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  console.log(`\n   Processing ${clinicAttributes.length} attributes...`)
  console.log("   " + "-".repeat(40))
  
  for (const attr of clinicAttributes) {
    try {
      let added = false
      
      switch (attr.type) {
        case 'string':
          added = await addStringAttribute(
            'clinics',
            attr.name,
            attr.size,
            attr.required,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        case 'email':
          added = await addEmailAttribute(
            'clinics',
            attr.name,
            attr.required,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        case 'datetime':
          added = await addDatetimeAttribute(
            'clinics',
            attr.name,
            attr.required,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        case 'integer':
          added = await addIntegerAttribute(
            'clinics',
            attr.name,
            attr.required,
            undefined,
            undefined,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        case 'boolean':
          added = await addBooleanAttribute(
            'clinics',
            attr.name,
            attr.required,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        case 'float':
          added = await addFloatAttribute(
            'clinics',
            attr.name,
            attr.required,
            undefined,
            undefined,
            (attr as any).defaultValue,
            existingAttributes
          )
          break
          
        default:
          console.log(`   ⚠ Unknown type for attribute ${attr.name}: ${attr.type}`)
          skippedCount++
          continue
      }
      
      if (added) {
        addedCount++
      } else {
        skippedCount++
      }
      
      // Small delay to avoid rate limiting
      await sleep(200)
      
    } catch (error: any) {
      console.error(`   ✗ Error processing attribute ${attr.name}:`, error.message)
      errorCount++
    }
  }
  
  return { added: addedCount, skipped: skippedCount, errors: errorCount }
}

/* --------------------------------------------------
   VERIFICATION
-------------------------------------------------- */
async function verifyClinicsCollection() {
  console.log("\n🔍 Verifying clinics collection...")
  
  try {
    const collection = await databases.getCollection(validatedDatabaseId, 'clinics')
    console.log(`   ✓ Collection: ${collection.name}`)
    console.log(`   ✓ Total attributes: ${collection.attributes.length}`)
    
    // Categorize attributes for better readability
    const categories = {
      'Basic Information': ['name', 'registration_number', 'email', 'phone', 'address', 'logo_url'],
      'Subscription & Billing': [
        'subscription_plan', 'subscription_status', 'selected_plan',
        'trial_started_at', 'trial_ends_at', 'subscription_start_date',
        'subscription_end_date', 'next_billing_date', 'payment_method_id'
      ],
      'Patient Management': ['monthly_patient_limit', 'current_month_patients'],
      'Branch Management': ['max_branches', 'current_branches'],
      'Payment Integration': ['paystack_customer_id', 'paystack_subscription_id'],
      'Settings & Status': ['settings', 'is_active', 'data_retention_days'],
      'Timestamps': ['created_at', 'updated_at']
    }
    
    const existingAttrs = collection.attributes.map((attr: any) => attr.key)
    
    console.log("\n📋 Attribute Status by Category:")
    console.log("   " + "=".repeat(50))
    
    let totalMissing = 0
    
    for (const [category, attrs] of Object.entries(categories)) {
      console.log(`\n   ${category}:`)
      
      for (const attr of attrs) {
        const exists = existingAttrs.includes(attr)
        const icon = exists ? '✓' : '✗'
        const status = exists ? 'PRESENT' : 'MISSING'
        
        console.log(`     ${icon} ${attr.padEnd(30)} ${status}`)
        
        if (!exists) {
          totalMissing++
        }
      }
    }
    
    console.log("\n📊 Summary:")
    console.log(`   Total attributes: ${existingAttrs.length}`)
    console.log(`   Missing attributes: ${totalMissing}`)
    
    if (totalMissing === 0) {
      console.log("\n✅ All required attributes are present!")
    } else {
      console.log(`\n⚠️  ${totalMissing} attributes are missing`)
    }
    
    return { total: existingAttrs.length, missing: totalMissing }
    
  } catch (error: any) {
    console.error(`   ✗ Failed to verify collection:`, error.message)
    return { total: 0, missing: 0 }
  }
}

/* --------------------------------------------------
   MAIN FUNCTION
-------------------------------------------------- */
async function main() {
  console.log("🚀 Clinic Attribute Setup Script")
  console.log("=".repeat(60))
  console.log("This script will add missing attributes to the 'clinics' collection")
  console.log("Existing attributes will be skipped automatically")
  console.log("=".repeat(60))
  
  try {
    // Check if database exists
    console.log("\n📁 Checking database...")
    const dbExists = await safeOperation(
      () => databases.get(validatedDatabaseId),
      'Database check'
    )
    
    if (!dbExists) {
      console.error("❌ Database not found!")
      console.log("💡 Please run your main setup script first to create the database")
      process.exit(1)
    }
    console.log("✓ Database found")
    
    // Setup clinics attributes
    console.log("-".repeat(60))
    const results = await setupClinicsAttributes()
    
    console.log("\n📊 Setup Results:")
    console.log("   " + "-".repeat(40))
    console.log(`   Attributes added: ${results.added}`)
    console.log(`   Attributes skipped (already exist): ${results.skipped}`)
    console.log(`   Errors encountered: ${results.errors}`)
    
    // Verify setup
    console.log("-".repeat(60))
    const verification = await verifyClinicsCollection()
    
    console.log("\n" + "=".repeat(60))
    console.log("🎉 Setup Complete!")
    console.log("\n📝 Next Steps:")
    
    if (verification.missing > 0) {
      console.log(`   1. ${verification.missing} attributes are still missing`)
      console.log("   2. Check the errors above and run the script again if needed")
    } else {
      console.log("   1. All clinic attributes are properly configured")
    }
    
    console.log("   2. Restart your Next.js application")
    console.log("   3. Test clinic creation - it should work now!")
    console.log("\n⚠️  Note: If you still get errors, check the exact error message")
    console.log("   and run this script again to add any additional missing attributes")
    
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message)
    
    if (error.message.includes('permission')) {
      console.error("\n💡 Permission error detected!")
      console.error("   Make sure your API key has these permissions:")
      console.error("   - databases.read")
      console.error("   - databases.write")
      console.error("   - collections.read")
      console.error("   - collections.write")
      console.error("\n   You can add permissions in Appwrite Console:")
      console.error("   Settings → API Keys → Edit your key")
    }
    
    if (error.message.includes('rate limit')) {
      console.error("\n💡 Rate limit detected!")
      console.error("   This script adds delays between operations,")
      console.error("   but you might need to wait a few minutes and try again")
    }
    
    process.exit(1)
  }
}

/* --------------------------------------------------
   EXECUTION WITH ERROR HANDLING
-------------------------------------------------- */
async function run() {
  try {
    await main()
  } catch (error: any) {
    console.error("\n💥 Unhandled error:", error)
    console.error("\n💡 Debugging tips:")
    console.error("   1. Check your .env.local file has correct values")
    console.error("   2. Verify Appwrite is running and accessible")
    console.error("   3. Check your API key permissions")
    console.error("   4. Try running with NODE_DEBUG=appwrite for more details")
    process.exit(1)
  }
}

// Add graceful shutdown
process.on('SIGINT', () => {
  console.log("\n\n🛑 Script interrupted by user")
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log("\n\n🛑 Script terminated")
  process.exit(0)
})

// Run the script
console.clear()
run()