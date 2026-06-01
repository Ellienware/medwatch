import { Client, Databases, Account, Storage, Users } from "node-appwrite"

export interface SessionAppwriteClient {
  client: Client
  databases: Databases
  account: Account
  storage: Storage
  users: Users
}

export function createSessionClient(sessionToken?: string): SessionAppwriteClient {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID

  if (!endpoint || !projectId) {
    throw new Error(
      "Appwrite environment variables are not configured. " +
      "Check NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID."
    )
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)

  // If a session token is provided, set it on the client
  if (sessionToken) {
    client.setSession(sessionToken)
  }

  return {
    client,
    databases: new Databases(client),
    account: new Account(client),
    storage: new Storage(client),
    users: new Users(client),
  }
}
