import { CheckCircle2, Download, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { reference?: string }
}) {
  const reference = searchParams.reference

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>

        <p className="text-lg text-muted-foreground mb-8">
          Your payment has been processed successfully. Your subscription is now active.
        </p>

        {reference && (
          <div className="bg-muted/50 rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground mb-1">Transaction Reference</p>
            <p className="font-mono text-sm font-semibold">{reference}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/clinic">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/clinic/billing">
                <Download className="mr-2 w-4 h-4" />
                Download Receipt
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </Card>
    </div>
  )
}
