// scripts/update-database.ts
import { Client, Databases, IndexType, Permission, Role } from "node-appwrite"
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

async function setupClinicalAssessmentsCollection() {
  console.log("\n🔄 Setting up clinical assessments collection...")
  
  const admin = Role.team("admin")
  const readPerms = [Permission.read(admin)]
  const writePerms = [Permission.write(admin)]
  
  try {
    // Check if collection exists
    await databases.getCollection(DATABASE_ID, "clinical_assessments")
    console.log("✓ Clinical Assessments collection already exists")
  } catch {
    // Create collection
    try {
      await databases.createCollection(
        DATABASE_ID,
        "clinical_assessments",
        "Clinical Assessments",
        [...readPerms, ...writePerms],
        false
      )
      console.log("✓ Created clinical assessments collection")
    } catch (error: any) {
      console.error("✗ Failed to create collection:", error.message)
      return
    }
  }
  
  // Add attributes that match your ClinicalAssessment type
  const attributes = [
    { name: "clinic_id", type: "string", size: 255, required: true },
    { name: "appointment_id", type: "string", size: 255, required: true },
    { name: "patient_id", type: "string", size: 255, required: true },
    { name: "doctor_id", type: "string", size: 255, required: true },
    { name: "doctor_name", type: "string", size: 255, required: true },
    { name: "started_at", type: "string", size: 255, required: true },
    { name: "completed_at", type: "string", size: 255, required: false },
    { name: "status", type: "string", size: 20, required: true },
    { name: "clinical_findings", type: "string", size: 65535, required: false },
    { name: "physical_examination", type: "string", size: 65535, required: false },
    { name: "medical_history_notes", type: "string", size: 2000, required: false },
    { name: "current_medications", type: "string", size: 2000, required: false },
    { name: "allergies_confirmed", type: "string", size: 2000, required: false },
    { name: "rules_engine_summary", type: "string", size: 65535, required: false },
    { name: "doctor_decision", type: "string", size: 30, required: false },
    { name: "doctor_reasoning", type: "string", size: 2000, required: false },
    { name: "override_rules_engine", type: "boolean", required: false },
    { name: "override_reason", type: "string", size: 2000, required: false },
    { name: "restrictions", type: "string", size: 65535, required: false },
    { name: "restriction_duration", type: "string", size: 50, required: false },
    { name: "referrals", type: "string", size: 65535, required: false },
    { name: "follow_up_required", type: "boolean", required: false },
    { name: "follow_up_date", type: "string", size: 255, required: false },
    { name: "follow_up_notes", type: "string", size: 2000, required: false },
    { name: "additional_notes", type: "string", size: 2000, required: false },
    { name: "certificate_id", type: "string", size: 255, required: false },
    { name: "created_at", type: "string", size: 255, required: true },
    { name: "updated_at", type: "string", size: 255, required: true },
  ]
  
  for (const attr of attributes) {
    try {
      if (attr.type === "string") {
        await databases.createStringAttribute(
          DATABASE_ID,
          "clinical_assessments",
          attr.name,
          attr.size!,
          attr.required as boolean
        )
        console.log(`  ✓ Added string: ${attr.name} (size: ${attr.size})`)
      } else if (attr.type === "boolean") {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          "clinical_assessments",
          attr.name,
          attr.required as boolean
        )
        console.log(`  ✓ Added boolean: ${attr.name}`)
      }
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.log(`  ⚠ Error adding ${attr.name}:`, error.message)
      } else {
        console.log(`  ✓ ${attr.name} already exists`)
      }
    }
  }
  
  // Create indexes - use string literals directly
  try {
    await databases.createIndex(
      DATABASE_ID,
      "clinical_assessments",
      "appointment_idx",
      IndexType.Unique,  // String literal for unique index
      ["appointment_id"],
      []
    )
    console.log("  ✓ Created appointment_idx")
  } catch (error: any) {
    console.log("  ⚠ appointment_idx:", error.message)
  }
  
  try {
    await databases.createIndex(
      DATABASE_ID,
      "clinical_assessments",
      "patient_idx",
      IndexType.Key,  // String literal for key index
      ["patient_id"],
      []
    )
    console.log("  ✓ Created patient_idx")
  } catch (error: any) {
    console.log("  ⚠ patient_idx:", error.message)
  }
  
  try {
    await databases.createIndex(
      DATABASE_ID,
      "clinical_assessments",
      "doctor_idx",
      IndexType.Key,  // String literal for key index
      ["doctor_id"],
      []
    )
    console.log("  ✓ Created doctor_idx")
  } catch (error: any) {
    console.log("  ⚠ doctor_idx:", error.message)
  }
  
  try {
    await databases.createIndex(
      DATABASE_ID,
      "clinical_assessments",
      "clinic_status_idx",
      IndexType.Key,  // String literal for key index
      ["clinic_id", "status"],
      []
    )
    console.log("  ✓ Created clinic_status_idx")
  } catch (error: any) {
    console.log("  ⚠ clinic_status_idx:", error.message)
  }
  
  try {
    await databases.createIndex(
      DATABASE_ID,
      "clinical_assessments",
      "certificate_idx",
      IndexType.Key,  // String literal for key index
      ["certificate_id"],
      []
    )
    console.log("  ✓ Created certificate_idx")
  } catch (error: any) {
    console.log("  ⚠ certificate_idx:", error.message)
  }
  
  console.log("\n✅ Clinical Assessments collection setup complete!")
}

async function updateCertificateCollection() {
  console.log("\n🔄 Updating certificates collection to match Certificate type...")
  
  try {
    // Check if collection exists
    await databases.getCollection(DATABASE_ID, "certificates")
    console.log("✓ Certificates collection exists, updating...")
    
    // Add missing attributes
    const missingAttributes = [
      // Template and settings
      { name: "template_type", type: "string", size: 20, required: false },
      { name: "settings_override", type: "string", size: 65535, required: false },
      
      // Medical type and fitness status
      { name: "medical_type", type: "string", size: 20, required: false },
      { name: "fitness_status", type: "string", size: 30, required: false },
      
      // Test results JSON fields
      { name: "lung_function_results", type: "string", size: 65535, required: false },
      { name: "audiometry_results", type: "string", size: 65535, required: false },
      { name: "vision_results", type: "string", size: 65535, required: false },
      { name: "urinalysis_results", type: "string", size: 65535, required: false },
      { name: "chest_xray_normal", type: "boolean", required: false },
      { name: "referrals", type: "string", size: 65535, required: false },
      
      // Provider and practitioner info
      { name: "provider_info", type: "string", size: 65535, required: false },
      { name: "practitioner_info", type: "string", size: 65535, required: false },
      
      // Styling options
      { name: "show_border", type: "boolean", required: false },
      { name: "border_width", type: "integer", required: false },
      { name: "border_color", type: "string", size: 20, required: false },
      { name: "border_style", type: "string", size: 20, required: false },
      { name: "include_watermark", type: "boolean", required: false },
      { name: "watermark_text", type: "string", size: 100, required: false },
      { name: "watermark_opacity", type: "float", required: false },
      { name: "footer_text", type: "string", size: 500, required: false },
      { name: "disclaimer_text", type: "string", size: 1000, required: false },
      { name: "validity_period_days", type: "integer", required: false },
      { name: "show_qr_code", type: "boolean", required: false },
      
      // Exam date (missing from your schema but in type)
      { name: "exam_date", type: "string", size: 255, required: false },
    ]
    
    for (const attr of missingAttributes) {
      try {
        if (attr.type === "string") {
          await databases.createStringAttribute(
            DATABASE_ID,
            "certificates",
            attr.name,
            attr.size!,
            attr.required as boolean
          )
          console.log(`  ✓ Added string: ${attr.name} (size: ${attr.size})`)
        } else if (attr.type === "boolean") {
          await databases.createBooleanAttribute(
            DATABASE_ID,
            "certificates",
            attr.name,
            attr.required as boolean
          )
          console.log(`  ✓ Added boolean: ${attr.name}`)
        } else if (attr.type === "integer") {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            "certificates",
            attr.name,
            attr.required as boolean
          )
          console.log(`  ✓ Added integer: ${attr.name}`)
        } else if (attr.type === "float") {
          await databases.createFloatAttribute(
            DATABASE_ID,
            "certificates",
            attr.name,
            attr.required as boolean
          )
          console.log(`  ✓ Added float: ${attr.name}`)
        }
      } catch (error: any) {
        if (!error.message.includes("already exists")) {
          console.log(`  ⚠ Error adding ${attr.name}:`, error.message)
        } else {
          console.log(`  ✓ ${attr.name} already exists`)
        }
      }
    }
    
    // Add missing indexes
    try {
      await databases.createIndex(
        DATABASE_ID,
        "certificates",
        "clinic_issued_idx",
        IndexType.Key,  // String literal for key index
        ["clinic_id", "issued_by"],
        []
      )
      console.log("  ✓ Created clinic_issued_idx")
    } catch (error: any) {
      console.log("  ⚠ clinic_issued_idx:", error.message)
    }
    
    try {
      await databases.createIndex(
        DATABASE_ID,
        "certificates",
        "fitness_status_idx",
        IndexType.Key,  // String literal for key index
        ["fitness_status"],
        []
      )
      console.log("  ✓ Created fitness_status_idx")
    } catch (error: any) {
      console.log("  ⚠ fitness_status_idx:", error.message)
    }
    
    try {
      await databases.createIndex(
        DATABASE_ID,
        "certificates",
        "medical_type_idx",
        IndexType.Key,  // String literal for key index
        ["medical_type"],
        []
      )
      console.log("  ✓ Created medical_type_idx")
    } catch (error: any) {
      console.log("  ⚠ medical_type_idx:", error.message)
    }
    
  } catch (error: any) {
    console.error("✗ Certificates collection not found:", error.message)
  }
  
  console.log("\n✅ Certificate collection update complete!")
}

async function main() {
  console.log("🚀 Starting database setup and updates...\n")
  
  await setupNotificationsCollection()
  await setupClinicalAssessmentsCollection()
  await updateCertificateCollection()
  
  console.log("\n✨ All database updates completed successfully!")
}

main().catch(console.error)