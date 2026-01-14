// scripts/update-schema.ts
import { Client, Databases, Permission, Role, ID, IndexType } from "node-appwrite"
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
   HELPERS
-------------------------------------------------- */
async function exists(fn: () => Promise<any>): Promise<boolean> {
  try {
    await fn()
    return true
  } catch {
    return false
  }
}

async function addAttribute(
  collectionId: string, 
  attributeDefinition: () => Promise<any>, 
  name: string
): Promise<boolean> {
  try {
    await attributeDefinition()
    console.log(`     ✓ Added/Updated attribute: ${name}`)
    return true
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log(`     ✓ Attribute already exists: ${name}`)
      return true
    } else {
      console.log(`     ⚠ Could not add attribute ${name}: ${error.message}`)
      return false
    }
  }
}

async function addIndex(
  collectionId: string, 
  indexDefinition: () => Promise<any>, 
  name: string
): Promise<boolean> {
  try {
    await indexDefinition()
    console.log(`     ✓ Added/Updated index: ${name}`)
    return true
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log(`     ✓ Index already exists: ${name}`)
      return true
    } else {
      console.log(`     ⚠ Could not add index ${name}: ${error.message}`)
      return false
    }
  }
}

interface AttributeDefinition {
  name: string
  fn: () => Promise<any>
  description: string
}

interface IndexDefinition {
  name: string
  fn: () => Promise<any>
  description: string
}

/* --------------------------------------------------
   UPDATE SUBSCRIPTIONS COLLECTION
-------------------------------------------------- */
async function updateSubscriptionsCollection(): Promise<boolean> {
  console.log("\n🔄 Updating subscriptions collection schema...")
  
  const collectionId = "subscriptions"
  
  // Check if collection exists
  if (!(await exists(() => databases.getCollection(validatedDatabaseId, collectionId)))) {
    console.error(`   ✗ Collection ${collectionId} doesn't exist!`)
    return false
  }
  
  console.log(`   ✓ Collection ${collectionId} found`)
  
  // Add missing attributes
  console.log(`   📝 Adding missing attributes...`)
  
  const attributes: AttributeDefinition[] = [
    // Trial period attributes
    {
      name: "trial_started_at",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "trial_started_at", false),
      description: "Trial start date"
    },
    {
      name: "trial_ends_at",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "trial_ends_at", false),
      description: "Trial end date"
    },
    // Billing period attributes
    {
      name: "next_billing_date",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "next_billing_date", false),
      description: "Next billing date"
    },
    // Payment method
    {
      name: "payment_method_id",
      fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "payment_method_id", 100, false),
      description: "Payment method ID (Paystack authorization code)"
    },
    // Metadata
    {
      name: "metadata",
      fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "metadata", 2000, false),
      description: "Subscription metadata (JSON)"
    }
  ]
  
  let successCount = 0
  for (const attr of attributes) {
    const success = await addAttribute(collectionId, attr.fn, attr.name)
    if (success) successCount++
  }
  
  console.log(`   📊 Added/updated ${successCount}/${attributes.length} attributes`)
  
  // Add missing indexes
  console.log(`   📝 Adding missing indexes...`)
  
  const indexes: IndexDefinition[] = [
    {
      name: "payment_method_idx",
      fn: () => databases.createIndex(
        validatedDatabaseId,
        collectionId,
        "payment_method_idx",
        IndexType.Key,
        ["payment_method_id"],
        ["ASC"]
      ),
      description: "Index for payment method lookup"
    },
    {
      name: "next_billing_idx",
      fn: () => databases.createIndex(
        validatedDatabaseId,
        collectionId,
        "next_billing_idx",
        IndexType.Key,
        ["next_billing_date"],
        ["ASC"]
      ),
      description: "Index for upcoming billing dates"
    },
    {
      name: "trial_ends_idx",
      fn: () => databases.createIndex(
        validatedDatabaseId,
        collectionId,
        "trial_ends_idx",
        IndexType.Key,
        ["trial_ends_at"],
        ["ASC"]
      ),
      description: "Index for trial end dates"
    }
  ]
  
  let indexSuccessCount = 0
  for (const idx of indexes) {
    const success = await addIndex(collectionId, idx.fn, idx.name)
    if (success) indexSuccessCount++
  }
  
  console.log(`   📊 Added/updated ${indexSuccessCount}/${indexes.length} indexes`)
  
  return true
}

/* --------------------------------------------------
   UPDATE CLINICS COLLECTION
-------------------------------------------------- */
async function updateClinicsCollection(): Promise<boolean> {
  console.log("\n🔄 Updating clinics collection schema...")
  
  const collectionId = "clinics"
  
  // Check if collection exists
  if (!(await exists(() => databases.getCollection(validatedDatabaseId, collectionId)))) {
    console.error(`   ✗ Collection ${collectionId} doesn't exist!`)
    return false
  }
  
  console.log(`   ✓ Collection ${collectionId} found`)
  
  // Add missing attributes for trial support
  console.log(`   📝 Adding missing clinic attributes...`)
  
  const attributes: AttributeDefinition[] = [
    // Trial period attributes
    {
      name: "trial_started_at",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "trial_started_at", false),
      description: "Trial start date"
    },
    {
      name: "trial_ends_at",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "trial_ends_at", false),
      description: "Trial end date"
    },
    // Selected plan
    {
      name: "selected_plan",
      fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "selected_plan", 50, false),
      description: "Selected plan after trial"
    },
    // Billing info
    {
      name: "next_billing_date",
      fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "next_billing_date", false),
      description: "Next billing date"
    },
    // Branch limits
    {
      name: "max_branches",
      fn: () => databases.createIntegerAttribute(validatedDatabaseId, collectionId, "max_branches", true, 1),
      description: "Maximum allowed branches"
    },
    {
      name: "current_branches",
      fn: () => databases.createIntegerAttribute(validatedDatabaseId, collectionId, "current_branches", true, 0),
      description: "Current number of branches"
    }
  ]
  
  let successCount = 0
  for (const attr of attributes) {
    const success = await addAttribute(collectionId, attr.fn, attr.name)
    if (success) successCount++
  }
  
  console.log(`   📊 Added/updated ${successCount}/${attributes.length} attributes`)
  
  return true
}



/* --------------------------------------------------
   CREATE PAYMENT METHODS COLLECTION
-------------------------------------------------- */
async function createPaymentMethodsCollection(): Promise<boolean> {
  console.log("\n🔄 Creating payment methods collection...")
  
  const collectionId = "payment_methods"
  
  // Check if collection already exists
  if (await exists(() => databases.getCollection(validatedDatabaseId, collectionId))) {
    console.log(`   ✓ Collection ${collectionId} already exists`)
    return true
  }
  
  try {
    // Create the collection
    await databases.createCollection(
      validatedDatabaseId,
      collectionId,
      "Payment Methods",
      [Permission.read(Role.team("admin")), Permission.write(Role.team("admin"))],
      false
    )
    console.log(`   ✓ Created collection: ${collectionId}`)
    
    // Add attributes
    console.log(`   📝 Adding attributes...`)
    
    const attributes: AttributeDefinition[] = [
      // Basic info
      {
        name: "clinic_id",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "clinic_id", 50, true),
        description: "Clinic ID"
      },
      // Card/account info
      {
        name: "type",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "type", 50, true),
        description: "Payment method type (card, bank)"
      },
      {
        name: "brand",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "brand", 100, false),
        description: "Card brand or bank name"
      },
      {
        name: "last4",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "last4", 4, true),
        description: "Last 4 digits"
      },
      // Card expiration
      {
        name: "exp_month",
        fn: () => databases.createIntegerAttribute(validatedDatabaseId, collectionId, "exp_month", true),
        description: "Expiration month"
      },
      {
        name: "exp_year",
        fn: () => databases.createIntegerAttribute(validatedDatabaseId, collectionId, "exp_year", true),
        description: "Expiration year"
      },
      // Paystack integration
      {
        name: "authorization_code",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "authorization_code", 100, true),
        description: "Paystack authorization code"
      },
      // Bank specific
      {
        name: "bank",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "bank", 100, false),
        description: "Bank name"
      },
      {
        name: "country_code",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "country_code", 10, false),
        description: "Country code"
      },
      // Status
      {
        name: "is_default",
        fn: () => databases.createBooleanAttribute(validatedDatabaseId, collectionId, "is_default", true),
        description: "Is default payment method"
      },
      {
        name: "is_active",
        fn: () => databases.createBooleanAttribute(validatedDatabaseId, collectionId, "is_active", true),
        description: "Is active"
      },
      // Metadata
      {
        name: "metadata",
        fn: () => databases.createStringAttribute(validatedDatabaseId, collectionId, "metadata", 2000, false),
        description: "Payment method metadata"
      },
      // Timestamps
      {
        name: "created_at",
        fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "created_at", true),
        description: "Created at"
      },
      {
        name: "updated_at",
        fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "updated_at", true),
        description: "Updated at"
      },
      {
        name: "deleted_at",
        fn: () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "deleted_at", false),
        description: "Deleted at"
      }
    ]
    
    let successCount = 0
    for (const attr of attributes) {
      const success = await addAttribute(collectionId, attr.fn, attr.name)
      if (success) successCount++
    }
    
    console.log(`   📊 Added ${successCount}/${attributes.length} attributes`)
    
    // Add indexes
    console.log(`   📝 Adding indexes...`)
    
    const indexes: IndexDefinition[] = [
      {
        name: "clinic_idx",
        fn: () => databases.createIndex(
          validatedDatabaseId,
          collectionId,
          "clinic_idx",
          IndexType.Key,
          ["clinic_id"],
          ["ASC"]
        ),
        description: "Index for clinic lookup"
      },
      {
        name: "auth_code_idx",
        fn: () => databases.createIndex(
          validatedDatabaseId,
          collectionId,
          "auth_code_idx",
          IndexType.Unique,
          ["authorization_code"],
          ["ASC"]
        ),
        description: "Index for authorization code"
      },
      {
        name: "clinic_default_idx",
        fn: () => databases.createIndex(
          validatedDatabaseId,
          collectionId,
          "clinic_default_idx",
          IndexType.Key,
          ["clinic_id", "is_default"],
          ["ASC", "ASC"]
        ),
        description: "Index for default payment methods"
      }
    ]
    
    let indexSuccessCount = 0
    for (const idx of indexes) {
      const success = await addIndex(collectionId, idx.fn, idx.name)
      if (success) indexSuccessCount++
    }
    
    console.log(`   📊 Added ${indexSuccessCount}/${indexes.length} indexes`)
    
    return true
    
  } catch (error: any) {
    console.error(`   ✗ Failed to create collection ${collectionId}:`, error.message)
    return false
  }
}

/* --------------------------------------------------
   RUN
-------------------------------------------------- */
async function run() {
  console.log("🚀 Updating MedSurv Database Schema...")
  console.log("=".repeat(50))
  
  try {
    console.log("\n📋 Updating collections for billing/trial support:")
    console.log("-".repeat(50))
    
    const results = {
      subscriptions: false,
      clinics: false,
      payment_methods: false
    }
    
    // Update subscriptions collection
    results.subscriptions = await updateSubscriptionsCollection()
    console.log("-".repeat(50))
    
    // Update clinics collection
    results.clinics = await updateClinicsCollection()
    console.log("-".repeat(50))
    
    // Create payment methods collection
    results.payment_methods = await createPaymentMethodsCollection()
    console.log("=".repeat(50))
    
    // Summary
    console.log("\n📊 Update Summary:")
    console.log("=".repeat(50))
    console.log(`   ✓ Subscriptions collection: ${results.subscriptions ? "Updated" : "Failed"}`)
    console.log(`   ✓ Clinics collection: ${results.clinics ? "Updated" : "Failed"}`)
    console.log(`   ✓ Payment methods collection: ${results.payment_methods ? "Created" : "Failed/Exists"}`)
    console.log("=".repeat(50))
    
    const allSuccess = Object.values(results).every(Boolean)
    if (allSuccess) {
      console.log("\n✅ Database schema update completed successfully!")
      console.log("\n📝 Changes made:")
      console.log("   1. Added trial period fields to subscriptions (trial_started_at, trial_ends_at)")
      console.log("   2. Added next_billing_date to subscriptions")
      console.log("   3. Added payment_method_id and metadata to subscriptions")
      console.log("   4. Added trial and branch fields to clinics")
      console.log("   5. Created payment_methods collection for storing cards/banks")
      console.log("\n⚠️  Note: Existing data remains untouched")
    } else {
      console.log("\n⚠️  Some updates were not successful. Check the logs above.")
    }
    
  } catch (error: any) {
    console.error("\n❌ Update failed:", error.message)
    console.error("\n💡 Troubleshooting tips:")
    console.error("   1. Check if API key has database write permissions")
    console.error("   2. Verify database exists")
    console.error("   3. Check network connectivity to Appwrite")
    process.exit(1)
  }
}

run().catch(console.error)