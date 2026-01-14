// lib/utils/confidential-test.ts

/**
 * Confidential test utility functions for handling sensitive medical tests
 * like HIV, Hepatitis, Syphilis, and other infectious disease tests
 */

// Types for confidential test handling
export interface ConfidentialTestInfo {
  isConfidential: boolean
  testType: 'hiv' | 'hepatitis' | 'syphilis' | 'malaria' | 'other' | 'none'
  accessLevel: 'restricted' | 'limited' | 'normal'
  requiresConsent: boolean
  requiresCounseling: boolean
  retentionPeriod: number // in days
}

export interface TestAccessLevel {
  roles: string[]
  permissions: string[]
  requireReason: boolean
  logAccess: boolean
}

export interface ConfidentialTestResult {
  id: string
  testId: string
  testCode: string
  testName: string
  result: any
  isConfidential: boolean
  accessLog: AccessLogEntry[]
  restrictedFields?: string[]
}

export interface AccessLogEntry {
  userId: string
  userName: string
  userRole: string
  timestamp: string
  reason?: string
  action: 'view' | 'edit' | 'print' | 'export'
  ipAddress?: string
}

// List of confidential test codes (case-insensitive matching)
export const CONFIDENTIAL_TEST_CODES = [
  // HIV Tests
  'HIV', 'HIV1', 'HIV2', 'HIV12', 'HIVRAPID', 'HIVELISA', 'HIVWB', 'HIVPCR',
  'HIVVIRALLOAD', 'CD4', 'CD4COUNT',
  
  // Hepatitis Tests
  'HEPB', 'HEPATITISB', 'HBSAG', 'ANTIHBS', 'ANTIHBC',
  'HEPC', 'HEPATITISC', 'ANTIHCV', 'HCVRNA',
  'HEPA', 'HEPATITISA', 'HAVIGM', 'HAVIGG',
  
  // Syphilis Tests
  'SYPHILIS', 'RPR', 'VDRL', 'TPPA', 'FTAABS',
  
  // Other STD Tests
  'GONORRHEA', 'CHLAMYDIA', 'HSV', 'HERPES',
  
  // Other Infectious Diseases
  'MALARIA', 'TB', 'TUBERCULOSIS', 'TYPHOID', 'DENGUE',
  
  // Mental Health
  'PSYCHIATRIC', 'MENTALHEALTH',
  
  // Genetic Tests
  'GENETIC', 'DNA',
]

// Test types categorization
export const TEST_TYPE_CATEGORIES: Record<string, ConfidentialTestInfo['testType']> = {
  'HIV': 'hiv',
  'HEPATITIS': 'hepatitis',
  'SYPHILIS': 'syphilis',
  'MALARIA': 'malaria',
  'TB': 'other',
  'PSYCHIATRIC': 'other',
  'GENETIC': 'other',
}

// Access levels by user role
export const ACCESS_LEVELS: Record<string, TestAccessLevel> = {
  doctor: {
    roles: ['doctor', 'specialist'],
    permissions: ['view', 'edit', 'print'],
    requireReason: false,
    logAccess: true
  },
  nurse: {
    roles: ['nurse', 'clinical_officer'],
    permissions: ['view'],
    requireReason: true,
    logAccess: true
  },
  receptionist: {
    roles: ['receptionist', 'clerk'],
    permissions: [],
    requireReason: true,
    logAccess: true
  },
  admin: {
    roles: ['clinic_admin', 'super_admin'],
    permissions: ['view', 'edit', 'print', 'export', 'delete'],
    requireReason: false,
    logAccess: true
  },
  employer: {
    roles: ['employer'],
    permissions: [],
    requireReason: true,
    logAccess: true
  },
  patient: {
    roles: ['patient'],
    permissions: ['view_own'],
    requireReason: false,
    logAccess: true
  }
}

// Retention periods in days for different test types
export const RETENTION_PERIODS: Record<ConfidentialTestInfo['testType'], number> = {
  hiv: 365 * 10, // 10 years for HIV
  hepatitis: 365 * 7, // 7 years for Hepatitis
  syphilis: 365 * 5, // 5 years for Syphilis
  malaria: 365 * 3, // 3 years for Malaria
  other: 365 * 5, // 5 years for other confidential tests
  none: 365 * 2 // 2 years for non-confidential
}

/**
 * Check if a test code is confidential
 */
export function isConfidentialTest(testCode: string): boolean {
  if (!testCode) return false
  
  const upperCode = testCode.toUpperCase().trim()
  
  // Check if test code contains any confidential keywords
  return CONFIDENTIAL_TEST_CODES.some(confidentialCode => 
    upperCode.includes(confidentialCode.toUpperCase()) ||
    confidentialCode.toUpperCase().includes(upperCode)
  )
}

/**
 * Get detailed information about a test's confidentiality
 */
export function getConfidentialTestInfo(testCode: string, testName?: string): ConfidentialTestInfo {
  const upperCode = testCode.toUpperCase().trim()
  const upperName = (testName || '').toUpperCase().trim()
  
  // Determine test type
  let testType: ConfidentialTestInfo['testType'] = 'none'
  
  for (const [keyword, type] of Object.entries(TEST_TYPE_CATEGORIES)) {
    if (upperCode.includes(keyword.toUpperCase()) || 
        (testName && upperName.includes(keyword.toUpperCase()))) {
      testType = type
      break
    }
  }
  
  const isConfidential = isConfidentialTest(testCode) || testType !== 'none'
  
  // Determine access level based on test type
  let accessLevel: ConfidentialTestInfo['accessLevel'] = 'normal'
  if (testType === 'hiv') accessLevel = 'restricted'
  else if (testType === 'hepatitis' || testType === 'syphilis') accessLevel = 'limited'
  else if (isConfidential) accessLevel = 'limited'
  
  // Determine requirements
  const requiresConsent = testType === 'hiv' || testType === 'syphilis'
  const requiresCounseling = testType === 'hiv'
  
  // Get retention period
  const retentionPeriod = RETENTION_PERIODS[testType]
  
  return {
    isConfidential,
    testType,
    accessLevel,
    requiresConsent,
    requiresCounseling,
    retentionPeriod
  }
}

/**
 * Get label for confidential tests
 */
export function getConfidentialTestLabel(testCode: string, testName?: string): string {
  const info = getConfidentialTestInfo(testCode, testName)
  
  if (!info.isConfidential) {
    return testName || testCode
  }
  
  const labels: Record<ConfidentialTestInfo['testType'], string> = {
    hiv: 'HIV Test 🔒',
    hepatitis: 'Hepatitis Test 🔒',
    syphilis: 'Syphilis Test 🔒',
    malaria: 'Malaria Test',
    other: 'Confidential Test 🔒',
    none: testName || testCode
  }
  
  return labels[info.testType]
}

/**
 * Get badge variant for confidential tests
 */
export function getConfidentialTestBadgeVariant(testCode: string): 
  'default' | 'secondary' | 'destructive' | 'outline' | 'confidential' {
  
  const info = getConfidentialTestInfo(testCode)
  
  if (!info.isConfidential) return 'outline'
  
  switch (info.testType) {
    case 'hiv':
      return 'destructive'
    case 'hepatitis':
    case 'syphilis':
      return 'confidential' // You might need to create this variant
    default:
      return 'secondary'
  }
}

/**
 * Check if a user can access a confidential test result
 */
export function canAccessTestResult(
  testCode: string, 
  userRole: string, 
  action: AccessLogEntry['action'],
  patientId?: string,
  isOwnResult: boolean = false
): { canAccess: boolean; reason?: string; requiresReason: boolean } {
  
  const info = getConfidentialTestInfo(testCode)
  
  // Non-confidential tests are always accessible
  if (!info.isConfidential) {
    return { canAccess: true, requiresReason: false }
  }
  
  // Patients can only view their own results
  if (userRole === 'patient') {
    if (isOwnResult && action === 'view') {
      return { canAccess: true, reason: 'Viewing own test result', requiresReason: false }
    }
    return { 
      canAccess: false, 
      reason: 'Patients can only view their own test results',
      requiresReason: false 
    }
  }
  
  // Check access level configuration
  const accessLevel = Object.values(ACCESS_LEVELS).find(level => 
    level.roles.includes(userRole)
  )
  
  if (!accessLevel) {
    return { 
      canAccess: false, 
      reason: 'User role not authorized',
      requiresReason: false 
    }
  }
  
  // Check if user has permission for the action
  if (!accessLevel.permissions.includes(action)) {
    return { 
      canAccess: false, 
      reason: `User role does not have ${action} permission`,
      requiresReason: false 
    }
  }
  
  return { 
    canAccess: true, 
    requiresReason: accessLevel.requireReason 
  }
}

/**
 * Create an access log entry
 */
export function createAccessLogEntry(
  userId: string,
  userName: string,
  userRole: string,
  action: AccessLogEntry['action'],
  reason?: string,
  ipAddress?: string
): AccessLogEntry {
  return {
    userId,
    userName,
    userRole,
    timestamp: new Date().toISOString(),
    reason,
    action,
    ipAddress
  }
}

/**
 * Sanitize test results for display based on user role
 */
export function sanitizeTestResults(
  results: Record<string, any>,
  testCode: string,
  userRole: string,
  isOwnResult: boolean = false
): Record<string, any> {
  const info = getConfidentialTestInfo(testCode)
  
  // Non-confidential tests or owners viewing their own results
  if (!info.isConfidential || (isOwnResult && userRole === 'patient')) {
    return results
  }
  
  // For confidential tests, hide sensitive information from unauthorized roles
  const sensitiveFields = getSensitiveFields(info.testType)
  
  // Check if user can see full results
  const canSeeFullResults = canAccessTestResult(testCode, userRole, 'view', undefined, isOwnResult).canAccess
  
  if (canSeeFullResults) {
    return results
  }
  
  // Sanitize results for restricted access
  const sanitized: Record<string, any> = { ...results }
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '*****' // Mask sensitive data
    }
  })
  
  // Add a note that data has been sanitized
  sanitized._sanitized = true
  sanitized._sanitizationNote = 'Some information has been hidden due to privacy restrictions'
  
  return sanitized
}

/**
 * Get sensitive fields for different test types
 */
function getSensitiveFields(testType: ConfidentialTestInfo['testType']): string[] {
  const fieldMap: Record<ConfidentialTestInfo['testType'], string[]> = {
    hiv: [
      'hiv_result', 'test_result', 'result', 'viral_load', 'cd4_count',
      'confirmatory_test', 'referral_made', 'counseling_notes'
    ],
    hepatitis: [
      'hbsag', 'anti_hbs', 'anti_hbc', 'anti_hcv', 'hcv_rna',
      'hepatitis_result', 'viral_load'
    ],
    syphilis: [
      'rpr', 'vdrl', 'tppa', 'syphilis_result', 'titer'
    ],
    malaria: [
      'malaria_result', 'parasite_count', 'species'
    ],
    other: [
      'result', 'diagnosis', 'findings'
    ],
    none: []
  }
  
  return fieldMap[testType] || []
}

/**
 * Format test result for display with confidentiality warnings
 */
export function formatTestResultWithWarnings(
  testCode: string,
  testName: string,
  result: any,
  userRole: string
): {
  displayName: string
  formattedResult: any
  warnings: string[]
  restrictions: string[]
} {
  const info = getConfidentialTestInfo(testCode, testName)
  const warnings: string[] = []
  const restrictions: string[] = []
  
  // Add confidentiality warnings
  if (info.isConfidential) {
    warnings.push('This test result contains confidential medical information.')
    
    if (info.requiresConsent) {
      warnings.push('Informed consent is required for this test.')
    }
    
    if (info.requiresCounseling) {
      warnings.push('Pre- and post-test counseling is required.')
    }
  }
  
  // Check access restrictions
  const accessCheck = canAccessTestResult(testCode, userRole, 'view')
  if (!accessCheck.canAccess) {
    restrictions.push(accessCheck.reason || 'Access restricted')
  }
  
  // Sanitize results if needed
  const formattedResult = sanitizeTestResults(result, testCode, userRole)
  
  return {
    displayName: getConfidentialTestLabel(testCode, testName),
    formattedResult,
    warnings,
    restrictions
  }
}

/**
 * Get audit trail requirements for a test
 */
export function getAuditRequirements(testCode: string): {
  logAllAccess: boolean
  requireReasonForAccess: boolean
  retentionPeriod: number
  encryptionRequired: boolean
} {
  const info = getConfidentialTestInfo(testCode)
  
  return {
    logAllAccess: info.isConfidential,
    requireReasonForAccess: info.accessLevel === 'restricted' || info.accessLevel === 'limited',
    retentionPeriod: info.retentionPeriod,
    encryptionRequired: info.testType === 'hiv' || info.testType === 'hepatitis'
  }
}

/**
 * Validate test result before storage
 */
export function validateConfidentialTestResult(
  testCode: string,
  data: any
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const info = getConfidentialTestInfo(testCode)
  
  // Check for required fields based on test type
  if (info.testType === 'hiv') {
    if (!data.hiv_result && !data.test_result) {
      errors.push('HIV test result is required')
    }
    
    if (!data.consent_obtained) {
      errors.push('Informed consent is required for HIV testing')
    }
  }
  
  // Check for counseling if required
  if (info.requiresCounseling && !data.counseling_provided) {
    warnings.push('Counseling should be documented for this test')
  }
  
  // Validate test kit information for rapid tests
  if (testCode.toUpperCase().includes('RAPID')) {
    if (!data.lot_number) {
      warnings.push('Test kit lot number should be recorded')
    }
    if (!data.expiry_date) {
      warnings.push('Test kit expiry date should be recorded')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Generate summary statistics for confidential tests
 */
export function getConfidentialTestStats(
  testResults: ConfidentialTestResult[]
): {
  totalConfidentialTests: number
  byTestType: Record<string, number>
  byAccessLevel: Record<string, number>
  recentAccesses: number
} {
  const stats = {
    totalConfidentialTests: 0,
    byTestType: {} as Record<string, number>,
    byAccessLevel: {} as Record<string, number>,
    recentAccesses: 0
  }
  
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  testResults.forEach(result => {
    const info = getConfidentialTestInfo(result.testCode)
    
    if (info.isConfidential) {
      stats.totalConfidentialTests++
      
      // Count by test type
      stats.byTestType[info.testType] = (stats.byTestType[info.testType] || 0) + 1
      
      // Count by access level
      stats.byAccessLevel[info.accessLevel] = (stats.byAccessLevel[info.accessLevel] || 0) + 1
      
      // Count recent accesses
      const recentAccess = result.accessLog?.some(log => 
        new Date(log.timestamp) > oneWeekAgo
      )
      if (recentAccess) {
        stats.recentAccesses++
      }
    }
  })
  
  return stats
}

/**
 * Export test result with confidentiality headers
 */
export function exportConfidentialTestResult(
  result: ConfidentialTestResult,
  includeSensitiveData: boolean = false
): {
  headers: Record<string, string>
  data: any
  metadata: Record<string, any>
} {
  const info = getConfidentialTestInfo(result.testCode)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Test-Type': info.testType,
    'X-Confidential': info.isConfidential.toString(),
    'X-Export-Date': new Date().toISOString(),
    'X-Access-Restricted': info.accessLevel
  }
  
  let data = result.result
  
  // Sanitize data if sensitive data shouldn't be included
  if (!includeSensitiveData && info.isConfidential) {
    const sensitiveFields = getSensitiveFields(info.testType)
    sensitiveFields.forEach(field => {
      if (data[field]) {
        data[field] = '[REDACTED]'
      }
    })
  }
  
  const metadata = {
    testId: result.testId,
    testCode: result.testCode,
    testName: result.testName,
    confidentialityLevel: info.accessLevel,
    exportTimestamp: new Date().toISOString(),
    sanitized: !includeSensitiveData && info.isConfidential
  }
  
  return { headers, data, metadata }
}