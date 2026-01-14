// app/clinic/billing/page.tsx
import { Suspense } from "react"
import { CreditCard, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BillingOverview } from "@/components/clinic/billing/billing-overview"
import { BranchSubscriptions } from "@/components/clinic/billing/branch-subscriptions"
import { PaymentHistory } from "@/components/clinic/billing/payment-history"
import { UsageStats } from "@/components/clinic/billing/usage-stats"
import Link from "next/link"

export default function BillingPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your subscription, view payment history, and track usage across all branches
        </p>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<div>Loading...</div>}>
        <BillingOverview />
      </Suspense>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Subscription Details */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Your Subscription</h2>
                <p className="text-sm text-muted-foreground">Manage your plan and branches</p>
              </div>
              <Button asChild>
                <Link href="/clinic/billing/add-branch">
                  Add Branch
                </Link>
              </Button>
            </div>

            <Suspense fallback={<div>Loading subscription...</div>}>
              <BranchSubscriptions />
            </Suspense>
          </Card>

          {/* Payment History */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Payments</h2>
            <Suspense fallback={<div>Loading payments...</div>}>
              <PaymentHistory />
            </Suspense>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Usage This Month */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Usage This Month</h2>
            <Suspense fallback={<div>Loading usage...</div>}>
              <UsageStats />
            </Suspense>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/clinic/billing/invoices">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Invoices
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/clinic/billing/payment-methods">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Methods
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/clinic/billing/change-plan">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Change Plan
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}