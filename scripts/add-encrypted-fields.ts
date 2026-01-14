/**
 * Script to add encrypted field attributes to Appwrite collections
 * Run this to automate the schema updates
 *
 * Usage:
 *   npm install node-appwrite
 *   tsx scripts/add-encrypted-fields.ts
 */

import { Client, Databases } from "node-appwrite"

// Configuration
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY! // Need API key for schema changes
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

// Initialize Appwrite
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY)

const databases = new Databases(client)

// Define encrypted fields for each collection
const ENCRYPTED_FIELDS_CONFIG = {
  patients: [
    { field: "first_name", size: 500 },
    { field: "last_name", size: 500 },
    { field: "id_number", size: 500 },
    { field: "passport_number", size: 500 },
    { field: "phone", size: 500 },
    { field: "email", size: 500 },
    { field: "address", size: 1000 },
    { field: "emergency_contact_name", size: 500 },
    { field: "emergency_contact_phone", size: 500 },
    { field: "medical_history", size: 5000 },
    { field: "current_medications", size: 5000 },
    { field: "allergies", size: 5000 },
  ],
  appointments: [
    { field: "notes", size: 10000 },
    { field: "examination_findings", size: 10000 },
  ],
  test_results: [
    { field: "test_data", size: 10000 },
    { field: "notes", size: 5000 },
    { field: "technician_notes", size: 5000 },
  ],
  certificates: [
    { field: "medical_conditions", size: 5000 },
    { field: "restrictions", size: 5000 },
    { field: "recommendations", size: 5000 },
    { field: "doctor_notes", size: 5000 },
  ],
  users: [
    { field: "phone", size: 500 },
    { field: "email", size: 500 },
  ],
  employers: [
    { field: "contact_person", size: 500 },
    { field: "contact_email", size: 500 },
    { field: "contact_phone", size: 500 },
  ],
}

/**
 * Add encrypted field attributes to a collection
 */
async function addEncryptedFieldsToCollection(collectionId: string, fields: { field: string; size: number }[]) {
  console.log(`\nProcessing collection: ${collectionId}`)

  for (const { field, size } of fields) {
    // Add _enc field
    try {
      await databases.createStringAttribute(DATABASE_ID, collectionId, `${field}_enc`, size, false)
      console.log(`✅ Added ${field}_enc`)
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log(`⏭️  ${field}_enc already exists`)
      } else {
        console.error(`❌ Failed to add ${field}_enc:`, error.message)
      }
    }

    // Add _iv field
    try {
      await databases.createStringAttribute(DATABASE_ID, collectionId, `${field}_iv`, 100, false)
      console.log(`✅ Added ${field}_iv`)
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log(`⏭️  ${field}_iv already exists`)
      } else {
        console.error(`❌ Failed to add ${field}_iv:`, error.message)
      }
    }

    // Add _tag field
    try {
      await databases.createStringAttribute(DATABASE_ID, collectionId, `${field}_tag`, 100, false)
      console.log(`✅ Added ${field}_tag`)
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log(`⏭️  ${field}_tag already exists`)
      } else {
        console.error(`❌ Failed to add ${field}_tag:`, error.message)
      }
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting database schema updates for encrypted fields...\n")
  console.log(`Endpoint: ${APPWRITE_ENDPOINT}`)
  console.log(`Project: ${APPWRITE_PROJECT_ID}`)
  console.log(`Database: ${DATABASE_ID}\n`)

  try {
    // Process each collection
    for (const [collectionId, fields] of Object.entries(ENCRYPTED_FIELDS_CONFIG)) {
      await addEncryptedFieldsToCollection(collectionId, fields)
    }

    console.log("\n✅ All collections processed successfully!")
    console.log("\nNext steps:")
    console.log("1. Review the new attributes in Appwrite Console")
    console.log("2. Test encryption/decryption with sample data")
    console.log("3. Run data migration script for existing records")
    console.log("4. Update collection permissions to restrict direct access")
  } catch (error) {
    console.error("\n❌ Error during schema update:", error)
    process.exit(1)
  }
}

// Run the script
main()
