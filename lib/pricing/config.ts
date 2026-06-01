// lib/pricing/config.ts
export const PRICING_TIERS = {
  SINGLE_BRANCH: {
    id: "single_branch",
    name: "Single Branch Plan",
    description: "Perfect for clinics with only one location",
    basePrice: 650000, // R6,500 in cents
    perBranchPrice: 0,
    minBranches: 1,
    maxBranches: 1,
    features: [
      "1 branch included",
      "All features included",
      "Unlimited patients",
      "Standard support",
    ],
  },
  MULTI_BRANCH: {
    id: "multi_branch",
    name: "Multi-Branch Plan",
    description: "For clinics with multiple locations",
    basePrice: 650000, // R6,500 for first branch
    perBranchPrice: 500000, // R5,000 per additional branch
    minBranches: 2,
    maxBranches: 10, // Or whatever limit you want
    features: [
      "R6,500 for first branch",
      "R5,000 per additional branch",
      "Centralized management",
      "Priority support",
      "Bulk operations",
    ],
  },
} as const

export type PricingTier = keyof typeof PRICING_TIERS

export function calculateMonthlyPrice(
  tierId: string,
  branchCount: number
): number {
  if (tierId === "single_branch") {
    return PRICING_TIERS.SINGLE_BRANCH.basePrice
  }

  // Multi-branch tier
  const basePrice = PRICING_TIERS.MULTI_BRANCH.basePrice
  const additionalBranches = Math.max(0, branchCount - 1)
  const additionalCost = additionalBranches * PRICING_TIERS.MULTI_BRANCH.perBranchPrice
  
  return basePrice + additionalCost
}

export function validateTierAndBranches(
  tierId: string,
  currentBranches: number,
  newTotalBranches: number
): { valid: boolean; error?: string } {
  const tier = tierId === "single_branch" ? PRICING_TIERS.SINGLE_BRANCH : PRICING_TIERS.MULTI_BRANCH

  // For trial start, we only check if single branch plan is selected
  if (tierId === "single_branch" && newTotalBranches > 1) {
    return {
      valid: false,
      error: "Single Branch plan supports maximum 1 branch.",
    }
  }

  if (tier.maxBranches && newTotalBranches > tier.maxBranches) {
    return {
      valid: false,
      error: `${tier.name} supports maximum ${tier.maxBranches} branches. Please contact support for enterprise pricing.`,
    }
  }

  return { valid: true }
}


export function getTierDetails(tierId: string) {
  return tierId === "single_branch" ? PRICING_TIERS.SINGLE_BRANCH : PRICING_TIERS.MULTI_BRANCH
}

export function calculateProratedAmount(
  oldAmount: number,
  newAmount: number,
  daysRemaining: number,
  totalDaysInCycle: number = 30
): number {
  const dailyOldRate = oldAmount / totalDaysInCycle
  const dailyNewRate = newAmount / totalDaysInCycle
  const dailyDifference = dailyNewRate - dailyOldRate
  
  return Math.round(dailyDifference * daysRemaining)
}
