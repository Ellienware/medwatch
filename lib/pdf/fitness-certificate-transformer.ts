import type { 
  Certificate, 
  Patient, 
  Clinic, 
  TestResult, 
  RulesEngineSummary,
  FitnessDecision 
} from "@/lib/types/database";
import type { FitnessCertificateData } from "@/lib/types/database";
import { ValidationService } from "@/lib/services/validation-service";

// Data quality indicator types
export interface DataQualityIndicator {
  field: string;
  source: "actual" | "default" | "derived" | "missing" | "engine_generated";
  confidence: number; // 0-100
  warning?: string;
}

export interface TransformResult {
  data: FitnessCertificateData;
  dataQuality: {
    overall: number; // 0-100 overall data quality score
    indicators: DataQualityIndicator[];
    warnings: string[];
    missingRequiredData: string[];
    usingDefaults: string[];
    engineGenerated: string[];
  };
}

export class FitnessCertificateTransformer {
  private static rulesEngineIntegrationEnabled = true;
  
  /**
   * Transform certificate data with comprehensive rules engine integration
   * Returns both the transformed data and quality metrics
   */
  static transformWithQuality(
    certificate: Certificate,
    patient: Patient,
    clinic: Clinic,
    testResults: TestResult[] = []
  ): TransformResult {
    const indicators: DataQualityIndicator[] = [];
    const warnings: string[] = [];
    const missingRequiredData: string[] = [];
    const usingDefaults: string[] = [];
    const engineGenerated: string[] = [];
    
    // Track which data is actual vs default vs engine-generated
    const dataSource = {
      patientName: patient?.first_name && patient?.last_name ? "actual" : "missing",
      idNumber: patient?.id_number ? "actual" : (patient?.passport_number ? "derived" : "missing"),
      occupation: patient?.job_title ? "actual" : "default",
      company: patient?.employer_company_name ? "actual" : "default",
      clinicInfo: clinic?.name ? "actual" : "default",
      testResults: testResults.length > 0 ? "actual" : "default",
      rulesEvaluation: certificate.rules_evaluation ? "engine_generated" : "missing",
      suggestedDecision: certificate.suggested_fitness_decision ? "engine_generated" : "missing"
    };
    
    // Track missing required data
    if (dataSource.patientName === "missing") {
      missingRequiredData.push("Patient name");
      warnings.push("Patient name is missing - certificate cannot be generated");
    }
    if (dataSource.idNumber === "missing") {
      missingRequiredData.push("ID/Passport number");
      warnings.push("Patient identification number is missing");
    }
    
    // Track defaults being used
    if (dataSource.occupation === "default") {
      usingDefaults.push("Occupation (using 'Pump Operator')");
    }
    if (dataSource.company === "default") {
      usingDefaults.push("Company name (using 'Mokaha Municipality')");
    }
    if (dataSource.testResults === "default") {
      usingDefaults.push("Test results (using reference values)");
      warnings.push("No actual test results found - using default reference values");
    }
    
    // Track engine-generated content
    if (dataSource.rulesEvaluation === "engine_generated") {
      engineGenerated.push("Clinical rules evaluation");
    }
    if (dataSource.suggestedDecision === "engine_generated") {
      engineGenerated.push("Suggested fitness decision");
    }
    
    // Check if doctor overrode engine suggestions
    if (certificate.doctor_decision_override) {
      warnings.push("Doctor has overridden rules engine suggestions - clinical discretion applied");
      indicators.push({
        field: "doctor_override",
        source: "actual",
        confidence: 100,
        warning: "Doctor applied clinical discretion overriding engine suggestions"
      });
    }
    
    // Transform the data
    const data = this.transformWithRulesIntegration(certificate, patient, clinic, testResults);
    
    // Build quality indicators
    indicators.push(
      { 
        field: "patient_name", 
        source: dataSource.patientName as any, 
        confidence: dataSource.patientName === "actual" ? 100 : 0 
      },
      { 
        field: "id_number", 
        source: dataSource.idNumber as any, 
        confidence: dataSource.idNumber === "actual" ? 100 : (dataSource.idNumber === "derived" ? 80 : 0) 
      },
      { 
        field: "occupation", 
        source: dataSource.occupation as any, 
        confidence: dataSource.occupation === "actual" ? 100 : 30 
      },
      { 
        field: "company", 
        source: dataSource.company as any, 
        confidence: dataSource.company === "actual" ? 100 : 30 
      },
      { 
        field: "clinic_info", 
        source: dataSource.clinicInfo as any, 
        confidence: dataSource.clinicInfo === "actual" ? 100 : 50 
      },
      { 
        field: "test_results", 
        source: dataSource.testResults as any, 
        confidence: dataSource.testResults === "actual" ? 100 : 20, 
        warning: dataSource.testResults === "default" ? "Using default test values" : undefined 
      },
      { 
        field: "rules_evaluation", 
        source: dataSource.rulesEvaluation as any, 
        confidence: dataSource.rulesEvaluation === "engine_generated" ? 95 : 0,
        warning: dataSource.rulesEvaluation === "missing" ? "No rules engine evaluation available" : undefined
      },
      { 
        field: "suggested_decision", 
        source: dataSource.suggestedDecision as any, 
        confidence: dataSource.suggestedDecision === "engine_generated" ? 90 : 0 
      }
    );
    
    // Add engine-specific quality indicators if available
    if (certificate.rules_evaluation) {
      indicators.push({
        field: "engine_confidence",
        source: "engine_generated",
        confidence: certificate.evaluation_confidence || 0,
        warning: certificate.evaluation_confidence && certificate.evaluation_confidence < 70 
          ? "Low confidence in engine evaluation" 
          : undefined
      });
      
      if (certificate.rules_evaluation.criticalFindings.length > 0) {
        indicators.push({
          field: "critical_findings",
          source: "engine_generated",
          confidence: 95,
          warning: `${certificate.rules_evaluation.criticalFindings.length} critical finding(s) identified`
        });
      }
    }
    
    // Calculate overall quality score
    const actualCount = indicators.filter(i => i.source === "actual" || i.source === "engine_generated").length;
    const totalCount = indicators.length;
    const overall = Math.round((actualCount / totalCount) * 100);
    
    return {
      data,
      dataQuality: {
        overall,
        indicators,
        warnings,
        missingRequiredData,
        usingDefaults,
        engineGenerated
      }
    };
  }
  
  /**
   * Transform with complete rules engine integration
   */
  static transformWithRulesIntegration(
    certificate: Certificate,
    patient: Patient,
    clinic: Clinic,
    testResults: TestResult[] = []
  ): FitnessCertificateData {
    try {
      // Extract test results into structured format with data quality tracking
      const extractedTests = this.extractTestResults(testResults);
      
      // Get medical type from certificate type or test results
      const medicalType = this.determineMedicalType(certificate, testResults);
      
      // Get fitness status - prefer doctor's decision, fall back to engine suggestion
      const fitnessStatus = this.determineFitnessStatus(certificate);
      
      // Determine if engine was used
      const engineWasUsed = !!certificate.rules_evaluation;
      const doctorOverrodeEngine = certificate.doctor_decision_override === true;
      
      // Generate content based on engine evaluation if available
      const engineGeneratedContent = engineWasUsed && certificate.rules_evaluation 
        ? this.generateContentFromEvaluation(certificate.rules_evaluation, certificate)
        : null;
      
      // Sanitize data
      const sanitizedPatientName = ValidationService.sanitizeText(
        `${patient.first_name} ${patient.last_name}`
      );
      const sanitizedOccupation = ValidationService.sanitizeText(
        patient.job_title || 'Pump Operator'
      );
      const sanitizedCompany = ValidationService.sanitizeText(
        patient.employer_company_name || 'Mokaha Municipality'
      );
      
      // Build certificate data
      const certificateData: FitnessCertificateData = {
        // Provider Information (from clinic)
        provider_name: clinic.name,
        provider_address: clinic.address || 'Cor Barbara and Lemie Road, Isando',
        provider_registration: clinic.registration_number || '2015/407407/07',
        provider_phone: clinic.phone || '+27 11 392 2078',
        provider_vat: '4200254178',
        provider_email: clinic.email || 'info@myhealth.co.za',
        provider_website: 'www.myhealth.co.za',
        provider_tagline: 'Commit to Health',
        
        // Certificate Information
        certificate_number: certificate.certificate_number,
        exam_date: this.formatDate(certificate.exam_date),
        issue_date: this.formatDate(certificate.issue_date),
        
        // Patient Information
        patient_name: sanitizedPatientName,
        id_number: patient.id_number || patient.passport_number || '',
        passport_number: patient.passport_number || undefined,
        occupation: sanitizedOccupation,
        company: sanitizedCompany,
        
        // Medical Type
        medical_type: medicalType,
        
        // Test Results
        lung_function: extractedTests.lungFunction,
        audiometry: extractedTests.audiometry,
        vision: extractedTests.vision,
        urinalysis: extractedTests.urinalysis,
        chest_xray: extractedTests.chestXray,
        
        // Referrals (extracted from test findings or engine evaluation)
        referrals: this.extractReferrals(testResults, certificate.rules_evaluation ?? undefined),
        
        // Fitness Status
        fitness_status: fitnessStatus,
        restrictions: certificate.restrictions || engineGeneratedContent?.restrictions || undefined,
        recommendations: certificate.recommendations || engineGeneratedContent?.recommendations || undefined,
        diagnosis: certificate.diagnosis || engineGeneratedContent?.diagnosis || undefined,
        
        // Validity Period
        valid_from: certificate.valid_from 
          ? this.formatDate(certificate.valid_from) 
          : this.formatDate(certificate.issue_date),
        valid_until: certificate.valid_until 
          ? this.formatDate(certificate.valid_until) 
          : this.addOneYear(certificate.issue_date),
        
        // Practitioner Information
        practitioner_name: certificate.doctor_name || 'DR R.B. MAKHOSA',
        practitioner_number: '14594063',
        practitioner_qualifications: 'MBChB (UCT), DOH (UKZN)',
        practitioner_registration: certificate.doctor_registration_number || 'MPQ471086',
        omp_number: 'CS/2001/0041',
        
        // ============================================================
        // RULES ENGINE INTEGRATION FIELDS
        // ============================================================
        
        // Rules Engine Evaluation Data
        rules_evaluation: certificate.rules_evaluation ?? undefined,
        suggested_fitness_decision: certificate.suggested_fitness_decision ?? undefined,
        evaluation_confidence: certificate.evaluation_confidence ?? undefined,
        doctor_decision_override: certificate.doctor_decision_override,
        override_reason: certificate.override_reason,
        decision_validation: certificate.decision_validation,
        
        // Engine-generated summary for display
        evaluation_summary: certificate.rules_evaluation ? {
          engine_decision: certificate.rules_evaluation.overallSuggestedDecision,
          engine_confidence: certificate.rules_evaluation.overallConfidence,
          critical_findings: certificate.rules_evaluation.criticalFindings,
          abnormal_findings: certificate.rules_evaluation.abnormalFindings,
          referrals: certificate.rules_evaluation.referralsRecommended,
          reasoning: certificate.rules_evaluation.reasoning,
          test_evaluations: certificate.rules_evaluation.testResults.map(result => ({
            test: result.testName,
            status: result.status,
            suggestion: result.suggestedDecision,
            reasoning: result.reasoning
          }))
        } : undefined,
        
        // Evaluation metadata
        evaluation_metadata: certificate.rules_evaluation ? {
          evaluated_at: certificate.decision_validation?.validated_at || new Date().toISOString(),
          test_count: certificate.rules_evaluation.testResults.length,
          critical_count: certificate.rules_evaluation.criticalFindings.length,
          abnormal_count: certificate.rules_evaluation.abnormalFindings.length,
          confidence: certificate.rules_evaluation.overallConfidence,
          decision_alignment: doctorOverrodeEngine ? 'override' : 'aligned',
          engine_version: '1.0.0'
        } : undefined,
        
        // Disclaimer based on engine usage
        disclaimer_text: !engineWasUsed 
          ? "Certificate generated through standard clinical assessment."
          : doctorOverrodeEngine
            ? "Note: Doctor has applied clinical discretion overriding computer-assisted evaluation findings. Medical practitioner's clinical judgment is final."
            : "Certificate generated with computer-assisted clinical evaluation support. All findings validated by medical practitioner.",
            
        // Data quality indicators (for internal use)
        _data_quality: {
          test_results_source: extractedTests._dataQuality,
          engine_used: engineWasUsed,
          doctor_override: doctorOverrodeEngine,
          confidence: certificate.evaluation_confidence || 0
        }
      };

      // Validate the transformed data
      const validation = ValidationService.validateCertificateData(certificateData);
      if (!validation.valid) {
        console.warn('Certificate data validation warnings:', validation.errors);
        // Add validation warnings to data quality
        if (certificateData._data_quality) {
          certificateData._data_quality.validation_warnings = validation.errors;
        }
      }

      return certificateData;
    } catch (error) {
      console.error('Error transforming certificate data with rules integration:', error);
      throw new Error(`Failed to transform certificate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Original transform method - maintained for backward compatibility
   */
  static transform(
    certificate: Certificate,
    patient: Patient,
    clinic: Clinic,
    testResults: TestResult[] = []
  ): FitnessCertificateData {
    return this.transformWithRulesIntegration(certificate, patient, clinic, testResults);
  }
  
  /**
   * Generate content from rules engine evaluation
   */
  private static generateContentFromEvaluation(
    evaluation: RulesEngineSummary,
    certificate: Certificate
  ): { diagnosis: string; restrictions: string; recommendations: string } {
    const doctorDecision = this.mapCertificateTypeToFitnessStatus(certificate.certificate_type);
    const engineDecision = evaluation.overallSuggestedDecision;
    
    // Generate diagnosis
    let diagnosis = "";
    if (evaluation.criticalFindings.length > 0) {
      diagnosis = `Clinical evaluation identified ${evaluation.criticalFindings.length} critical finding(s) requiring attention. `;
      if (doctorDecision !== engineDecision) {
        diagnosis += `Doctor has applied clinical discretion (${doctorDecision} vs engine suggestion: ${engineDecision}).`;
      }
    } else if (evaluation.abnormalFindings.length > 0) {
      diagnosis = `Clinical evaluation identified ${evaluation.abnormalFindings.length} abnormal finding(s). `;
      diagnosis += evaluation.reasoning;
    } else {
      diagnosis = "Clinical evaluation within normal parameters. No significant abnormalities detected.";
    }
    
    // Generate restrictions
    const restrictions: string[] = [];
    
    // Critical findings always generate restrictions
    if (evaluation.criticalFindings.length > 0) {
      restrictions.push("Medical restrictions apply due to critical health findings.");
    }
    
    // Specific test-based restrictions
    evaluation.testResults.forEach(result => {
      if (result.status === "critical") {
        switch(result.testCode.toLowerCase()) {
          case "audiometry":
            restrictions.push("Mandatory hearing protection in all work environments.");
            break;
          case "spirometry":
            restrictions.push("Respiratory protection required. No exposure to respiratory irritants.");
            break;
          case "drug_screen":
            restrictions.push("No safety-sensitive duties. Must complete substance abuse program.");
            break;
          case "blood_pressure":
            restrictions.push("No work at heights, with heavy machinery, or in extreme temperatures.");
            break;
          case "vision":
            restrictions.push("Corrective eyewear mandatory. No night driving or precision work.");
            break;
        }
      } else if (result.status === "abnormal") {
        switch(result.testCode.toLowerCase()) {
          case "audiometry":
            restrictions.push("Annual hearing surveillance required.");
            break;
          case "blood_pressure":
            restrictions.push("Regular blood pressure monitoring during work hours.");
            break;
          case "blood_glucose":
            restrictions.push("Regular glucose monitoring. Access to snacks/medication required.");
            break;
        }
      }
    });
    
    // Overall decision restrictions
    if (engineDecision === "fit_with_restrictions") {
      restrictions.push("Work restrictions as specified by Occupational Health Practitioner.");
    } else if (engineDecision === "temporarily_unfit") {
      restrictions.push("Medically unfit for duty until follow-up assessment and clearance.");
    } else if (engineDecision === "permanently_unfit") {
      restrictions.push("Permanently medically unfit for this specific occupation.");
    }
    
    const restrictionsText = restrictions.length > 0 
      ? restrictions.join(' ') 
      : "No specific restrictions recommended.";
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    // Referrals
    if (evaluation.referralsRecommended.length > 0) {
      recommendations.push(`Refer to: ${evaluation.referralsRecommended.join(', ')}.`);
    }
    
    // Critical findings recommendations
    if (evaluation.criticalFindings.length > 0) {
      recommendations.push("Immediate medical follow-up required for critical findings.");
    }
    
    // Test-specific recommendations
    evaluation.testResults.forEach(result => {
      if (result.referralSuggested && result.referralType) {
        recommendations.push(`Follow-up with ${result.referralType} for ${result.testName}.`);
      }
      
      if (result.status === "critical" || result.status === "abnormal") {
        switch(result.testCode.toLowerCase()) {
          case "audiometry":
            recommendations.push("Comprehensive audiological assessment recommended.");
            break;
          case "spirometry":
            recommendations.push("Pulmonary function test with bronchodilator response.");
            break;
          case "blood_pressure":
            recommendations.push("24-hour ambulatory blood pressure monitoring.");
            break;
          case "blood_glucose":
            recommendations.push("Oral glucose tolerance test and HbA1c follow-up.");
            break;
          case "cholesterol":
            recommendations.push("Cardiovascular risk assessment and lipid management.");
            break;
          case "liver_function":
            recommendations.push("Liver ultrasound and viral hepatitis screening.");
            break;
        }
      }
    });
    
    // General health recommendations
    if (evaluation.abnormalFindings.length > 2) {
      recommendations.push("Comprehensive health assessment and lifestyle modification program.");
    }
    
    const recommendationsText = recommendations.length > 0 
      ? recommendations.join(' ') 
      : "No specific recommendations. Continue regular health maintenance.";
    
    return {
      diagnosis,
      restrictions: restrictionsText,
      recommendations: recommendationsText
    };
  }
  
  /**
   * Extract test results with data quality tracking
   */
  private static extractTestResults(testResults: TestResult[]): {
    lungFunction: any;
    audiometry: any;
    vision: any;
    urinalysis: any;
    chestXray: boolean;
    _dataQuality: {
      lungFunction: "actual" | "default";
      audiometry: "actual" | "default";
      vision: "actual" | "default";
      urinalysis: "actual" | "default";
      chestXray: "actual" | "default";
    };
  } {
    // Explicitly type the defaults object
    const defaults: ReturnType<typeof FitnessCertificateTransformer.extractTestResults> = {
      lungFunction: {
        fvc_percent: '98%',
        fev1_percent: '92%',
        fev1_fvc_ratio: '92%',
        pef_l_min: '420'
      },
      audiometry: {
        left: {
          '500HZ': '10',
          '1000HZ': '10',
          '2000HZ': '10',
          '3000HZ': '10',
          '4000HZ': '10',
          '6000HZ': '15',
          '8000HZ': '15'
        },
        right: {
          '500HZ': '10',
          '1000HZ': '10',
          '2000HZ': '10',
          '3000HZ': '15',
          '4000HZ': '15',
          '6000HZ': '15',
          '8000HZ': '15'
        }
      },
      vision: {
        right_acuity: '20/20',
        left_acuity: '20/20',
        color_vision: 'NAD'
      },
      urinalysis: {
        normal: true,
        hgt_mmol: '5.2'
      },
      chestXray: true,
      _dataQuality: {
        lungFunction: "default",
        audiometry: "default",
        vision: "default",
        urinalysis: "default",
        chestXray: "default"
      }
    };
      
    // Extract actual test results if available and track data source
    testResults.forEach(test => {
      const testCode = test.test_code?.toLowerCase() || '';
      let results: Record<string, any> = {};
      
      try {
        results = typeof test.results === 'string' 
          ? JSON.parse(test.results || '{}') 
          : (test.results || {});
      } catch (e) {
        console.warn(`Failed to parse test results for ${testCode}:`, e);
        return;
      }
      
      // Check if results object has any actual data
      const hasActualData = Object.keys(results).length > 0 && 
        Object.values(results).some(v => v !== null && v !== undefined && v !== '');
      
      switch (true) {
        case testCode.includes('spirometry') || testCode.includes('lung'):
          if (hasActualData) {
            defaults.lungFunction = {
              fvc_percent: this.formatPercentValue(results.fvc_percent || results.fvc) || defaults.lungFunction.fvc_percent,
              fev1_percent: this.formatPercentValue(results.fev1_percent || results.fev1) || defaults.lungFunction.fev1_percent,
              fev1_fvc_ratio: this.formatPercentValue(results.fev1_fvc_ratio || results.ratio) || defaults.lungFunction.fev1_fvc_ratio,
              pef_l_min: String(results.pef_l_min || results.pef || defaults.lungFunction.pef_l_min)
            };
            defaults._dataQuality.lungFunction = "actual";
          }
          break;
          
        case testCode.includes('audiometry') || testCode.includes('audio'):
          if (hasActualData) {
            // Handle both nested and flat result structures
            const leftEar = results.left_ear || results.left || {};
            const rightEar = results.right_ear || results.right || {};
            
            defaults.audiometry = {
              left: {
                '500HZ': String(leftEar['500HZ'] || results.left_500 || results.left_500hz || defaults.audiometry.left['500HZ']),
                '1000HZ': String(leftEar['1000HZ'] || results.left_1000 || results.left_1000hz || defaults.audiometry.left['1000HZ']),
                '2000HZ': String(leftEar['2000HZ'] || results.left_2000 || results.left_2000hz || defaults.audiometry.left['2000HZ']),
                '3000HZ': String(leftEar['3000HZ'] || results.left_3000 || results.left_3000hz || defaults.audiometry.left['3000HZ']),
                '4000HZ': String(leftEar['4000HZ'] || results.left_4000 || results.left_4000hz || defaults.audiometry.left['4000HZ']),
                '6000HZ': String(leftEar['6000HZ'] || results.left_6000 || results.left_6000hz || defaults.audiometry.left['6000HZ']),
                '8000HZ': String(leftEar['8000HZ'] || results.left_8000 || results.left_8000hz || defaults.audiometry.left['8000HZ'])
              },
              right: {
                '500HZ': String(rightEar['500HZ'] || results.right_500 || results.right_500hz || defaults.audiometry.right['500HZ']),
                '1000HZ': String(rightEar['1000HZ'] || results.right_1000 || results.right_1000hz || defaults.audiometry.right['1000HZ']),
                '2000HZ': String(rightEar['2000HZ'] || results.right_2000 || results.right_2000hz || defaults.audiometry.right['2000HZ']),
                '3000HZ': String(rightEar['3000HZ'] || results.right_3000 || results.right_3000hz || defaults.audiometry.right['3000HZ']),
                '4000HZ': String(rightEar['4000HZ'] || results.right_4000 || results.right_4000hz || defaults.audiometry.right['4000HZ']),
                '6000HZ': String(rightEar['6000HZ'] || results.right_6000 || results.right_6000hz || defaults.audiometry.right['6000HZ']),
                '8000HZ': String(rightEar['8000HZ'] || results.right_8000 || results.right_8000hz || defaults.audiometry.right['8000HZ'])
              }
            };
            defaults._dataQuality.audiometry = "actual";
          }
          break;
          
        case testCode.includes('vision') || testCode.includes('visual') || testCode.includes('eye'):
          if (hasActualData) {
            defaults.vision = {
              right_acuity: String(results.right_acuity || results.od || results.right || defaults.vision.right_acuity),
              left_acuity: String(results.left_acuity || results.os || results.left || defaults.vision.left_acuity),
              color_vision: String(results.color_vision || results.color || results.colour || defaults.vision.color_vision)
            };
            defaults._dataQuality.vision = "actual";
          }
          break;
          
        case testCode.includes('urinalysis') || testCode.includes('urine'):
          if (hasActualData) {
            defaults.urinalysis = {
              normal: results.normal !== false && results.result !== 'abnormal',
              hgt_mmol: String(results.hgt || results.hgt_mmol || results.glucose || defaults.urinalysis.hgt_mmol)
            };
            defaults._dataQuality.urinalysis = "actual";
          }
          break;
          
        case testCode.includes('chest') || testCode.includes('xray') || testCode.includes('x-ray'):
          if (hasActualData) {
            defaults.chestXray = results.normal !== false && results.result !== 'abnormal';
            defaults._dataQuality.chestXray = "actual";
          }
          break;
      }
    });
    
    return defaults;
  }
  
  /**
   * Helper to format percentage values consistently
   */
  private static formatPercentValue(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    if (isNaN(numValue)) return String(value);
    
    return `${numValue}%`;
  }
  
  /**
   * Determine fitness status with engine integration
   */
  private static determineFitnessStatus(certificate: Certificate): 'fit' | 'fit_with_conditions' | 'fit_with_restrictions' | 'temporarily_unfit' {
    // Doctor's decision from certificate type takes precedence
    const doctorStatus = this.mapCertificateTypeToFitnessStatus(certificate.certificate_type);
    
    // If engine was used and doctor didn't override, we could note the alignment
    if (certificate.rules_evaluation && !certificate.doctor_decision_override) {
      const engineStatus = certificate.rules_evaluation.overallSuggestedDecision;
      // You could log alignment here if needed
    }
    
    return doctorStatus;
  }
  
  private static determineMedicalType(certificate: Certificate, testResults: TestResult[]): 'pre_employment' | 'annual' | 'exit' | 'transfer' {
    // Try to determine from certificate or test results
    const certType = certificate.certificate_type?.toLowerCase() || '';
    
    if (certType.includes('pre') || certType.includes('employment')) return 'pre_employment';
    if (certType.includes('annual')) return 'annual';
    if (certType.includes('exit')) return 'exit';
    if (certType.includes('transfer')) return 'transfer';
    
    // Default to annual medical
    return 'annual';
  }
  
  private static extractReferrals(
    testResults: TestResult[], 
    rulesEvaluation?: RulesEngineSummary
  ): {
    local_clinic: boolean;
    audiologist: boolean;
    optometrist: boolean;
    lung_function: boolean;
    omp: boolean;
  } {
    const referrals = {
      local_clinic: false,
      audiologist: false,
      optometrist: false,
      lung_function: false,
      omp: false
    };
    
    // First check test findings for referrals
    testResults.forEach(test => {
      const findings = test.findings?.toLowerCase() || '';
      const recommendations = test.recommendations?.toLowerCase() || '';
      const text = `${findings} ${recommendations}`;
      
      if (text.includes('audiologist') || text.includes('hearing')) {
        referrals.audiologist = true;
      }
      if (text.includes('optometrist') || text.includes('vision') || text.includes('eye')) {
        referrals.optometrist = true;
      }
      if (text.includes('lung') || text.includes('pulmonary') || text.includes('spirometry')) {
        referrals.lung_function = true;
      }
      if (text.includes('omp') || text.includes('occupational') || text.includes('medical practitioner')) {
        referrals.omp = true;
      }
      if (text.includes('clinic') || text.includes('hospital') || text.includes('refer')) {
        referrals.local_clinic = true;
      }
    });
    
    // Then check rules engine recommendations
    if (rulesEvaluation) {
      rulesEvaluation.referralsRecommended.forEach(referral => {
        const referralLower = referral.toLowerCase();
        if (referralLower.includes('audiologist')) referrals.audiologist = true;
        if (referralLower.includes('optometrist') || referralLower.includes('eye')) referrals.optometrist = true;
        if (referralLower.includes('pulmonologist') || referralLower.includes('lung')) referrals.lung_function = true;
        if (referralLower.includes('omp') || referralLower.includes('occupational')) referrals.omp = true;
        if (referralLower.includes('clinic') || referralLower.includes('hospital')) referrals.local_clinic = true;
      });
    }
    
    return referrals;
  }
  
  private static mapCertificateTypeToFitnessStatus(certificateType: string): 'fit' | 'fit_with_conditions' | 'fit_with_restrictions' | 'temporarily_unfit' {
    const type = certificateType.toLowerCase();
    
    if (type.includes('unfit')) return 'temporarily_unfit';
    if (type.includes('restriction')) return 'fit_with_restrictions';
    if (type.includes('condition')) return 'fit_with_conditions';
    
    return 'fit';
  }
  
  private static formatDate(dateString: string): string {
    try {
      if (!dateString) return 'N/A'
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`)
        return 'N/A'
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).replace(/\//g, ' ');
    } catch {
      console.warn(`Error formatting date: ${dateString}`)
      return 'N/A'
    }
  }
  
  private static addOneYear(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string for addOneYear: ${dateString}`)
        return this.formatDate(new Date().toISOString())
      }
      
      date.setFullYear(date.getFullYear() + 1);
      return this.formatDate(date.toISOString());
    } catch {
      console.warn(`Error adding one year to date: ${dateString}`)
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      return this.formatDate(nextYear.toISOString())
    }
  }
}

// Legacy function for backward compatibility
export function transformWithRulesEvaluation(
  certificate: Certificate,
  patient: Patient,
  clinic: Clinic,
  testResults: TestResult[],
  rulesEvaluation?: RulesEngineSummary
): FitnessCertificateData {
  // Create a certificate copy with rules evaluation
  const certificateWithRules = {
    ...certificate,
    rules_evaluation: rulesEvaluation || certificate.rules_evaluation,
    suggested_fitness_decision: rulesEvaluation?.overallSuggestedDecision || certificate.suggested_fitness_decision,
    evaluation_confidence: rulesEvaluation?.overallConfidence || certificate.evaluation_confidence
  };
  
  return FitnessCertificateTransformer.transformWithRulesIntegration(
    certificateWithRules,
    patient,
    clinic,
    testResults
  );
}

export default FitnessCertificateTransformer;