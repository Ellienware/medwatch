//lib/appwrite/admin-client
import { Client, Databases, Account, Storage, Users } from "node-appwrite"

export interface AdminAppwriteClient {
  client: Client
  databases: Databases
  account: Account
  storage: Storage
  users: Users
}

let adminClientInstance: AdminAppwriteClient | null = null

export function createAdminClient(): AdminAppwriteClient {
  if (adminClientInstance) {
    return adminClientInstance
  }

  const apiKey = process.env.APPWRITE_ADMIN_API_KEY || process.env.APPWRITE_API_KEY
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

  if (!apiKey || !endpoint || !projectId) {
    throw new Error(
      "Appwrite admin environment variables are not configured. " +
      "Check APPWRITE_ADMIN_API_KEY, NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    )
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey)

  adminClientInstance = {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
    users: new Users(client),
  }

  return adminClientInstance
}

// Convenience exports for admin operations
export const adminClient = createAdminClient()
export const adminDatabases = adminClient.databases
export const adminAccount = adminClient.account
export const adminStorage = adminClient.storage
export const adminUsers = adminClient.users