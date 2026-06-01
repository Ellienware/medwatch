import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Branch } from "@/lib/types/database"

export class BranchRepository extends BaseRepository<Branch> {
  protected collectionId = COLLECTIONS.BRANCHES

  constructor() {
    super("branch")
  }

  protected mapToEntity(doc: any): Branch {
    // Parse operating_hours from JSON string if it exists
    let operatingHours: Record<string, any> = {}
    
    if (doc.operating_hours) {
      try {
        if (typeof doc.operating_hours === 'string') {
          operatingHours = JSON.parse(doc.operating_hours)
        } else if (typeof doc.operating_hours === 'object') {
          operatingHours = doc.operating_hours
        }
      } catch (error) {
        console.error('Error parsing operating_hours:', error)
        operatingHours = {}
      }
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      name: doc.name,
      code: doc.code,
      email: doc.email || null,
      phone: doc.phone || null,
      address: doc.address || null,
      latitude: doc.latitude || null,
      longitude: doc.longitude || null,
      operating_hours: operatingHours,
      is_active: doc.is_active,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  // Override create to handle object-to-string conversion
  async create(data: Partial<Branch>): Promise<Branch> {
    // Convert operating_hours object to JSON string
    const processedData: any = { ...data }
    
    if (processedData.operating_hours && typeof processedData.operating_hours === 'object') {
      processedData.operating_hours = JSON.stringify(processedData.operating_hours)
    } else if (!processedData.operating_hours) {
      processedData.operating_hours = "{}"
    }
    
    return super.create(processedData)
  }

  // Override update to handle object-to-string conversion
  async update(id: string, data: Partial<Branch>): Promise<Branch> {
    // Convert operating_hours object to JSON string
    const processedData: any = { ...data }
    
    if (processedData.operating_hours && typeof processedData.operating_hours === 'object') {
      processedData.operating_hours = JSON.stringify(processedData.operating_hours)
    }
    
    return super.update(id, processedData)
  }

  async findByClinicId(clinicId: string, options?: { isActive?: boolean }): Promise<Branch[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.isActive !== undefined) {
      queries.push(Query.equal("is_active", options.isActive))
    }

    queries.push(Query.orderAsc("name"))

    return this.find(queries)
  }

  async findByCode(code: string, clinicId: string): Promise<Branch | null> {
    const branches = await this.find([Query.equal("code", code), Query.equal("clinic_id", clinicId)])
    return branches[0] || null
  }

  async countByClinicId(clinicId: string): Promise<number> {
    return this.count([Query.equal("clinic_id", clinicId), Query.equal("is_active", true)])
  }
}
