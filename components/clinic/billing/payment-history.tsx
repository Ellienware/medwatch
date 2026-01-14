// components/clinic/billing/payment-history.tsx
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { getCurrentUser } from "@/lib/auth/actions"
import { PaymentRepository } from "@/lib/repositories/payment-repository"

async function getPaymentHistory() {
  const user = await getCurrentUser()
  if (!user?.clinic_id) {
    return []
  }

  try {
    const paymentRepo = new PaymentRepository()
    const payments = await paymentRepo.findByClinicId(user.clinic_id, 20)

    return payments.map((payment) => ({
      id: payment.id,
      date: payment.paid_at || payment.created_at,
      description: payment.description,
      amount: payment.amount,
      status: payment.status,
      reference: payment.payment_provider_reference || payment.id.slice(0, 8).toUpperCase(),
      currency: payment.currency,
    }))
  } catch (error) {
    console.error("Error fetching payment history:", error)
    return []
  }
}

export async function PaymentHistory() {
  const payments = await getPaymentHistory()

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          text: "Completed",
          color: "bg-green-50 text-green-700 border-green-200",
        }
      case "failed":
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          text: "Failed",
          color: "bg-red-50 text-red-700 border-red-200",
        }
      case "pending":
        return {
          icon: <Clock className="w-4 h-4 text-yellow-500" />,
          text: "Pending",
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        }
      case "refunded":
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-500" />,
          text: "Refunded",
          color: "bg-blue-50 text-blue-700 border-blue-200",
        }
      default:
        return {
          icon: null,
          text: status,
          color: "bg-gray-50 text-gray-700 border-gray-200",
        }
    }
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Download className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No payment history</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your payment transactions will appear here once you make your first payment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Recent Transactions</h3>
        <span className="text-sm text-muted-foreground">
          {payments.length} transaction{payments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {payments.map((payment) => {
        const statusConfig = getStatusConfig(payment.status)

        return (
          <div
            key={payment.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {statusConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{payment.description}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusConfig.color}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      {new Date(payment.date).toLocaleDateString("en-ZA", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      Ref: {payment.reference}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-right">
                <div className="text-lg font-semibold whitespace-nowrap">
                  {formatCurrency(payment.amount, payment.currency)}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {payment.currency}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
                title="Download receipt"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}