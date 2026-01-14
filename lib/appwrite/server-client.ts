import { Client, Databases, Account, Storage, Users } from "node-appwrite"

export interface ServerAppwriteClient {
  client: Client
  databases: Databases
  account: Account
  storage: Storage
  users: Users
}

let serverClientInstance: ServerAppwriteClient | null = null

export function createServerClient(): ServerAppwriteClient {
  if (serverClientInstance) {
    return serverClientInstance
  }

  const apiKey = process.env.APPWRITE_API_KEY
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

  if (!apiKey || !endpoint || !projectId) {
    throw new Error(
      "Appwrite server environment variables are not configured. " +
      "Check APPWRITE_API_KEY, NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    )
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey)

  serverClientInstance = {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
    users: new Users(client),
  }

  return serverClientInstance
}

// Convenience exports for server-only usage
export const serverClient = createServerClient()
export const serverDatabases = serverClient.databases
export const serverAccount = serverClient.account
export const serverStorage = serverClient.storage
export const serverUsers = serverClient.users