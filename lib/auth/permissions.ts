import type { UserRole } from "@/lib/types/database"

export const PERMISSIONS = {
  // Super Admin - Full system access
  super_admin: {
    canManageClinics: true,
    canViewAllClinics: true,
    canManageSubscriptions: true,
    canViewSystemAnalytics: true,
    canManageSystemSettings: true,
    canAccessAllData: true,
    canDecryptAllFields: true,
    canViewAuditLogs: true,
    canManageEncryption: true,
  },

  // Clinic Admin - Full clinic access
  clinic_admin: {
    canManageBranches: true,
    canManageUsers: true,
    canManageEmployers: true,
    canManagePatients: true,
    canManageAppointments: true,
    canManageClinicalTests: true,
    canViewReports: true,
    canManageBilling: true,
    canManageSettings: true,
    canDecryptAllFields: true,
    canViewAuditLogs: true,
    canExportData: true,
  },

  // Receptionist - Front desk operations
  receptionist: {
    canManageEmployers: true,
    canManagePatients: true,
    canManageAppointments: true,
    canCheckInPatients: true,
    canViewAppointments: true,
    canDecryptBasicFields: true, // Limited decryption
    canViewCertificates: false,
  },

  // Nurse - Clinical operations
  nurse: {
    canViewPatients: true,
    canViewAppointments: true,
    canPerformTests: true,
    canRecordTestResults: true,
    canViewTestResults: true,
    canAddNurseNotes: true,
    canDecryptClinicalFields: true,
    canViewMedicalHistory: true,
  },

  // Doctor - Medical oversight
  doctor: {
    canViewPatients: true,
    canViewAppointments: true,
    canViewTestResults: true,
    canIssueCertificates: true,
    canAddDoctorNotes: true,
    canApproveFitness: true,
    canDecryptClinicalFields: true,
    canViewMedicalHistory: true,
    canPrescribe: true,
  },

  // Employer - Portal access only
  employer: {
    canViewOwnEmployees: true,
    canViewCertificates: true,
    canViewReports: true,
    canManageEmployeeList: true,
    canDecryptAllFields: false, // No decryption access
    canViewSummariesOnly: true,
  },
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role] as Record<string, boolean>
  return rolePermissions?.[permission] ?? false
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/super-admin": ["super_admin"],
    "/clinic": ["clinic_admin"],
    "/dashboard": ["clinic_admin", "receptionist", "nurse", "doctor"],
    "/employer": ["employer"],
    "/patients": ["clinic_admin", "receptionist", "nurse", "doctor"],
    "/appointments": ["clinic_admin", "receptionist", "nurse", "doctor"],
    "/tests": ["clinic_admin", "nurse", "doctor"],
    "/certificates": ["clinic_admin", "doctor"],
    "/employers": ["clinic_admin", "receptionist"],
    "/billing": ["clinic_admin"],
    "/settings": ["clinic_admin"],
    "/audit-logs": ["super_admin", "clinic_admin"],
  }

  for (const [path, allowedRoles] of Object.entries(routePermissions)) {
    if (route.startsWith(path)) {
      return allowedRoles.includes(role)
    }
  }

  return false
}

export function canAccessPatientData(
  userRole: UserRole,
  patientClinicId: string,
  userClinicId: string | null,
): boolean {
  // Super admin can access all data
  if (userRole === "super_admin") {
    return true
  }

  // All other roles must be in same clinic
  return userClinicId === patientClinicId
}

export function canDecryptField(userRole: UserRole, fieldName: string, entityType: string): boolean {
  // Super admin and clinic admin can decrypt everything
  if (userRole === "super_admin" || userRole === "clinic_admin") {
    return true
  }

  // Employers cannot decrypt any fields
  if (userRole === "employer") {
    return false
  }

  // Receptionists can decrypt basic contact info only
  if (userRole === "receptionist") {
    const allowedFields = ["first_name", "last_name", "phone", "email", "address"]
    return allowedFields.includes(fieldName)
  }

  // Nurses and doctors can decrypt clinical fields
  if (userRole === "nurse" || userRole === "doctor") {
    // All patient fields except passport
    if (entityType === "patient") {
      return fieldName !== "passport_number"
    }

    // All appointment and test result fields
    if (entityType === "appointment" || entityType === "test_result") {
      return true
    }

    // Nurses cannot decrypt doctor-only certificate fields
    if (entityType === "certificate" && userRole === "nurse") {
      return fieldName !== "doctor_notes"
    }

    return true
  }

  return false
}

export function canExportData(userRole: UserRole): boolean {
  return userRole === "super_admin" || userRole === "clinic_admin"
}

export function canViewAuditLogs(userRole: UserRole): boolean {
  return userRole === "super_admin" || userRole === "clinic_admin"
}

export function canManageUsers(userRole: UserRole): boolean {
  return userRole === "super_admin" || userRole === "clinic_admin"
}

export function canDeleteRecords(userRole: UserRole): boolean {
  return userRole === "super_admin" || userRole === "clinic_admin"
}
