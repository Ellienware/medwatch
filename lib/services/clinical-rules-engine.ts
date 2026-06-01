// lib/services/clinical-rules-engine.ts
/**
 * Clinical Rules Engine for Occupational Health Assessments
 * 
 * This service evaluates test results against occupational health standards
 * and suggests fitness decisions with reasoning.
 * 
 * Standards referenced:
 * - South African Occupational Health Guidelines
 * - SANS (South African National Standards) for workplace medicals
 * - DMR (Department of Mineral Resources) guidelines for mining
 */

import type {
  TestResult,
  FitnessDecision,
  RulesEngineResult,
  RulesEngineSummary,
} from "@/lib/types/database"

// Test-specific thresholds and rules
interface TestRule {
  testCode: string
  testName: string
  evaluate: (results: Record<string, any>) => RulesEngineResult
}

// Status type for clarity
type TestStatus = "normal" | "abnormal" | "critical"

/**
 * Enhanced Status Builder Pattern for managing test status transitions
 * Priority: critical > abnormal > normal
 */
interface StatusBuilder {
  current: TestStatus
  set(newStatus: TestStatus): StatusBuilder
  setIf(condition: boolean, newStatus: TestStatus): StatusBuilder
  setAbnormalIfNotCritical(): StatusBuilder
  setNormalIfNotAtLeast(status: TestStatus): StatusBuilder
  is(status: TestStatus): boolean
  isAtLeast(status: TestStatus): boolean
  isAtMost(status: TestStatus): boolean
  reset(): StatusBuilder
  getPriority(): number
}

function createStatus(initial: TestStatus = "normal"): StatusBuilder {
  let status: TestStatus = initial
  
  const priority = { "critical": 3, "abnormal": 2, "normal": 1 }
  
  const builder: StatusBuilder = {
    get current(): TestStatus {
      return status
    },
    
    set(newStatus: TestStatus): StatusBuilder {
      if (priority[newStatus] > priority[status]) {
        status = newStatus
      }
      return builder
    },
    
    setIf(condition: boolean, newStatus: TestStatus): StatusBuilder {
      if (condition) {
        builder.set(newStatus)
      }
      return builder
    },
    
    setAbnormalIfNotCritical(): StatusBuilder {
      if (status !== "critical") {
        status = "abnormal"
      }
      return builder
    },
    
    setNormalIfNotAtLeast(minStatus: TestStatus): StatusBuilder {
      if (priority[status] < priority[minStatus]) {
        status = "normal"
      }
      return builder
    },
    
    is(statusToCheck: TestStatus): boolean {
      return status === statusToCheck
    },
    
    isAtLeast(minStatus: TestStatus): boolean {
      return priority[status] >= priority[minStatus]
    },
    
    isAtMost(maxStatus: TestStatus): boolean {
      return priority[status] <= priority[maxStatus]
    },
    
    reset(): StatusBuilder {
      status = "normal"
      return builder
    },
    
    getPriority(): number {
      return priority[status]
    }
  }
  
  return builder
}

// Helper function to create consistent RulesEngineResult
function createRulesEngineResult(
  testCode: string,
  testName: string,
  status: StatusBuilder,
  suggestedDecision: FitnessDecision,
  findings: string[],
  defaultReferralType: string = "General Practitioner",
  confidenceNormal: number = 90,
  confidenceAbnormal: number = 80
): RulesEngineResult {
  return {
    testCode,
    testName,
    status: status.current,
    suggestedDecision,
    reasoning: findings.length > 0
      ? `${testName} findings: ${findings.join("; ")}`
      : `${testName} within normal limits`,
    referralSuggested: status.isAtLeast("abnormal"),
    referralType: status.isAtLeast("abnormal") ? defaultReferralType : undefined,
    confidence: status.is("normal") ? confidenceNormal : confidenceAbnormal,
  }
}

// Reference ranges for common occupational health tests
const REFERENCE_RANGES = {
  // Spirometry / Lung Function
  spirometry: {
    fvc_percent: { normal: 80, mild: 70, moderate: 60, severe: 50 },
    fev1_percent: { normal: 80, mild: 70, moderate: 60, severe: 50 },
    fev1_fvc_ratio: { normal: 70, mild: 65, moderate: 60, severe: 55 },
    pef: { normal: 80, mild: 70, moderate: 60, severe: 50 },
  },
  
  // Audiometry (hearing loss in dB)
  audiometry: {
    // PLH (Percentage Loss of Hearing) thresholds
    plh: { normal: 0, mild: 10, moderate: 20, severe: 30 },
    // Individual frequency thresholds
    frequency: { normal: 25, mild: 40, moderate: 55, severe: 70 },
  },
  
  // Vision
  vision: {
    snellen: {
      // 6/6 = 1.0, 6/9 = 0.67, 6/12 = 0.5, 6/18 = 0.33, 6/36 = 0.17
      normal: "6/9",
      mild: "6/12",
      moderate: "6/18",
      severe: "6/36",
    },
  },
  
  // Urinalysis
  urinalysis: {
    glucose: { normal: "negative", abnormal: "positive" },
    protein: { normal: "negative", abnormal: "positive" },
    blood: { normal: "negative", abnormal: "positive" },
    hgt: { low: 4.0, high: 7.8, critical_low: 3.5, critical_high: 11.1 },
  },
  
  // Blood Pressure
  blood_pressure: {
    systolic: { normal: 120, elevated: 130, high: 140, crisis: 180 },
    diastolic: { normal: 80, elevated: 85, high: 90, crisis: 120 },
  },
  
  // BMI
  bmi: {
    underweight: 18.5,
    normal_low: 18.5,
    normal_high: 24.9,
    overweight: 30,
    obese: 35,
  },
  
  // Blood Glucose (Fasting)
  blood_glucose: {
    fasting: { normal: 5.6, prediabetic: 6.9, diabetic: 7.0 },
    random: { normal: 7.8, elevated: 11.0, critical: 16.7 },
    hba1c: { normal: 5.7, prediabetic: 6.4, diabetic: 6.5 },
  },
  
  // Cholesterol Panel (mmol/L)
  cholesterol: {
    total: { optimal: 5.2, borderline: 6.2, high: 6.2 },
    ldl: { optimal: 2.6, near_optimal: 3.4, borderline: 4.1, high: 4.9, very_high: 4.9 },
    hdl: { low_risk_male: 1.0, low_risk_female: 1.3, high_risk: 0.9 },
    triglycerides: { normal: 1.7, borderline: 2.3, high: 5.6, very_high: 5.6 },
  },
  
  // Complete Blood Count (CBC)
  cbc: {
    hemoglobin: { 
      male: { low: 13.5, high: 17.5 }, 
      female: { low: 12.0, high: 15.5 } 
    },
    hematocrit: { 
      male: { low: 38.8, high: 50.0 }, 
      female: { low: 34.9, high: 44.5 } 
    },
    wbc: { low: 4.5, high: 11.0 },
    platelets: { low: 150, high: 400 },
    rbc: { 
      male: { low: 4.5, high: 5.9 }, 
      female: { low: 4.0, high: 5.2 } 
    },
  },
  
  // Liver Function Tests (LFT)
  liver_function: {
    alt: { normal: 40, elevated: 80, high: 120 },
    ast: { normal: 40, elevated: 80, high: 120 },
    alp: { low: 44, high: 147 },
    ggt: { male: 60, female: 40 },
    bilirubin: { total: 21, direct: 5.1 },
    albumin: { low: 35, high: 50 },
  },
  
  // Kidney Function Tests
  kidney_function: {
    creatinine: { 
      male: { low: 62, high: 106 }, 
      female: { low: 44, high: 80 } 
    },
    urea: { low: 2.5, high: 7.1 },
    egfr: { normal: 90, mild_decrease: 60, moderate_decrease: 30, severe_decrease: 15 },
    uric_acid: { 
      male: { low: 210, high: 420 }, 
      female: { low: 150, high: 360 } 
    },
  },
  
  // Drug Screen thresholds (ng/mL cutoffs)
  drug_screen: {
    cannabis: 50,
    cocaine: 300,
    amphetamines: 1000,
    opiates: 2000,
    benzodiazepines: 300,
    methamphetamine: 1000,
    pcp: 25,
    barbiturates: 300,
    methadone: 300,
  },
}

/**
 * Evaluates spirometry test results
 */
function evaluateSpirometry(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.spirometry
  
  const fvc = parseFloat(results.fvc_percent || results.fvc || "0")
  const fev1 = parseFloat(results.fev1_percent || results.fev1 || "0")
  const ratio = parseFloat(results.fev1_fvc_ratio || results.ratio || "0")
  
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  const findings: string[] = []
  
  // Evaluate FVC
  if (fvc < thresholds.fvc_percent.severe) {
    status.set("critical")
    findings.push(`FVC severely reduced at ${fvc}%`)
  } else if (fvc < thresholds.fvc_percent.moderate) {
    status.set("abnormal")
    findings.push(`FVC moderately reduced at ${fvc}%`)
  } else if (fvc < thresholds.fvc_percent.mild) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`FVC mildly reduced at ${fvc}%`)
  }
  
  // Evaluate FEV1
  if (fev1 < thresholds.fev1_percent.severe) {
    status.set("critical")
    findings.push(`FEV1 severely reduced at ${fev1}%`)
  } else if (fev1 < thresholds.fev1_percent.moderate) {
    status.setAbnormalIfNotCritical()
    findings.push(`FEV1 moderately reduced at ${fev1}%`)
  } else if (fev1 < thresholds.fev1_percent.mild) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`FEV1 mildly reduced at ${fev1}%`)
  }
  
  // Evaluate ratio (for obstructive patterns)
  if (ratio < thresholds.fev1_fvc_ratio.severe) {
    status.set("critical")
    findings.push(`FEV1/FVC ratio indicates severe obstruction at ${ratio}%`)
  } else if (ratio < thresholds.fev1_fvc_ratio.normal) {
    status.setAbnormalIfNotCritical()
    findings.push(`FEV1/FVC ratio indicates possible obstruction at ${ratio}%`)
  }
  
  // Determine fitness decision
  if (status.is("critical")) {
    suggestedDecision = "temporarily_unfit"
  } else if (status.is("abnormal")) {
    suggestedDecision = "fit_with_restrictions"
  }
  
  return createRulesEngineResult(
    "spirometry",
    "Spirometry / Lung Function",
    status,
    suggestedDecision,
    findings,
    "Pulmonologist",
    95,
    85
  )
}

/**
 * Evaluates audiometry test results
 */
function evaluateAudiometry(results: Record<string, any>): RulesEngineResult {
  const frequencyThreshold = REFERENCE_RANGES.audiometry.frequency
  
  // Parse results for both ears
  const leftEar = results.left_ear || results.left || {}
  const rightEar = results.right_ear || results.right || {}
  
  const frequencies = ["500HZ", "1000HZ", "2000HZ", "3000HZ", "4000HZ", "6000HZ", "8000HZ"]
  
  let maxLeftLoss = 0
  let maxRightLoss = 0
  const findings: string[] = []
  
  // Calculate maximum hearing loss for each ear
  for (const freq of frequencies) {
    const leftVal = parseFloat(leftEar[freq] || "0")
    const rightVal = parseFloat(rightEar[freq] || "0")
    
    if (leftVal > maxLeftLoss) maxLeftLoss = leftVal
    if (rightVal > maxRightLoss) maxRightLoss = rightVal
  }
  
  // Calculate PLH (Percentage Loss of Hearing) - simplified calculation
  // Using average of speech frequencies (500, 1000, 2000 Hz)
  const speechFreqs = ["500HZ", "1000HZ", "2000HZ"]
  let leftAvg = 0
  let rightAvg = 0
  
  for (const freq of speechFreqs) {
    leftAvg += parseFloat(leftEar[freq] || "0")
    rightAvg += parseFloat(rightEar[freq] || "0")
  }
  leftAvg /= 3
  rightAvg /= 3
  
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  // Evaluate hearing loss severity
  if (maxLeftLoss >= frequencyThreshold.severe || maxRightLoss >= frequencyThreshold.severe) {
    status.set("critical")
    findings.push(`Severe hearing loss detected (Left: ${maxLeftLoss}dB, Right: ${maxRightLoss}dB at worst frequency)`)
    suggestedDecision = "fit_with_restrictions"
  } else if (maxLeftLoss >= frequencyThreshold.moderate || maxRightLoss >= frequencyThreshold.moderate) {
    status.set("abnormal")
    findings.push(`Moderate hearing loss detected (Left: ${maxLeftLoss}dB, Right: ${maxRightLoss}dB at worst frequency)`)
    suggestedDecision = "fit_with_conditions"
  } else if (maxLeftLoss >= frequencyThreshold.mild || maxRightLoss >= frequencyThreshold.mild) {
    status.set("abnormal")
    findings.push(`Mild hearing loss detected (Left: ${maxLeftLoss}dB, Right: ${maxRightLoss}dB at worst frequency)`)
  }
  
  // Check for noise-induced hearing loss pattern (4000Hz notch)
  const left4k = parseFloat(leftEar["4000HZ"] || "0")
  const right4k = parseFloat(rightEar["4000HZ"] || "0")
  
  if (left4k > 40 || right4k > 40) {
    findings.push("Possible noise-induced hearing loss pattern detected at 4000Hz")
  }
  
  return createRulesEngineResult(
    "audiometry",
    "Audiometry",
    status,
    suggestedDecision,
    findings,
    "Audiologist",
    95,
    80
  )
}

/**
 * Evaluates vision test results
 */
function evaluateVision(results: Record<string, any>): RulesEngineResult {
  const leftAcuity = results.left_acuity || results.left || ""
  const rightAcuity = results.right_acuity || results.right || ""
  const colorVision = results.color_vision || ""
  
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  // Parse Snellen notation (e.g., "6/6", "6/12")
  function parseSnellen(snellen: string): number {
    if (!snellen) return 0
    const parts = snellen.split("/")
    if (parts.length !== 2) return 0
    return parseFloat(parts[0]) / parseFloat(parts[1])
  }
  
  const leftScore = parseSnellen(leftAcuity)
  const rightScore = parseSnellen(rightAcuity)
  
  // Minimum driving standard is typically 6/12 in better eye
  const betterEye = Math.max(leftScore, rightScore)
  const worseEye = Math.min(leftScore, rightScore)
  
  if (betterEye < 0.33) { // Worse than 6/18
    status.set("critical")
    findings.push(`Visual acuity significantly reduced: Left ${leftAcuity}, Right ${rightAcuity}`)
    suggestedDecision = "temporarily_unfit"
  } else if (betterEye < 0.5) { // Worse than 6/12
    status.set("abnormal")
    findings.push(`Visual acuity reduced: Left ${leftAcuity}, Right ${rightAcuity}`)
    suggestedDecision = "fit_with_restrictions"
  } else if (worseEye < 0.5) {
    status.set("abnormal")
    findings.push(`Monocular vision concern: Left ${leftAcuity}, Right ${rightAcuity}`)
    suggestedDecision = "fit_with_conditions"
  }
  
  // Color vision assessment
  const colorNormal = colorVision.toLowerCase().includes("normal") || 
                       colorVision.toLowerCase().includes("pass")
  if (colorVision && !colorNormal) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`Color vision deficiency detected: ${colorVision}`)
    if (suggestedDecision === "fit") {
      suggestedDecision = "fit_with_conditions"
    }
  }
  
  return createRulesEngineResult(
    "vision",
    "Vision Screening",
    status,
    suggestedDecision,
    findings,
    "Optometrist",
    90,
    85
  )
}

/**
 * Evaluates urinalysis test results
 */
function evaluateUrinalysis(results: Record<string, any>): RulesEngineResult {
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const thresholds = REFERENCE_RANGES.urinalysis
  
  // Check for abnormal findings
  const glucose = (results.glucose || "").toLowerCase()
  const protein = (results.protein || "").toLowerCase()
  const blood = (results.blood || "").toLowerCase()
  const hgt = parseFloat(results.hgt_mmol || results.hgt || "0")
  
  // Glucose
  const hasGlucose = glucose && glucose !== "negative" && glucose !== "nil" && glucose !== "-"
  status.setIf(hasGlucose, "abnormal")
  if (hasGlucose) {
    findings.push(`Glucose detected in urine: ${glucose}`)
  }
  
  // Protein
  const hasProtein = protein && protein !== "negative" && protein !== "nil" && protein !== "-"
  status.setIf(hasProtein, "abnormal")
  if (hasProtein) {
    findings.push(`Protein detected in urine: ${protein}`)
  }
  
  // Blood
  const hasBlood = blood && blood !== "negative" && blood !== "nil" && blood !== "-"
  status.setIf(hasBlood, "abnormal")
  if (hasBlood) {
    findings.push(`Blood detected in urine: ${blood}`)
  }
  
  // HGT (if included)
  if (hgt > 0) {
    if (hgt > thresholds.hgt.critical_high || hgt < thresholds.hgt.critical_low) {
      status.set("critical")
      findings.push(`HGT critically abnormal: ${hgt} mmol/L`)
      suggestedDecision = "temporarily_unfit"
    } else if (hgt > thresholds.hgt.high || hgt < thresholds.hgt.low) {
      status.setAbnormalIfNotCritical()
      findings.push(`HGT outside normal range: ${hgt} mmol/L`)
    }
  }
  
  // Determine fitness based on findings
  if (findings.length > 0 && status.is("abnormal") && suggestedDecision === "fit") {
    suggestedDecision = "fit_with_conditions"
  }
  
  return createRulesEngineResult(
    "urinalysis",
    "Urinalysis",
    status,
    suggestedDecision,
    findings,
    "Pulmonologist",
    90,
    75
  )
}

/**
 * Evaluates blood pressure results
 */
function evaluateBloodPressure(results: Record<string, any>): RulesEngineResult {
  const systolic = parseFloat(results.systolic || results.bp_systolic || "0")
  const diastolic = parseFloat(results.diastolic || results.bp_diastolic || "0")
  
  if (systolic === 0 || diastolic === 0) {
    return {
      testCode: "blood_pressure",
      testName: "Blood Pressure",
      status: "normal",
      suggestedDecision: "fit",
      reasoning: "Blood pressure results not available for evaluation",
      referralSuggested: false,
      confidence: 50,
    }
  }
  
  const thresholds = REFERENCE_RANGES.blood_pressure
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  // Check for hypertensive crisis
  if (systolic >= thresholds.systolic.crisis || diastolic >= thresholds.diastolic.crisis) {
    status.set("critical")
    findings.push(`Hypertensive crisis: ${systolic}/${diastolic} mmHg`)
    suggestedDecision = "temporarily_unfit"
  } else if (systolic >= thresholds.systolic.high || diastolic >= thresholds.diastolic.high) {
    status.set("abnormal")
    findings.push(`Hypertension Stage 2: ${systolic}/${diastolic} mmHg`)
    suggestedDecision = "fit_with_conditions"
  } else if (systolic >= thresholds.systolic.elevated || diastolic >= thresholds.diastolic.elevated) {
    status.set("abnormal")
    findings.push(`Elevated blood pressure: ${systolic}/${diastolic} mmHg`)
  }
  
  return createRulesEngineResult(
    "blood_pressure",
    "Blood Pressure",
    status,
    suggestedDecision,
    findings,
    "General Practitioner",
    95,
    85
  )
}

/**
 * Evaluates chest X-ray results
 */
function evaluateChestXray(results: Record<string, any>): RulesEngineResult {
  const normal = results.normal === true || 
                 results.normal === "true" || 
                 (typeof results.normal === "string" && results.normal.toLowerCase() === "normal")
  
  const findingsText = results.findings || results.notes || ""
  
  const status = createStatus(normal ? "normal" : "abnormal")
  let suggestedDecision: FitnessDecision = normal ? "fit" : "fit_with_conditions"
  
  // Check for critical findings
  const criticalKeywords = ["mass", "tumor", "carcinoma", "pneumothorax", "effusion", "collapse"]
  const findingsLower = findingsText.toLowerCase()
  
  for (const keyword of criticalKeywords) {
    if (findingsLower.includes(keyword)) {
      status.set("critical")
      suggestedDecision = "temporarily_unfit"
      break
    }
  }
  
  const reasoning = normal
    ? "Chest X-ray shows no abnormalities"
    : `Chest X-ray findings: ${findingsText || "Abnormality detected - review required"}`
  
  return {
    testCode: "chest_xray",
    testName: "Chest X-Ray",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: status.isAtLeast("abnormal"),
    referralType: status.isAtLeast("abnormal") ? "Pulmonologist" : undefined,
    confidence: status.is("normal") ? 90 : 70,
  }
}

/**
 * Evaluates ECG results
 */
function evaluateECG(results: Record<string, any>): RulesEngineResult {
  const normal = results.normal === true || 
                 results.normal === "true" || 
                 results.interpretation?.toLowerCase().includes("normal")
  
  const interpretation = results.interpretation || results.findings || ""
  
  const status = createStatus(normal ? "normal" : "abnormal")
  let suggestedDecision: FitnessDecision = normal ? "fit" : "fit_with_conditions"
  
  // Check for critical findings
  const criticalKeywords = ["infarction", "ischemia", "arrhythmia", "block", "fibrillation"]
  const interpLower = interpretation.toLowerCase()
  
  for (const keyword of criticalKeywords) {
    if (interpLower.includes(keyword)) {
      status.set("critical")
      suggestedDecision = "temporarily_unfit"
      break
    }
  }
  
  const reasoning = normal
    ? "ECG shows normal sinus rhythm"
    : `ECG findings: ${interpretation || "Abnormality detected - cardiology review required"}`
  
  return {
    testCode: "ecg",
    testName: "ECG / EKG",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: status.isAtLeast("abnormal"),
    referralType: status.isAtLeast("abnormal") ? "Cardiologist" : undefined,
    confidence: status.is("normal") ? 85 : 70,
  }
}

/**
 * Evaluates Drug Screen results
 * Critical for occupational health - positive results typically mean unfit for safety-sensitive work
 */
function evaluateDrugScreen(results: Record<string, any>): RulesEngineResult {
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const drugTypes = [
    { key: "cannabis", name: "Cannabis/THC" },
    { key: "cocaine", name: "Cocaine" },
    { key: "amphetamines", name: "Amphetamines" },
    { key: "opiates", name: "Opiates" },
    { key: "benzodiazepines", name: "Benzodiazepines" },
    { key: "methamphetamine", name: "Methamphetamine" },
    { key: "pcp", name: "PCP" },
    { key: "barbiturates", name: "Barbiturates" },
    { key: "methadone", name: "Methadone" },
  ]
  
  for (const drug of drugTypes) {
    const result = results[drug.key]
    // Check for positive result (can be boolean, string, or value above cutoff)
    const isPositive = 
      result === true || 
      result === "positive" || 
      result === "detected" ||
      (typeof result === "number" && result > (REFERENCE_RANGES.drug_screen[drug.key as keyof typeof REFERENCE_RANGES.drug_screen] || 0))
    
    if (isPositive) {
      status.set("critical")
      findings.push(`${drug.name}: Positive`)
    }
  }
  
  // Any positive drug result is critical for safety-sensitive work
  if (status.is("critical")) {
    suggestedDecision = "temporarily_unfit"
  }
  
  const reasoning = findings.length > 0
    ? `Drug screen findings: ${findings.join("; ")}. Positive drug test requires immediate action per occupational health guidelines.`
    : "Drug screen negative for all tested substances"
  
  return {
    testCode: "drug_screen",
    testName: "Drug Screening Panel",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: status.is("critical"),
    referralType: status.is("critical") ? "Occupational Health Physician" : undefined,
    confidence: 95,
  }
}

/**
 * Evaluates Blood Glucose results
 */
function evaluateBloodGlucose(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.blood_glucose
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const fasting = parseFloat(results.fasting || results.fasting_glucose || "0")
  const random = parseFloat(results.random || results.random_glucose || "0")
  const hba1c = parseFloat(results.hba1c || results.glycated_hemoglobin || "0")
  
  // Evaluate fasting glucose
  if (fasting > 0) {
    if (fasting >= thresholds.fasting.diabetic) {
      status.set("abnormal")
      findings.push(`Fasting glucose ${fasting} mmol/L indicates diabetes`)
      suggestedDecision = "fit_with_conditions"
    } else if (fasting >= thresholds.fasting.prediabetic) {
      status.set("abnormal")
      findings.push(`Fasting glucose ${fasting} mmol/L indicates prediabetes`)
    }
  }
  
  // Evaluate random glucose
  if (random > 0) {
    if (random >= thresholds.random.critical) {
      status.set("critical")
      findings.push(`Random glucose ${random} mmol/L is critically elevated`)
      suggestedDecision = "temporarily_unfit"
    } else if (random >= thresholds.random.elevated) {
      status.setAbnormalIfNotCritical()
      findings.push(`Random glucose ${random} mmol/L is elevated`)
      if (suggestedDecision === "fit") suggestedDecision = "fit_with_conditions"
    }
  }
  
  // Evaluate HbA1c
  if (hba1c > 0) {
    if (hba1c >= thresholds.hba1c.diabetic) {
      status.set("abnormal")
      findings.push(`HbA1c ${hba1c}% indicates diabetes`)
      if (suggestedDecision === "fit") suggestedDecision = "fit_with_conditions"
    } else if (hba1c >= thresholds.hba1c.prediabetic) {
      status.set("abnormal")
      findings.push(`HbA1c ${hba1c}% indicates prediabetes`)
    }
  }
  
  return createRulesEngineResult(
    "blood_glucose",
    "Blood Glucose",
    status,
    suggestedDecision,
    findings,
    "General Practitioner",
    90,
    85
  )
}

/**
 * Evaluates Cholesterol Panel results
 */
function evaluateCholesterol(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.cholesterol
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const total = parseFloat(results.total || results.total_cholesterol || "0")
  const ldl = parseFloat(results.ldl || results.ldl_cholesterol || "0")
  const hdl = parseFloat(results.hdl || results.hdl_cholesterol || "0")
  const triglycerides = parseFloat(results.triglycerides || results.trig || "0")
  
  // Evaluate total cholesterol
  if (total > 0 && total >= thresholds.total.high) {
    status.set("abnormal")
    findings.push(`Total cholesterol ${total} mmol/L is high`)
  } else if (total > 0 && total >= thresholds.total.borderline) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`Total cholesterol ${total} mmol/L is borderline high`)
  }
  
  // Evaluate LDL
  if (ldl > 0 && ldl >= thresholds.ldl.very_high) {
    status.set("abnormal")
    findings.push(`LDL cholesterol ${ldl} mmol/L is very high`)
    suggestedDecision = "fit_with_conditions"
  } else if (ldl > 0 && ldl >= thresholds.ldl.high) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`LDL cholesterol ${ldl} mmol/L is high`)
  }
  
  // Evaluate HDL (low is bad)
  if (hdl > 0 && hdl < thresholds.hdl.high_risk) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`HDL cholesterol ${hdl} mmol/L is low (cardiovascular risk)`)
  }
  
  // Evaluate triglycerides
  if (triglycerides > 0 && triglycerides >= thresholds.triglycerides.very_high) {
    status.set("critical")
    findings.push(`Triglycerides ${triglycerides} mmol/L are very high (pancreatitis risk)`)
    suggestedDecision = "fit_with_conditions"
  } else if (triglycerides > 0 && triglycerides >= thresholds.triglycerides.high) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`Triglycerides ${triglycerides} mmol/L are high`)
  }
  
  return createRulesEngineResult(
    "cholesterol",
    "Cholesterol/Lipid Panel",
    status,
    suggestedDecision,
    findings,
    "General Practitioner",
    90,
    80
  )
}

/**
 * Evaluates Complete Blood Count (CBC) results
 */
function evaluateCBC(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.cbc
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  // Determine gender for gender-specific ranges
  const gender = (results.gender || results.sex || "male").toLowerCase()
  const isMale = gender === "male" || gender === "m"
  
  const hemoglobin = parseFloat(results.hemoglobin || results.hb || results.hgb || "0")
  const wbc = parseFloat(results.wbc || results.white_blood_cells || "0")
  const platelets = parseFloat(results.platelets || results.plt || "0")
  const rbc = parseFloat(results.rbc || results.red_blood_cells || "0")
  
  // Evaluate hemoglobin
  if (hemoglobin > 0) {
    const hbRange = isMale ? thresholds.hemoglobin.male : thresholds.hemoglobin.female
    if (hemoglobin < hbRange.low - 2) {
      status.set("critical")
      findings.push(`Hemoglobin ${hemoglobin} g/dL is critically low (severe anemia)`)
      suggestedDecision = "temporarily_unfit"
    } else if (hemoglobin < hbRange.low) {
      status.set("abnormal")
      findings.push(`Hemoglobin ${hemoglobin} g/dL is low (anemia)`)
      suggestedDecision = "fit_with_conditions"
    } else if (hemoglobin > hbRange.high) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`Hemoglobin ${hemoglobin} g/dL is elevated`)
    }
  }
  
  // Evaluate WBC
  if (wbc > 0) {
    if (wbc < thresholds.wbc.low - 1) {
      status.setAbnormalIfNotCritical()
      findings.push(`WBC ${wbc} x10^9/L is low (leukopenia)`)
    } else if (wbc < thresholds.wbc.low) {
      findings.push(`WBC ${wbc} x10^9/L is borderline low`)
    } else if (wbc > thresholds.wbc.high + 5) {
      status.setAbnormalIfNotCritical()
      findings.push(`WBC ${wbc} x10^9/L is significantly elevated`)
    } else if (wbc > thresholds.wbc.high) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`WBC ${wbc} x10^9/L is elevated`)
    }
  }
  
  // Evaluate platelets
  if (platelets > 0) {
    if (platelets < thresholds.platelets.low - 50) {
      status.set("critical")
      findings.push(`Platelets ${platelets} x10^9/L are critically low (bleeding risk)`)
      suggestedDecision = "temporarily_unfit"
    } else if (platelets < thresholds.platelets.low) {
      status.setAbnormalIfNotCritical()
      findings.push(`Platelets ${platelets} x10^9/L are low (thrombocytopenia)`)
    } else if (platelets > thresholds.platelets.high) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`Platelets ${platelets} x10^9/L are elevated`)
    }
  }
  
  return createRulesEngineResult(
    "cbc",
    "Complete Blood Count",
    status,
    suggestedDecision,
    findings,
    "General Practitioner",
    90,
    85
  )
}

/**
 * Evaluates Liver Function Test (LFT) results
 */
function evaluateLiverFunction(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.liver_function
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const alt = parseFloat(results.alt || results.sgpt || "0")
  const ast = parseFloat(results.ast || results.sgot || "0")
  const alp = parseFloat(results.alp || results.alkaline_phosphatase || "0")
  const ggt = parseFloat(results.ggt || results.gamma_gt || "0")
  const bilirubin = parseFloat(results.bilirubin || results.total_bilirubin || "0")
  
  // Evaluate ALT
  if (alt > 0) {
    if (alt > thresholds.alt.high) {
      status.set("critical")
      findings.push(`ALT ${alt} U/L is significantly elevated (liver damage)`)
      suggestedDecision = "fit_with_conditions"
    } else if (alt > thresholds.alt.elevated) {
      status.set("abnormal")
      findings.push(`ALT ${alt} U/L is elevated`)
    } else if (alt > thresholds.alt.normal) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`ALT ${alt} U/L is mildly elevated`)
    }
  }
  
  // Evaluate AST
  if (ast > 0) {
    if (ast > thresholds.ast.high) {
      status.setAbnormalIfNotCritical()
      findings.push(`AST ${ast} U/L is significantly elevated`)
    } else if (ast > thresholds.ast.normal) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`AST ${ast} U/L is elevated`)
    }
  }
  
  // Evaluate GGT (often elevated with alcohol use)
  if (ggt > 0 && ggt > thresholds.ggt.male) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`GGT ${ggt} U/L is elevated (may indicate alcohol use or liver disease)`)
  }
  
  // Evaluate Bilirubin
  if (bilirubin > 0 && bilirubin > thresholds.bilirubin.total) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`Bilirubin ${bilirubin} umol/L is elevated (jaundice risk)`)
  }
  
  return createRulesEngineResult(
    "liver_function",
    "Liver Function Tests",
    status,
    suggestedDecision,
    findings,
    "General Practitioner",
    90,
    80
  )
}

/**
 * Evaluates Kidney Function Test results
 */
function evaluateKidneyFunction(results: Record<string, any>): RulesEngineResult {
  const thresholds = REFERENCE_RANGES.kidney_function
  const findings: string[] = []
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  const gender = (results.gender || results.sex || "male").toLowerCase()
  const isMale = gender === "male" || gender === "m"
  
  const creatinine = parseFloat(results.creatinine || results.serum_creatinine || "0")
  const urea = parseFloat(results.urea || results.blood_urea || "0")
  const egfr = parseFloat(results.egfr || results.gfr || "0")
  
  // Evaluate creatinine
  if (creatinine > 0) {
    const creatRange = isMale ? thresholds.creatinine.male : thresholds.creatinine.female
    if (creatinine > creatRange.high * 2) {
      status.set("critical")
      findings.push(`Creatinine ${creatinine} umol/L is critically elevated (kidney failure)`)
      suggestedDecision = "temporarily_unfit"
    } else if (creatinine > creatRange.high) {
      status.set("abnormal")
      findings.push(`Creatinine ${creatinine} umol/L is elevated (kidney dysfunction)`)
      suggestedDecision = "fit_with_conditions"
    }
  }
  
  // Evaluate eGFR (estimated Glomerular Filtration Rate)
  if (egfr > 0) {
    if (egfr < thresholds.egfr.severe_decrease) {
      status.set("critical")
      findings.push(`eGFR ${egfr} mL/min indicates severe kidney disease (Stage 4-5)`)
      suggestedDecision = "temporarily_unfit"
    } else if (egfr < thresholds.egfr.moderate_decrease) {
      status.setAbnormalIfNotCritical()
      findings.push(`eGFR ${egfr} mL/min indicates moderate kidney disease (Stage 3)`)
      if (suggestedDecision === "fit") suggestedDecision = "fit_with_conditions"
    } else if (egfr < thresholds.egfr.mild_decrease) {
      status.setIf(status.is("normal"), "abnormal")
      findings.push(`eGFR ${egfr} mL/min indicates mild kidney function decrease`)
    }
  }
  
  // Evaluate urea
  if (urea > 0 && urea > thresholds.urea.high) {
    status.setIf(status.is("normal"), "abnormal")
    findings.push(`Urea ${urea} mmol/L is elevated`)
  }
  
  return createRulesEngineResult(
    "kidney_function",
    "Kidney Function Tests",
    status,
    suggestedDecision,
    findings,
    "Nephrologist",
    90,
    85
  )
}

/**
 * Evaluates HIV test results
 */
function evaluateHIV(results: Record<string, any>): RulesEngineResult {
  // HIV status - check various result formats
  const isPositive = 
    results.positive === true ||
    results.result === "positive" ||
    results.result === "reactive" ||
    results.reactive === true ||
    results.hiv_positive === true
  
  const isNegative = 
    results.negative === true ||
    results.result === "negative" ||
    results.result === "non-reactive" ||
    results.non_reactive === true
  
  const status = createStatus(isNegative ? "normal" : "abnormal")
  let suggestedDecision: FitnessDecision = "fit" // HIV+ individuals can be fit for work
  
  let reasoning = ""
  if (isPositive) {
    reasoning = "HIV test reactive. Note: HIV status alone does not affect fitness determination per employment guidelines. " +
                "Fitness depends on overall health status and ability to perform job functions safely."
  } else if (isNegative) {
    reasoning = "HIV test non-reactive"
  } else {
    reasoning = "HIV test result inconclusive or pending confirmation"
    status.set("abnormal")
  }
  
  return {
    testCode: "hiv",
    testName: "HIV Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "General Practitioner" : undefined,
    confidence: 95,
  }
}

/**
 * Evaluates Hepatitis B test results
 */
function evaluateHepatitisB(results: Record<string, any>): RulesEngineResult {
  const hbsag = results.hbsag || results.surface_antigen
  const antiHbs = results.anti_hbs || results.surface_antibody
  const antiHbc = results.anti_hbc || results.core_antibody
  
  const isPositive = 
    hbsag === "positive" || 
    hbsag === "reactive" || 
    hbsag === true
  
  const isImmune = 
    antiHbs === "positive" || 
    antiHbs === "reactive" ||
    (typeof antiHbs === "number" && antiHbs >= 10)
  
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  let reasoning = ""
  
  if (isPositive) {
    status.set("abnormal")
    reasoning = "Hepatitis B surface antigen positive - indicates active or chronic HBV infection. " +
                "Consider liver function assessment and specialist referral."
    suggestedDecision = "fit_with_conditions"
  } else if (isImmune) {
    reasoning = "Hepatitis B antibody positive - indicates immunity (vaccination or past infection)"
  } else {
    reasoning = "Hepatitis B screening negative - no evidence of infection. Consider vaccination if not immune."
  }
  
  return {
    testCode: "hepatitis_b",
    testName: "Hepatitis B Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "Hepatologist" : undefined,
    confidence: 90,
  }
}

/**
 * Evaluates Hepatitis C test results
 */
function evaluateHepatitisC(results: Record<string, any>): RulesEngineResult {
  const antiHcv = results.anti_hcv || results.hcv_antibody || results.result
  const hcvRna = results.hcv_rna || results.viral_load
  
  const isPositive = 
    antiHcv === "positive" || 
    antiHcv === "reactive" || 
    antiHcv === true ||
    (typeof hcvRna === "number" && hcvRna > 0)
  
  const status = createStatus(isPositive ? "abnormal" : "normal")
  let suggestedDecision: FitnessDecision = isPositive ? "fit_with_conditions" : "fit"
  
  const reasoning = isPositive
    ? "Hepatitis C antibody positive - indicates current or past HCV infection. " +
      "Confirmatory RNA testing and specialist referral recommended."
    : "Hepatitis C screening negative"
  
  return {
    testCode: "hepatitis_c",
    testName: "Hepatitis C Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "Hepatologist" : undefined,
    confidence: 90,
  }
}

/**
 * Evaluates Syphilis (VDRL/RPR) test results
 */
function evaluateSyphilis(results: Record<string, any>): RulesEngineResult {
  const isPositive = 
    results.positive === true ||
    results.result === "positive" ||
    results.result === "reactive" ||
    results.reactive === true ||
    results.vdrl === "reactive" ||
    results.rpr === "reactive"
  
  const status = createStatus(isPositive ? "abnormal" : "normal")
  let suggestedDecision: FitnessDecision = "fit" // Treatable condition
  
  const reasoning = isPositive
    ? "Syphilis screening positive/reactive - confirmatory testing (TPHA/FTA-ABS) and treatment required"
    : "Syphilis screening negative/non-reactive"
  
  return {
    testCode: "syphilis",
    testName: "Syphilis Screening (VDRL/RPR)",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "General Practitioner" : undefined,
    confidence: 85,
  }
}

/**
 * Evaluates Tuberculosis (TB) test results
 */
function evaluateTuberculosis(results: Record<string, any>): RulesEngineResult {
  // Check various TB test types
  const mantoux = results.mantoux || results.ppd || results.tst
  const quantiferon = results.quantiferon || results.igra || results.qft
  const sputum = results.sputum || results.afb
  const geneXpert = results.genexpert || results.xpert
  
  const status = createStatus("normal")
  let suggestedDecision: FitnessDecision = "fit"
  const findings: string[] = []
  
  // Check for active TB (critical)
  if (sputum === "positive" || geneXpert === "detected" || geneXpert === "positive") {
    status.set("critical")
    suggestedDecision = "temporarily_unfit"
    findings.push("Active TB detected - requires immediate treatment and isolation")
  }
  
  // Check for latent TB (abnormal but may be fit)
  if (mantoux === "positive" || quantiferon === "positive" || 
      (typeof mantoux === "number" && mantoux >= 10)) {
    if (!status.is("critical")) {
      status.set("abnormal")
      findings.push("Latent TB infection indicated - chest X-ray and further evaluation required")
    }
  }
  
  const reasoning = findings.length > 0
    ? findings.join("; ")
    : "TB screening negative - no evidence of active or latent tuberculosis"
  
  return {
    testCode: "tuberculosis",
    testName: "Tuberculosis Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: status.isAtLeast("abnormal"),
    referralType: status.isAtLeast("abnormal") ? "Pulmonologist" : undefined,
    confidence: status.is("critical") ? 95 : 85,
  }
}

/**
 * Evaluates Malaria test results
 */
function evaluateMalaria(results: Record<string, any>): RulesEngineResult {
  const isPositive = 
    results.positive === true ||
    results.result === "positive" ||
    results.detected === true ||
    results.parasites_seen === true
  
  const parasiteType = results.parasite_type || results.species || ""
  const parasiteDensity = results.density || results.parasite_count || ""
  
  const status = createStatus(isPositive ? "critical" : "normal")
  let suggestedDecision: FitnessDecision = isPositive ? "temporarily_unfit" : "fit"
  
  let reasoning = ""
  if (isPositive) {
    reasoning = `Malaria positive${parasiteType ? ` (${parasiteType})` : ""}${parasiteDensity ? ` - density: ${parasiteDensity}` : ""}. ` +
                "Immediate treatment required. Unfit for work until successfully treated."
  } else {
    reasoning = "Malaria screening negative - no parasites detected"
  }
  
  return {
    testCode: "malaria",
    testName: "Malaria Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "General Practitioner" : undefined,
    confidence: 95,
  }
}

/**
 * Evaluates Pregnancy test results (for safety-sensitive work)
 */
function evaluatePregnancy(results: Record<string, any>): RulesEngineResult {
  const isPositive = 
    results.positive === true ||
    results.result === "positive" ||
    results.pregnant === true
  
  const status = createStatus(isPositive ? "abnormal" : "normal")
  let suggestedDecision: FitnessDecision = "fit"
  
  let reasoning = ""
  if (isPositive) {
    reasoning = "Pregnancy confirmed. May require workplace risk assessment for hazardous exposures " +
                "(chemicals, radiation, heavy lifting, etc.). Restrictions based on specific job hazards, not pregnancy status."
    suggestedDecision = "fit_with_conditions"
  } else {
    reasoning = "Pregnancy test negative"
  }
  
  return {
    testCode: "pregnancy",
    testName: "Pregnancy Test",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "Occupational Health Physician" : undefined,
    confidence: 95,
  }
}

/**
 * Evaluates Typhoid test results
 */
function evaluateTyphoid(results: Record<string, any>): RulesEngineResult {
  const isPositive = 
    results.positive === true ||
    results.result === "positive" ||
    results.reactive === true
  
  const status = createStatus(isPositive ? "critical" : "normal")
  let suggestedDecision: FitnessDecision = isPositive ? "temporarily_unfit" : "fit"
  
  const reasoning = isPositive
    ? "Typhoid test positive - requires treatment and follow-up. Unfit for food handling until cleared."
    : "Typhoid screening negative"
  
  return {
    testCode: "typhoid",
    testName: "Typhoid Screening",
    status: status.current,
    suggestedDecision,
    reasoning,
    referralSuggested: isPositive,
    referralType: isPositive ? "General Practitioner" : undefined,
    confidence: 85,
  }
}

/**
 * Generic evaluator for tests without specific rules
 */
function evaluateGenericTest(
  testCode: string,
  testName: string,
  results: Record<string, any>
): RulesEngineResult {
  const isNormal =
    results.is_normal === true ||
    results.normal === true ||
    results.status?.toLowerCase() === "normal"

  const status = createStatus(isNormal ? "normal" : "abnormal")
  const suggestedDecision: FitnessDecision = isNormal ? "fit" : "fit_with_conditions"

  return createRulesEngineResult(
    testCode,
    testName,
    status,
    suggestedDecision,
    isNormal ? [] : ["Results abnormal - clinical review recommended"],
    "General Practitioner",
    70,
    60
  )
}

/**
 * Maps test codes to evaluation functions
 */
function getEvaluator(testCode: string): (results: Record<string, any>) => RulesEngineResult {
  const testCodeLower = testCode.toLowerCase()
  
  // Spirometry / Lung Function
  if (testCodeLower.includes("spiro") || testCodeLower.includes("lung") || testCodeLower.includes("pulm")) {
    return evaluateSpirometry
  }
  
  // Audiometry
  if (testCodeLower.includes("audio") || testCodeLower.includes("hear")) {
    return evaluateAudiometry
  }
  
  // Vision
  if (testCodeLower.includes("vision") || testCodeLower.includes("visual") || testCodeLower.includes("eye")) {
    return evaluateVision
  }
  
  // Urinalysis
  if (testCodeLower.includes("urine") || testCodeLower.includes("urinalysis")) {
    return evaluateUrinalysis
  }
  
  // Blood Pressure
  if (testCodeLower.includes("bp") || testCodeLower.includes("blood_pressure") || testCodeLower.includes("bloodpressure")) {
    return evaluateBloodPressure
  }
  
  // Chest X-Ray
  if (testCodeLower.includes("xray") || testCodeLower.includes("x-ray") || (testCodeLower.includes("chest") && !testCodeLower.includes("test"))) {
    return evaluateChestXray
  }
  
  // ECG
  if (testCodeLower.includes("ecg") || testCodeLower.includes("ekg") || testCodeLower.includes("electro")) {
    return evaluateECG
  }
  
  // Drug Screen
  if (testCodeLower.includes("drug") || testCodeLower.includes("tox") || testCodeLower.includes("substance")) {
    return evaluateDrugScreen
  }
  
  // Blood Glucose
  if (testCodeLower.includes("glucose") || testCodeLower.includes("sugar") || testCodeLower.includes("hba1c") || testCodeLower.includes("diabetes")) {
    return evaluateBloodGlucose
  }
  
  // Cholesterol / Lipid Panel
  if (testCodeLower.includes("cholesterol") || testCodeLower.includes("lipid") || testCodeLower.includes("lipogram")) {
    return evaluateCholesterol
  }
  
  // Complete Blood Count (CBC)
  if (testCodeLower.includes("cbc") || testCodeLower.includes("fbc") || testCodeLower.includes("full_blood") || testCodeLower.includes("blood_count") || testCodeLower.includes("hemoglobin")) {
    return evaluateCBC
  }
  
  // Liver Function Tests
  if (testCodeLower.includes("liver") || testCodeLower.includes("lft") || testCodeLower.includes("hepatic") || testCodeLower.includes("alt") || testCodeLower.includes("ast") || testCodeLower.includes("bilirubin")) {
    return evaluateLiverFunction
  }
  
  // Kidney Function Tests
  if (testCodeLower.includes("kidney") || testCodeLower.includes("renal") || testCodeLower.includes("creatinine") || testCodeLower.includes("egfr") || testCodeLower.includes("urea")) {
    return evaluateKidneyFunction
  }
  
  // HIV
  if (testCodeLower.includes("hiv")) {
    return evaluateHIV
  }
  
  // Hepatitis B
  if (testCodeLower.includes("hepatitis_b") || testCodeLower.includes("hepb") || testCodeLower.includes("hbsag") || testCodeLower.includes("hbv")) {
    return evaluateHepatitisB
  }
  
  // Hepatitis C
  if (testCodeLower.includes("hepatitis_c") || testCodeLower.includes("hepc") || testCodeLower.includes("hcv")) {
    return evaluateHepatitisC
  }
  
  // Syphilis
  if (testCodeLower.includes("syphilis") || testCodeLower.includes("vdrl") || testCodeLower.includes("rpr")) {
    return evaluateSyphilis
  }
  
  // Tuberculosis
  if (testCodeLower.includes("tb") || testCodeLower.includes("tuberculosis") || testCodeLower.includes("mantoux") || testCodeLower.includes("quantiferon")) {
    return evaluateTuberculosis
  }
  
  // Malaria
  if (testCodeLower.includes("malaria")) {
    return evaluateMalaria
  }
  
  // Pregnancy
  if (testCodeLower.includes("pregnancy") || testCodeLower.includes("hcg") || testCodeLower.includes("pregnant")) {
    return evaluatePregnancy
  }
  
  // Typhoid
  if (testCodeLower.includes("typhoid") || testCodeLower.includes("widal")) {
    return evaluateTyphoid
  }
  
  // Return generic evaluator for unknown tests
  return (results) => evaluateGenericTest(testCode, testCode, results)
}

/**
 * Determines overall fitness decision from individual test results
 */
function determineOverallDecision(results: RulesEngineResult[]): FitnessDecision {
  // Priority: permanently_unfit > temporarily_unfit > fit_with_restrictions > fit_with_conditions > fit
  const decisionPriority: FitnessDecision[] = [
    "permanently_unfit",
    "temporarily_unfit",
    "fit_with_restrictions",
    "fit_with_conditions",
    "fit",
  ]
  
  let worstDecision: FitnessDecision = "fit"
  
  for (const result of results) {
    const currentIndex = decisionPriority.indexOf(worstDecision)
    const resultIndex = decisionPriority.indexOf(result.suggestedDecision)
    
    if (resultIndex < currentIndex) {
      worstDecision = result.suggestedDecision
    }
  }
  
  return worstDecision
}

/**
 * Main function to evaluate all test results and generate summary
 */
export function evaluateTestResults(testResults: TestResult[]): RulesEngineSummary {
  const evaluatedResults: RulesEngineResult[] = []
  const criticalFindings: string[] = []
  const abnormalFindings: string[] = []
  const referralsRecommended: string[] = []
  
  for (const testResult of testResults) {
    const testCode = testResult.test_code || "unknown"
    const testName = testResult.test_name || testCode
    
    // Parse results if they're a string
    let results: Record<string, any> = {}
    if (typeof testResult.results === "string") {
      try {
        results = JSON.parse(testResult.results)
      } catch {
        results = {}
      }
    } else {
      results = testResult.results || {}
    }
    
    // Get appropriate evaluator and run evaluation
    const evaluator = getEvaluator(testCode)
    const evaluation = evaluator(results)
    
    // Update test name if we have a better one
    evaluation.testName = testName || evaluation.testName
    
    evaluatedResults.push(evaluation)
    
    // Collect findings
    if (evaluation.status === "critical") {
      criticalFindings.push(`${evaluation.testName}: ${evaluation.reasoning}`)
    } else if (evaluation.status === "abnormal") {
      abnormalFindings.push(`${evaluation.testName}: ${evaluation.reasoning}`)
    }
    
    // Collect referrals
    if (evaluation.referralSuggested && evaluation.referralType) {
      if (!referralsRecommended.includes(evaluation.referralType)) {
        referralsRecommended.push(evaluation.referralType)
      }
    }
  }
  
  // Determine overall decision
  const overallSuggestedDecision = determineOverallDecision(evaluatedResults)
  
  // Calculate overall confidence
  const avgConfidence = evaluatedResults.length > 0
    ? evaluatedResults.reduce((sum, r) => sum + r.confidence, 0) / evaluatedResults.length
    : 50
  
  // Generate overall reasoning
  let reasoning = ""
  if (criticalFindings.length > 0) {
    reasoning = `Critical findings require immediate attention. ${criticalFindings.length} critical issue(s) identified.`
  } else if (abnormalFindings.length > 0) {
    reasoning = `${abnormalFindings.length} abnormal finding(s) identified that may require conditions or restrictions.`
  } else {
    reasoning = "All test results within normal parameters. No significant findings."
  }
  
  return {
    overallSuggestedDecision,
    overallConfidence: Math.round(avgConfidence),
    criticalFindings,
    abnormalFindings,
    referralsRecommended,
    reasoning,
    testResults: evaluatedResults,
  }
}

/**
 * Clinical Rules Engine Service class for dependency injection
 */
export class ClinicalRulesEngine {
  /**
   * Evaluates test results and returns a comprehensive summary
   */
  evaluate(testResults: TestResult[]): RulesEngineSummary {
    return evaluateTestResults(testResults)
  }
  
  /**
   * Evaluates a single test result
   */
  evaluateSingleTest(testResult: TestResult): RulesEngineResult {
    const testCode = testResult.test_code || "unknown"
    
    let results: Record<string, any> = {}
    if (typeof testResult.results === "string") {
      try {
        results = JSON.parse(testResult.results)
      } catch {
        results = {}
      }
    } else {
      results = testResult.results || {}
    }
    
    const evaluator = getEvaluator(testCode)
    const evaluation = evaluator(results)
    evaluation.testName = testResult.test_name || evaluation.testName
    
    return evaluation
  }
  
  /**
   * Gets the reference ranges for display purposes
   */
  getReferenceRanges() {
    return REFERENCE_RANGES
  }
  
  /**
   * Validates that the doctor's decision is appropriate given the findings
   */
  validateDoctorDecision(
    doctorDecision: FitnessDecision,
    rulesEngineDecision: FitnessDecision,
    criticalFindings: string[]
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []
    
    // Decision priority mapping (lower = more restrictive)
    const decisionPriority: Record<FitnessDecision, number> = {
      permanently_unfit: 1,
      temporarily_unfit: 2,
      fit_with_restrictions: 3,
      fit_with_conditions: 4,
      fit: 5,
    }
    
    const doctorPriority = decisionPriority[doctorDecision]
    const rulesPriority = decisionPriority[rulesEngineDecision]
    
    // Warn if doctor is clearing someone the rules engine flagged
    if (doctorPriority > rulesPriority) {
      warnings.push(
        `Doctor's decision (${doctorDecision}) is less restrictive than rules engine suggestion (${rulesEngineDecision}). Override reason should be documented.`
      )
    }
    
    // Critical warning if clearing someone with critical findings
    if (criticalFindings.length > 0 && doctorDecision === "fit") {
      warnings.push(
        `Warning: Clearing patient as "fit" despite ${criticalFindings.length} critical finding(s). This requires documented justification.`
      )
    }
    
    return {
      valid: true,
      warnings,
    }
  }
}

export const clinicalRulesEngine = new ClinicalRulesEngine()