// lib/utils/fitness-mapping.ts
import type { FitnessDecision, CertificateType, FitnessStatus } from '@/lib/types/database';

export const FITNESS_DECISIONS = {
  FIT: {
    value: 'fit' as FitnessDecision,
    label: 'Fit',
    description: 'Patient is fully fit for work without any restrictions',
    certificateType: 'fit_to_work' as CertificateType,
    fitnessStatus: 'fit' as FitnessStatus,
  },
  FIT_WITH_CONDITIONS: {
    value: 'fit_with_conditions' as FitnessDecision,
    label: 'Fit with Conditions',
    description: 'Fit for work with specific conditions to be monitored',
    certificateType: 'fit_with_restrictions' as CertificateType,
    fitnessStatus: 'fit_with_conditions' as FitnessStatus,
  },
  FIT_WITH_RESTRICTIONS: {
    value: 'fit_with_restrictions' as FitnessDecision,
    label: 'Fit with Restrictions',
    description: 'Fit for work but with specific job restrictions',
    certificateType: 'fit_with_restrictions' as CertificateType,
    fitnessStatus: 'fit_with_restrictions' as FitnessStatus,
  },
  TEMPORARILY_UNFIT: {
    value: 'temporarily_unfit' as FitnessDecision,
    label: 'Temporarily Unfit',
    description: 'Currently unfit, expected to recover',
    certificateType: 'unfit_to_work' as CertificateType,
    fitnessStatus: 'temporarily_unfit' as FitnessStatus,
  },
  PERMANENTLY_UNFIT: {
    value: 'permanently_unfit' as FitnessDecision,
    label: 'Permanently Unfit',
    description: 'Permanently unfit for the specified work',
    certificateType: 'unfit_to_work' as CertificateType,
    fitnessStatus: 'temporarily_unfit' as FitnessStatus, // certificate uses temporarily_unfit for both
  },
} as const;

export function fitnessDecisionToCertificateType(
  decision: FitnessDecision | null | undefined
): CertificateType {
  if (!decision) return 'fit_to_work';
  const entry = Object.values(FITNESS_DECISIONS).find(d => d.value === decision);
  return entry?.certificateType ?? 'fit_to_work';
}

export function certificateTypeToFitnessDecision(
  type: CertificateType
): FitnessDecision {
  switch (type) {
    case 'fit_to_work':
      return 'fit';
    case 'fit_with_restrictions':
      return 'fit_with_restrictions';
    case 'unfit_to_work':
      return 'temporarily_unfit'; // default to temporarily_unfit
    default:
      return 'fit';
  }
}

export function fitnessDecisionToFitnessStatus(
  decision: FitnessDecision | null | undefined
): FitnessStatus {
  if (!decision) return 'fit';
  const entry = Object.values(FITNESS_DECISIONS).find(d => d.value === decision);
  return entry?.fitnessStatus ?? 'fit';
}

export function certificateTypeToFitnessStatus(
  type: CertificateType
): FitnessStatus {
  switch (type) {
    case 'fit_to_work':
      return 'fit';
    case 'fit_with_restrictions':
      return 'fit_with_restrictions';
    case 'unfit_to_work':
      return 'temporarily_unfit';
    default:
      return 'fit';
  }
}

export const fitnessDecisionOptions = Object.values(FITNESS_DECISIONS).map(
  ({ value, label, description }) => ({ value, label, description })
);