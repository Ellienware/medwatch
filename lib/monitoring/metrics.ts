/**
 * Application metrics tracking
 * For production, integrate with Vercel Analytics or custom metrics service
 */

type MetricType = "counter" | "gauge" | "histogram" | "timer"

type Metric = {
  name: string
  type: MetricType
  value: number
  tags?: Record<string, string>
  timestamp: number
}

class MetricsCollector {
  private metrics: Metric[] = []
  private flushInterval = 60000 // 1 minute

  constructor() {
    if (typeof window === "undefined") {
      setInterval(() => this.flush(), this.flushInterval)
    }
  }

  increment(name: string, value = 1, tags?: Record<string, string>) {
    this.record({
      name,
      type: "counter",
      value,
      tags,
      timestamp: Date.now(),
    })
  }

  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.record({
      name,
      type: "gauge",
      value,
      tags,
      timestamp: Date.now(),
    })
  }

  histogram(name: string, value: number, tags?: Record<string, string>) {
    this.record({
      name,
      type: "histogram",
      value,
      tags,
      timestamp: Date.now(),
    })
  }

  timer(name: string, tags?: Record<string, string>): () => void {
    const start = Date.now()

    return () => {
      const duration = Date.now() - start
      this.record({
        name,
        type: "timer",
        value: duration,
        tags,
        timestamp: Date.now(),
      })
    }
  }

  private record(metric: Metric) {
    this.metrics.push(metric)

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Metric]", metric)
    }
  }

  private flush() {
    if (this.metrics.length === 0) {
      return
    }

    // Send metrics to monitoring service
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoringService(this.metrics)
    }

    // Clear metrics
    this.metrics = []
  }

  private sendToMonitoringService(metrics: Metric[]) {
    // Implement sending to your monitoring service
    // Example: fetch('/api/metrics', { method: 'POST', body: JSON.stringify(metrics) })
  }

  getMetrics(): Metric[] {
    return [...this.metrics]
  }
}

// Singleton instance
const metrics = new MetricsCollector()

export default metrics

/**
 * Measure function execution time
 */
export async function measure<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
  const endTimer = metrics.timer(name, tags)

  try {
    const result = await fn()
    endTimer()
    return result
  } catch (error) {
    endTimer()
    metrics.increment(`${name}.error`, 1, tags)
    throw error
  }
}
