// lib/repositories/branch-repository.ts
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
      operating_hours: doc.operating_hours || {},
      is_active: doc.is_active,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
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