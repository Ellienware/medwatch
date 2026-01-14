// scripts/fix-auth-mismatch.ts
import { Client, Databases, Query } from "node-appwrite"
import * as dotenv from "dotenv"

dotenv.config({ path: '.env.local' })

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)

async function fixAuthMismatch(email: string) {
  console.log(`🔧 Fixing auth_user_id mismatch for: ${email}`)
  
  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  
  try {
    // 1. Get employer record
    const employers = await databases.listDocuments(
      DATABASE_ID,
      'employers',
      [Query.equal('email', email)]
    )
    
    if (employers.total === 0) {
      console.log(`❌ Employer not found: ${email}`)
      return
    }
    
    const employer = employers.documents[0]
    const employerAuthId = employer.auth_user_id
    
    console.log(`Employer auth_user_id: ${employerAuthId}`)
    
    if (!employerAuthId) {
      console.log(`❌ Employer has no auth_user_id`)
      return
    }
    
    // 2. Get user record
    const users = await databases.listDocuments(
      DATABASE_ID,
      'users',
      [Query.equal('email', email)]
    )
    
    if (users.total === 0) {
      console.log(`❌ User not found: ${email}`)
      return
    }
    
    const user = users.documents[0]
    console.log(`Current user auth_user_id: ${user.auth_user_id}`)
    
    // 3. Update user with correct auth_user_id
    if (user.auth_user_id !== employerAuthId) {
      console.log(`🔄 Updating user auth_user_id from "${user.auth_user_id}" to "${employerAuthId}"`)
      
      await databases.updateDocument(
        DATABASE_ID,
        'users',
        user.$id,
        {
          auth_user_id: employerAuthId
        }
      )
      
      console.log(`✅ Updated user ${user.$id} with auth_user_id: ${employerAuthId}`)
    } else {
      console.log(`✅ User already has correct auth_user_id`)
    }
    
    // 4. Verify they're linked
    if (employer.linked_user_id !== user.$id) {
      console.log(`🔄 Updating employer linked_user_id to ${user.$id}`)
      
      await databases.updateDocument(
        DATABASE_ID,
        'employers',
        employer.$id,
        {
          linked_user_id: user.$id
        }
      )
      
      console.log(`✅ Updated employer linked_user_id`)
    } else {
      console.log(`✅ Employer already linked to user`)
    }
    
    console.log('\n🎉 Fix completed!')
    console.log(`User ID: ${user.$id}`)
    console.log(`Employer ID: ${employer.$id}`)
    console.log(`Auth User ID: ${employerAuthId}`)
    console.log(`Linked: ${employer.linked_user_id === user.$id ? 'Yes' : 'No'}`)
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

// Run for the specific email
fixAuthMismatch('clientacc610@gmail.com').catch(console.error)