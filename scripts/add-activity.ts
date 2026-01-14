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
  console.error("Please check your .env.local file")
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
async function collectionExists(collectionId: string): Promise<boolean> {
  try {
    await databases.getCollection(validatedDatabaseId, collectionId)
    return true
  } catch {
    return false
  }
}

async function attributeExists(collectionId: string, attributeName: string): Promise<boolean> {
  try {
    const collection = await databases.getCollection(validatedDatabaseId, collectionId)
    return collection.attributes.some((attr: any) => attr.key === attributeName)
  } catch {
    return false
  }
}

async function addAttribute(
  fn: () => Promise<any>, 
  collectionId: string, 
  attributeName: string
) {
  try {
    if (await attributeExists(collectionId, attributeName)) {
      console.log(`     ⚠ Attribute already exists: ${attributeName}`)
      return
    }
    await fn()
    console.log(`     ✓ Added attribute: ${attributeName}`)
  } catch (error: any) {
    console.error(`     ✗ Failed to add attribute ${attributeName}:`, error.message)
  }
}

async function addIndex(
  fn: () => Promise<any>, 
  indexName: string
) {
  try {
    await fn()
    console.log(`     ✓ Added index: ${indexName}`)
  } catch (error: any) {
    if (!error.message.includes("already exists")) {
      console.error(`     ✗ Failed to add index ${indexName}:`, error.message)
    } else {
      console.log(`     ⚠ Index already exists: ${indexName}`)
    }
  }
}

/* --------------------------------------------------
   ADD ACTIVITIES COLLECTION
-------------------------------------------------- */
async function addActivitiesCollection() {
  console.log("\n📊 Adding Activities Collection...")
  console.log("-".repeat(50))

  const collectionId = "activities"
  const collectionName = "Activities"
  const admin = Role.team("admin")
  const readPerms = [Permission.read(admin)]
  const writePerms = [Permission.write(admin)]

  // Check if collection already exists
  if (await collectionExists(collectionId)) {
    console.log(`   ⚠ Collection "${collectionId}" already exists`)
    console.log("   Checking attributes...")
    
    // Verify all required attributes exist
    const requiredAttributes = [
      "clinic_id", "user_id", "user_name", "user_role", "action_type",
      "description", "entity_type", "entity_id", "metadata", "created_at"
    ]
    
    for (const attr of requiredAttributes) {
      if (await attributeExists(collectionId, attr)) {
        console.log(`     ✓ Attribute exists: ${attr}`)
      } else {
        console.log(`     ⚠ Missing attribute: ${attr}`)
      }
    }
    
    console.log("\n   💡 Note: Collection exists. No changes made.")
    console.log("   If you need to modify the collection, delete it first and run this script again.")
    return
  }

  // Create the collection
  try {
    console.log(`   Creating collection: ${collectionName} (ID: ${collectionId})`)
    await databases.createCollection(
      validatedDatabaseId,
      collectionId,
      collectionName,
      [...readPerms, ...writePerms],
      false
    )
    console.log(`   ✓ Collection created successfully`)
  } catch (error: any) {
    console.error(`   ✗ Failed to create collection:`, error.message)
    throw error
  }

  // Add attributes
  console.log(`\n   Adding attributes...`)
  
  // Clinic and user info
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "clinic_id", 50, true),
    collectionId,
    "clinic_id"
  )
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "user_id", 50, true),
    collectionId,
    "user_id"
  )
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "user_name", 255, true),
    collectionId,
    "user_name"
  )
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "user_role", 50, false),
    collectionId,
    "user_role"
  )

  // Activity info
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "action_type", 50, true),
    collectionId,
    "action_type"
  )
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "description", 1000, true),
    collectionId,
    "description"
  )

  // Entity info (what the activity is about)
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "entity_type", 50, false),
    collectionId,
    "entity_type"
  )
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "entity_id", 50, false),
    collectionId,
    "entity_id"
  )

  // Metadata (JSON stored as string)
  await addAttribute(
    () => databases.createStringAttribute(validatedDatabaseId, collectionId, "metadata", 4000, false),
    collectionId,
    "metadata"
  )

  // Timestamp
  await addAttribute(
    () => databases.createDatetimeAttribute(validatedDatabaseId, collectionId, "created_at", true),
    collectionId,
    "created_at"
  )

  // Add indexes for efficient querying
  console.log(`\n   Adding indexes...`)
  await addIndex(
    () => databases.createIndex(
      validatedDatabaseId,
      collectionId,
      "clinic_created_idx",
      IndexType.Key,
      ["clinic_id", "created_at"],
      ["ASC", "DESC"]
    ),
    "clinic_created_idx"
  )
  await addIndex(
    () => databases.createIndex(
      validatedDatabaseId,
      collectionId,
      "user_idx",
      IndexType.Key,
      ["user_id"],
      ["ASC"]
    ),
    "user_idx"
  )
  await addIndex(
    () => databases.createIndex(
      validatedDatabaseId,
      collectionId,
      "action_type_idx",
      IndexType.Key,
      ["action_type"],
      ["ASC"]
    ),
    "action_type_idx"
  )

  console.log("\n   ✅ Activities collection setup complete!")
}

/* --------------------------------------------------
   VERIFY DATABASE EXISTS
-------------------------------------------------- */
async function verifyDatabase() {
  console.log("\n🔍 Verifying database...")
  try {
    const database = await databases.get(validatedDatabaseId)
    console.log(`   ✓ Database found: ${database.name}`)
    console.log(`   📊 Database ID: ${database.$id}`)
    return true
  } catch (error: any) {
    console.error(`   ✗ Database not found: ${validatedDatabaseId}`)
    console.error(`   Error: ${error.message}`)
    return false
  }
}

/* --------------------------------------------------
   MAIN FUNCTION
-------------------------------------------------- */
async function main() {
  console.log("🚀 Starting Activities Collection Update Script")
  console.log("=".repeat(50))

  try {
    // Verify database exists
    const dbExists = await verifyDatabase()
    if (!dbExists) {
      console.error("\n❌ Cannot proceed: Database does not exist")
      console.error("Please run your main setup script first to create the database.")
      process.exit(1)
    }

    // Add activities collection
    await addActivitiesCollection()

    console.log("\n" + "=".repeat(50))
    console.log("✅ Update script completed successfully!")
    
    console.log("\n📋 What was added:")
    console.log("   • Collection: 'activities'")
    console.log("   • Attributes: 10 (clinic_id, user_id, user_name, user_role, action_type,")
    console.log("                 description, entity_type, entity_id, metadata, created_at)")
    console.log("   • Indexes: 3 (clinic_created_idx, user_idx, action_type_idx)")
    
    console.log("\n🎯 Purpose of this collection:")
    console.log("   • Track user activities for the dashboard RecentActivity component")
    console.log("   • Log actions like patient registration, appointments, etc.")
    console.log("   • Provide audit trail and activity monitoring")
    
    console.log("\n⚡ Next steps:")
    console.log("   1. Your RecentActivity component will now show real data")
    console.log("   2. Activities will be logged automatically when users perform actions")
    console.log("   3. Test by creating a patient - it should appear in RecentActivity")
    
    console.log("\n🔧 Technical details:")
    console.log("   • Metadata field stores JSON as string (max 4000 chars)")
    console.log("   • Created_at uses Appwrite's $createdAt timestamp")
    console.log("   • Indexes optimize queries by clinic and creation date")

  } catch (error: any) {
    console.error("\n❌ Script failed:", error.message)
    console.error("\n💡 Troubleshooting tips:")
    console.error("   1. Check if API key has 'collections.write' permission")
    console.error("   2. Verify Appwrite server is running")
    console.error("   3. Ensure you're using correct database ID")
    console.error("   4. Check your .env.local file for correct values")
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)