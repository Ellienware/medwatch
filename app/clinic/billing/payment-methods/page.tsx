// app/clinic/billing/payment-methods/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, MoreHorizontal, Trash2, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
  is_default: boolean
  authorization_code: string
}

export default function PaymentMethodsPage() {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingPayment, setIsAddingPayment] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch("/api/paystack/cards")
      const data = await response.json()
      
      if (response.ok) {
        setPaymentMethods(data.cards || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load payment methods",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    setIsAddingPayment(true)
    
    try {
      // Initialize Paystack transaction for card authorization
      const response = await fetch("/api/paystack/initialize-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com", // Get from user session
          amount: 100, // Small amount to authorize card
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize card addition")
      }

      if (data.status && data.data.authorization_url) {
        // Open Paystack popup or redirect
        window.open(data.data.authorization_url, "_blank")
        
        toast({
          title: "Add Payment Method",
          description: "Please complete the payment form in the new window",
          variant: "default",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add payment method",
        variant: "destructive",
      })
    } finally {
      setIsAddingPayment(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/paystack/cards/${methodId}/default`, {
        method: "PUT",
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentMethods(methods =>
          methods.map(method => ({
            ...method,
            is_default: method.id === methodId
          }))
        )
        toast({
          title: "Success",
          description: "Default payment method updated",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update default payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive",
      })
    }
  }

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) return

    try {
      const response = await fetch(`/api/paystack/cards/${methodId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentMethods(methods => methods.filter(m => m.id !== methodId))
        toast({
          title: "Success",
          description: "Payment method removed",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove payment method",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      })
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your payment methods and billing information</p>
        </div>
        <Button onClick={handleAddPaymentMethod} disabled={isAddingPayment}>
          {isAddingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Alert>
          <AlertDescription>
            No payment methods found. Add a payment method to enable automatic billing after your trial ends.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="p-6 relative">
              {method.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle className="w-3 h-3" />
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!method.is_default && (
                      <DropdownMenuItem onClick={() => handleSetDefault(method.id)}>
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {method.brand} •••• {method.last4}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {method.exp_month.toString().padStart(2, "0")}/{method.exp_year}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {method.type}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Next billing date</span>
            <span className="font-medium">15 January 2024</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Billing cycle</span>
            <span className="font-medium">Monthly</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Payment processor</span>
            <span className="font-medium">Paystack</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
