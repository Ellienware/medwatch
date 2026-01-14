/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis via Upstash
 */

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiresAt })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
const cache = new MemoryCache()

// Run cleanup every 10 minutes
if (typeof window === "undefined") {
  setInterval(() => cache.cleanup(), 10 * 60 * 1000)
}

export default cache

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
  const cached = cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const data = await fetcher()
  cache.set(key, data, ttl)

  return data
}
