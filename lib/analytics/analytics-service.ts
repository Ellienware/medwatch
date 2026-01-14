import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"

export interface DateRange {
  startDate: string
  endDate: string
}

export interface AppointmentMetrics {
  total: number
  completed: number
  cancelled: number
  noShow: number
  completionRate: number
  averagePerDay: number
}

export interface CertificateMetrics {
  total: number
  fitToWork: number
  fitWithRestrictions: number
  unfitToWork: number
  sentToEmployer: number
  pending: number
}

export interface PatientMetrics {
  total: number
  active: number
  newThisMonth: number
  byEmployer: Record<string, number>
}

export interface RevenueMetrics {
  total: number
  byMonth: Record<string, number>
  topServices: Array<{ name: string; revenue: number; count: number }>
}

/**
 * Analytics service for generating clinic reports
 */
export class AnalyticsService {
  private get databases() {
    return createServerClient().databases
  }

  /**
   * Get appointment metrics for a date range
   */
  async getAppointmentMetrics(clinicId: string, dateRange: DateRange): Promise<AppointmentMetrics> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.greaterThanEqual("appointment_date", dateRange.startDate),
      Query.lessThanEqual("appointment_date", dateRange.endDate),
    ]

    const [total, completed, cancelled, noShow] = await Promise.all([
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, queries),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        ...queries,
        Query.equal("status", "completed"),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        ...queries,
        Query.equal("status", "cancelled"),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
        ...queries,
        Query.equal("status", "no_show"),
      ]),
    ])

    const totalCount = total.total
    const completedCount = completed.total
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    // Calculate days in range
    const start = new Date(dateRange.startDate)
    const end = new Date(dateRange.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const averagePerDay = totalCount / days

    return {
      total: totalCount,
      completed: completedCount,
      cancelled: cancelled.total,
      noShow: noShow.total,
      completionRate,
      averagePerDay,
    }
  }

  /**
   * Get certificate metrics for a date range
   */
  async getCertificateMetrics(clinicId: string, dateRange: DateRange): Promise<CertificateMetrics> {
    const queries = [
      Query.equal("clinic_id", clinicId),
      Query.greaterThanEqual("issue_date", dateRange.startDate),
      Query.lessThanEqual("issue_date", dateRange.endDate),
    ]

    const [all, fitToWork, fitWithRestrictions, unfitToWork, sent] = await Promise.all([
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, queries),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
        ...queries,
        Query.equal("certificate_type", "fit_to_work"),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
        ...queries,
        Query.equal("certificate_type", "fit_with_restrictions"),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
        ...queries,
        Query.equal("certificate_type", "unfit_to_work"),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CERTIFICATES, [
        ...queries,
        Query.equal("sent_to_employer", true),
      ]),
    ])

    return {
      total: all.total,
      fitToWork: fitToWork.total,
      fitWithRestrictions: fitWithRestrictions.total,
      unfitToWork: unfitToWork.total,
      sentToEmployer: sent.total,
      pending: all.total - sent.total,
    }
  }

  /**
   * Get patient metrics
   */
  async getPatientMetrics(clinicId: string): Promise<PatientMetrics> {
    const [all, active, newPatients] = await Promise.all([
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [Query.equal("clinic_id", clinicId)]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
        Query.equal("clinic_id", clinicId),
        Query.equal("is_active", true),
      ]),
      this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.PATIENTS, [
        Query.equal("clinic_id", clinicId),
        Query.greaterThanEqual(
          "$createdAt",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        ),
      ]),
    ])

    // Get patients by employer
    const allPatients = all.documents
    const byEmployer: Record<string, number> = {}
    allPatients.forEach((patient: any) => {
      if (patient.employer_id) {
        byEmployer[patient.employer_id] = (byEmployer[patient.employer_id] || 0) + 1
      }
    })

    return {
      total: all.total,
      active: active.total,
      newThisMonth: newPatients.total,
      byEmployer,
    }
  }

  /**
   * Get test result statistics
   */
  async getTestResultStats(clinicId: string, dateRange: DateRange) {
  const queries = [
    Query.equal("clinic_id", clinicId),
    Query.greaterThanEqual("performed_at", dateRange.startDate),
    Query.lessThanEqual("performed_at", dateRange.endDate),
  ]

  const [all, normal, abnormal, unreviewed] = await Promise.all([
    this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.TEST_RESULTS, queries),
    this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.TEST_RESULTS, [
      ...queries,
      Query.equal("is_normal", true),
    ]),
    this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.TEST_RESULTS, [
      ...queries,
      Query.equal("is_normal", false), // This gives us abnormal results
    ]),
    this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.TEST_RESULTS, [
      ...queries,
      Query.isNull("reviewed_by"),
    ]),
  ])

  return {
    total: all.total,
    normal: normal.total,
    abnormal: abnormal.total, // Now this exists
    unreviewed: unreviewed.total,
    normalRate: all.total > 0 ? (normal.total / all.total) * 100 : 0,
  }
}

  /**
   * Generate comprehensive clinic report
   */
  async generateClinicReport(clinicId: string, dateRange: DateRange) {
    const [appointments, certificates, patients, testResults] = await Promise.all([
      this.getAppointmentMetrics(clinicId, dateRange),
      this.getCertificateMetrics(clinicId, dateRange),
      this.getPatientMetrics(clinicId),
      this.getTestResultStats(clinicId, dateRange),
    ])

    return {
      dateRange,
      generatedAt: new Date().toISOString(),
      appointments,
      certificates,
      patients,
      testResults,
    }
  }

  /**
   * Get daily appointment trends for charts
   */
  async getDailyAppointmentTrends(clinicId: string, dateRange: DateRange) {
    const appointments = await this.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.APPOINTMENTS, [
      Query.equal("clinic_id", clinicId),
      Query.greaterThanEqual("appointment_date", dateRange.startDate),
      Query.lessThanEqual("appointment_date", dateRange.endDate),
      Query.limit(1000),
    ])

    // Group by date
    const dailyData: Record<string, { date: string; total: number; completed: number }> = {}

    appointments.documents.forEach((apt: any) => {
      const date = apt.appointment_date
      if (!dailyData[date]) {
        dailyData[date] = { date, total: 0, completed: 0 }
      }
      dailyData[date].total++
      if (apt.status === "completed") {
        dailyData[date].completed++
      }
    })

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  }
}

export const analyticsService = new AnalyticsService()
