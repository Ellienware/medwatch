// scripts/setup-certificate-final.ts
import { Client, Databases, Permission, Role, IndexType } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
const API_KEY = process.env.APPWRITE_API_KEY!
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const databases = new Databases(client)

// Helper to wait with retry
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry function
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      console.log(`  ⏳ Retry ${i + 1}/${maxRetries} after error: ${error.message}`)
      await wait(delay * (i + 1))
    }
  }
  throw new Error('Max retries reached')
}

async function setupCertificateTemplatesCollection() {
  console.log("🚀 Setting up certificate_templates collection...")
  console.log("=".repeat(60))
  
  // Delete existing collection if it exists
  try {
    await databases.getCollection(DATABASE_ID, "certificate_templates")
    console.log("⚠ Collection exists, deleting...")
    await databases.deleteCollection(DATABASE_ID, "certificate_templates")
    console.log("✓ Old collection deleted")
    await wait(3000) // Wait for deletion to complete
  } catch {
    console.log("✓ No existing collection found")
  }
  
  // Create collection
  try {
    const admin = Role.team("admin")
    const readPerms = [Permission.read(admin)]
    const writePerms = [Permission.write(admin)]
    
    await databases.createCollection(
      DATABASE_ID,
      "certificate_templates",
      "Certificate Templates",
      [...readPerms, ...writePerms],
      false
    )
    console.log("✓ Collection created successfully")
  } catch (error: any) {
    console.error("❌ Failed to create collection:", error.message)
    return
  }
  
  // Wait for collection to be ready
  console.log("⏳ Waiting for collection to initialize...")
  await wait(5000)
  
  // Define attributes - MINIMAL VERSION for free plan
  // Free plan has limits, so we need to be conservative
  const attributes = [
    // REQUIRED FIELDS - minimal sizes
    { name: "clinic_id", type: "string", size: 36, required: true },
    { name: "name", type: "string", size: 100, required: true },
    { name: "category", type: "string", size: 30, required: true },
    
    // JSON fields - store as JSON strings
    { name: "settings", type: "string", size: 1500, required: true },
    { name: "layout", type: "string", size: 1500, required: true },
    
    // Boolean fields - NO default values for required
    { name: "is_default", type: "boolean", required: true },
    { name: "is_one_page", type: "boolean", required: true },
    
    // Array field - WITHOUT encryption (free plan doesn't support)
    { name: "sections_included", type: "string", size: 20, required: true, array: true },
    
    // Metadata
    { name: "created_by", type: "string", size: 36, required: true },
    { name: "created_at", type: "datetime", required: true },
    { name: "updated_at", type: "datetime", required: true },
  ]
  
  // OPTIONAL fields - add these only if we have capacity
  const optionalAttributes = [
    { name: "description", type: "string", size: 150, required: false },
    { name: "thumbnail_url", type: "string", size: 150, required: false },
  ]
  
  console.log("\n📝 Adding core attributes...")
  const successfulAttributes: string[] = []
  
  // Add core attributes first
  for (const attr of attributes) {
    try {
      console.log(`  ➕ Adding: ${attr.name}`)
      
      await retryOperation(async () => {
        if (attr.type === "string") {
          if (attr.array) {
            // For array attributes, explicitly disable encryption
            await databases.createStringAttribute(
              DATABASE_ID,
              "certificate_templates",
              attr.name,
              attr.size!,
              attr.required,
              undefined, // NO default for required
              false,     // NO encryption (free plan)
              true      // This is an array
            )
          } else {
            await databases.createStringAttribute(
              DATABASE_ID,
              "certificate_templates",
              attr.name,
              attr.size!,
              attr.required,
              attr.required ? undefined : "" // Only default for optional
            )
          }
        } else if (attr.type === "boolean") {
          // For required booleans, don't provide default
          await databases.createBooleanAttribute(
            DATABASE_ID,
            "certificate_templates",
            attr.name,
            attr.required,
            attr.required ? undefined : false
          )
        } else if (attr.type === "datetime") {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            "certificate_templates",
            attr.name,
            attr.required
          )
        }
      }, 2, 2000)
      
      console.log(`    ✓ ${attr.name} added`)
      successfulAttributes.push(attr.name)
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        console.log(`    ✓ ${attr.name} already exists`)
        successfulAttributes.push(attr.name)
      } else if (error.message.includes("Encrypted string attributes")) {
        console.log(`    ⚠ ${attr.name}: Free plan limitation. Trying without array...`)
        // Try as regular string instead of array
        try {
          await databases.createStringAttribute(
            DATABASE_ID,
            "certificate_templates",
            attr.name,
            500, // Larger size to store JSON array as string
            attr.required,
            undefined,
            false
          )
          console.log(`    ✓ ${attr.name} added as JSON string`)
          successfulAttributes.push(attr.name)
        } catch (e: any) {
          console.log(`    ✗ ${attr.name} failed: ${e.message}`)
        }
      } else {
        console.log(`    ✗ ${attr.name} failed: ${error.message}`)
      }
    }
    
    // Wait between attributes
    await wait(800)
  }
  
  // Try to add optional attributes if we have space
  console.log("\n📝 Trying optional attributes...")
  for (const attr of optionalAttributes) {
    try {
      // Skip if we already have too many attributes
      if (successfulAttributes.length >= 15) { // Free plan limit
        console.log(`  ⚠ Skipping ${attr.name}: Too many attributes`)
        continue
      }
      
      console.log(`  ➕ Adding optional: ${attr.name}`)
      
      await databases.createStringAttribute(
        DATABASE_ID,
        "certificate_templates",
        attr.name,
        attr.size!,
        attr.required,
        "" // Default empty string for optional
      )
      
      console.log(`    ✓ ${attr.name} added`)
      successfulAttributes.push(attr.name)
      await wait(800)
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`    ⚠ ${attr.name} skipped: ${error.message}`)
      }
    }
  }
  
  console.log(`\n✅ ${successfulAttributes.length} attributes added successfully`)
  console.log("⏳ Waiting for attributes to be ready...")
  await wait(8000)
  
  // Create indexes for existing attributes
  console.log("\n🔧 Creating indexes...")
  
  const indexes = [
    { name: "idx_clinic", key: "clinic_id", type: IndexType.Key },
    { name: "idx_category", key: "category", type: IndexType.Key },
    { name: "idx_created", key: "created_at", type: IndexType.Key },
  ]
  
  // Only create indexes for attributes that exist
  for (const index of indexes) {
    if (successfulAttributes.includes(index.key)) {
      try {
        await retryOperation(async () => {
          await databases.createIndex(
            DATABASE_ID,
            "certificate_templates",
            index.name,
            index.type,
            [index.key]
          )
        })
        console.log(`  ✓ Index: ${index.name}`)
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(`  ✓ Index ${index.name} already exists`)
        } else {
          console.log(`  ⚠ Index ${index.name}: ${error.message}`)
        }
      }
      await wait(1500)
    } else {
      console.log(`  ⚠ Skipping index ${index.name}: ${index.key} not available`)
    }
  }
  
  // Try compound index if both attributes exist
  if (successfulAttributes.includes("clinic_id") && successfulAttributes.includes("is_default")) {
    try {
      await databases.createIndex(
        DATABASE_ID,
        "certificate_templates",
        "idx_clinic_default",
        IndexType.Key,
        ["clinic_id", "is_default"]
      )
      console.log("  ✓ Compound index: idx_clinic_default")
    } catch (error: any) {
      console.log(`  ⚠ Compound index failed: ${error.message}`)
    }
  }
  
  console.log("\n" + "=".repeat(60))
  console.log("🎉 SETUP COMPLETE!")
  console.log("=".repeat(60))
  
  console.log("\n📊 SUMMARY:")
  console.log(`  • Collection: certificate_templates`)
  console.log(`  • Attributes created: ${successfulAttributes.length}`)
  console.log(`  • Indexes created: ${indexes.length}`)
  
  console.log("\n📋 Created attributes:")
  successfulAttributes.forEach(attr => console.log(`  • ${attr}`))
  
  console.log("\n💡 NOTES for your application:")
  console.log("  1. 'sections_included' is stored as JSON string (free plan limitation)")
  console.log("  2. Optional fields may not be available due to plan limits")
  console.log("  3. Handle JSON parsing for 'settings', 'layout', 'sections_included'")
  
  console.log("\n🔄 Next steps in your app:")
  console.log(`  1. Parse JSON strings: JSON.parse(record.settings)`)
  console.log(`  2. For 'sections_included', you may need to store as: "['patient_info', 'test_results']"`)
  console.log(`  3. Set default values in your app logic (is_default: false, etc.)`)
  
  // Sample code for app
  console.log("\n📝 Sample code for creating a template:")
  console.log(`
  const template = {
    clinic_id: "clinic_123",
    name: "Standard Certificate",
    category: "medical",
    settings: JSON.stringify({ fontSize: 12, margin: 20 }),
    layout: JSON.stringify({ header: true, footer: false }),
    is_default: false,
    is_one_page: true,
    sections_included: JSON.stringify(['patient_info', 'diagnosis']), // Store as JSON string
    created_by: "user_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  `)
}

async function main() {
  try {
    await setupCertificateTemplatesCollection()
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message)
    console.log("\n💡 Troubleshooting:")
    console.log("  1. Check your Appwrite API key")
    console.log("  2. Verify database ID is correct")
    console.log("  3. Ensure you have proper permissions")
    console.log("  4. Try upgrading Appwrite plan if hitting limits")
  }
}

main().catch(console.error)