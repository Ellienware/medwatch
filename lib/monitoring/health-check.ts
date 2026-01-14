/**
 * Health check utilities for monitoring system health
 */

import { createServerClient } from "@/lib/appwrite/client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy"
  checks: {
    database: boolean
    cache: boolean
    auth: boolean
  }
  timestamp: string
  uptime: number
}

const startTime = Date.now()

export async function checkHealth(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabase(),
    cache: await checkCache(),
    auth: await checkAuth(),
  }

  const allHealthy = Object.values(checks).every((check) => check === true)
  const someHealthy = Object.values(checks).some((check) => check === true)

  return {
    status: allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    const { databases } = createServerClient()
    await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USERS, [])
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

async function checkCache(): Promise<boolean> {
  try {
    const cache = require("@/lib/cache").default
    cache.set("health-check", true, 1000)
    const result = cache.get("health-check")
    return result === true
  } catch (error) {
    console.error("Cache health check failed:", error)
    return false
  }
}

async function checkAuth(): Promise<boolean> {
  try {
    return !!(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID &&
      process.env.APPWRITE_API_KEY
    )
  } catch (error) {
    console.error("Auth health check failed:", error)
    return false
  }
}
