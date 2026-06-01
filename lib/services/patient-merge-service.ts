// lib/services/patient-merge.service.ts (NEW FILE)
import { 
  getPatientRepository, 
  getAppointmentRepository,
  getTestResultRepository,
  getCertificateRepository 
} from "@/lib/repositories"
import { MedicalAudit } from "@/lib/audit/medical-audit"
import { Query } from "node-appwrite"

export interface MergeOptions {
  keepPatientId: string  // Patient to keep
  mergePatientId: string // Patient to merge and deactivate
  mergeFields: {
    personal_info: boolean
    contact_info: boolean
    medical_info: boolean
    employment_info: boolean
  }
}

export class PatientMergeService {
  static async findPotentialDuplicates(clinicId: string): Promise<Array<{
    patients: Array<{id: string, name: string, id_number: string}>
    similarity_score: number
    matching_fields: string[]
  }>> {
    const patientRepo = getPatientRepository()
    const patients = await patientRepo.findByClinicId(clinicId)
    
    const duplicates: any[] = []
    
    // Check for exact ID number matches
    const idMap = new Map<string, any[]>()
    patients.forEach(patient => {
      if (patient.id_number) {
        if (!idMap.has(patient.id_number)) {
          idMap.set(patient.id_number, [])
        }
        idMap.get(patient.id_number)!.push(patient)
      }
    })
    
    // Find groups with same ID number
    for (const [idNumber, patientGroup] of idMap.entries()) {
      if (patientGroup.length > 1) {
        duplicates.push({
          patients: patientGroup.map(p => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            id_number: p.id_number
          })),
          similarity_score: 100,
          matching_fields: ['id_number']
        })
      }
    }
    
    // Check for similar names (optional - more complex)
    // You could add fuzzy name matching here
    
    return duplicates
  }
  
  static async mergePatients(
    userId: string,
    userRole: string,
    clinicId: string,
    options: MergeOptions
  ): Promise<{success: boolean; mergedRecords: number; error?: string}> {
    try {
      // Only clinic admins can merge patients
      if (userRole !== 'clinic_admin') {
        throw new Error("Only clinic administrators can merge patient records")
      }
      
      const patientRepo = getPatientRepository()
      const appointmentRepo = getAppointmentRepository()
      const testRepo = getTestResultRepository()
      const certificateRepo = getCertificateRepository()
      
      // Get both patients
      const [keepPatient, mergePatient] = await Promise.all([
        patientRepo.findById(options.keepPatientId),
        patientRepo.findById(options.mergePatientId)
      ])
      
      if (!keepPatient || !mergePatient || 
          keepPatient.clinic_id !== clinicId || 
          mergePatient.clinic_id !== clinicId) {
        throw new Error("Patients not found or belong to different clinics")
      }
      
      let mergedRecords = 0
      
      // 1. Transfer appointments
      const appointments = await appointmentRepo.find([
        Query.equal("patient_id", options.mergePatientId)
      ])
      
      await Promise.all(
        appointments.map(appt => 
          appointmentRepo.update(appt.id, { patient_id: options.keepPatientId })
        )
      )
      mergedRecords += appointments.length
      
      // 2. Transfer test results
      const tests = await testRepo.find([
        Query.equal("patient_id", options.mergePatientId)
      ])
      
      await Promise.all(
        tests.map(test => 
          testRepo.update(test.id, { patient_id: options.keepPatientId })
        )
      )
      mergedRecords += tests.length
      
      // 3. Transfer certificates
      const certificates = await certificateRepo.find([
        Query.equal("patient_id", options.mergePatientId)
      ])
      
      await Promise.all(
        certificates.map(cert => 
          certificateRepo.update(cert.id, { patient_id: options.keepPatientId })
        )
      )
      mergedRecords += certificates.length
      
      // 4. Merge patient data (optional fields)
      const updates: any = {}
      
      if (options.mergeFields.contact_info) {
        if (!keepPatient.email && mergePatient.email) updates.email = mergePatient.email
        if (!keepPatient.phone && mergePatient.phone) updates.phone = mergePatient.phone
        if (!keepPatient.address && mergePatient.address) updates.address = mergePatient.address
      }
      
      if (options.mergeFields.medical_info) {
        if (!keepPatient.allergies && mergePatient.allergies) updates.allergies = mergePatient.allergies
        if (!keepPatient.chronic_conditions && mergePatient.chronic_conditions) {
          updates.chronic_conditions = mergePatient.chronic_conditions
        }
        if (!keepPatient.blood_type && mergePatient.blood_type) updates.blood_type = mergePatient.blood_type
      }
      
      if (options.mergeFields.employment_info) {
        if (!keepPatient.employer_id && mergePatient.employer_id) updates.employer_id = mergePatient.employer_id
        if (!keepPatient.employee_number && mergePatient.employee_number) {
          updates.employee_number = mergePatient.employee_number
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await patientRepo.update(options.keepPatientId, updates)
      }
      
      // 5. Deactivate merged patient
      await patientRepo.update(options.mergePatientId, {
        is_active: false,
        merged_into: options.keepPatientId,
        merged_at: new Date().toISOString(),
        merged_by: userId
      })
      
      // 6. Audit log
      await MedicalAudit.logAction({
        userId,
        userRole,
        clinicId,
        entityType: "patient",
        entityId: options.keepPatientId,
        action: "UPDATE",
        changes: {
          merged_patient: options.mergePatientId,
          merged_records: mergedRecords,
          merged_fields: Object.keys(updates)
        },
        ipAddress: null,
        userAgent: null,
        metadata: {
          keep_patient_name: `${keepPatient.first_name} ${keepPatient.last_name}`,
          merge_patient_name: `${mergePatient.first_name} ${mergePatient.last_name}`,
          records_transferred: mergedRecords
        }
      })
      
      return {
        success: true,
        mergedRecords
      }
      
    } catch (error) {
      console.error("Error merging patients:", error)
      return {
        success: false,
        mergedRecords: 0,
        error: (error as Error).message
      }
    }
  }
}