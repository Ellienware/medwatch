// lib/types/billing.ts

// Import core types if needed
import { type Clinic, type Branch, type User } from "./database"

// Plan and pricing types

export type PricingTier = "single_branch" | "multi_branch"


// Main subscription interface
// lib/types/billing.ts - Simplified since Clinic now includes billing
export type SubscriptionPlan = "trial" | "single_branch" | "multi_branch"
export type SubscriptionStatus = "trial" | "active" | "pending" | "cancelled" | "suspended" | "expired" | "past_due"

// Keep only Subscription interface since Clinic now has billing fields
export interface Subscription {
  id: string
  clinic_id: string
  pricing_tier: "single_branch" | "multi_branch"
  total_branches: number
  amount: number
  status: SubscriptionStatus
  trial_started_at: string | null
  trial_ends_at: string | null
  current_period_start: string
  current_period_end: string
  next_billing_date: string | null
  paystack_subscription_id: string | null
  paystack_reference: string | null
  payment_method_id: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Keep other billing interfaces as needed (Payment, PaymentMethod, Invoice, etc.)
export interface Payment {
  id: string
  clinic_id: string
  subscription_id: string | null
  payment_type: "subscription" | "setup_fee" | "invoice" | "trial_activation" | "plan_change"
  amount: number
  currency: string
  paystack_reference: string
  paystack_transaction_id: string | null
  paystack_authorization_code: string | null
  status: "pending" | "success" | "failed" | "cancelled" | "refunded"
  payment_method: "card" | "bank_transfer" | "mobile_money" | null
  paid_at: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any>
  description: string | null
  invoice_number: string | null
  invoice_url: string | null
  receipt_url: string | null
  is_recurring: boolean
  retry_count: number
  last_retry_at: string | null
}

// Payment interface
export interface Payment {
  id: string
  clinic_id: string
  subscription_id: string | null
  payment_type: "subscription" | "setup_fee" | "invoice" | "trial_activation" | "plan_change"
  amount: number
  currency: string
  paystack_reference: string
  paystack_transaction_id: string | null
  paystack_authorization_code: string | null
  status: "pending" | "success" | "failed" | "cancelled" | "refunded"
  payment_method: "card" | "bank_transfer" | "mobile_money" | null
  paid_at: string | null
  created_at: string
  updated_at: string
  metadata: Record<string, any>
  description: string | null
  invoice_number: string | null
  invoice_url: string | null
  receipt_url: string | null
  is_recurring: boolean
  retry_count: number
  last_retry_at: string | null
}

// Payment method interface
export interface PaymentMethod {
  id: string
  clinic_id: string
  type: "card" | "bank"
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  authorization_code: string  // Paystack authorization code
  bank: string | null
  country_code: string | null
  is_default: boolean
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// Invoice interface
export interface Invoice {
  id: string
  clinic_id: string
  subscription_id: string | null
  invoice_number: string
  period_start: string
  period_end: string
  amount_due: number
  amount_paid: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  due_date: string | null
  paid_at: string | null
  pdf_url: string | null
  line_items: Array<{
    description: string
    amount: number
    quantity: number
    unit_price: number
  }>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Branch subscription interface (per-branch billing)
export interface BranchSubscription {
  id: string
  clinic_id: string
  branch_id: string
  plan_id: string
  status: "active" | "trial" | "cancelled" | "suspended" | "expired" | "pending"
  start_date: string
  end_date: string | null
  trial_end_date: string | null
  trial_started_at: string | null
  
  // Paystack integration
  paystack_subscription_code: string | null
  paystack_customer_code: string | null
  
  // Pricing
  monthly_price: number
  setup_fee_paid: boolean
  setup_fee_amount: number | null
  
  // Additional fields
  is_active: boolean
  auto_renew: boolean
  next_billing_date: string | null
  
  created_at: string
  updated_at: string
}

// Usage tracking interface
export interface UsageTracking {
  id: string
  clinic_id: string
  branch_id: string | null
  subscription_id: string | null
  
  // Period
  period_start: string
  period_end: string
  
  // Usage metrics
  patients_registered: number
  appointments_created: number
  tests_performed: number
  certificates_issued: number
  storage_used_mb: number
  
  // Subscription-specific limits
  plan_limit_patients: number | null
  plan_limit_storage_mb: number | null
  plan_limit_branches: number | null
  
  // Overage tracking
  overage_patients: number
  overage_storage_mb: number
  overage_charges: number
  
  created_at: string
  updated_at: string
}

// Trial reminder interface
export interface TrialReminder {
  id: string
  clinic_id: string
  subscription_id: string
  reminder_type: "7_days" | "3_days" | "1_day" | "trial_ended" | "payment_failed"
  sent_at: string
  sent_to: string  // Email address
  status: "sent" | "failed" | "opened"
  error_message: string | null
  created_at: string
  updated_at: string
}

// Subscription plan interface (configuration)
export interface SubscriptionPlanConfig {
  id: string
  name: string
  description: string | null
  monthly_price_per_branch: number
  setup_fee_per_branch: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  // New fields for trial support
  trial_days: number | null
  max_branches: number | null
  patient_limit: number | null
  storage_limit_mb: number | null
}

// Paystack configuration
export interface PaystackConfig {
  publicKey: string
  secretKey: string
  enableTestMode: boolean
  webhookSecret: string | null
}

// Webhook event interface for Paystack
export interface WebhookEvent {
  id: string
  event_type: string
  paystack_event: string
  paystack_reference: string | null
  paystack_transaction_id: string | null
  data: Record<string, any>
  status: "pending" | "processed" | "failed"
  attempts: number
  last_attempt_at: string | null
  error_message: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

// Extended clinic interface with billing fields
export interface ClinicWithBilling extends Clinic {
  // Billing fields
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  trial_started_at: string | null
  trial_ends_at: string | null
  selected_plan: "single_branch" | "multi_branch" | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  next_billing_date: string | null
  monthly_patient_limit: number
  current_month_patients: number
  paystack_customer_id: string | null
  paystack_subscription_id: string | null
  payment_method_id: string | null
  max_branches: number
  current_branches: number
}

// Pricing calculation types
export interface PricingTierConfig {
  name: string
  basePrice: number  // In cents
  perBranchPrice?: number  // In cents, for multi-branch plans
  maxBranches?: number
  features: string[]
}

export interface PricingValidation {
  valid: boolean
  error?: string
  maxBranches?: number
}

// Billing summary types
export interface BillingSummary {
  currentPeriod: {
    start: string
    end: string
  }
  nextBillingDate: string
  amountDue: number
  currency: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  branches: {
    total: number
    active: number
    limit: number
  }
  usage: {
    patients: number
    appointments: number
    tests: number
    certificates: number
    storage: number
    limits?: {
      patients?: number
      storage?: number
    }
  }
}

export { Clinic }
