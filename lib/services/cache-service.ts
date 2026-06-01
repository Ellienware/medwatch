export class CacheService {
  private static instance: CacheService
  private cache = new Map<string, { data: any; expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiry })
    
    // Clean up expired entries periodically
    this.cleanup()
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    // Run cleanup only occasionally to avoid performance hit
    if (Math.random() < 0.1) { // 10% chance
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key)
        }
      }
    }
  }

  // Specific cache methods for certificates
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }

  // Cache clinic settings (change frequently)
  async getClinicSettings(clinicId: string, fetchFn: () => Promise<any>): Promise<any> {
    const key = `clinic_settings_${clinicId}`
    return this.getOrSet(key, fetchFn, 2 * 60 * 1000) // 2 minutes TTL
  }

  // Cache certificate data (change less frequently)
  async getCertificateData(certificateId: string, fetchFn: () => Promise<any>): Promise<any> {
    const key = `certificate_${certificateId}`
    return this.getOrSet(key, fetchFn, 10 * 60 * 1000) // 10 minutes TTL
  }

  // Invalidate cache for specific clinic
  invalidateClinic(clinicId: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (key.includes(`clinic_${clinicId}`) || key.includes(`clinic_settings_${clinicId}`)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.delete(key))
  }

  // Invalidate cache for specific certificate
  invalidateCertificate(certificateId: string): void {
    this.delete(`certificate_${certificateId}`)
  }
}

export const cache = CacheService.getInstance()
