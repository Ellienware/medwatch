import { Client, Databases, Storage, Permission, Role, ID, Compression, IndexType } from "node-appwrite"
import * as dotenv from "dotenv"

/* --------------------------------------------------
   LOAD ENV
-------------------------------------------------- */
dotenv.config({ path: '.env.local' })

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || "medical_files"

// Validate environment variables
console.log("🔧 Checking environment variables...")
console.log(`   Endpoint: ${ENDPOINT ? "✓" : "✗"} ${ENDPOINT}`)
console.log(`   Project ID: ${PROJECT_ID ? "✓" : "✗"} ${PROJECT_ID}`)
console.log(`   Database ID: ${DATABASE_ID ? "✓" : "✗"} ${DATABASE_ID}`)
console.log(`   Storage Bucket ID: ${STORAGE_BUCKET_ID}`)
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
const storage = new Storage(client)

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
async function exists(fn: () => Promise<any>) {
  try {
    await fn()
    return true
  } catch {
    return false
  }
}

async function createCollection(id: string, name: string, readPermissions: any[], writePermissions: any[]) {
  console.log(`   Creating collection: ${id}...`)
  
  if (await exists(() => databases.getCollection(validatedDatabaseId, id))) {
    console.log(`   ✓ Collection ${id} already exists`)
    return
  }
  
  const allPermissions = [...readPermissions, ...writePermissions]
  
  try {
    await databases.createCollection(validatedDatabaseId, id, name, allPermissions, false)
    console.log(`   ✓ Created collection: ${id}`)
  } catch (error: any) {
    console.error(`   ✗ Failed to create collection ${id}:`, error.message)
    throw error
  }
}

async function attr(fn: () => Promise<any>, name: string) {
  try {
    await fn()
    console.log(`     ✓ Added attribute: ${name}`)
  } catch (error: any) {
    if (!error.message.includes("already exists")) {
      console.log(`     ⚠ Could not add attribute ${name}: ${error.message}`)
    }
  }
}

async function index(fn: () => Promise<any>, name: string) {
  try {
    await fn()
    console.log(`     ✓ Added index: ${name}`)
  } catch (error: any) {
    if (!error.message.includes("already exists")) {
      console.log(`     ⚠ Could not add index ${name}: ${error.message}`)
    }
  }
}

/* --------------------------------------------------
   DATABASE
-------------------------------------------------- */
async function setupDatabase() {
  console.log("\n📁 Setting up database...")
  if (!(await exists(() => databases.get(validatedDatabaseId)))) {
    try {
      await databases.create(validatedDatabaseId, "MedSurv Enterprise DB")
      console.log(`   ✓ Created database: ${validatedDatabaseId}`)
    } catch (error: any) {
      console.error(`   ✗ Failed to create database:`, error.message)
      throw error
    }
  } else {
    console.log(`   ✓ Database ${validatedDatabaseId} already exists`)
  }
}

/* --------------------------------------------------
   STORAGE
-------------------------------------------------- */
async function setupStorage() {
  console.log("\n📦 Setting up storage bucket...")
  if (await exists(() => storage.getBucket(STORAGE_BUCKET_ID))) {
    console.log(`   ✓ Storage bucket ${STORAGE_BUCKET_ID} already exists`)
    return
  }

  try {
    await storage.createBucket(
      STORAGE_BUCKET_ID,
      "Medical Files",
      [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
      ],
      false
    )
    console.log(`   ✓ Created storage bucket: ${STORAGE_BUCKET_ID}`)
  } catch (error: any) {
    console.error(`   ✗ Failed to create storage bucket:`, error.message)
    throw error
  }
}

/* --------------------------------------------------
   COLLECTIONS (Matching TypeScript Schema)
-------------------------------------------------- */
async function setupCollections() {
  console.log("\n🗂️ Setting up collections...")
  const admin = Role.team("admin")
  const readPerms = [Permission.read(admin)]
  const writePerms = [Permission.write(admin)]

  /* ---------- CLINICS ---------- */
  await createCollection("clinics", "Clinics", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "name", 255, true), "clinics.name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "registration_number", 100, false), "clinics.registration_number")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "clinics", "email", true), "clinics.email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "phone", 50, false), "clinics.phone")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "address", 500, false), "clinics.address")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "logo_url", 500, false), "clinics.logo_url")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "subscription_plan", 50, true), "clinics.subscription_plan")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "subscription_status", 50, true), "clinics.subscription_status")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinics", "subscription_start_date", false), "clinics.subscription_start_date")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinics", "subscription_end_date", false), "clinics.subscription_end_date")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "clinics", "monthly_patient_limit", true), "clinics.monthly_patient_limit")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "clinics", "current_month_patients", true), "clinics.current_month_patients")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "paystack_customer_id", 100, false), "clinics.paystack_customer_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "paystack_subscription_id", 100, false), "clinics.paystack_subscription_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinics", "settings", 2000, false), "clinics.settings")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "clinics", "is_active", true), "clinics.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinics", "created_at", true), "clinics.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinics", "updated_at", true), "clinics.updated_at")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "clinics", "data_retention_days", true), "clinics.data_retention_days")

  /* ---------- BRANCHES ---------- */
  await createCollection("branches", "Branches", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "clinic_id", 50, true), "branches.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "name", 255, true), "branches.name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "code", 50, true), "branches.code")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "branches", "email", false), "branches.email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "phone", 50, false), "branches.phone")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "address", 500, false), "branches.address")
  await attr(() => databases.createFloatAttribute(validatedDatabaseId, "branches", "latitude", false), "branches.latitude")
  await attr(() => databases.createFloatAttribute(validatedDatabaseId, "branches", "longitude", false), "branches.longitude")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "branches", "operating_hours", 2000, false), "branches.operating_hours")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "branches", "is_active", true), "branches.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "branches", "created_at", true), "branches.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "branches", "updated_at", true), "branches.updated_at")

  /* ---------- USERS ---------- */
  await createCollection("users", "Users", readPerms, writePerms)
  try {
  await databases.deleteAttribute(validatedDatabaseId, "users", "auth_user_id")
  console.log("     ✓ Deleted existing auth_user_id attribute")
} catch (error: any) {
  // Attribute might not exist yet, that's fine
  console.log("     ⚠ auth_user_id attribute doesn't exist yet or couldn't be deleted:", error.message)
}
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "clinic_id", 50, false), "users.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "branch_id", 50, false), "users.branch_id")
  // CHANGE THIS LINE - change 'true' to 'false' to make auth_user_id optional
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "auth_user_id", 50, false), "users.auth_user_id")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "users", "email", true), "users.email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "full_name", 255, true), "users.full_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "phone", 50, false), "users.phone")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "role", 50, true), "users.role")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "permissions", 2000, false), "users.permissions")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "professional_registration_number", 100, false), "users.professional_registration_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "specialization", 255, false), "users.specialization")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "users", "avatar_url", 500, false), "users.avatar_url")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "users", "is_active", true), "users.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "users", "last_login", false), "users.last_login")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "users", "created_at", true), "users.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "users", "updated_at", true), "users.updated_at")
  // Also update this index from Unique to Key since auth_user_id can be null
  await index(() => databases.createIndex(validatedDatabaseId, "users", "auth_idx", IndexType.Key, ["auth_user_id"], ["ASC"]), "users.auth_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "users", "email_idx", IndexType.Key, ["email"], ["ASC"]), "users.email_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "users", "clinic_role_idx", IndexType.Key, ["clinic_id", "role"], ["ASC", "ASC"]), "users.clinic_role_idx")

  /* ---------- EMPLOYERS ---------- */
  await createCollection("employers", "Employers", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "clinic_id", 50, true), "employers.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "company_name", 255, true), "employers.company_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "registration_number", 100, false), "employers.registration_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "industry", 100, false), "employers.industry")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "employers", "email", true), "employers.email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "phone", 50, false), "employers.phone")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "address", 500, false), "employers.address")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "employers", "billing_email", false), "employers.billing_email")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "employers", "payment_terms", false), "employers.payment_terms")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "portal_user_id", 50, false), "employers.portal_user_id")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "employers", "portal_enabled", true), "employers.portal_enabled")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "employers", "auto_receive_certificates", true), "employers.auto_receive_certificates")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "employers", "notification_preferences", 2000, false), "employers.notification_preferences")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "employers", "is_active", true), "employers.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "employers", "created_at", true), "employers.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "employers", "updated_at", true), "employers.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "employers", "clinic_email_idx", IndexType.Unique, ["clinic_id", "email"], ["ASC", "ASC"]), "employers.clinic_email_idx")

  /* ---------- PATIENTS ---------- */
  await createCollection("patients", "Patients", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "clinic_id", 50, true), "patients.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "employer_id", 50, false), "patients.employer_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "id_number", 100, true), "patients.id_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "passport_number", 100, false), "patients.passport_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "first_name", 100, true), "patients.first_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "last_name", 100, true), "patients.last_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "date_of_birth", 20, true), "patients.date_of_birth")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "gender", 20, false), "patients.gender")
  await attr(() => databases.createEmailAttribute(validatedDatabaseId, "patients", "email", false), "patients.email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "phone", 50, false), "patients.phone")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "address", 500, false), "patients.address")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "employee_number", 100, false), "patients.employee_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "job_title", 255, false), "patients.job_title")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "department", 255, false), "patients.department")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "employment_start_date", 20, false), "patients.employment_start_date")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "blood_type", 10, false), "patients.blood_type")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "allergies", 1000, false), "patients.allergies")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "chronic_conditions", 1000, false), "patients.chronic_conditions")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "emergency_contact_name", 255, false), "patients.emergency_contact_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "emergency_contact_phone", 50, false), "patients.emergency_contact_phone")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "patients", "consent_given", true), "patients.consent_given")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "consent_date", 20, false), "patients.consent_date")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "photo_url", 500, false), "patients.photo_url")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "patients", "notes", 2000, false), "patients.notes")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "patients", "is_active", true), "patients.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "patients", "created_at", true), "patients.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "patients", "updated_at", true), "patients.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "patients", "clinic_id_number_idx", IndexType.Unique, ["clinic_id", "id_number"], ["ASC", "ASC"]), "patients.clinic_id_number_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "patients", "employer_idx", IndexType.Key, ["employer_id"], ["ASC"]), "patients.employer_idx")

  /* ---------- APPOINTMENTS ---------- */
  await createCollection("appointments", "Appointments", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "clinic_id", 50, true), "appointments.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "branch_id", 50, true), "appointments.branch_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "patient_id", 50, true), "appointments.patient_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "employer_id", 50, false), "appointments.employer_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "appointment_date", 20, true), "appointments.appointment_date")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "appointment_time", 20, true), "appointments.appointment_time")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "appointment_type", 100, true), "appointments.appointment_type")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "reason", 500, false), "appointments.reason")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "status", 50, true), "appointments.status")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "checked_in_at", false), "appointments.checked_in_at")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "checked_in_by", 50, false), "appointments.checked_in_by")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "nurse_assigned_id", 50, false), "appointments.nurse_assigned_id")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "nurse_started_at", false), "appointments.nurse_started_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "nurse_completed_at", false), "appointments.nurse_completed_at")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "doctor_assigned_id", 50, false), "appointments.doctor_assigned_id")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "doctor_started_at", false), "appointments.doctor_started_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "doctor_completed_at", false), "appointments.doctor_completed_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "completed_at", false), "appointments.completed_at")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "reception_notes", 1000, false), "appointments.reception_notes")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "nurse_notes", 1000, false), "appointments.nurse_notes")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "doctor_notes", 1000, false), "appointments.doctor_notes")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "appointments", "created_by", 50, false), "appointments.created_by")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "created_at", true), "appointments.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "appointments", "updated_at", true), "appointments.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "appointments", "clinic_date_status_idx", IndexType.Key, ["clinic_id", "appointment_date", "status"], ["ASC", "ASC", "ASC"]), "appointments.clinic_date_status_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "appointments", "patient_idx", IndexType.Key, ["patient_id"], ["ASC"]), "appointments.patient_idx")

  /* ---------- CLINICAL TESTS ---------- */
  await createCollection("clinical_tests", "Clinical Tests", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "clinic_id", 50, true), "clinical_tests.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "test_code", 50, true), "clinical_tests.test_code")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "test_name", 255, true), "clinical_tests.test_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "test_category", 100, false), "clinical_tests.test_category")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "description", 1000, false), "clinical_tests.description")
  await attr(() => databases.createFloatAttribute(validatedDatabaseId, "clinical_tests", "price", true), "clinical_tests.price")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "parameters", 4000, false), "clinical_tests.parameters")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "clinical_tests", "normal_ranges", 2000, false), "clinical_tests.normal_ranges")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "clinical_tests", "requires_equipment", true), "clinical_tests.requires_equipment")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "clinical_tests", "estimated_duration_minutes", false), "clinical_tests.estimated_duration_minutes")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "clinical_tests", "is_active", true), "clinical_tests.is_active")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinical_tests", "created_at", true), "clinical_tests.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "clinical_tests", "updated_at", true), "clinical_tests.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "clinical_tests", "clinic_test_code_idx", IndexType.Unique, ["clinic_id", "test_code"], ["ASC", "ASC"]), "clinical_tests.clinic_test_code_idx")

  /* ---------- TEST RESULTS ---------- */
  await createCollection("test_results", "Test Results", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "clinic_id", 50, true), "test_results.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "appointment_id", 50, true), "test_results.appointment_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "patient_id", 50, true), "test_results.patient_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "test_id", 50, true), "test_results.test_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "performed_by", 50, false), "test_results.performed_by")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "test_results", "performed_at", true), "test_results.performed_at")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "results", 4000, true), "test_results.results")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "test_results", "is_normal", false), "test_results.is_normal")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "findings", 2000, false), "test_results.findings")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "recommendations", 2000, false), "test_results.recommendations")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "attachments", 2000, false), "test_results.attachments")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "test_results", "reviewed_by", 50, false), "test_results.reviewed_by")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "test_results", "reviewed_at", false), "test_results.reviewed_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "test_results", "created_at", true), "test_results.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "test_results", "updated_at", true), "test_results.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "test_results", "appointment_test_idx", IndexType.Unique, ["appointment_id", "test_id"], ["ASC", "ASC"]), "test_results.appointment_test_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "test_results", "patient_idx", IndexType.Key, ["patient_id"], ["ASC"]), "test_results.patient_idx")

  /* ---------- CERTIFICATES ---------- */
  await createCollection("certificates", "Certificates", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "clinic_id", 50, true), "certificates.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "appointment_id", 50, true), "certificates.appointment_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "patient_id", 50, true), "certificates.patient_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "certificate_number", 100, true), "certificates.certificate_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "certificate_type", 50, true), "certificates.certificate_type")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "issue_date", 20, true), "certificates.issue_date")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "valid_from", 20, false), "certificates.valid_from")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "valid_until", 20, false), "certificates.valid_until")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "diagnosis", 1000, false), "certificates.diagnosis")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "restrictions", 1000, false), "certificates.restrictions")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "recommendations", 1000, false), "certificates.recommendations")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "issued_by", 50, true), "certificates.issued_by")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "doctor_name", 255, true), "certificates.doctor_name")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "doctor_registration_number", 100, false), "certificates.doctor_registration_number")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "doctor_signature_url", 500, false), "certificates.doctor_signature_url")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "certificates", "pdf_url", 500, false), "certificates.pdf_url")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "certificates", "sent_to_employer", true), "certificates.sent_to_employer")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "certificates", "sent_at", false), "certificates.sent_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "certificates", "created_at", true), "certificates.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "certificates", "updated_at", true), "certificates.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "certificates", "certificate_number_idx", IndexType.Unique, ["certificate_number"], ["ASC"]), "certificates.certificate_number_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "certificates", "appointment_idx", IndexType.Unique, ["appointment_id"], ["ASC"]), "certificates.appointment_idx")

  /* ---------- SUBSCRIPTIONS ---------- */
  await createCollection("subscriptions", "Subscriptions", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "subscriptions", "clinic_id", 50, true), "subscriptions.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "subscriptions", "pricing_tier", 50, true, "single_branch"), "subscriptions.pricing_tier")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "subscriptions", "total_branches", true, 1), "subscriptions.total_branches")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "subscriptions", "amount", true), "subscriptions.amount")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "subscriptions", "status", 50, true, "pending"), "subscriptions.status")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "subscriptions", "current_period_start", true), "subscriptions.current_period_start")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "subscriptions", "current_period_end", true), "subscriptions.current_period_end")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "subscriptions", "paystack_subscription_id", 100, false), "subscriptions.paystack_subscription_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "subscriptions", "paystack_reference", 100, false), "subscriptions.paystack_reference")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "subscriptions", "created_at", true), "subscriptions.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "subscriptions", "updated_at", true), "subscriptions.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "subscriptions", "clinic_idx", IndexType.Key, ["clinic_id"], ["ASC"]), "subscriptions.clinic_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "subscriptions", "status_idx", IndexType.Key, ["status"], ["ASC"]), "subscriptions.status_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "subscriptions", "paystack_ref_idx", IndexType.Unique, ["paystack_reference"], ["ASC"]), "subscriptions.paystack_ref_idx")

  /* ---------- PAYMENTS ---------- */
  await createCollection("payments", "Payments", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "clinic_id", 50, true), "payments.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "subscription_id", 50, true), "payments.subscription_id")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "payments", "amount", true), "payments.amount")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "currency", 3, true, "ZAR"), "payments.currency")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "status", 50, true, "pending"), "payments.status")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "payment_method", 50, true, "card"), "payments.payment_method")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "payment_provider", 50, true, "paystack"), "payments.payment_provider")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "payment_provider_transaction_id", 100, false), "payments.payment_provider_transaction_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "payment_provider_reference", 100, false), "payments.payment_provider_reference")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "description", 500, true), "payments.description")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "payments", "metadata", 2000, false), "payments.metadata")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "payments", "paid_at", false), "payments.paid_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "payments", "created_at", true), "payments.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "payments", "updated_at", true), "payments.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "payments", "clinic_idx", IndexType.Key, ["clinic_id"], ["ASC"]), "payments.clinic_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "payments", "subscription_idx", IndexType.Key, ["subscription_id"], ["ASC"]), "payments.subscription_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "payments", "status_idx", IndexType.Key, ["status"], ["ASC"]), "payments.status_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "payments", "paystack_ref_idx", IndexType.Unique, ["payment_provider_reference"], ["ASC"]), "payments.paystack_ref_idx")

  /* ---------- INVOICES ---------- */
  await createCollection("invoices", "Invoices", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "clinic_id", 50, true), "invoices.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "subscription_id", 50, false), "invoices.subscription_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "invoice_number", 100, true), "invoices.invoice_number")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "invoices", "date", true), "invoices.date")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "description", 500, true), "invoices.description")
  await attr(() => databases.createIntegerAttribute(validatedDatabaseId, "invoices", "total", true), "invoices.total")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "currency", 3, true, "ZAR"), "invoices.currency")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "status", 50, true, "pending"), "invoices.status")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "paystack_reference", 100, false), "invoices.paystack_reference")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "invoices", "paid_at", false), "invoices.paid_at")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "invoices", "payment_method", 50, false), "invoices.payment_method")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "invoices", "due_date", false), "invoices.due_date")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "invoices", "created_at", true), "invoices.created_at")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "invoices", "updated_at", true), "invoices.updated_at")
  await index(() => databases.createIndex(validatedDatabaseId, "invoices", "clinic_idx", IndexType.Key, ["clinic_id"], ["ASC"]), "invoices.clinic_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "invoices", "invoice_number_idx", IndexType.Unique, ["invoice_number"], ["ASC"]), "invoices.invoice_number_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "invoices", "status_idx", IndexType.Key, ["status"], ["ASC"]), "invoices.status_idx")

  /* ---------- AUDIT LOGS ---------- */
  await createCollection("audit_logs", "Audit Logs", readPerms, writePerms)
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "clinic_id", 50, true), "audit_logs.clinic_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "user_id", 50, true), "audit_logs.user_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "user_email", 255, true), "audit_logs.user_email")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "user_role", 50, true), "audit_logs.user_role")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "action", 255, true), "audit_logs.action")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "entity_type", 100, true), "audit_logs.entity_type")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "entity_id", 50, true), "audit_logs.entity_id")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "entity_description", 500, false), "audit_logs.entity_description")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "changes", 4000, false), "audit_logs.changes")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "metadata", 2000, false), "audit_logs.metadata")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "ip_address", 100, false), "audit_logs.ip_address")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "user_agent", 500, false), "audit_logs.user_agent")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "audit_logs", "timestamp", true), "audit_logs.timestamp")
  await attr(() => databases.createBooleanAttribute(validatedDatabaseId, "audit_logs", "success", true), "audit_logs.success")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "error_message", 1000, false), "audit_logs.error_message")
  await attr(() => databases.createStringAttribute(validatedDatabaseId, "audit_logs", "risk_level", 50, false), "audit_logs.risk_level")
  await attr(() => databases.createDatetimeAttribute(validatedDatabaseId, "audit_logs", "created_at", true), "audit_logs.created_at")
  await index(() => databases.createIndex(validatedDatabaseId, "audit_logs", "clinic_timestamp_idx", IndexType.Key, ["clinic_id", "timestamp"], ["ASC", "DESC"]), "audit_logs.clinic_timestamp_idx")
  await index(() => databases.createIndex(validatedDatabaseId, "audit_logs", "user_idx", IndexType.Key, ["user_id"], ["ASC"]), "audit_logs.user_idx")
}

/* --------------------------------------------------
   RUN
-------------------------------------------------- */
async function run() {
  console.log("🚀 Setting up MedSurv Enterprise Schema...")
  console.log("=".repeat(50))
  
  try {
    await setupDatabase()
    console.log("-".repeat(50))
    await setupStorage()
    console.log("-".repeat(50))
    await setupCollections()
    console.log("=".repeat(50))
    console.log("✅ MedSurv setup completed successfully!")
    console.log("\n📋 Summary:")
    console.log(`   Database: ${validatedDatabaseId}`)
    console.log(`   Storage Bucket: ${STORAGE_BUCKET_ID}`)
    console.log(`   Collections Created: 13`)
    console.log("\n📝 Important Notes:")
    console.log("   • Date fields (date_of_birth, appointment_date, etc.) are stored as strings (YYYY-MM-DD)")
    console.log("   • Timestamps (created_at, updated_at) are stored as datetime")
    console.log("   • JSON fields (settings, permissions, results) are stored as strings")
    console.log("\n⚠️  Next steps:")
    console.log("   1. Create an 'admin' team in Appwrite Console")
    console.log("   2. Add users to the 'admin' team for access control")
    console.log("   3. Test the setup by creating a clinic and user")
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message)
    console.error("\n💡 Troubleshooting tips:")
    console.error("   1. Check if API key has sufficient permissions")
    console.error("   2. Verify Appwrite endpoint is accessible")
    console.error("   3. Ensure you have correct Appwrite package versions")
    process.exit(1)
  }
}

run().catch(console.error)