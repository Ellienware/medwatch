// /* =========================================================
//    BROWSER CLIENT (Web SDK)
//    ========================================================= */

// import {
//   Client as WebClient,
//   Databases,
//   Account,
//   Storage,
//   Query,
// } from "appwrite"

// interface BrowserClient {
//   client: WebClient
//   databases: Databases
//   account: Account
//   storage: Storage
// }

// let browserClientInstance: BrowserClient | null = null

// export function createBrowserClient(): BrowserClient {
//   if (browserClientInstance) {
//     return browserClientInstance
//   }

//   const client = new WebClient()
//     .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

//   browserClientInstance = {
//     client,
//     databases: new Databases(client),
//     account: new Account(client),
//     storage: new Storage(client),
//   }

//   return browserClientInstance
// }

// /* =========================================================
//    CONVENIENCE EXPORTS (BROWSER ONLY)
//    ========================================================= */

// export const client = createBrowserClient().client
// export const storage = createBrowserClient().storage
// export { Query }

// /* =========================================================
//    DEPRECATED SERVER FUNCTIONS - FIXED VERSION
//    ========================================================= */

// /**
//  * @deprecated Use getAdminClient from auth.ts or create your own
//  * Keeping for backward compatibility with existing code
//  */
// export async function createAdminServerClient() {
//   console.warn("createAdminServerClient is deprecated. Create admin client directly instead.")
  
//   const { Client, Databases, Account, Storage, Users } = await import("node-appwrite")
  
//   const client = new Client()
//     .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
//     .setKey(process.env.APPWRITE_API_KEY!)

//   return {
//     client,
//     databases: new Databases(client),
//     account: new Account(client),
//     storage: new Storage(client),
//     users: new Users(client),
//   }
// }

// /**
//  * @deprecated Use session-based approach from auth.ts
//  */
// export async function createSessionServerClient() {
//   console.warn("createSessionServerClient is deprecated. Use getAccount from auth.ts instead.")
  
//   const { Client, Databases, Account, Storage, Users } = await import("node-appwrite")
  
//   const client = new Client()
//     .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

//   return {
//     client,
//     databases: new Databases(client),
//     account: new Account(client),
//     storage: new Storage(client),
//     users: new Users(client),
//   }
// }

// /**
//  * @deprecated Use createAdminServerClient() instead
//  */
// export const createServerClient = createAdminServerClient