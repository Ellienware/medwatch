import { APPWRITE_DATABASE_ID, COLLECTIONS } from "./config"
import { Query } from "appwrite"
import { getAccount } from "./auth"
import cache, { withCache } from "@/lib/cache"

// Helper function to create admin client
async function createAdminClient() {
  const { Client, Databases, Account, Storage, Users } = await import("node-appwrite")
  
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)

  return {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
    users: new Users(client),
  }
}

/**
 * Get current user's clinic ID from Appwrite
 */
export async function getCurrentUserClinicId(): Promise<string | null> {
  const account = await getAccount()

  if (!account) {
    return null
  }

  return withCache(
    `user:${account.$id}:clinic_id`,
    async () => {
      try {
        // Use admin client for database queries
        const { databases } = await createAdminClient()

        const users = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USERS, [
          Query.equal("auth_user_id", account.$id),
        ])

        if (users.documents.length === 0) {
          return null
        }

        return users.documents[0].clinic_id || null
      } catch (error) {
        console.error("Error fetching user clinic ID:", error)
        return null
      }
    },
    5 * 60 * 1000, // 5 minutes cache
  )
}

/**
 * Get current user's role from Appwrite
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const account = await getAccount()

  if (!account) {
    return null
  }

  return withCache(
    `user:${account.$id}:role`,
    async () => {
      try {
        // Use admin client for database queries
        const { databases } = await createAdminClient()

        const users = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USERS, [
          Query.equal("auth_user_id", account.$id),
        ])

        if (users.documents.length === 0) {
          return null
        }

        return users.documents[0].role || null
      } catch (error) {
        console.error("Error fetching user role:", error)
        return null
      }
    },
    5 * 60 * 1000, // 5 minutes cache
  )
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === "super_admin"
}

/**
 * Map Appwrite document to typed object
 */
export function mapDocument<T>(doc: any): T {
  const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = doc

  return {
    id: $id,
    created_at: $createdAt,
    updated_at: $updatedAt,
    ...rest,
  } as T
}

/**
 * Map multiple Appwrite documents to typed array
 */
export function mapDocuments<T>(docs: any[]): T[] {
  return docs.map((doc) => mapDocument<T>(doc))
}

/**
 * Invalidate user cache when data changes
 */
export function invalidateUserCache(userId: string) {
  cache.delete(`user:${userId}:clinic_id`)
  cache.delete(`user:${userId}:role`)
  cache.delete(`user:${userId}:profile`)
}