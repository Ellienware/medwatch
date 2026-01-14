// lib/appwrite/config.ts

// Appwrite Database and Collection IDs
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

// Collection IDs - these will be created in Appwrite
export const COLLECTIONS = {
  CLINICS: "clinics",
  BRANCHES: "branches",
  USERS: "users",
  EMPLOYERS: "employers",
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  CLINICAL_TESTS: "clinical_tests",
  TEST_RESULTS: "test_results",
  CERTIFICATES: "certificates",
  INVOICES: "invoices",
  NOTIFICATIONS: "notifications",
  AUDIT_LOGS: "audit_logs",
  SUBSCRIPTIONS: "subscriptions",
  PAYMENTS: "payments",
  PAYMENT_METHODS: "payment_methods",
  ACTIVITIES: "activities",
}

// Storage bucket ID - single bucket for all file types
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || "medsurv_storage"

export const STORAGE = {
  BUCKET_ID: STORAGE_BUCKET_ID,
}

// File type prefixes for organizing files within single bucket
export const FILE_PREFIXES = {
  AVATARS: "avatars/",
  CERTIFICATES: "certificates/",
  TEST_RESULTS: "test_results/",
  CLINIC_LOGOS: "clinic_logos/",
}
