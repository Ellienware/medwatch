// lib/repositories/patient-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Patient } from "@/lib/types/database"

export class PatientRepository extends BaseRepository<Patient> {
  protected collectionId = COLLECTIONS.PATIENTS

  constructor() {
    super("patient")
  }

// lib/repositories/patient-repository.ts - Update mapToEntity method
protected mapToEntity(doc: any): Patient {
  return {
    id: doc.$id,
    clinic_id: doc.clinic_id,
    employer_id: doc.employer_id || null,
    id_number: doc.id_number,
    passport_number: doc.passport_number || null,
    first_name: doc.first_name,
    last_name: doc.last_name,
    date_of_birth: doc.date_of_birth,
    gender: doc.gender || null,
    email: doc.email || null,
    phone: doc.phone || null,
    address: doc.address || null,
    employee_number: doc.employee_number || null,
    job_title: doc.job_title || null,
    department: doc.department || null,
    employment_start_date: doc.employment_start_date || null,
    blood_type: doc.blood_type || null,
    allergies: doc.allergies || null,
    chronic_conditions: doc.chronic_conditions || null,
    emergency_contact_name: doc.emergency_contact_name || null,
    emergency_contact_phone: doc.emergency_contact_phone || null,
    emergency_contact_relationship: doc.emergency_contact_relationship || null, // Add this line
    consent_given: doc.consent_given || false,
    consent_date: doc.consent_date || null,
    photo_url: doc.photo_url || null,
    notes: doc.notes || null,
    is_active: doc.is_active !== undefined ? doc.is_active : true,
    employer_company_name: doc.employer_company_name || null,
    created_at: doc.$createdAt,
    updated_at: doc.$updatedAt,
  }
}

  async findByClinicId(clinicId: string, options?: { isActive?: boolean; employerId?: string }): Promise<Patient[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    if (options?.isActive !== undefined) {
      queries.push(Query.equal("is_active", options.isActive))
    }

    if (options?.employerId) {
      queries.push(Query.equal("employer_id", options.employerId))
    }

    queries.push(Query.orderDesc("$createdAt"))

    return this.find(queries)
  }

  async findByIdNumber(idNumber: string, clinicId: string): Promise<Patient | null> {
    const patients = await this.find([Query.equal("id_number", idNumber), Query.equal("clinic_id", clinicId)])
    return patients[0] || null
  }

  async findByEmployerId(employerId: string): Promise<Patient[]> {
    return this.find([Query.equal("employer_id", employerId), Query.orderDesc("$createdAt")])
  }

  async search(clinicId: string, searchTerm: string): Promise<Patient[]> {
    const queries = [Query.equal("clinic_id", clinicId)]

    // Search across multiple fields
    queries.push(
      Query.or([
        Query.search("first_name", searchTerm),
        Query.search("last_name", searchTerm),
        Query.search("id_number", searchTerm),
        Query.search("employee_number", searchTerm),
      ]),
    )

    return this.find(queries)
  }

  async countByEmployerId(employerId: string): Promise<number> {
    return this.count([Query.equal("employer_id", employerId)])
  }

  async countByClinicId(clinicId: string): Promise<number> {
    return this.count([Query.equal("clinic_id", clinicId)])
  }
}
