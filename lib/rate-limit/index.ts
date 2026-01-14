/**
 * Rate limiting implementation
 * For production, consider using Upstash Rate Limit
 */

type RateLimitConfig = {
  interval: number // Time window in ms
  uniqueTokenPerInterval: number // Max unique tokens in window
}

type RateLimitRecord = {
  count: number
  resetTime: number
}

class RateLimiter {
  private records = new Map<string, RateLimitRecord>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 }) {
    this.config = config

    // Clean up expired records every minute
    if (typeof window === "undefined") {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  async check(
    identifier: string,
    limit: number = this.config.uniqueTokenPerInterval,
  ): Promise<{
    success: boolean
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const record = this.records.get(identifier)

    // No record or expired record
    if (!record || now > record.resetTime) {
      this.records.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
      })

      return {
        success: true,
        remaining: limit - 1,
        reset: now + this.config.interval,
      }
    }

    // Check if limit exceeded
    if (record.count >= limit) {
      return {
        success: false,
        remaining: 0,
        reset: record.resetTime,
      }
    }

    // Increment count
    record.count++

    return {
      success: true,
      remaining: limit - record.count,
      reset: record.resetTime,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key)
      }
    }
  }

  reset(identifier: string) {
    this.records.delete(identifier)
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

export default rateLimiter

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  identifier: string,
  limit?: number,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  return rateLimiter.check(identifier, limit)
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Use IP address as fallback
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}
