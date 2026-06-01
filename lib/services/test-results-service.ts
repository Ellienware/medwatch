// lib/services/test-results-service.ts
import type { TestResult } from '@/lib/types/database';

export class TestResultsService {
  /**
   * Parse test results from JSON string or object
   */
  static parseResults(testResult: TestResult): Record<string, any> {
    if (!testResult.results) return {};
    if (typeof testResult.results === 'string') {
      try {
        return JSON.parse(testResult.results);
      } catch {
        return {};
      }
    }
    return testResult.results as Record<string, any>;
  }

  /**
   * Extract lung function data from test results
   */
  static extractLungFunction(testResults: TestResult[]): {
    fvc_percent: string;
    fev1_percent: string;
    fev1_fvc_ratio: string;
    pef_l_min: string;
  } {
    const lungTest = testResults.find(
      t => t.test_code?.toLowerCase().includes('spirometry') ||
           t.test_name?.toLowerCase().includes('lung')
    );
    if (!lungTest) {
      return {
        fvc_percent: '98%',
        fev1_percent: '92%',
        fev1_fvc_ratio: '92%',
        pef_l_min: '420',
      };
    }
    const results = this.parseResults(lungTest);
    return {
      fvc_percent: this.formatPercent(results.fvc_percent || results.fvc) || '98%',
      fev1_percent: this.formatPercent(results.fev1_percent || results.fev1) || '92%',
      fev1_fvc_ratio: this.formatPercent(results.fev1_fvc_ratio || results.ratio) || '92%',
      pef_l_min: String(results.pef_l_min || results.pef || '420'),
    };
  }

  /**
   * Extract audiometry data
   */
  static extractAudiometry(testResults: TestResult[]): {
    left: Record<string, string>;
    right: Record<string, string>;
  } {
    const audioTest = testResults.find(
      t => t.test_code?.toLowerCase().includes('audio') ||
           t.test_name?.toLowerCase().includes('hearing')
    );
    const frequencies = ['500HZ', '1000HZ', '2000HZ', '3000HZ', '4000HZ', '6000HZ', '8000HZ'];
    const defaultLeft: Record<string, string> = {};
    const defaultRight: Record<string, string> = {};
    frequencies.forEach(f => {
      defaultLeft[f] = '10';
      defaultRight[f] = '10';
    });

    if (!audioTest) {
      return { left: defaultLeft, right: defaultRight };
    }
    const results = this.parseResults(audioTest);
    const leftEar = results.left_ear || results.left || {};
    const rightEar = results.right_ear || results.right || {};

    const left: Record<string, string> = {};
    const right: Record<string, string> = {};
    frequencies.forEach(f => {
      left[f] = String(leftEar[f] || results[`left_${f.toLowerCase()}`] || defaultLeft[f]);
      right[f] = String(rightEar[f] || results[`right_${f.toLowerCase()}`] || defaultRight[f]);
    });
    return { left, right };
  }

  /**
   * Extract vision data
   */
  static extractVision(testResults: TestResult[]): {
    right_acuity: string;
    left_acuity: string;
    color_vision: string;
  } {
    const visionTest = testResults.find(
      t => t.test_code?.toLowerCase().includes('vision') ||
           t.test_name?.toLowerCase().includes('eye')
    );
    const defaults = {
      right_acuity: '20/20',
      left_acuity: '20/20',
      color_vision: 'NAD',
    };
    if (!visionTest) return defaults;
    const results = this.parseResults(visionTest);
    return {
      right_acuity: String(results.right_acuity || results.od || results.right || defaults.right_acuity),
      left_acuity: String(results.left_acuity || results.os || results.left || defaults.left_acuity),
      color_vision: String(results.color_vision || results.color || results.colour || defaults.color_vision),
    };
  }

  /**
   * Extract urinalysis data
   */
  static extractUrinalysis(testResults: TestResult[]): {
    normal: boolean;
    hgt_mmol: string;
  } {
    const urineTest = testResults.find(
      t => t.test_code?.toLowerCase().includes('urinalysis') ||
           t.test_name?.toLowerCase().includes('urine')
    );
    const defaults = { normal: true, hgt_mmol: '5.2' };
    if (!urineTest) return defaults;
    const results = this.parseResults(urineTest);
    return {
      normal: results.normal !== false && results.result !== 'abnormal',
      hgt_mmol: String(results.hgt || results.hgt_mmol || results.glucose || defaults.hgt_mmol),
    };
  }

  /**
   * Extract chest X-ray status
   */
  static extractChestXray(testResults: TestResult[]): boolean {
    const xrayTest = testResults.find(
      t => t.test_code?.toLowerCase().includes('chest') ||
           t.test_name?.toLowerCase().includes('xray')
    );
    if (!xrayTest) return true;
    const results = this.parseResults(xrayTest);
    return results.normal !== false && results.result !== 'abnormal';
  }

  /**
   * Extract referral flags from test results and rules engine
   */
  static extractReferrals(
    testResults: TestResult[],
    rulesEvaluation?: any
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
      omp: false,
    };

    // Check test findings
    testResults.forEach(test => {
      const findings = test.findings?.toLowerCase() || '';
      const recs = test.recommendations?.toLowerCase() || '';
      const text = `${findings} ${recs}`;
      if (text.includes('audiologist') || text.includes('hearing')) referrals.audiologist = true;
      if (text.includes('optometrist') || text.includes('vision') || text.includes('eye')) referrals.optometrist = true;
      if (text.includes('lung') || text.includes('pulmonary') || text.includes('spirometry')) referrals.lung_function = true;
      if (text.includes('omp') || text.includes('occupational')) referrals.omp = true;
      if (text.includes('clinic') || text.includes('hospital')) referrals.local_clinic = true;
    });

    // Check rules engine recommendations
    if (rulesEvaluation?.referralsRecommended) {
      rulesEvaluation.referralsRecommended.forEach((ref: string) => {
        const r = ref.toLowerCase();
        if (r.includes('audiologist')) referrals.audiologist = true;
        if (r.includes('optometrist')) referrals.optometrist = true;
        if (r.includes('pulmonologist') || r.includes('lung')) referrals.lung_function = true;
        if (r.includes('omp') || r.includes('occupational')) referrals.omp = true;
        if (r.includes('clinic') || r.includes('hospital')) referrals.local_clinic = true;
      });
    }
    return referrals;
  }

  private static formatPercent(value: any): string | null {
    if (value == null) return null;
    const num = parseFloat(String(value).replace('%', ''));
    if (isNaN(num)) return String(value);
    return `${num}%`;
  }
}