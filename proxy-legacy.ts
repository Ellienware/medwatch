import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { rateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/pricing",
  "/api/webhooks",
  "/api/health",
]

// Routes that require onboarding completion
const protectedRoutes = ["/dashboard", "/clinic", "/employer", "/super-admin"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api")) {
    const identifier = getRateLimitIdentifier(request)
    const { success, remaining, reset } = await rateLimit(identifier, 200)

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMIT_ERROR" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "200",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        },
      )
    }
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for Appwrite session cookie
  const sessionCookie = request.cookies.get("appwrite-session")

  if (!sessionCookie) {
    // No session - redirect to sign in
    const signInUrl = new URL("/auth/sign-in", request.url)
    signInUrl.searchParams.set("redirect_url", request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Allow authenticated users to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [],
}

// This file is kept for backwards compatibility but is no longer used
// All authentication and routing is now handled by middleware.ts with Appwrite
