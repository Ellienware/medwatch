interface RateLimitResult {
  success: boolean
  limit?: number
  remaining?: number
  reset?: number
  retryAfter?: number
}

export class RateLimiter {
  private static readonly memoryStore = new Map<string, { count: number; resetTime: number }>()
  private static readonly DEFAULT_LIMITS = {
    pdfGeneration: { windowMs: 60000, max: 10 }, // 10 per minute
    api: { windowMs: 60000, max: 100 }, // 100 per minute
    auth: { windowMs: 60000, max: 5 }, // 5 per minute
  }
  
  /**
   * Apply rate limiting
   */
  static async limit(
    identifier: string,
    type: keyof typeof RateLimiter.DEFAULT_LIMITS = 'pdfGeneration'
  ): Promise<RateLimitResult> {
    const limitConfig = RateLimiter.DEFAULT_LIMITS[type]
    const now = Date.now()
    const key = `${type}:${identifier}`
    
    // Get or create rate limit entry
    let entry = RateLimiter.memoryStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      // New window or expired window
      entry = {
        count: 1,
        resetTime: now + limitConfig.windowMs
      }
    } else {
      // Existing window, increment count
      if (entry.count >= limitConfig.max) {
        return {
          success: false,
          limit: limitConfig.max,
          remaining: 0,
          reset: Math.ceil((entry.resetTime - now) / 1000),
          retryAfter: entry.resetTime - now
        }
      }
      entry.count++
    }
    
    RateLimiter.memoryStore.set(key, entry)
    
    return {
      success: true,
      limit: limitConfig.max,
      remaining: limitConfig.max - entry.count,
      reset: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  /**
   * Clean up old rate limit entries
   */
  static cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of RateLimiter.memoryStore.entries()) {
      if (entry.resetTime < now - 60000) { // Remove entries older than 1 minute after reset
        RateLimiter.memoryStore.delete(key)
      }
    }
  }
  
  /**
   * Get client IP for rate limiting
   */
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    return ip
  }
}
