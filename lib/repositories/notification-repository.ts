// lib/repositories/notification-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query, ID } from "appwrite"
import type { Notification, NotificationType, NotificationPriority } from "@/lib/types/notifications"
import { serverDatabases } from "@/lib/appwrite/server-client"
import { withRetry } from "@/lib/utils/retry"
import { DatabaseError } from "@/lib/errors"
import logger from "@/lib/logging/logger"
import metrics from "@/lib/monitoring/metrics"

export class NotificationRepository extends BaseRepository<Notification> {
  protected collectionId = COLLECTIONS.NOTIFICATIONS

  constructor() {
    super("notification")
  }

  protected mapToEntity(doc: any): Notification {
    let dataObj: Record<string, any> = {}
    
    try {
      // Parse JSON string back to object if it exists
      if (doc.data && typeof doc.data === 'string') {
        dataObj = JSON.parse(doc.data)
      } else if (doc.data && typeof doc.data === 'object') {
        dataObj = doc.data
      }
    } catch (error) {
      logger.warn(`Failed to parse notification data`, { 
        id: doc.$id, 
        data: doc.data 
      })
      dataObj = {}
    }
    
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      user_id: doc.user_id,
      type: doc.type,
      priority: doc.priority,
      title: doc.title,
      message: doc.message,
      link: doc.link || null,
      data: dataObj,
      read: doc.read,
      read_at: doc.read_at || null,
      created_at: doc.$createdAt,
      expires_at: doc.expires_at || null,
    }
  }

  /**
   * Override create method to handle data conversion and avoid updated_at
   */
  async create(data: Partial<Notification>): Promise<Notification> {
    logger.info(`Creating notification`, { data })
    metrics.increment(`${this.cachePrefix}.create`, 1, { collection: this.cachePrefix })

    try {
      return await withRetry(async () => {
        const now = new Date().toISOString()
        const dataForAppwrite: any = { ...data }
        
        // Add created_at only (not updated_at for notifications)
        if (!dataForAppwrite.created_at) {
          dataForAppwrite.created_at = now
        }
        
        // Convert data object to JSON string for Appwrite
        if (dataForAppwrite.data && typeof dataForAppwrite.data === 'object') {
          dataForAppwrite.data = JSON.stringify(dataForAppwrite.data)
          logger.debug(`Stringified notification data for storage`, {
            originalKeys: Object.keys(data.data || {}),
            stringLength: dataForAppwrite.data.length
          })
        } else if (!dataForAppwrite.data) {
          dataForAppwrite.data = "{}" // Default empty object
        }
        
        logger.debug(`Creating notification document`, {
          dataKeys: Object.keys(dataForAppwrite),
          dataFieldType: typeof dataForAppwrite.data,
          dataLength: dataForAppwrite.data.length
        })
        
        const doc = await serverDatabases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          this.collectionId,
          ID.unique(),
          dataForAppwrite
        )
        
        return this.mapToEntity(doc)
      })
    } catch (error) {
      logger.error(`Failed to create notification`, error, { data })
      metrics.increment(`${this.cachePrefix}.create.error`, 1, { collection: this.cachePrefix })
      throw new DatabaseError(`Failed to create notification`, error as Error)
    }
  }

  /**
   * Override update method for consistency
   */
  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    logger.info(`Updating notification`, { id, data })
    metrics.increment(`${this.cachePrefix}.update`, 1, { collection: this.cachePrefix })

    try {
      return await withRetry(async () => {
        const dataToUpdate: any = { ...data }
        
        // Convert data object to JSON string if needed
        if (dataToUpdate.data && typeof dataToUpdate.data === 'object') {
          dataToUpdate.data = JSON.stringify(dataToUpdate.data)
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
      logger.error(`Failed to update notification`, error, { id, data })
      metrics.increment(`${this.cachePrefix}.update.error`, 1, { collection: this.cachePrefix })
      throw new DatabaseError(`Failed to update notification`, error as Error)
    }
  }

  // ... rest of your existing methods (keep them as they are)
  async findByUserId(userId: string, options?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    const queries = [Query.equal("user_id", userId)]

    if (options?.unreadOnly) {
      queries.push(Query.equal("read", false))
    }

    queries.push(Query.orderDesc("$createdAt"))

    if (options?.limit) {
      queries.push(Query.limit(options.limit))
    }

    return this.find(queries)
  }

  async findByClinicId(
    clinicId: string,
    options?: { unreadOnly?: boolean; type?: NotificationType },
  ): Promise<Notification[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.unreadOnly) {
      queries.push(Query.equal("read", false))
    }

    if (options?.type) {
      queries.push(Query.equal("type", options.type))
    }

    queries.push(Query.orderDesc("$createdAt"))

    return this.find(queries)
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return this.update(notificationId, {
      read: true,
      read_at: new Date().toISOString(),
    })
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findByUserId(userId, { unreadOnly: true })

    await Promise.all(notifications.map((notification) => this.markAsRead(notification.id)))
  }

  async countUnread(userId: string): Promise<number> {
    return this.count([Query.equal("user_id", userId), Query.equal("read", false)])
  }

  async createNotification(
    userId: string,
    clinicId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority
      link?: string
      data?: Record<string, any>
      expiresAt?: string
    },
  ): Promise<Notification> {
    // Use our overridden create method
    return this.create({
      user_id: userId,
      clinic_id: clinicId,
      type,
      priority: options?.priority || "medium",
      title,
      message,
      link: options?.link,
      data: options?.data || {}, // Pass as object, repository will stringify
      read: false,
      expires_at: options?.expiresAt,
    })
  }

  async deleteOldNotifications(daysOld = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const oldNotifications = await this.find([Query.lessThan("$createdAt", cutoffDate.toISOString()), Query.limit(100)])

    await Promise.all(oldNotifications.map((notification) => this.delete(notification.id)))
  }
}