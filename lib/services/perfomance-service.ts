declare const performance: {
  now(): number
}

export class PerformanceService {
  private static instance: PerformanceService
  private metrics = new Map<string, { start: number; end?: number }>()
  private enabled: boolean
  

  private constructor() {
    this.enabled = process.env.NODE_ENV === 'development' || process.env.PERFORMANCE_MONITORING === 'true'
  }

  

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  startMeasurement(name: string) {
    if (!this.enabled) return
    
    this.metrics.set(name, { start: performance.now() })
  }

  endMeasurement(name: string) {
    if (!this.enabled) return
    
    const metric = this.metrics.get(name)
    if (metric) {
      metric.end = performance.now()
      const duration = metric.end - metric.start
      
      if (duration > 1000) {
        console.warn(`⚠️ Performance warning: ${name} took ${duration.toFixed(2)}ms`)
      } else if (this.enabled) {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
      }
    }
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn()
    
    this.startMeasurement(name)
    try {
      return await fn();
    } finally {
      this.endMeasurement(name);
    }
  }

  getMetrics() {
    const results: Record<string, number> = {}
    
    this.metrics.forEach((metric, name) => {
      if (metric.end) {
        results[name] = metric.end - metric.start
      }
    })
    
    return results
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = PerformanceService.getInstance()
