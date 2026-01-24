// scripts/appwrite-cleanup.ts
import { Client, Databases } from "node-appwrite"
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

async function deleteCertificateTemplatesCollection() {
  console.log("🧹 Deleting certificate_templates collection...")
  
  try {
    await databases.deleteCollection(DATABASE_ID, "certificate_templates")
    console.log("✅ Collection deleted successfully!")
    console.log("\n💡 Now you can run: npm run appwrite:upgrade")
  } catch (error: any) {
    if (error.message.includes("Collection with the requested ID could not be found")) {
      console.log("ℹ Collection doesn't exist")
    } else {
      console.error("❌ Failed to delete collection:", error.message)
    }
  }
}

async function main() {
  console.log("🚨 WARNING: This will delete all data in certificate_templates collection!")
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  await deleteCertificateTemplatesCollection()
}

main().catch(console.error)