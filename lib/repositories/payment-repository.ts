// lib/repositories/payment-repository.ts
import { BaseRepository } from "./base-repository"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"

export type Payment = {
  id: string
  clinic_id: string
  subscription_id: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  payment_method: "card" | "bank_transfer" | "mobile_money"
  payment_provider: "paystack"
  payment_provider_transaction_id?: string | null
  payment_provider_reference?: string | null
  description: string
  metadata?: Record<string, any>
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export class PaymentRepository extends BaseRepository<Payment> {
  protected collectionId = COLLECTIONS.PAYMENTS

  constructor() {
    super("payment")
  }

  protected mapToEntity(doc: any): Payment {
    return {
      id: doc.$id,
      clinic_id: doc.clinic_id,
      subscription_id: doc.subscription_id,
      amount: doc.amount,
      currency: doc.currency,
      status: doc.status,
      payment_method: doc.payment_method,
      payment_provider: doc.payment_provider,
      payment_provider_transaction_id: doc.payment_provider_transaction_id || null,
      payment_provider_reference: doc.payment_provider_reference || null,
      description: doc.description,
      metadata: doc.metadata || {},
      paid_at: doc.paid_at || null,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
    }
  }

  async findByClinicId(clinicId: string, limit = 10): Promise<Payment[]> {
    return this.find([
      Query.equal("clinic_id", clinicId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ])
  }
}
