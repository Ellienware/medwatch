// scripts/add-certificate-fields.ts
import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load from .env.local where your actual variables are
dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("❌ Missing environment variables");
  console.log("ENDPOINT:", ENDPOINT ? "Set" : "Missing");
  console.log("PROJECT_ID:", PROJECT_ID ? "Set" : "Missing");
  console.log("API_KEY:", API_KEY ? "Set" : "Missing");
  console.log("DATABASE_ID:", DATABASE_ID ? "Set" : "Missing");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const COLLECTION_ID = 'certificates';

async function addStringAttribute(
  name: string,
  required: boolean = false,
  size: number = 100,
  defaultValue?: string
) {
  try {
    console.log(`➕ Adding ${name} (string, required: ${required})...`);
    
    await databases.createStringAttribute(
      DATABASE_ID,
      COLLECTION_ID,
      name,
      size,
      required,
      defaultValue
    );
    
    console.log(`✅ Added ${name}`);
    return true;
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.code === 409) {
      console.log(`✅ ${name} already exists`);
      return true;
    } else {
      console.error(`❌ Error adding ${name}:`, error.message);
      return false;
    }
  }
}

async function addCertificateFields() {
  console.log('🚀 Adding missing fields to certificates collection...\n');
  console.log('📋 Current Database ID:', DATABASE_ID);
  console.log('📋 Collection ID:', COLLECTION_ID);
  console.log('📋 Project ID:', PROJECT_ID);
  console.log('');

  let success = true;

  // Add exam_date (string, not required)
  success = success && await addStringAttribute('exam_date', false, 100);

  // Add medical_type (string, not required)
  success = success && await addStringAttribute('medical_type', false, 50);

  // Add fitness_status (string, not required)
  success = success && await addStringAttribute('fitness_status', false, 50);

  // Add template_id (string, not required) - for backward compatibility
  success = success && await addStringAttribute('template_id', false, 100, "");

  if (success) {
    console.log('\n🎉 All fields added/verified successfully!');
    console.log('\n📋 Summary of added fields:');
    console.log('==========================');
    console.log('✅ exam_date (string, optional) - Examination date');
    console.log('✅ medical_type (string, optional) - Type of medical exam');
    console.log('✅ fitness_status (string, optional) - Fitness assessment result');
    console.log('✅ template_id (string, optional, default: "") - Template reference');
  } else {
    console.log('\n❌ Some fields failed to add. Please check the errors above.');
    process.exit(1);
  }
}

addCertificateFields().catch(console.error);