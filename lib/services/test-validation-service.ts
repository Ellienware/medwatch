// lib/services/test-validation.service.ts - CORRECTED VERSION
export class TestValidationService {
  static readonly SENSITIVE_TESTS = [
    'hiv', 'syphilis', 'hepatitis_b', 'hepatitis_c', 
    'drug_screen', 'psychiatric', 'hiv_1', 'hiv_2'
  ]
  
  static readonly TEST_NORMAL_RANGES = {
    blood_pressure: {
      systolic: { min: 90, max: 140 },
      diastolic: { min: 60, max: 90 }
    },
    blood_glucose: {
      fasting: { min: 70, max: 100 }, // mg/dL
      random: { min: 70, max: 140 }
    },
    cholesterol: {
      total: { min: 125, max: 200 },
      ldl: { min: 0, max: 100 },
      hdl: { min: 40, max: Infinity }
    },
    // Add more test ranges...
  }
  
  static validateTestResult(
    testCode: string, 
    results: any,
  ): {
    isValid: boolean
    isNormal: boolean
    warnings: string[]
    normalizedResults: any
    requiresReview: boolean
  } {
    const validation = {
      isValid: true,
      isNormal: true,
      warnings: [] as string[],
      normalizedResults: { ...results },
      requiresReview: false
    }
    
    // Check for required fields based on test type
    const requiredFields = this.getRequiredFields(testCode)
    for (const field of requiredFields) {
      if (results[field] === undefined || results[field] === null) {
        validation.isValid = false
        validation.warnings.push(`Missing required field: ${field}`)
      }
    }
    
    // Test-specific validation
    switch(testCode.toLowerCase()) {
      case 'blood_pressure':
        validation.isNormal = this.validateBloodPressure(results, validation.warnings)
        if (!validation.isNormal) validation.requiresReview = true
        break
        
      case 'hiv_test':
        validation.isNormal = this.validateHIVTest(results, validation.warnings)
        validation.requiresReview = true // Always require review for HIV
        break
        
      case 'blood_glucose':
        validation.isNormal = this.validateBloodGlucose(results, validation.warnings)
        if (!validation.isNormal) validation.requiresReview = true
        break
        
      // Add more test validations...
    }
    
    // Check for critical values
    if (this.hasCriticalValues(testCode, results)) {
      validation.requiresReview = true
      validation.warnings.push('Critical value detected - requires immediate review')
    }
    
    return validation
  }
  
  private static validateBloodPressure(results: any, warnings: string[]): boolean {
    const systolic = Number(results.systolic)
    const diastolic = Number(results.diastolic)
    
    if (isNaN(systolic) || isNaN(diastolic)) {
      warnings.push('Invalid blood pressure values')
      return false
    }
    
    // Plausibility check
    if (systolic < 50 || systolic > 300) {
      warnings.push(`Systolic BP (${systolic}) outside plausible range`)
      return false
    }
    
    if (diastolic < 30 || diastolic > 200) {
      warnings.push(`Diastolic BP (${diastolic}) outside plausible range`)
      return false
    }
    
    // Normal range check
    const ranges = this.TEST_NORMAL_RANGES.blood_pressure
    const isNormal = systolic >= ranges.systolic.min && 
                     systolic <= ranges.systolic.max &&
                     diastolic >= ranges.diastolic.min && 
                     diastolic <= ranges.diastolic.max
    
    if (!isNormal) {
      warnings.push(`Blood pressure abnormal: ${systolic}/${diastolic}`)
    }
    
    return isNormal
  }
  
  private static validateHIVTest(results: any, warnings: string[]): boolean {
    const validResults = ['negative', 'positive', 'indeterminate', 'reactive', 'non-reactive']
    const result = (results.result || '').toLowerCase()
    
    if (!validResults.includes(result)) {
      warnings.push(`Invalid HIV test result: ${result}`)
      return false
    }
    
    // HIV positive is "abnormal" but valid
    return result === 'negative' || result === 'non-reactive'
  }
  
  // ✅ ADD THIS MISSING METHOD
  private static validateBloodGlucose(results: any, warnings: string[]): boolean {
    const glucose = Number(results.value)
    const type = (results.type || 'fasting').toLowerCase()
    
    if (isNaN(glucose)) {
      warnings.push('Invalid blood glucose value')
      return false
    }
    
    // Plausibility check
    if (glucose < 20 || glucose > 1000) {
      warnings.push(`Blood glucose (${glucose}) outside plausible range`)
      return false
    }
    
    // Get appropriate range based on test type
    const ranges = this.TEST_NORMAL_RANGES.blood_glucose
    const range = type === 'random' ? ranges.random : ranges.fasting
    
    const isNormal = glucose >= range.min && glucose <= range.max
    
    if (!isNormal) {
      warnings.push(`Blood glucose ${type} abnormal: ${glucose} mg/dL`)
    }
    
    return isNormal
  }
  
  private static getRequiredFields(testCode: string): string[] {
    const fieldMap: Record<string, string[]> = {
      blood_pressure: ['systolic', 'diastolic'],
      blood_glucose: ['value', 'type'], // fasting/random
      hiv_test: ['result'],
      urinalysis: ['appearance', 'ph', 'glucose', 'protein'],
      // Add more...
    }
    
    return fieldMap[testCode.toLowerCase()] || []
  }
  
  private static hasCriticalValues(testCode: string, results: any): boolean {
    switch(testCode.toLowerCase()) {
      case 'blood_pressure':
        const systolic = Number(results.systolic)
        const diastolic = Number(results.diastolic)
        return systolic > 180 || diastolic > 120 || systolic < 90
        
      case 'blood_glucose':
        const glucose = Number(results.value)
        return glucose > 400 || glucose < 50
        
      // Add more critical value checks...
    }
    
    return false
  }
  
  static isSensitiveTest(testCode: string): boolean {
    return this.SENSITIVE_TESTS.includes(testCode.toLowerCase())
  }
  
  // ✅ ADD MORE VALIDATION METHODS AS NEEDED
  
  private static validateCholesterol(results: any, warnings: string[]): boolean {
    const total = Number(results.total)
    const ldl = Number(results.ldl)
    const hdl = Number(results.hdl)
    
    if (isNaN(total) || isNaN(ldl) || isNaN(hdl)) {
      warnings.push('Invalid cholesterol values')
      return false
    }
    
    const ranges = this.TEST_NORMAL_RANGES.cholesterol
    const isNormal = total >= ranges.total.min && total <= ranges.total.max &&
                     ldl >= ranges.ldl.min && ldl <= ranges.ldl.max &&
                     hdl >= ranges.hdl.min
    
    if (!isNormal) {
      warnings.push(`Cholesterol abnormal: Total=${total}, LDL=${ldl}, HDL=${hdl}`)
    }
    
    return isNormal
  }
  
  private static validateUrinalysis(results: any, warnings: string[]): boolean {
    // Basic validation for urinalysis
    const glucose = results.glucose
    const protein = results.protein
    const ph = Number(results.ph)
    
    if (ph && (isNaN(ph) || ph < 4.5 || ph > 8.0)) {
      warnings.push(`Urine pH abnormal: ${ph}`)
      return false
    }
    
    // Glucose and protein should typically be negative/trace
    const hasAbnormalGlucose = glucose && glucose !== 'negative' && glucose !== 'trace'
    const hasAbnormalProtein = protein && protein !== 'negative' && protein !== 'trace'
    
    if (hasAbnormalGlucose || hasAbnormalProtein) {
      if (hasAbnormalGlucose) warnings.push(`Urine glucose abnormal: ${glucose}`)
      if (hasAbnormalProtein) warnings.push(`Urine protein abnormal: ${protein}`)
      return false
    }
    
    return true
  }
}