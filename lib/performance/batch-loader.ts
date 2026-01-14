/**
 * Batch loader for efficient data fetching
 * Reduces N+1 query problems
 */

type BatchLoadFn<K, V> = (keys: K[]) => Promise<V[]>

export class BatchLoader<K, V> {
  private queue: Array<{
    key: K
    resolve: (value: V | null) => void
    reject: (error: Error) => void
  }> = []
  private batchLoadFn: BatchLoadFn<K, V>
  private batchTimeoutMs: number
  private batchTimeout: NodeJS.Timeout | null = null
  private maxBatchSize: number

  constructor(batchLoadFn: BatchLoadFn<K, V>, options?: { batchTimeoutMs?: number; maxBatchSize?: number }) {
    this.batchLoadFn = batchLoadFn
    this.batchTimeoutMs = options?.batchTimeoutMs || 10
    this.maxBatchSize = options?.maxBatchSize || 100
  }

  async load(key: K): Promise<V | null> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject })

      // Process immediately if batch is full
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch()
        return
      }

      // Schedule batch processing
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch()
        }, this.batchTimeoutMs)
      }
    })
  }

  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    const batch = this.queue.splice(0, this.maxBatchSize)

    if (batch.length === 0) {
      return
    }

    try {
      const keys = batch.map((item) => item.key)
      const results = await this.batchLoadFn(keys)

      // Resolve all promises
      batch.forEach((item, index) => {
        item.resolve(results[index] || null)
      })
    } catch (error) {
      // Reject all promises
      batch.forEach((item) => {
        item.reject(error as Error)
      })
    }
  }
}
