// lib/repositories/clinical-test-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { ClinicalTest } from "@/lib/types/database"

export class ClinicalTestRepository extends BaseRepository<ClinicalTest> {
  protected collectionId = COLLECTIONS.CLINICAL_TESTS

  constructor() {
    super("clinical_test")
  }

  protected mapToEntity(doc: any): ClinicalTest {
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      test_code: doc.test_code,
      test_name: doc.test_name,
      test_category: doc.test_category ?? null,
      description: doc.description ?? null,
      price: doc.price,
      // These are already strings from Appwrite - just ensure defaults
      parameters: doc.parameters ?? "[]",
      normal_ranges: doc.normal_ranges ?? "{}",
      requires_equipment: doc.requires_equipment,
      estimated_duration_minutes: doc.estimated_duration_minutes ?? null,
      is_active: doc.is_active,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  // Helper methods for frontend usage (optional)
  parseParameters(parameters: string): any[] {
    try {
      return JSON.parse(parameters || "[]")
    } catch {
      return []
    }
  }

  parseNormalRanges(normalRanges: string): Record<string, any> {
    try {
      return JSON.parse(normalRanges || "{}")
    } catch {
      return {}
    }
  }

  // Override create method to ensure parameters and normal_ranges are strings
  async create(data: Partial<ClinicalTest>): Promise<ClinicalTest> {
    const processedData = {
      ...data,
      parameters: typeof data.parameters === 'string' 
        ? data.parameters 
        : JSON.stringify(data.parameters || []),
      normal_ranges: typeof data.normal_ranges === 'string'
        ? data.normal_ranges
        : JSON.stringify(data.normal_ranges || {}),
    }
    
    return super.create(processedData)
  }

  // Override update method to ensure parameters and normal_ranges are strings
  async update(id: string, data: Partial<ClinicalTest>): Promise<ClinicalTest> {
    const processedData = {
      ...data,
      parameters: typeof data.parameters === 'string' 
        ? data.parameters 
        : JSON.stringify(data.parameters || []),
      normal_ranges: typeof data.normal_ranges === 'string'
        ? data.normal_ranges
        : JSON.stringify(data.normal_ranges || {}),
    }
    
    return super.update(id, processedData)
  }

  async findByClinicId(
    clinicId: string,
    options?: { isActive?: boolean; category?: string },
  ): Promise<ClinicalTest[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.isActive !== undefined) {
      queries.push(Query.equal("is_active", options.isActive))
    }

    if (options?.category) {
      queries.push(Query.equal("test_category", options.category))
    }

    queries.push(Query.orderAsc("test_name"))

    return this.find(queries)
  }

  /**
   * 🔑 Primary lookup method
   * Business-safe lookup using test_code + clinic_id
   */
  async findByTestCode(
    testCode: string,
    clinicId: string,
  ): Promise<ClinicalTest | null> {
    const results = await this.find([
      Query.equal("test_code", testCode),
      Query.equal("clinic_id", clinicId),
      Query.limit(1),
    ])

    return results[0] ?? null
  }

  async search(clinicId: string, searchTerm: string): Promise<ClinicalTest[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.or([
        Query.search("test_name", searchTerm),
        Query.search("test_code", searchTerm),
        Query.search("description", searchTerm),
      ]),
    ])
  }

  async findByCategory(
    clinicId: string,
    category: string,
  ): Promise<ClinicalTest[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("test_category", category),
      Query.orderAsc("test_name"),
    ])
  }

  async getCategories(clinicId: string): Promise<string[]> {
    const tests = await this.findByClinicId(clinicId, { isActive: true })

    return Array.from(
      new Set(
        tests
          .map((test) => test.test_category)
          .filter((cat): cat is string => Boolean(cat)),
      ),
    ).sort()
  }
}