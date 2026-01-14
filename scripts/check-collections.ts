// scripts/check-collections.ts (updated document count section)
import { Client, Databases, Query } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

// Validate environment variables
if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("❌ Missing environment variables")
  console.error("   Please check your .env.local file")
  console.error("   Required:")
  console.error("   - NEXT_PUBLIC_APPWRITE_ENDPOINT")
  console.error("   - NEXT_PUBLIC_APPWRITE_PROJECT_ID")
  console.error("   - NEXT_PUBLIC_APPWRITE_DATABASE_ID")
  console.error("   - APPWRITE_API_KEY")
  process.exit(1)
}

// Type assert after validation
const validatedEndpoint = ENDPOINT as string
const validatedProjectId = PROJECT_ID as string
const validatedApiKey = API_KEY as string
const validatedDatabaseId = DATABASE_ID as string

const client = new Client()
  .setEndpoint(validatedEndpoint)
  .setProject(validatedProjectId)
  .setKey(validatedApiKey)

const databases = new Databases(client)

async function checkCollections() {
  try {
    console.log("🔍 Checking collections and attributes...")
    console.log(`📊 Database: ${validatedDatabaseId}`)
    
    // List all collections
    const collections = await databases.listCollections(validatedDatabaseId)
    console.log(`\n📂 Found ${collections.total} collections:`)
    
    if (collections.total === 0) {
      console.log("   No collections found! Run setup script first:")
      console.log("   npm run appwrite:setup")
      return
    }
    
    for (const collection of collections.collections) {
      console.log(`\n┌── ${collection.name} (${collection.$id})`)
      console.log(`│   Created: ${new Date(collection.$createdAt).toLocaleString()}`)
      console.log(`│   Permissions: ${collection.$permissions.length} rules`)
      
      // Get collection attributes
      try {
        const attributes = await databases.listAttributes(validatedDatabaseId, collection.$id)
        console.log(`├── 📋 Attributes (${attributes.total}):`)
        
        if (attributes.total === 0) {
          console.log(`│   └── No attributes defined`)
        } else {
          // Group attributes by type for better readability
          const attrGroups: Record<string, any[]> = {}
          
          attributes.attributes.forEach((attr: any) => {
            const type = attr.array ? `${attr.type}[]` : attr.type
            if (!attrGroups[type]) {
              attrGroups[type] = []
            }
            attrGroups[type].push(attr)
          })
          
          // Display attributes grouped by type
          const typeKeys = Object.keys(attrGroups)
          typeKeys.forEach((type, typeIndex) => {
            const isLastType = typeIndex === typeKeys.length - 1
            console.log(`│   ${isLastType ? '└' : '├'}── ${type}:`)
            
            attrGroups[type].forEach((attr, attrIndex) => {
              const isLastAttr = attrIndex === attrGroups[type].length - 1
              const symbol = isLastType && isLastAttr ? '    └' : '    ├'
              console.log(`│   ${symbol}── ${attr.key}${attr.required ? ' [required]' : ''}${attr.default ? ` (default: ${attr.default})` : ''}`)
            })
          })
        }
        
        // Get indexes
        try {
          const indexes = await databases.listIndexes(validatedDatabaseId, collection.$id)
          if (indexes.total > 0) {
            console.log(`├── 🔍 Indexes (${indexes.total}):`)
            indexes.indexes.forEach((index: any, idx: number) => {
              const isLast = idx === indexes.total - 1
              console.log(`│   ${isLast ? '└' : '├'}── ${index.key} (${index.type}): [${index.attributes.join(', ')}]`)
            })
          }
        } catch (indexError: any) {
          console.log(`├── ⚠️  Could not get indexes: ${indexError.message}`)
        }
        
      } catch (attrError: any) {
        console.log(`├── ❌ Could not get attributes: ${attrError.message}`)
      }
      
      // Get document count - FIXED: using Query.limit(1) instead of just 1
      try {
        const documents = await databases.listDocuments(
          validatedDatabaseId, 
          collection.$id, 
          [Query.limit(1)] // Use Query.limit instead of raw number
        )
        console.log(`└── 📄 Documents: ${documents.total}`)
      } catch (docError: any) {
        console.log(`└── 📄 Could not get document count: ${docError.message}`)
      }
    }
    
    console.log("\n✅ Collection check completed")
    
  } catch (error: any) {
    console.error("\n❌ Error checking collections:", error.message)
    console.error("\n💡 Tips:")
    console.error("   1. Check if database exists")
    console.error("   2. Verify API key permissions")
    console.error("   3. Make sure DATABASE_ID is correct")
  }
}

checkCollections()