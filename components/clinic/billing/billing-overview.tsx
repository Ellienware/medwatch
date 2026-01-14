// components/clinic/billing/billing-overview.tsx - UPDATED
import { Card } from "@/components/ui/card"
import { Building2, CreditCard, TrendingUp, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { getCurrentUser } from "@/lib/auth/actions"
import { getSubscriptionRepository } from "@/lib/repositories"
import { Query } from "appwrite"
import { COLLECTIONS } from "@/lib/appwrite/config"
import { createServerClient } from "@/lib/appwrite/server-client"

async function getBillingOverview() {
  const user = await getCurrentUser()
  if (!user?.clinic_id) {
    return {
      totalBranches: 0,
      monthlyTotal: 0,
      nextBillingDate: new Date().toISOString(),
      currentPeriodUsage: { patients: 0, appointments: 0, certificates: 0 },
      subscriptionPlan: "No active plan",
    }
  }

  const subscriptionRepo = getSubscriptionRepository()
  // Get active OR trial subscription (matching branch-subscriptions.tsx)
  const subscription = await subscriptionRepo.findActiveOrTrialByClinicId(user.clinic_id)

  // Calculate based on subscription
  let monthlyTotal = 0
  let subscriptionPlan = "No active plan"
  let totalBranches = 0
  let nextBillingDate = new Date().toISOString()
  
  if (subscription) {
    monthlyTotal = subscription.amount
    subscriptionPlan = subscription.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch"
    // Use total_branches from subscription, default to 1 if 0 or undefined
    totalBranches = subscription.total_branches || 1
    nextBillingDate = subscription.current_period_end || new Date().toISOString()
  }

  // Get usage stats from Appwrite
  const { databases } = createServerClient()
  const [patients, appointments, certificates] = await Promise.all([
    databases
      .listDocuments(COLLECTIONS.PATIENTS, Query.equal("clinic_id", user.clinic_id))
      .then((r) => r.total)
      .catch(() => 0),
    databases
      .listDocuments(COLLECTIONS.APPOINTMENTS, Query.equal("clinic_id", user.clinic_id))
      .then((r) => r.total)
      .catch(() => 0),
    databases
      .listDocuments(COLLECTIONS.CERTIFICATES, Query.equal("clinic_id", user.clinic_id))
      .then((r) => r.total)
      .catch(() => 0),
  ])

  return {
    totalBranches,
    monthlyTotal,
    nextBillingDate,
    subscriptionPlan,
    currentPeriodUsage: { patients, appointments, certificates },
  }
}

export async function BillingOverview() {
  const data = await getBillingOverview()

  const stats = [
    {
      label: "Active Branches",
      value: data.totalBranches.toString(),
      icon: Building2,
      description: data.subscriptionPlan,
    },
    {
      label: "Monthly Total",
      value: formatCurrency(data.monthlyTotal),
      icon: CreditCard,
      description: data.subscriptionPlan === "Single Branch" ? "R6,500/month" : "Multi-branch pricing",
    },
    {
      label: "Next Billing",
      value: new Date(data.nextBillingDate).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
      }),
      icon: Calendar,
      description: "Auto-renewal enabled",
    },
    {
      label: "This Month",
      value: `${data.currentPeriodUsage.appointments} appts`,
      icon: TrendingUp,
      description: `${data.currentPeriodUsage.patients} patients`,
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </Card>
        )
      })}
    </div>
  )
}