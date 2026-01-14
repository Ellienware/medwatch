// components/clinic/billing/add-branch-form.tsx - UPDATED
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Check, Plus, Minus, Calendar, Shield } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { PRICING_TIERS, calculateMonthlyPrice, validateTierAndBranches } from "@/lib/pricing/config"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AddBranchForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean
    hasTrial: boolean
    trialActive: boolean
    daysRemaining?: number
    trialEndsAt?: string
  } | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
  })
  
  const [pricingTier, setPricingTier] = useState<"single_branch" | "multi_branch">("single_branch")
  const [branchCount, setBranchCount] = useState(1)
  const [monthlyPrice, setMonthlyPrice] = useState(650000)
  const [trialEndDate, setTrialEndDate] = useState<string>("")

  useEffect(() => {
    loadSubscriptionStatus()
    calculateTrialEndDate()
  }, [])

  useEffect(() => {
    const price = calculateMonthlyPrice(pricingTier, branchCount)
    setMonthlyPrice(price)
  }, [pricingTier, branchCount])

  const loadSubscriptionStatus = async () => {
    try {
      console.log("🔍 Loading subscription status...")
      const response = await fetch("/api/subscriptions/check")
      const data = await response.json()
      console.log("📥 Subscription status:", data)
      setSubscriptionStatus(data)
    } catch (error) {
      console.error("Failed to load subscription status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTrialEndDate = () => {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    setTrialEndDate(endDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log("🔍 [DEBUG] Form submitted")
    console.log("📝 Form data:", formData)
    console.log("🎯 Subscription status:", subscriptionStatus)
    console.log("💲 Pricing tier:", pricingTier)
    console.log("🏢 Branch count:", branchCount)

    try {
      // Validate form data
      if (!formData.name || !formData.code || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        return
      }

      // Only validate for new subscriptions, not for adding to trial
      if (!subscriptionStatus?.hasTrial) {
        const validation = validateTierAndBranches(pricingTier, 0, branchCount)
        if (!validation.valid) {
          toast({
            title: "Invalid Selection",
            description: validation.error,
            variant: "destructive",
          })
          return
        }
      }

      // Check subscription status
      if (!subscriptionStatus) {
        throw new Error("Unable to determine subscription status")
      }

      console.log("🚀 Calling appropriate handler based on subscription status")

      if (subscriptionStatus.hasActiveSubscription) {
        console.log("💰 Calling: handleAddBranchToExisting (paid subscription)")
        await handleAddBranchToExisting()
      } else if (subscriptionStatus.hasTrial && subscriptionStatus.trialActive) {
        console.log("🎫 Calling: handleAddBranchToTrial (active trial)")
        await handleAddBranchToTrial()
      } else if (!subscriptionStatus.hasTrial && !subscriptionStatus.hasActiveSubscription) {
        console.log("🚀 Calling: handleStartFreeTrial (no subscription)")
        await handleStartFreeTrial()
      } else {
        console.log("⏰ Calling: handleTrialExpired (trial expired)")
        await handleTrialExpired()
      }
    } catch (error) {
      console.error("[Add Branch Error]:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartFreeTrial = async () => {
    console.log("🚀 Starting free trial...")
    
    const response = await fetch("/api/subscriptions/create-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        pricingTier,
        branchCount,
      }),
    })

    console.log("📥 Response status:", response.status)
    const data = await response.json()
    console.log("📥 Response data:", data)

    if (!response.ok) {
      throw new Error(data.error || "Failed to start trial")
    }

    toast({
      title: "Free Trial Started!",
      description: `Enjoy 30 days of free access to all features. Your trial ends on ${trialEndDate}.`,
      variant: "default",
    })

    // Redirect to dashboard
    router.push("/dashboard")
  }

  const handleAddBranchToTrial = async () => {
    console.log("📤 Adding branch to trial...")
    console.log("📝 Sending data:", {
      ...formData,
      is_active: true,
    })
    
    const response = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        is_active: true, // ✅ Explicitly set to true
      }),
    })

    console.log("📥 Response status:", response.status)
    const data = await response.json()
    console.log("📥 Response data:", data)

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to add branch")
    }

    toast({
      title: "Branch Added",
      description: data.message || "Branch added successfully to your trial account",
      variant: "default",
    })

    router.push("/dashboard")
  }

  const handleAddBranchToExisting = async () => {
    console.log("💰 Adding branch to existing subscription...")
    
    const response = await fetch("/api/branches/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        pricingTier,
        branchCount,
      }),
    })

    const data = await response.json()
    console.log("📥 Response:", data)

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to add branch")
    }

    if (data.requiresPayment) {
      const reference = `ADD-${Date.now()}`
      
      const paymentResponse = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          amount: data.additionalAmount,
          reference,
          metadata: {
            type: "add_branch",
            branch_name: formData.name,
            branch_code: formData.code,
            pricing_tier: pricingTier,
            branch_count: branchCount,
          },
        }),
      })

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentData.message || "Failed to initialize payment")
      }

      if (paymentData.status && paymentData.data?.authorization_url) {
        window.location.href = paymentData.data.authorization_url
      } else {
        throw new Error("No payment URL received from Paystack")
      }
    } else {
      router.push(`/clinic/billing/success?reference=${Date.now()}`)
    }
  }

  const handleTrialExpired = async () => {
    // Redirect to payment to start subscription
    const reference = `POSTTRIAL-${Date.now()}`

    const response = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        amount: monthlyPrice,
        reference,
        metadata: {
          type: "post_trial_subscription",
          pricing_tier: pricingTier,
          branch_count: branchCount,
          branch_name: formData.name,
          branch_code: formData.code,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to initialize payment")
    }

    if (data.status && data.data?.authorization_url) {
      window.location.href = data.data.authorization_url
    } else {
      throw new Error("No payment URL received from Paystack")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trial Status Banner */}
      {subscriptionStatus?.trialActive && (
        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <Calendar className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <span className="font-semibold">30-Day Free Trial Active</span> • 
            {subscriptionStatus.daysRemaining ? ` ${subscriptionStatus.daysRemaining} days remaining` : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Branch Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Branch Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Johannesburg Branch"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Branch Code *</Label>
            <Input
              id="code"
              placeholder="e.g., JHB-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="branch@clinic.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="011 123 4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="123 Main Street, Johannesburg, 2000"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Pricing Tier Selection - Only show if no active trial */}
      {!subscriptionStatus?.trialActive && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
          
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              <span>30-Day Free Trial Included</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Both plans include a full-featured 30-day free trial. No payment required to start.
            </p>
          </div>
          
          <RadioGroup 
            value={pricingTier} 
            onValueChange={(value) => setPricingTier(value as "single_branch" | "multi_branch")} 
            className="space-y-4"
          >
            {/* Single Branch Plan */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary cursor-pointer">
              <RadioGroupItem value="single_branch" id="single_branch" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="single_branch" className="text-lg font-medium cursor-pointer">
                    Single Branch Plan
                  </Label>
                </div>
                <p className="text-muted-foreground mt-1">
                  Perfect for clinics with only one location
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">{formatCurrency(PRICING_TIERS.SINGLE_BRANCH.basePrice)}</span>
                      <span className="text-sm text-muted-foreground ml-2">/month after trial</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    <Check className="w-4 h-4 inline mr-1" />
                    <span className="font-medium">Free for 30 days</span>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="multi_branch" className="text-lg font-medium cursor-pointer">
                    Multi-Branch Plan
                  </Label>
                </div>
                <p className="text-muted-foreground mt-1">
                  For clinics with multiple locations
                </p>
                
                {pricingTier === "multi_branch" && (
                  <div className="mt-4">
                    <Label htmlFor="branchCount" className="block mb-2 text-sm font-medium">
                      How many branches do you need?
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setBranchCount(Math.max(2, branchCount - 1))}
                        disabled={branchCount <= 2}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="text-center min-w-[100px]">
                        <span className="text-2xl font-semibold">{branchCount}</span>
                        <p className="text-xs text-muted-foreground">branch{branchCount > 1 ? 'es' : ''}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setBranchCount(branchCount + 1)}
                        disabled={branchCount >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">
                        {formatCurrency(calculateMonthlyPrice("multi_branch", branchCount))}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">/month after trial</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    <Check className="w-4 h-4 inline mr-1" />
                    <span className="font-medium">Free for 30 days</span>
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
      )}

      {/* Billing Summary */}
      <Card className="p-6 bg-muted/50">
        <h2 className="text-xl font-semibold mb-4">Billing Summary</h2>
        <div className="space-y-3">
          {subscriptionStatus?.trialActive ? (
            /* Active Trial */
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-green-800">30-Day Free Trial Active</span>
                  <p className="text-sm text-green-600">
                    Full access to all features • Ends on {subscriptionStatus.trialEndsAt ? new Date(subscriptionStatus.trialEndsAt).toLocaleDateString() : trialEndDate}
                  </p>
                </div>
                <span className="text-xl font-bold text-green-800">FREE</span>
              </div>
            </div>
          ) : subscriptionStatus?.hasActiveSubscription ? (
            /* Active Subscription */
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-blue-800">Active Subscription</span>
                  <p className="text-sm text-blue-600">
                    You have an active paid subscription
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* New Trial */
            <>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-green-800">30-Day Free Trial</span>
                    <p className="text-sm text-green-600">
                      Full access to all features • Ends on {trialEndDate}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-green-800">FREE</span>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">After trial ends:</span>
                  <span className="font-medium">
                    {pricingTier === "single_branch" ? "Single Branch Plan" : "Multi-Branch Plan"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Monthly Cost</span>
                  <span className="text-2xl font-bold">{formatCurrency(monthlyPrice)}</span>
                </div>
              </div>
            </>
          )}
          
          <div className="pt-3 border-t flex items-center justify-between">
            <div>
              <span className="font-semibold">
                {subscriptionStatus?.trialActive ? "Add Branch Today" : "Start Today"}
              </span>
              <p className="text-sm text-muted-foreground">
                {subscriptionStatus?.trialActive 
                  ? "Add a new branch to your trial account" 
                  : "No payment required for 30 days"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">FREE</div>
              <p className="text-xs text-muted-foreground">
                {subscriptionStatus?.trialActive ? "for trial period" : "for 30 days"}
              </p>
            </div>
          </div>
        </div>
        
        {!subscriptionStatus?.trialActive && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">How it works:</span> Start your free trial today. 
              After 30 days, you'll be automatically charged {formatCurrency(monthlyPrice)}/month for your selected plan. 
              Cancel anytime before trial ends.
            </p>
          </div>
        )}
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {subscriptionStatus?.hasActiveSubscription 
            ? "Continue to Payment" 
            : subscriptionStatus?.trialActive
            ? "Add Branch to Trial"
            : "Start Free Trial"
          }
        </Button>
      </div>
    </form>
  )
}