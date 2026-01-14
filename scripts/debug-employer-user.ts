// scripts/debug-employer-user.ts
import { Client, Databases, Query } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)

async function debugEmployerUser(email: string) {
  console.log(`🔍 Debugging user/employer: ${email}`)
  
  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  
  try {
    // 1. Check user collection
    console.log('\n📋 Checking USERS collection:')
    const users = await databases.listDocuments(
      DATABASE_ID,
      'users',
      [Query.equal('email', email)]
    )
    
    if (users.total > 0) {
      const user = users.documents[0]
      console.log('✅ User found in users collection:')
      console.log('   ID:', user.$id)
      console.log('   Role:', user.role)
      console.log('   First login required:', user.first_login_required)
      console.log('   Auth User ID:', user.auth_user_id)
      console.log('   Clinic ID:', user.clinic_id)
      console.log('   Company Name:', user.company_name)
      console.log('   Permissions:', user.permissions)
      console.log('   Created:', user.$createdAt)
    } else {
      console.log('❌ User NOT found in users collection')
    }
    
    // 2. Check employer collection
    console.log('\n📋 Checking EMPLOYERS collection:')
    const employers = await databases.listDocuments(
      DATABASE_ID,
      'employers',
      [Query.equal('email', email)]
    )
    
    if (employers.total > 0) {
      const employer = employers.documents[0]
      console.log('✅ Employer found in employers collection:')
      console.log('   ID:', employer.$id)
      console.log('   Company Name:', employer.company_name)
      console.log('   Auth User ID:', employer.auth_user_id)
      console.log('   Linked User ID:', employer.linked_user_id)
      console.log('   Portal Enabled:', employer.portal_enabled)
      console.log('   First login required:', employer.first_login_required)
      console.log('   Clinic ID:', employer.clinic_id)
      console.log('   Created:', employer.$createdAt)
    } else {
      console.log('❌ Employer NOT found in employers collection')
    }
    
    // 3. Check Appwrite Users API (auth)
    console.log('\n📋 Checking Appwrite Users API:')
    try {
      // You'll need to use serverUsers for this
      const { serverUsers } = await import('@/lib/appwrite/server-client')
      const appwriteUsers = await serverUsers.list([`email=${email}`])
      
      if (appwriteUsers.users.length > 0) {
        const appwriteUser = appwriteUsers.users[0]
        console.log('✅ User found in Appwrite Auth:')
        console.log('   ID:', appwriteUser.$id)
        console.log('   Name:', appwriteUser.name)
        console.log('   Email:', appwriteUser.email)
        console.log('   Status:', appwriteUser.status)
        console.log('   Created:', appwriteUser.$createdAt)
      } else {
        console.log('❌ User NOT found in Appwrite Auth')
      }
    } catch (authError) {
      console.log('⚠️  Could not check Appwrite Auth:')
    }
    
  } catch (error: any) {
    console.error('❌ Debug error:', error.message)
  }
}

// Run for the specific email
debugEmployerUser('clientacc610@gmail.com').catch(console.error)