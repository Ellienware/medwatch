import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/appwrite/auth"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { paystackConfig } from "@/lib/paystack/config"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
      },
    })

    const data = await response.json()

    if (!data.status || data.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const { databases } = createServerClient()

    // Find payment by paystack_reference
    const payments = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.INVOICES, [
      Query.equal("paystack_reference", reference),
    ])

    if (payments.documents.length > 0) {
      const payment = payments.documents[0]
      await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.INVOICES, payment.$id, {
        payment_status: "success",
        paid_at: new Date().toISOString(),
        payment_method: data.data.channel,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Paystack verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
