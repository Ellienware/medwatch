// app/api/subscriptions/check/route.ts
import { getCurrentUser } from "@/lib/auth/actions"
import { getSubscriptionRepository } from "@/lib/repositories"

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      return Response.json({ 
        hasActiveSubscription: false,
        hasTrial: false
      })
    }

    const subscriptionRepo = getSubscriptionRepository()
    const subscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id)

    if (!subscription) {
      return Response.json({
        hasActiveSubscription: false,
        hasTrial: false,
        status: "no_subscription"
      })
    }

    // Check if trial is still active
    let trialActive = false
    let daysRemaining = 0
    
    if (subscription.status === "trial" && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      const now = new Date()
      trialActive = now < trialEnd
      
      if (trialActive) {
        const diffTime = trialEnd.getTime() - now.getTime()
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }
    }

    return Response.json({
      hasActiveSubscription: subscription.status === "active",
      hasTrial: subscription.status === "trial",
      trialActive,
      trialEndsAt: subscription.trial_ends_at,
      daysRemaining,
      subscription: subscription || null,
      status: subscription.status
    })
  } catch (error) {
    console.error("Subscription check error:", error)
    return Response.json({ 
      hasActiveSubscription: false,
      hasTrial: false,
      status: "error"
    })
  }
}