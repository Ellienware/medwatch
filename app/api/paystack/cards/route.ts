// app/api/paystack/cards/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/actions"
import { paystackConfig } from "@/lib/paystack/config"
import { getSubscriptionRepository } from "@/lib/repositories"

// GET - List customer's cards
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptionRepo = getSubscriptionRepository()
    const subscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id || "")

    if (!subscription?.paystack_subscription_id) {
      return NextResponse.json({ cards: [] })
    }

    // Fetch cards from Paystack
    const response = await fetch(
      `https://api.paystack.co/customer/${subscription.paystack_subscription_id}/card`,
      {
        headers: {
          Authorization: `Bearer ${paystackConfig.secretKey}`,
        },
      }
    )

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ cards: [] })
    }

    return NextResponse.json({ cards: data.data })
  } catch (error) {
    console.error("Get cards error:", error)
    return NextResponse.json({ cards: [] })
  }
}

// POST - Initialize card addition
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { email, amount } = body

    // Initialize transaction for card authorization
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackConfig.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email || user.email,
        amount: amount || 100, // Small amount for authorization
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paystack/card-callback`,
        metadata: {
          action: "add_card",
          user_id: user.id,
        },
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Initialize card error:", error)
    return NextResponse.json({ error: "Failed to initialize card addition" }, { status: 500 })
  }
}