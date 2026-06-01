// app/clinic/billing/change-plan/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, Loader2, ArrowLeft, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { PRICING_TIERS, calculateMonthlyPrice, validateTierAndBranches } from "@/lib/pricing/config"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChangePlanPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<{
    pricing_tier: string
    total_branches: number
    amount: number
  } | null>(null)
  const [selectedTier, setSelectedTier] = useState<"single_branch" | "multi_branch">("single_branch")
  const [branchCount, setBranchCount] = useState(2) // Default for multi-branch
  const [error, setError] = useState<string | null>(null)
  const [comparison, setComparison] = useState<{
    currentMonthly: number
    newMonthly: number
    priceDifference: number
  } | null>(null)

  // Load current subscription
  useEffect(() => {
    async function loadCurrentPlan() {
      try {
        const response = await fetch("/api/subscriptions/check")
        const data = await response.json()

        if (data.subscription) {
          setCurrentPlan(data.subscription)
          setSelectedTier(data.subscription.pricing_tier || "single_branch")
          setBranchCount(data.subscription.total_branches || 1)
        }
      } catch (error) {
        console.error("Failed to load current plan:", error)
        setError("Failed to load your current subscription details.")
      } finally {
        setIsLoading(false)
      }
    }

    loadCurrentPlan()
  }, [])

  // Calculate comparison when selection changes
  useEffect(() => {
    if (!currentPlan) return

    const newMonthlyPrice = calculateMonthlyPrice(selectedTier, branchCount)
    const priceDifference = newMonthlyPrice - currentPlan.amount

    setComparison({
      currentMonthly: currentPlan.amount,
      newMonthly: newMonthlyPrice,
      priceDifference,
    })
  }, [selectedTier, branchCount, currentPlan])

  const handleSubmit = async () => {
    if (!currentPlan) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate the new plan
      const validation = validateTierAndBranches(selectedTier, 0, branchCount)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Check if there's actually a change
      const isSameTier = selectedTier === currentPlan.pricing_tier
      const isSameBranches = branchCount === currentPlan.total_branches
      
      if (isSameTier && isSameBranches) {
        setError("You're already on this plan with the same number of branches.")
        setIsSubmitting(false)
        return
      }

      // Prepare the plan change request
      const response = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newTier: selectedTier,
          newBranchCount: branchCount,
          currentPlan: currentPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process plan change")
      }

      if (data.requiresPayment) {
        // Redirect to payment
        const paymentResponse = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            amount: data.amount,
            reference: `PLAN-${Date.now()}`,
            metadata: {
              type: "change_plan",
              new_tier: selectedTier,
              new_branch_count: branchCount,
              current_tier: currentPlan.pricing_tier,
              current_branch_count: currentPlan.total_branches,
            },
          }),
        })

        const paymentData = await paymentResponse.json()

        if (paymentData.status) {
          window.location.href = paymentData.data.authorization_url
        } else {
          throw new Error(paymentData.message)
        }
      } else {
        // No payment required, show success and redirect
        alert("Your plan has been updated successfully!")
        router.push("/clinic/billing")
      }
    } catch (error) {
      console.error("Plan change error:", error)
      setError(error instanceof Error ? error.message : "Failed to change plan. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your current plan...</p>
        </div>
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Change Plan</h1>
          <p className="text-muted-foreground">
            You don't have an active subscription. Please subscribe first.
          </p>
        </div>
        <Card className="p-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active subscription found. Please go to the billing page to subscribe.
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push("/clinic/billing")}>
              Go to Billing
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
        <h1 className="text-3xl font-bold mb-2">Change Your Plan</h1>
        <p className="text-muted-foreground">
          Choose the plan that best fits your clinic's needs. Changes take effect immediately.
        </p>
      </div>

      {/* Current Plan Summary */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {currentPlan.pricing_tier === "single_branch" ? "Single Branch Plan" : "Multi-Branch Plan"}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentPlan.total_branches} branch{currentPlan.total_branches > 1 ? 'es' : ''} • {formatCurrency(currentPlan.amount)}/month
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Billed monthly</p>
          </div>
        </div>
      </Card>

      {/* New Plan Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select New Plan</h2>
        
        <RadioGroup 
          value={selectedTier} 
          onValueChange={(value) => setSelectedTier(value as "single_branch" | "multi_branch")} 
          className="space-y-4"
        >
          {/* Single Branch Plan */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
            <RadioGroupItem value="single_branch" id="single_branch" />
            <div className="flex-1">
              <Label htmlFor="single_branch" className="text-lg font-medium cursor-pointer">
                Single Branch Plan
              </Label>
              <p className="text-muted-foreground mt-1">
                Perfect for clinics with only one location
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(PRICING_TIERS.SINGLE_BRANCH.basePrice)}</span>
                  <span className="text-sm text-muted-foreground">per month</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {PRICING_TIERS.SINGLE_BRANCH.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Multi-Branch Plan */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
            <RadioGroupItem value="multi_branch" id="multi_branch" />
            <div className="flex-1">
              <Label htmlFor="multi_branch" className="text-lg font-medium cursor-pointer">
                Multi-Branch Plan
              </Label>
              <p className="text-muted-foreground mt-1">
                For clinics with multiple locations
              </p>
              

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {formatCurrency(calculateMonthlyPrice("multi_branch", branchCount))}
                  </span>
                  <span className="text-sm text-muted-foreground">per month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {branchCount === 1 ? "1 branch" : 
                   `R6,500 for first branch + R5,000 for each additional (${branchCount} total)`}
                </p>
                <ul className="mt-3 space-y-2">
                  {PRICING_TIERS.MULTI_BRANCH.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </RadioGroup>
      </Card>

      {/* Plan Comparison */}
      {comparison && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <p className="text-2xl font-bold mb-1">{formatCurrency(comparison.currentMonthly)}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan.pricing_tier === "single_branch" ? "Single Branch" : "Multi-Branch"} • {currentPlan.total_branches} branch{currentPlan.total_branches > 1 ? 'es' : ''}
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-2">New Plan</h3>
                <p className="text-2xl font-bold mb-1">{formatCurrency(comparison.newMonthly)}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTier === "single_branch" ? "Single Branch" : "Multi-Branch"} • {selectedTier === "single_branch" ? "1 branch" : `${branchCount} branches`}
                </p>
              </div>
            </div>

            {/* Price Change Summary */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Price Change Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current monthly cost</span>
                  <span>{formatCurrency(comparison.currentMonthly)}</span>
                </div>
                <div className="flex justify-between">
                  <span>New monthly cost</span>
                  <span>{formatCurrency(comparison.newMonthly)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Monthly difference</span>
                    <span className={comparison.priceDifference > 0 ? "text-green-600" : 
                                     comparison.priceDifference < 0 ? "text-red-600" : "text-muted-foreground"}>
                      {comparison.priceDifference > 0 ? "+" : ""}{formatCurrency(comparison.priceDifference)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
{comparison?.priceDifference && comparison.priceDifference !== 0 && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {comparison.priceDifference > 0 ? (
        <>
          Your monthly subscription will <strong>increase by {formatCurrency(comparison.priceDifference)}</strong> starting 
          from your next billing cycle. You'll be charged the difference immediately.
        </>
      ) : (
        <>
          Your monthly subscription will <strong>decrease by {formatCurrency(Math.abs(comparison.priceDifference))}</strong> starting 
          from your next billing cycle. The difference will be credited to your account.
        </>
      )}
    </AlertDescription>
  </Alert>
)}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/clinic/billing")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !comparison || comparison?.priceDifference === 0}
            >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {comparison?.priceDifference && comparison.priceDifference > 0 ? "Continue to Payment" : "Confirm Change"}
            </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-muted-foreground text-center">
        <p>
          Plan changes take effect immediately. If you're downgrading, the change will apply from your next billing cycle.
          Any prorated credits or charges will be reflected in your next invoice.
        </p>
      </div>
    </div>
  )
}
