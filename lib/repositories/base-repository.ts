
import { ID, Query } from "appwrite"
import { serverDatabases } from "@/lib/appwrite/server-client"
import { databaseCircuitBreaker, withResilience, withRetry } from "@/lib/utils/retry"
import { DatabaseError } from "@/lib/errors"
import { withCache } from "@/lib/cache"
import logger from "@/lib/logging/logger"
import metrics, { measure } from "@/lib/monitoring/metrics"

/**
 * Advanced base repository with caching, metrics, and retry logic
 */
export abstract class BaseRepository<T> {
  protected abstract collectionId: string
  protected cachePrefix: string

  constructor(cachePrefix: string) {
    this.cachePrefix = cachePrefix
  }

  /**
   * Collections that don't use updated_at timestamp
   * Add other collections here as needed
   */
  private get collectionsWithoutUpdatedAt(): string[] {
    return ["notifications", "audit_logs"] // Add other collections that don't have updated_at
  }

  /**
   * Check if this collection uses updated_at
   */
  private usesUpdatedAt(): boolean {
    return !this.collectionsWithoutUpdatedAt.includes(this.cachePrefix)
  }

  /**
   * Find document by ID with caching
   */
  async findById(id: string, options?: { skipCache?: boolean }): Promise<T | null> {
    const cacheKey = `${this.cachePrefix}:${id}`

    logger.debug(`Finding ${this.cachePrefix} by ID`, { id, skipCache: options?.skipCache })

    return measure(
      `${this.cachePrefix}.findById`,
      async () => {
        if (options?.skipCache) {
          return this.fetchById(id)
        }

        return withCache(cacheKey, () => this.fetchById(id), 5 * 60 * 1000)
      },
      { collection: this.cachePrefix },
    )
  }

  private async fetchById(id: string): Promise<T | null> {
    try {
      return await withRetry(async () => {
        const doc = await serverDatabases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          id
        )
        return this.mapToEntity(doc)
      })
    } catch (error: any) {
      if (error?.code === 404) {
        return null
      }
      logger.error(`Failed to fetch ${this.cachePrefix} by ID`, error, { id })
      throw new DatabaseError(`Failed to fetch ${this.cachePrefix} by ID`, error)
    }
  }

  /**
   * Find documents with query
   */
async find(queries: string[] = [], options?: { limit?: number; offset?: number }): Promise<T[]> {
  logger.debug(`Finding ${this.cachePrefix} with queries`, { queries, options })

  return measure(
    `${this.cachePrefix}.find`,
    async () => {
      try {
        // Use resilience pattern (circuit breaker + retry)
        return await withResilience(
          async () => {
            const queryList = [...queries]

            if (options?.limit) {
              queryList.push(Query.limit(options.limit))
            }

            if (options?.offset) {
              queryList.push(Query.offset(options.offset))
            }

            const result = await serverDatabases.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              this.collectionId,
              queryList
            )

            return result.documents.map((doc) => this.mapToEntity(doc))
          },
          databaseCircuitBreaker,
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
          },
          this.cachePrefix
        )
      } catch (error) {
        logger.error(`Failed to fetch ${this.cachePrefix} list`, error, { 
          queries, 
          options,
          circuitState: databaseCircuitBreaker.getState()
        })
        
        // Re-throw with more context
        const enhancedError = new DatabaseError(
          `Failed to fetch ${this.cachePrefix} list: ${error instanceof Error ? error.message : String(error)}`,
          error as Error
        )
        
        // Add circuit breaker state to error for debugging
        if (error instanceof Error) {
          (enhancedError as any).circuitState = databaseCircuitBreaker.getState()
        }
        
        throw enhancedError
      }
    },
    { collection: this.cachePrefix },
  )
}

  /**
   * Count documents with query
   */
  async count(queries: string[] = []): Promise<number> {
    return measure(
      `${this.cachePrefix}.count`,
      async () => {
        try {
          return await withRetry(async () => {
            const result = await serverDatabases.listDocuments(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
              this.collectionId,
              queries
            )
            return result.total
          })
        } catch (error) {
          logger.error(`Failed to count ${this.cachePrefix}`, error, { queries })
          throw new DatabaseError(`Failed to count ${this.cachePrefix}`, error as Error)
        }
      },
      { collection: this.cachePrefix },
    )
  }

  /**
   * Create new document
   */
  async create(data: Partial<T>): Promise<T> {
    logger.info(`Creating ${this.cachePrefix}`, { data })
    metrics.increment(`${this.cachePrefix}.create`, 1, { collection: this.cachePrefix })

    try {
      return await withRetry(async () => {
        // Add timestamps automatically if they don't exist
        const now = new Date().toISOString()
        const dataWithTimestamps: any = { ...data }
        
        // Always add created_at for all collections
        if (!dataWithTimestamps.created_at) {
          dataWithTimestamps.created_at = now
        }
        
        // Only add updated_at for collections that use it
        if (this.usesUpdatedAt() && !dataWithTimestamps.updated_at) {
          dataWithTimestamps.updated_at = now
        }
        
        const doc = await serverDatabases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          ID.unique(),
          dataWithTimestamps
        )
        return this.mapToEntity(doc)
      })
    } catch (error) {
      logger.error(`Failed to create ${this.cachePrefix}`, error, { data })
      metrics.increment(`${this.cachePrefix}.create.error`, 1, { collection: this.cachePrefix })
      throw new DatabaseError(`Failed to create ${this.cachePrefix}`, error as Error)
    }
  }

  /**
   * Update document
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    logger.info(`Updating ${this.cachePrefix}`, { id, data })
    metrics.increment(`${this.cachePrefix}.update`, 1, { collection: this.cachePrefix })

    try {
      return await withRetry(async () => {
        // Only update updated_at for collections that use it
        const dataToUpdate: any = { ...data }
        
        if (this.usesUpdatedAt()) {
          dataToUpdate.updated_at = new Date().toISOString()
        }
        
        const doc = await serverDatabases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          id,
          dataToUpdate
        )
        // Invalidate cache
        this.invalidateCache(id)
        return this.mapToEntity(doc)
      })
    } catch (error) {
      logger.error(`Failed to update ${this.cachePrefix}`, error, { id, data })
      metrics.increment(`${this.cachePrefix}.update.error`, 1, { collection: this.cachePrefix })
      throw new DatabaseError(`Failed to update ${this.cachePrefix}`, error as Error)
    }
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<void> {
    logger.info(`Deleting ${this.cachePrefix}`, { id })
    metrics.increment(`${this.cachePrefix}.delete`, 1, { collection: this.cachePrefix })

    try {
      await withRetry(async () => {
        await serverDatabases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          id
        )
        // Invalidate cache
        this.invalidateCache(id)
      })
    } catch (error) {
      logger.error(`Failed to delete ${this.cachePrefix}`, error, { id })
      metrics.increment(`${this.cachePrefix}.delete.error`, 1, { collection: this.cachePrefix })
      throw new DatabaseError(`Failed to delete ${this.cachePrefix}`, error as Error)
    }
  }

  /**
   * Paginate results
   */
  async paginate(
    queries: string[] = [],
    page = 1,
    pageSize = 25,
  ): Promise<{
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const offset = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      this.find(queries, { limit: pageSize, offset }),
      this.count(queries)
    ])

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /**
   * Invalidate cache for specific entity
   */
  protected invalidateCache(id: string) {
    try {
      const cache = require("@/lib/cache").default
      cache.delete(`${this.cachePrefix}:${id}`)
    } catch (error) {
      logger.warn(`Failed to invalidate cache for ${this.cachePrefix}:${id}`, error)
    }
  }

  /**
   * Map Appwrite document to entity
   * Must be implemented by child classes
   */
  protected abstract mapToEntity(doc: any): T
}