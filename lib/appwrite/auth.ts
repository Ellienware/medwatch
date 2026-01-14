"use server"

import { cookies } from "next/headers"
import { ID } from "appwrite"
import type { Models } from "appwrite"

// Store admin client instance
let adminClient: any = null

async function getAdminClient() {
  if (adminClient) return adminClient
  
  const { Client, Databases, Account, Storage, Users } = await import("node-appwrite")
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  adminClient = {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
    users: new Users(client),
  }
  
  return adminClient
}

/**
 * Create a new user account
 */
export async function createAccount(email: string, password: string, name: string) {
  try {
    const { account } = await getAdminClient()
    const user = await account.create(ID.unique(), email, password, name)
    console.log("Account created successfully:", user.$id)
    return { user, error: null }
  } catch (error: any) {
    console.error("Failed to create account:", error)
    return { user: null, error: error.message || "Failed to create account" }
  }
}

/**
 * Sign in and create session
 */
export async function createEmailSession(email: string, password: string) {
  try {
    const { account } = await getAdminClient()
    
    console.log("Creating session for:", email)
    const session = await account.createEmailPasswordSession(email, password)

    console.log("Session created successfully:", {
      sessionId: session.$id,
      userId: session.userId,
    })

    // Store in cookies
    const cookieStore = await cookies()
    
    // Store session (sessionId:secret)
    cookieStore.set("appwrite-session", `${session.$id}:${session.secret}`, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    })
    
    // Store user ID
    cookieStore.set("appwrite-user-id", session.userId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    })
    
    // Store email
    cookieStore.set("appwrite-user-email", email, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    })

    // Try to get user info via users API (requires users.read scope)
    try {
      const { users } = await getAdminClient()
      const user = await users.get(session.userId)
      console.log("Got user info via users API:", user.email)
      
      // Store name if available
      if (user.name) {
        cookieStore.set("appwrite-user-name", user.name, {
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
        })
      }
    } catch (userError: any) {
      console.log("Could not get user details, using email only:", userError.message)
    }

    return { session, error: null }
  } catch (error: any) {
    console.error("Failed to create session:", error)
    return { session: null, error: error.message || "Failed to sign in" }
  }
}

export async function sendPasswordReset(email: string) {
  return createPasswordRecovery(email)
}

/**
 * Get current user
 */
export async function getAccount(): Promise<Models.User<Models.Preferences> | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("appwrite-user-id")?.value
    
    if (!userId) {
      return null
    }
    
    // Try to get user via users API (requires users.read scope)
    try {
      const { users } = await getAdminClient()
      const user = await users.get(userId)
      console.log("Got user via users API:", user.email)
      return user
    } catch (error) {
      console.log("users.get() failed, trying Web SDK...")
      
      // Try alternative: Use Web SDK with session
      const sessionCookie = cookieStore.get("appwrite-session")?.value
      if (sessionCookie) {
        try {
          const { Client, Account } = await import("appwrite")
          
          const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
          
          client.setSession(sessionCookie)
          
          const account = new Account(client)
          const user = await account.get()
          console.log("Got user via Web SDK:", user.email)
          return user
        } catch (webError: any) {
          console.log("Web SDK failed:", webError.message)
        }
      }
      
      // Last resort: Use cookie data
      const userEmail = cookieStore.get("appwrite-user-email")?.value
      const userName = cookieStore.get("appwrite-user-name")?.value
      
      console.log("Returning user from cookies")
      
      // Create a minimal user object that matches the Models.User type
      const minimalUser: Models.User<Models.Preferences> = {
        $id: userId,
        email: userEmail || "",
        name: userName || "User",
        prefs: {},
        labels: [],
        status: true,
        passwordUpdate: "",
        phone: "",
        emailVerification: false,
        phoneVerification: false,
        registration: "",
        $createdAt: "",
        $updatedAt: "",
        mfa: false,
        targets: [],
        accessedAt: ""
      }
      
      return minimalUser
    }
  } catch (error) {
    console.error("Error in getAccount:", error)
    return null
  }
}

/**
 * Get current logged in user (alias for getAccount)
 */
export async function getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
  return getAccount()
}

/**
 * Delete current session (logout)
 */
export async function deleteSession() {
  try {
    const cookieStore = await cookies()
    
    // Try to delete session via Web SDK if we have session cookie
    const sessionCookie = cookieStore.get("appwrite-session")?.value
    if (sessionCookie) {
      try {
        const { Client, Account } = await import("appwrite")
        
        const client = new Client()
          .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
          .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        
        client.setSession(sessionCookie)
        
        const account = new Account(client)
        await account.deleteSession("current")
        console.log("Session deleted from Appwrite")
      } catch (deleteError: any) {
        console.log("Could not delete session from Appwrite:", deleteError.message)
      }
    }
    
    // Clear all auth cookies
    cookieStore.delete("appwrite-session")
    cookieStore.delete("appwrite-user-id")
    cookieStore.delete("appwrite-user-email")
    cookieStore.delete("appwrite-user-name")
    
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Failed to delete session:", error)
    return { success: false, error: error.message || "Failed to sign out" }
  }
}

/**
 * Send password recovery email
 */
export async function createPasswordRecovery(email: string) {
  try {
    const { account } = await getAdminClient()
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password`
    await account.createRecovery(email, resetUrl)
    return { success: true, error: null }
  } catch (error: any) {
    console.error("Failed to send recovery email:", error)
    return { success: false, error: error.message || "Failed to send recovery email" }
  }
}

/**
 * Complete password recovery
 */
export async function updatePasswordRecovery(
  userId: string, 
  secret: string, 
  password: string,
  confirmPassword?: string // Add this parameter
) {
  try {
    console.log('updatePasswordRecovery called with:', { 
      userId, 
      secret: secret.substring(0, 10) + '...', // Log partial secret
      passwordLength: password.length 
    })
    
    const { account } = await getAdminClient()
    
    // Use confirmPassword if provided, otherwise use password
    const confirm = confirmPassword || password
    
    console.log('Calling account.updateRecovery with:', {
      userId,
      secretLength: secret.length,
      password: '***',
      confirm: '***'
    })
    
    const result = await account.updateRecovery(userId, secret, password, confirm)
    
    console.log('Password recovery update successful:', {
      success: true,
      userId: result.userId
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    console.error('updatePasswordRecovery error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    })
    
    return {
      success: false,
      error: error.message || 'Failed to update password'
    }
  }
}

/**
 * Get sessions list
 */
export async function getSessions() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("appwrite-user-id")?.value
    
    if (!userId) {
      return { sessions: null, error: "No user ID found" }
    }
    
    const { account } = await getAdminClient()
    const sessions = await account.listSessions(userId)
    return { sessions, error: null }
  } catch (error: any) {
    console.error("Failed to get sessions:", error)
    return { sessions: null, error: error.message || "Failed to get sessions" }
  }
}

/**
 * Validate if session is still active
 */
export async function validateSession(): Promise<boolean> {
  try {
    const user = await getAccount()
    return !!user
  } catch (error) {
    return false
  }
}