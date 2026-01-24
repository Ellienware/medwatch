//lib/auth/appwrite-auth
import { serverUsers, serverAccount } from "@/lib/appwrite/server-client"
import { ID } from "node-appwrite"

/**
 * Create a user account in Appwrite
 */
export async function createAppwriteAccount(
  email: string,
  password: string,
  name: string
): Promise<string> {
  try {
    // Create user via Users API (admin endpoint)
    const user = await serverUsers.create(
      ID.unique(),
      email,
      undefined, // phone (optional)
      password,
      name
    )
    
    console.log(`Appwrite account created: ${user.$id}`)
    return user.$id
  } catch (error: any) {
    console.error("Failed to create Appwrite account:", error)
    
    // If user already exists, try to get the user
    if (error.message?.includes('already exists')) {
      try {
        // Try to get user by email
        const usersList = await serverUsers.list([`email=${email}`])
        if (usersList.users.length > 0) {
          return usersList.users[0].$id
        }
      } catch (lookupError) {
        console.error("Failed to lookup existing user:", lookupError)
      }
    }
    
    throw error
  }
}

/**
 * Send password reset email - UPDATED VERSION
 */
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    console.log(`Attempting to send password reset to: ${email}`)
    
    // First, check if user exists
    const user = await getUserByEmail(email)
    
    if (!user) {
      console.error(`No Appwrite user found for email: ${email}`)
      throw new Error(`No user account found for email: ${email}`)
    }
    
    console.log(`Found Appwrite user ${user.$id} for email: ${email}`)
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`
    
    try {
      await serverAccount.createRecovery(email, resetUrl)
      console.log(`Password reset email sent to: ${email}`)
    } catch (recoveryError: any) {
      console.error("Failed to send password reset email:", recoveryError)
      
      // Check for specific error types
      if (recoveryError.code === 429) {
        throw new Error("Too many reset attempts. Please wait before trying again.")
      }
      
      if (recoveryError.code === 400) {
        throw new Error("Invalid request. Please check the email address.")
      }
      
      // Re-throw with a more helpful message
      throw new Error(`Failed to send password reset: ${recoveryError.message || 'Unknown error'}`)
    }
  } catch (error: any) {
    console.error("Error in sendPasswordReset:", error)
    
    // Re-throw the error so calling code can handle it
    throw error
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    // Use Query.equal method for Appwrite v1.x
    const users = await serverUsers.list([
      JSON.stringify({ method: "equal", attribute: "email", values: [email] })
    ])
    return users.users[0] || null
  } catch (error) {
    console.error("Failed to get user by email:", error)
    return null
  }
}

/**
 * Create or get existing user account for employer
 */
export async function ensureEmployerAccount(
  email: string,
  companyName: string,
  employerId: string,
  clinicId: string
): Promise<string> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    
    if (existingUser) {
      console.log(`Found existing Appwrite user: ${existingUser.$id}`)
      
      // Update user preferences with employer info
      await serverUsers.updatePrefs(existingUser.$id, {
        ...existingUser.prefs,
        employerId,
        clinicId,
        userType: 'employer',
        companyName,
        updatedAt: new Date().toISOString()
      })
      
      return existingUser.$id
    }
    
    // Generate a temporary password
    const tempPassword = generateTempPassword()
    
    // Create new user
    const newUser = await serverUsers.create(
      ID.unique(),
      email,
      undefined, // phone
      tempPassword,
      companyName || email.split('@')[0]
    )
    
    // Set user preferences
    await serverUsers.updatePrefs(newUser.$id, {
      employerId,
      clinicId,
      userType: 'employer',
      companyName,
      createdAt: new Date().toISOString(),
      temporaryPassword: true // Flag to indicate they need to reset password
    })
    
    console.log(`Created new Appwrite user for employer: ${newUser.$id}`)
    
    // TODO: Send welcome email with temporary password
    console.log(`Temporary password for ${email}: ${tempPassword}`)
    
    return newUser.$id
    
  } catch (error: any) {
    console.error("Failed to ensure employer account:", error)
    throw error
  }
}

/**
 * Generate a temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one uppercase, one lowercase, one number, and one special char
  password += chars.charAt(Math.floor(Math.random() * 26)) // uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)) // lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)) // number
  password += chars.charAt(62 + Math.floor(Math.random() * 8)) // special char
  
  // Add 4 more random characters
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}