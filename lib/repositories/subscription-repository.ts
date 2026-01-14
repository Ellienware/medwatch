// lib/repositories/subscription-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import type { Subscription, SubscriptionStatus, PricingTier } from "@/lib/types/billing"

export class SubscriptionRepository extends BaseRepository<Subscription> {
  protected collectionId = COLLECTIONS.SUBSCRIPTIONS

  constructor() {
    super("subscription")
  }

  protected mapToEntity(doc: any): Subscription {
    // Parse metadata from JSON string or use empty object
    let metadata: Record<string, any> = {}
    if (typeof doc.metadata === 'string' && doc.metadata.trim()) {
      try {
        metadata = JSON.parse(doc.metadata)
      } catch (error) {
        console.warn('Failed to parse metadata JSON:', error)
      }
    } else if (doc.metadata && typeof doc.metadata === 'object') {
      metadata = doc.metadata
    }
    
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      pricing_tier: doc.pricing_tier as PricingTier,
      total_branches: doc.total_branches || 1,
      amount: doc.amount || 0,
      status: doc.status as SubscriptionStatus,
      trial_started_at: doc.trial_started_at || null,
      trial_ends_at: doc.trial_ends_at || null,
      current_period_start: doc.current_period_start || new Date().toISOString(),
      current_period_end: doc.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      next_billing_date: doc.next_billing_date || null,
      paystack_subscription_id: doc.paystack_subscription_id || null,
      paystack_reference: doc.paystack_reference || null,
      payment_method_id: doc.payment_method_id || null,
      metadata: metadata,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  // Override create to handle metadata serialization
  async create(data: Partial<Subscription>): Promise<Subscription> {
    // Stringify metadata if it's an object
    const preparedData: any = { ...data }
    
    if (preparedData.metadata && typeof preparedData.metadata === 'object') {
      preparedData.metadata = JSON.stringify(preparedData.metadata)
    }
    
    // Convert Date objects to ISO strings
    const dateFields = ['trial_started_at', 'trial_ends_at', 'current_period_start', 'current_period_end', 'next_billing_date']
    
    for (const field of dateFields) {
      if (preparedData[field] && preparedData[field] instanceof Date) {
        preparedData[field] = preparedData[field].toISOString()
      }
    }
    
    return super.create(preparedData)
  }

  // Override update to handle metadata serialization
  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    // Stringify metadata if it's an object
    const preparedData: any = { ...data }
    
    if (preparedData.metadata && typeof preparedData.metadata === 'object') {
      preparedData.metadata = JSON.stringify(preparedData.metadata)
    }
    
    // Convert Date objects to ISO strings
    const dateFields = ['trial_started_at', 'trial_ends_at', 'current_period_start', 'current_period_end', 'next_billing_date']
    
    for (const field of dateFields) {
      if (preparedData[field] && preparedData[field] instanceof Date) {
        preparedData[field] = preparedData[field].toISOString()
      }
    }
    
    return super.update(id, preparedData)
  }

  async findByClinicId(clinicId: string): Promise<Subscription[]> {
    return this.find([Query.equal("clinic_id", clinicId), Query.orderDesc("$createdAt")])
  }

  async findActiveByClinicId(clinicId: string): Promise<Subscription | null> {
    const subscriptions = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", "active"),
      Query.limit(1),
    ])
    return subscriptions[0] || null
  }

  async findActiveOrTrialByClinicId(clinicId: string): Promise<Subscription | null> {
    const subscriptions = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.or([
        Query.equal("status", "active"),
        Query.equal("status", "trial"),
      ]),
      Query.limit(1),
    ])
    return subscriptions[0] || null
  }

  async findPendingByClinicId(clinicId: string): Promise<Subscription | null> {
    const subscriptions = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", "pending"),
      Query.limit(1),
    ])
    return subscriptions[0] || null
  }

  async findExpiredByClinicId(clinicId: string): Promise<Subscription | null> {
    const subscriptions = await this.find([
      Query.equal("clinic_id", clinicId),
      Query.equal("status", "expired"),
      Query.limit(1),
    ])
    return subscriptions[0] || null
  }

  async updateTotalBranches(subscriptionId: string, totalBranches: number, newAmount: number): Promise<Subscription> {
    return this.update(subscriptionId, {
      total_branches: totalBranches,
      amount: newAmount,
    })
  }

  async findByPaystackReference(reference: string): Promise<Subscription[]> {
    return this.find([
      Query.equal("paystack_reference", reference),
    ])
  }

  async findByPaymentMethodId(paymentMethodId: string): Promise<Subscription[]> {
    return this.find([
      Query.equal("payment_method_id", paymentMethodId),
    ])
  }

  // Create trial subscription - WORKING VERSION
  async createTrial(clinicId: string, pricingTier: string, branchCount: number): Promise<Subscription> {
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 30) // 30-day trial
    
    // Prepare metadata as object
    const metadata = {
      trial_started: new Date().toISOString(),
      selected_plan: pricingTier,
      branch_count: branchCount,
    }
    
    // Use type assertion to bypass TypeScript checks temporarily
    const subscriptionData = {
      clinic_id: clinicId,
      pricing_tier: pricingTier,
      total_branches: branchCount,
      amount: 0,
      status: "trial",
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEnds.toISOString(),
      next_billing_date: trialEnds.toISOString(),
      paystack_subscription_id: null,
      paystack_reference: null,
      payment_method_id: null,
      metadata: JSON.stringify(metadata), // Stringify it here
    } as any // Use 'as any' to bypass TypeScript checks
    
    return this.create(subscriptionData)
  }

  // Helper method to check if trial is active
  async isTrialActive(subscription: Subscription): Promise<boolean> {
    if (subscription.status !== "trial") return false
    if (!subscription.trial_ends_at) return false
    return new Date() < new Date(subscription.trial_ends_at)
  }

  // Helper method to get days remaining in trial
  async getTrialDaysRemaining(subscription: Subscription): Promise<number | null> {
    if (subscription.status !== "trial" || !subscription.trial_ends_at) return null
    
    const now = new Date()
    const trialEnd = new Date(subscription.trial_ends_at)
    const diffTime = trialEnd.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Find active trials
  async findActiveTrials(): Promise<Subscription[]> {
    // Note: Appwrite doesn't support date comparisons directly
    // We'll fetch all trials and filter client-side
    const allTrials = await this.find([
      Query.equal("status", "trial"),
      Query.orderAsc("trial_ends_at"),
    ])
    
    return allTrials.filter(sub => {
      if (!sub.trial_ends_at) return false
      const trialEnd = new Date(sub.trial_ends_at)
      return trialEnd > new Date()
    })
  }

  // Find trials expiring within X days
  async findTrialsExpiringSoon(days: number = 3): Promise<Subscription[]> {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + days)
    
    const allTrials = await this.find([
      Query.equal("status", "trial"),
      Query.orderAsc("trial_ends_at"),
    ])
    
    return allTrials.filter(sub => {
      if (!sub.trial_ends_at) return false
      const trialEnd = new Date(sub.trial_ends_at)
      return trialEnd > now && trialEnd <= futureDate
    })
  }

  // Convert trial to active subscription
  async convertTrialToActive(
    subscriptionId: string,
    amount: number,
    paystackReference: string,
    paystackSubscriptionId?: string,
    paymentMethodId?: string
  ): Promise<Subscription> {
    const now = new Date()
    const nextBilling = new Date()
    nextBilling.setMonth(nextBilling.getMonth() + 1)
    
    const subscription = await this.findById(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }
    
    // Prepare metadata update
    const updatedMetadata = {
      ...subscription.metadata,
      trial_converted_at: now.toISOString(),
      conversion_reference: paystackReference,
    }
    
    return this.update(subscriptionId, {
      status: "active",
      amount: amount,
      paystack_reference: paystackReference,
      paystack_subscription_id: paystackSubscriptionId || null,
      payment_method_id: paymentMethodId || null,
      current_period_start: now.toISOString(),
      current_period_end: nextBilling.toISOString(),
      next_billing_date: nextBilling.toISOString(),
      metadata: updatedMetadata,
    } as any) // Use type assertion
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    const subscription = await this.findById(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`)
    }
    
    // Prepare metadata update
    const updatedMetadata = {
      ...subscription.metadata,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    }
    
    return this.update(subscriptionId, {
      status: "cancelled",
      next_billing_date: null,
      metadata: updatedMetadata,
    } as any) // Use type assertion
  }

  // Update subscription status
  async updateStatus(subscriptionId: string, status: SubscriptionStatus): Promise<Subscription> {
    return this.update(subscriptionId, { status } as any)
  }

  // Mark subscription as past due
  async markAsPastDue(subscriptionId: string): Promise<Subscription> {
    return this.update(subscriptionId, { status: "past_due" } as any)
  }

  // Renew subscription
  async renewSubscription(
    subscriptionId: string,
    amount: number,
    periodStart: Date,
    periodEnd: Date,
    nextBilling: Date
  ): Promise<Subscription> {
    return this.update(subscriptionId, {
      amount: amount,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_date: nextBilling.toISOString(),
      status: "active",
    } as any)
  }

  // Get subscription statistics for a clinic
  async getClinicSubscriptionStats(clinicId: string): Promise<{
    active: number
    trial: number
    cancelled: number
    expired: number
    total: number
  }> {
    const allSubscriptions = await this.findByClinicId(clinicId)
    
    const stats = {
      active: 0,
      trial: 0,
      cancelled: 0,
      expired: 0,
      total: allSubscriptions.length
    }
    
    for (const sub of allSubscriptions) {
      switch (sub.status) {
        case 'active':
          stats.active++
          break
        case 'trial':
          stats.trial++
          break
        case 'cancelled':
          stats.cancelled++
          break
        case 'expired':
          stats.expired++
          break
      }
    }
    
    return stats
  }
}