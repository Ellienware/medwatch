import { NextResponse } from "next/server"
import { checkHealth } from "@/lib/monitoring/health-check"

/**
 * Health check endpoint for monitoring
 */
export async function GET() {
  try {
    const health = await checkHealth()

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
