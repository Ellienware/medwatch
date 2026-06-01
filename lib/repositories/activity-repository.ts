import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Activity, ActivityType } from "@/lib/types/database"

export class ActivityRepository extends BaseRepository<Activity> {
  protected collectionId = COLLECTIONS.ACTIVITIES

  constructor() {
    super("activity")
  }

  protected mapToEntity(doc: any): Activity {
    // Parse metadata from JSON string or use empty object
    let metadata: Record<string, any> = {}
    if (typeof doc.metadata === 'string' && doc.metadata.trim()) {
      try {
        metadata = JSON.parse(doc.metadata)
      } catch (error) {
        console.warn('Failed to parse metadata JSON:', error)
      }
    } else if (doc.metadata && typeof doc.metadata === 'object') {
      metadata = doc.metadata
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      user_id: doc.user_id,
      user_name: doc.user_name,
      user_role: doc.user_role,
      action_type: doc.action_type as ActivityType,
      description: doc.description,
      entity_type: doc.entity_type || "",
      entity_id: doc.entity_id || "",
      metadata: metadata,
      created_at: doc.$createdAt,
    }
  }

  async findByClinicId(clinicId: string, limit: number = 10): Promise<Activity[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ])
  }

  async createActivity(data: {
    clinic_id: string
    user_id: string
    user_name: string
    user_role?: string
    action_type: ActivityType
    description: string
    entity_type?: string
    entity_id?: string
    metadata?: Record<string, any>
  }): Promise<Activity> {
    // Prepare metadata as JSON string
    const metadata = data.metadata ? JSON.stringify(data.metadata) : "{}"

    return this.create({
      clinic_id: data.clinic_id,
      user_id: data.user_id,
      user_name: data.user_name,
      user_role: data.user_role || "",
      action_type: data.action_type,
      description: data.description,
      entity_type: data.entity_type || "",
      entity_id: data.entity_id || "",
      metadata: metadata,
    })
  }

  async getRecentActivity(clinicId: string, days: number = 7): Promise<Activity[]> {
    // Note: Appwrite doesn't support date range queries directly
    // We'll fetch recent activities and filter client-side
    const recentActivities = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ])

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return recentActivities.filter(activity => {
      const activityDate = new Date(activity.created_at)
      return activityDate >= cutoffDate
    })
  }
}
