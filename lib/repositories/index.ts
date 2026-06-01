/**
 * Repository instances
 * Using singleton pattern to avoid multiple instances
 */

import { UserRepository } from "./user-repository"
import { ClinicRepository } from "./clinic-repository"
import { AuditLogRepository } from "./audit-log-repository" 
import { SubscriptionRepository } from "./subscription-repository"
import { PaymentRepository } from "./payment-repository"
import { PatientRepository } from "./patient-repository"
import { AppointmentRepository } from "./appointment-repository"
import { ClinicalTestRepository } from "./clinical-test-repository"
import { TestResultRepository } from "./test-result-repository"
import { CertificateRepository } from "./certificate-repository"
import { EmployerRepository } from "./employer-repository"
import { BranchRepository } from "./branch-repository"
import { NotificationRepository } from "./notification-repository"
import { StaffRepository } from "./staff-repository"
import { ActivityRepository } from "./activity-repository"
import { AssessmentRepository } from "./assessment-repository"

 // Add this

let userRepository: UserRepository | null = null
let clinicRepository: ClinicRepository | null = null
let subscriptionRepository: SubscriptionRepository | null = null
let paymentRepository: PaymentRepository | null = null
let patientRepository: PatientRepository | null = null
let appointmentRepository: AppointmentRepository | null = null
let clinicalTestRepository: ClinicalTestRepository | null = null
let testResultRepository: TestResultRepository | null = null
let certificateRepository: CertificateRepository | null = null
let employerRepository: EmployerRepository | null = null
let branchRepository: BranchRepository | null = null
let notificationRepository: NotificationRepository | null = null
let staffRepository: StaffRepository | null = null
let activityRepository: ActivityRepository | null = null
let assessmentRepository: AssessmentRepository | null = null
let auditLogRepository: AuditLogRepository | null = null

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository()
  }
  return userRepository
}

export function getAuditLogRepository(): AuditLogRepository {
  if (!auditLogRepository) {
    auditLogRepository = new AuditLogRepository()
  }
  return auditLogRepository
}

export function getStaffRepository(): StaffRepository {
  if (!staffRepository) {
    staffRepository = new StaffRepository()
  }
  return staffRepository
}

export function getClinicRepository(): ClinicRepository {
  if (!clinicRepository) {
    clinicRepository = new ClinicRepository()
  }
  return clinicRepository
}

export function getSubscriptionRepository(): SubscriptionRepository {
  if (!subscriptionRepository) {
    subscriptionRepository = new SubscriptionRepository()
  }
  return subscriptionRepository
}

export function getPaymentRepository(): PaymentRepository {
  if (!paymentRepository) {
    paymentRepository = new PaymentRepository()
  }
  return paymentRepository
}

export function getPatientRepository(): PatientRepository {
  if (!patientRepository) {
    patientRepository = new PatientRepository()
  }
  return patientRepository
}

export function getAppointmentRepository(): AppointmentRepository {
  if (!appointmentRepository) {
    appointmentRepository = new AppointmentRepository()
  }
  return appointmentRepository
}

export function getClinicalTestRepository(): ClinicalTestRepository {
  if (!clinicalTestRepository) {
    clinicalTestRepository = new ClinicalTestRepository()
  }
  return clinicalTestRepository
}

export function getTestResultRepository(): TestResultRepository {
  if (!testResultRepository) {
    testResultRepository = new TestResultRepository()
  }
  return testResultRepository
}

export function getCertificateRepository(): CertificateRepository {
  if (!certificateRepository) {
    certificateRepository = new CertificateRepository()
  }
  return certificateRepository
}

export function getEmployerRepository(): EmployerRepository {
  if (!employerRepository) {
    employerRepository = new EmployerRepository()
  }
  return employerRepository
}

export function getBranchRepository(): BranchRepository {
  if (!branchRepository) {
    branchRepository = new BranchRepository()
  }
  return branchRepository
}

export function getNotificationRepository(): NotificationRepository {
  if (!notificationRepository) {
    notificationRepository = new NotificationRepository()
  }
  return notificationRepository
}

export function getActivityRepository(): ActivityRepository {
  if (!activityRepository) {
    activityRepository = new ActivityRepository()
  }
  return activityRepository
}

export function getAssessmentRepository(): AssessmentRepository {
  if (!assessmentRepository) {
    assessmentRepository = new AssessmentRepository()
  }
  return assessmentRepository
}

// Only export repository classes, not entity types
// Remove any duplicate exports of entity types like 'User'
export { 
  UserRepository,
  ClinicRepository,
  SubscriptionRepository,
  PaymentRepository,
  PatientRepository,
  AppointmentRepository,
  ClinicalTestRepository,
  TestResultRepository,
  CertificateRepository,
  EmployerRepository,
  BranchRepository,
  NotificationRepository,
  StaffRepository,
  ActivityRepository,
  AssessmentRepository,
}
