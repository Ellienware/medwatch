// scripts/update-database.ts
import { Client, Databases, Permission, Role } from "node-appwrite"
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

async function setupNotificationsCollection() {
  console.log("🔄 Setting up notifications collection...")
  
  const admin = Role.team("admin")
  const readPerms = [Permission.read(admin)]
  const writePerms = [Permission.write(admin)]
  
  try {
    // Check if collection exists
    await databases.getCollection(DATABASE_ID, "notifications")
    console.log("✓ Notifications collection already exists")
  } catch {
    // Create collection
    try {
      await databases.createCollection(
        DATABASE_ID,
        "notifications",
        "Notifications",
        [...readPerms, ...writePerms],
        false
      )
      console.log("✓ Created notifications collection")
    } catch (error: any) {
      console.error("✗ Failed to create collection:", error.message)
      return
    }
  }
  
  // Add attributes that match your NotificationRepository
  const attributes = [
    { name: "clinic_id", type: "string", size: 50, required: true },
    { name: "user_id", type: "string", size: 50, required: true },
    { name: "type", type: "string", size: 50, required: true },
    { name: "priority", type: "string", size: 20, required: true },
    { name: "title", type: "string", size: 255, required: true },
    { name: "message", type: "string", size: 1000, required: true },
    { name: "link", type: "string", size: 500, required: false },
    { name: "data", type: "string", size: 2000, required: false },
    { name: "read", type: "boolean", required: true },
    { name: "read_at", type: "datetime", required: false },
    { name: "expires_at", type: "datetime", required: false },
    { name: "created_at", type: "datetime", required: true },
  ]
  
  for (const attr of attributes) {
    try {
      if (attr.type === "string") {
        await databases.createStringAttribute(
          DATABASE_ID,
          "notifications",
          attr.name,
          attr.size!, // Use non-null assertion since we know size is defined for string attributes
          attr.required as boolean
        )
        console.log(`  ✓ Added string: ${attr.name} (size: ${attr.size})`)
      } else if (attr.type === "boolean") {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          "notifications",
          attr.name,
          attr.required as boolean
        )
        console.log(`  ✓ Added boolean: ${attr.name}`)
      } else if (attr.type === "datetime") {
        await databases.createDatetimeAttribute(
          DATABASE_ID,
          "notifications",
          attr.name,
          attr.required as boolean
        )
        console.log(`  ✓ Added datetime: ${attr.name}`)
      }
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ Error adding ${attr.name}:`, error.message)
      } else {
        console.log(`  ✓ ${attr.name} already exists`)
      }
    }
  }
  
  console.log("\n✅ Notifications collection setup complete!")
}

async function main() {
  await setupNotificationsCollection()
}

main().catch(console.error)