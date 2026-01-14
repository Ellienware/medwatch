// scripts/fix-attributes.ts
import { Client, Databases, IndexType } from "node-appwrite"
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

async function fixAttributes() {
  console.log("🔧 Fixing missing attributes...")
  
  try {
    // Fix subscriptions collection
    console.log("\n📋 Fixing subscriptions collection:")
    
    // Create pricing_tier as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "subscriptions", "pricing_tier", 50, true)
      console.log("  ✓ Added pricing_tier attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ pricing_tier: ${error.message}`)
      }
    }
    
    // Create status as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "subscriptions", "status", 50, true)
      console.log("  ✓ Added status attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ status: ${error.message}`)
      }
    }
    
    // Fix payments collection
    console.log("\n📋 Fixing payments collection:")
    
    // Create currency as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "payments", "currency", 3, true)
      console.log("  ✓ Added currency attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ currency: ${error.message}`)
      }
    }
    
    // Create status as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "payments", "status", 50, true)
      console.log("  ✓ Added status attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ status: ${error.message}`)
      }
    }
    
    // Create payment_method as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "payments", "payment_method", 50, true)
      console.log("  ✓ Added payment_method attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ payment_method: ${error.message}`)
      }
    }
    
    // Create payment_provider as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "payments", "payment_provider", 50, true)
      console.log("  ✓ Added payment_provider attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ payment_provider: ${error.message}`)
      }
    }
    
    // Fix invoices collection
    console.log("\n📋 Fixing invoices collection:")
    
    // Create currency as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "invoices", "currency", 3, true)
      console.log("  ✓ Added currency attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ currency: ${error.message}`)
      }
    }
    
    // Create status as required (without default)
    try {
      await databases.createStringAttribute(DATABASE_ID, "invoices", "status", 50, true)
      console.log("  ✓ Added status attribute")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ status: ${error.message}`)
      }
    }
    
    console.log("\n✅ All attributes fixed!")
    
    // Create missing indexes
    console.log("\n📋 Creating missing indexes:")
    
    try {
      await databases.createIndex(DATABASE_ID, "subscriptions", "status_idx", IndexType.Key, ["status"])
      console.log("  ✓ Created subscriptions.status_idx")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ subscriptions.status_idx: ${error.message}`)
      }
    }
    
    try {
      await databases.createIndex(DATABASE_ID, "payments", "status_idx", IndexType.Key, ["status"])
      console.log("  ✓ Created payments.status_idx")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ payments.status_idx: ${error.message}`)
      }
    }
    
    try {
      await databases.createIndex(DATABASE_ID, "invoices", "status_idx", IndexType.Key, ["status"])
      console.log("  ✓ Created invoices.status_idx")
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ invoices.status_idx: ${error.message}`)
      }
    }
    
    console.log("\n🎉 All fixes completed successfully!")
    
  } catch (error: any) {
    console.error("❌ Error fixing attributes:", error.message)
    process.exit(1)
  }
}

fixAttributes()