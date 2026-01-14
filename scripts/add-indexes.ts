// scripts/add-indexes.ts
import { Client, Databases, IndexType } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

// Get environment variables with type assertion
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as string
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID as string
const API_KEY = process.env.APPWRITE_API_KEY as string
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string

// Validate
if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("Missing required environment variables!")
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const databases = new Databases(client)

async function addMissingIndexes() {
  console.log("Adding missing fulltext indexes for patients collection...")
  
  try {
    const indexes = [
      { key: "first_name_ft", type: IndexType.Fulltext, attributes: ["first_name"] },
      { key: "last_name_ft", type: IndexType.Fulltext, attributes: ["last_name"] },
      { key: "id_number_ft", type: IndexType.Fulltext, attributes: ["id_number"] },
      { key: "employee_number_ft", type: IndexType.Fulltext, attributes: ["employee_number"] },
      { key: "search_all_ft", type: IndexType.Fulltext, attributes: ["first_name", "last_name", "id_number", "employee_number"] },
    ]

    for (const index of indexes) {
      try {
        await databases.createIndex(DATABASE_ID, "patients", index.key, index.type, index.attributes)
        console.log(`✅ Created index: ${index.key}`)
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`⚠️ Index ${index.key} already exists`)
        } else {
          console.log(`❌ Failed to create index ${index.key}: ${error.message}`)
        }
      }
    }
    
    console.log("\n✅ All indexes added successfully!")
  } catch (error: any) {
    console.error("❌ Error adding indexes:", error.message)
    process.exit(1)
  }
}

addMissingIndexes()