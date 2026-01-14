import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/appwrite/auth"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"
import { handleError, RateLimitError, AuthenticationError } from "@/lib/errors"

/**
 * Example API route with rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new AuthenticationError()
    }

    // Apply rate limiting
    const identifier = getRateLimitIdentifier(request, user.$id)
    const { success, remaining, reset } = await rateLimit(identifier, 100) // 100 requests per minute

    // Set rate limit headers
    const headers = {
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(reset).toISOString(),
    }

    if (!success) {
      throw new RateLimitError("Too many requests. Please try again later.")
    }

    // Your API logic here
    const data = { message: "Success" }

    return NextResponse.json(data, { headers })
  } catch (error) {
    const { message, code, statusCode } = handleError(error)
    return NextResponse.json({ error: message, code }, { status: statusCode })
  }
}
