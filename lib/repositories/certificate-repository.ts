// lib/repositories/certificate-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Certificate, CertificateType } from "@/lib/types/database"
import { TestResultRepository } from "./test-result-repository"
import { PatientRepository } from "./patient-repository"
import { ClinicRepository } from "./clinic-repository"
import { AppointmentRepository } from "./appointment-repository"
import { BranchRepository } from "./branch-repository"
import { ClinicalTestRepository } from "./clinical-test-repository"

export class CertificateRepository extends BaseRepository<Certificate> {
  protected collectionId = COLLECTIONS.CERTIFICATES

  constructor() {
    super("certificate")
  }

  protected mapToEntity(doc: any): Certificate {
    // Parse test results if they exist
    let testResults: any[] = []
    if (doc.test_results) {
      try {
        if (typeof doc.test_results === 'string') {
          testResults = JSON.parse(doc.test_results)
        } else if (Array.isArray(doc.test_results)) {
          testResults = doc.test_results
        }
      } catch (error) {
        console.error('Error parsing test results:', error)
        testResults = []
      }
    }

    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      appointment_id: doc.appointment_id,
      patient_id: doc.patient_id,
      certificate_number: doc.certificate_number,
      certificate_type: doc.certificate_type as CertificateType,
      issue_date: doc.issue_date,
      valid_from: doc.valid_from || null,
      valid_until: doc.valid_until || null,
      diagnosis: doc.diagnosis || null,
      restrictions: doc.restrictions || null,
      recommendations: doc.recommendations || null,
      issued_by: doc.issued_by,
      doctor_name: doc.doctor_name,
      doctor_registration_number: doc.doctor_registration_number || null,
      doctor_signature_url: doc.doctor_signature_url || null,
      pdf_url: doc.pdf_url || null,
      template_id: doc.template_id || null,
      test_results: testResults,
      sent_to_employer: doc.sent_to_employer || false,
      sent_to_patient: doc.sent_to_patient || false,
      sent_at: doc.sent_at || null,
      status: doc.status || "draft",
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  async create(data: Partial<Certificate>): Promise<Certificate> {
    // Stringify test results if they exist
    const processedData: any = { ...data }
    
    if (processedData.test_results && Array.isArray(processedData.test_results)) {
      processedData.test_results = JSON.stringify(processedData.test_results)
    }
    
    // Set defaults
    const defaults = {
      sent_to_employer: false,
      sent_to_patient: false,
      status: "draft",
    }
    
    // Apply defaults for missing fields
    for (const [key, value] of Object.entries(defaults)) {
      if (processedData[key] === undefined || processedData[key] === null) {
        processedData[key] = value
      }
    }
    
    return super.create(processedData)
  }

  async update(id: string, data: Partial<Certificate>): Promise<Certificate> {
    // Stringify test results if they exist
    const processedData: any = { ...data }
    
    if (processedData.test_results && Array.isArray(processedData.test_results)) {
      processedData.test_results = JSON.stringify(processedData.test_results)
    }
    
    return super.update(id, processedData)
  }

  async findByClinicId(
    clinicId: string,
    options?: {
      certificateType?: CertificateType
      patientId?: string
      sentToEmployer?: boolean
    },
  ): Promise<Certificate[]> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("issue_date"),
    ]

    if (options?.certificateType) {
      queries.push(Query.equal("certificate_type", options.certificateType))
    }

    if (options?.patientId) {
      queries.push(Query.equal("patient_id", options.patientId))
    }

    if (options?.sentToEmployer !== undefined) {
      queries.push(Query.equal("sent_to_employer", options.sentToEmployer))
    }

    return this.find(queries)
  }

  async findByPatientId(patientId: string): Promise<Certificate[]> {
    return this.find([
      Query.equal("patient_id", patientId),
      Query.orderDesc("issue_date"),
    ])
  }

  async findByAppointmentId(appointmentId: string): Promise<Certificate[]> {
    return this.find([Query.equal("appointment_id", appointmentId)])
  }

  async findByCertificateNumber(certificateNumber: string, clinicId: string): Promise<Certificate | null> {
    const certificates = await this.find([
      Query.equal("certificate_number", certificateNumber),
      Query.equal("clinic_id", clinicId),
    ])
    return certificates[0] || null
  }

  async findPendingToSend(clinicId: string): Promise<Certificate[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("sent_to_employer", false),
      Query.orderAsc("issue_date"),
    ])
  }

  async markAsSent(id: string, toPatient: boolean = false, toEmployer: boolean = false): Promise<Certificate> {
    const updateData: Partial<Certificate> = {
      sent_at: new Date().toISOString(),
    }
    
    if (toPatient) {
      updateData.sent_to_patient = true
    }
    
    if (toEmployer) {
      updateData.sent_to_employer = true
    }
    
    return this.update(id, updateData)
  }

  async generateCertificateNumber(clinicId: string): Promise<string> {
    // Generate a more readable format
    const today = new Date()
    const year = today.getFullYear()
    
    // Count certificates for this clinic in current year
    const count = await this.count([
      Query.equal("clinic_id", clinicId),
      Query.startsWith("certificate_number", `${year}`),
    ])

    // Format: YEAR-CLINIC-000001
    const sequentialNumber = String(count + 1).padStart(6, "0")
    return `${year}-${clinicId.slice(0, 4).toUpperCase()}-${sequentialNumber}`
  }

  async countByType(
    clinicId: string,
    certificateType: CertificateType,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.equal("certificate_type", certificateType),
    ]

    if (startDate) {
      queries.push(Query.greaterThanEqual("issue_date", startDate))
    }

    if (endDate) {
      queries.push(Query.lessThanEqual("issue_date", endDate))
    }

    return this.count(queries)
  }

  async updateCertificate(id: string, data: Partial<Certificate>): Promise<Certificate> {
    return this.update(id, data)
  }

  async updateCertificateWithTestResults(
    id: string, 
    data: Partial<Certificate> & { test_results?: any[] }
  ): Promise<Certificate> {
    return this.update(id, data)
  }

  async findWithTestResults(id: string): Promise<{
    certificate: Certificate;
    testResults: any[];
    patient: any;
    clinic: any;
    branch?: any;
  }> {
    const certificate = await this.findById(id)
    
    if (!certificate) {
      throw new Error("Certificate not found")
    }

    // Get test results
    const testResultRepo = new TestResultRepository()
    const testResults = await testResultRepo.findByAppointmentId(certificate.appointment_id)
    
    // Enrich test results with test names
    const enrichedTestResults = await Promise.all(
      testResults.map(async (testResult) => {
        try {
          const clinicalTestRepo = new ClinicalTestRepository()
          const test = await clinicalTestRepo.findById(testResult.test_code)
          return {
            ...testResult,
            test_name: test?.test_name || 'Unknown Test',
          }
        } catch (error) {
          console.error("Error fetching test name:", error)
          return {
            ...testResult,
            test_name: 'Unknown Test',
          }
        }
      })
    )
    
    // Get patient
    const patientRepo = new PatientRepository()
    const patient = await patientRepo.findById(certificate.patient_id)
    
    // Get clinic
    const clinicRepo = new ClinicRepository()
    const clinic = await clinicRepo.findById(certificate.clinic_id)
    
    // Get branch if available (from appointment)
    let branch = null
    if (certificate.appointment_id) {
      try {
        const appointmentRepo = new AppointmentRepository()
        const appointment = await appointmentRepo.findById(certificate.appointment_id)
        if (appointment?.branch_id) {
          const branchRepo = new BranchRepository()
          branch = await branchRepo.findById(appointment.branch_id)
        }
      } catch (error) {
        console.error("Error fetching branch:", error)
      }
    }

    return {
      certificate,
      testResults: enrichedTestResults,
      patient,
      clinic,
      branch
    }
  }

  async updateStatus(certificateId: string, status: Certificate["status"]): Promise<Certificate> {
    return this.update(certificateId, { status })
  }

    async findByTemplateId(templateId: string): Promise<Certificate[]> {
    return this.find([
      Query.equal("template_id", templateId),
      Query.orderDesc("issue_date"),
    ])
  }

  async updateWithTemplate(certificateId: string, templateId: string): Promise<Certificate> {
    return this.update(certificateId, {
      template_id: templateId,
      updated_at: new Date().toISOString()
    })
  }

  async getTemplateUsageStats(clinicId: string): Promise<Record<string, number>> {
    const certificates = await this.findByClinicId(clinicId)
    const stats: Record<string, number> = {}
    
    certificates.forEach(cert => {
      const templateId = cert.template_id || 'no_template'
      stats[templateId] = (stats[templateId] || 0) + 1
    })
    
    return stats
  }
}