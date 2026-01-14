import {
  Client as WebClient,
  Databases,
  Account,
  Storage,
  Query,
} from "appwrite"

export interface BrowserAppwriteClient {
  client: WebClient
  databases: Databases
  account: Account
  storage: Storage
}

let browserClientInstance: BrowserAppwriteClient | null = null

export function createBrowserClient(): BrowserAppwriteClient {
  if (browserClientInstance) {
    return browserClientInstance
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

  if (!endpoint || !projectId) {
    throw new Error(
      "Appwrite browser environment variables are not configured. " +
      "Check NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    )
  }

  const client = new WebClient()
    .setEndpoint(endpoint)
    .setProject(projectId)

  browserClientInstance = {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
  }

  return browserClientInstance
}

// Convenience exports for browser-only usage
export const browserClient = createBrowserClient()
export const browserDatabases = browserClient.databases
export const browserAccount = browserClient.account
export const browserStorage = browserClient.storage
export { Query }