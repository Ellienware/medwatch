// app/clinic/billing/invoices/[id]/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Copy, Printer, Mail, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { getCurrentUser } from "@/lib/auth/actions"
import Link from "next/link"
import { InvoiceExportButton } from "@/components/export/invoice-export-button"


type Invoice = {
  $id: string
  invoice_number: string
  date: string
  due_date?: string
  description: string
  total: number
  currency: string
  status: "pending" | "paid" | "overdue" | "cancelled"
  clinic_id: string
  subscription_id?: string
  paystack_reference?: string
  paid_at?: string
  payment_method?: string
  created_at: string
  updated_at: string
}

async function getInvoice(id: string): Promise<Invoice | null> {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser?.clinic_id) {
      return null
    }

    const appwrite = await createServerClient()
    const invoice = await appwrite.databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.INVOICES,
        id
    ) as unknown as Invoice

    // Security check: ensure invoice belongs to user's clinic
    if (invoice.clinic_id !== currentUser.clinic_id) {
      return null
    }

    return invoice
  } catch (error) {
    console.error("Failed to fetch invoice:", error)
    return null
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "paid":
      return {
        text: "Paid",
        variant: "default" as const,
        className: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200",
      }
    case "pending":
      return {
        text: "Pending",
        variant: "secondary" as const,
        className: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200",
      }
    case "overdue":
      return {
        text: "Overdue",
        variant: "destructive" as const,
        className: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200",
      }
    case "cancelled":
      return {
        text: "Cancelled",
        variant: "outline" as const,
        className: "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200",
      }
    default:
      return {
        text: status,
        variant: "outline" as const,
        className: "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200",
      }
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The invoice you're looking for doesn't exist or you don't have access.
          </p>
          <Button asChild>
            <Link href="/clinic/billing/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(invoice.status)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clinic/billing/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Invoice #{invoice.invoice_number}</h1>
            <p className="text-muted-foreground mt-1">
              Issued on {new Date(invoice.date).toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusConfig.className}>
            {statusConfig.text}
          </Badge>
          
          <InvoiceExportButton 
            invoiceId={invoice.$id}
            invoiceNumber={invoice.invoice_number}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Invoice Number</h3>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Issue Date</h3>
                <p className="font-medium">
                  {new Date(invoice.date).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {invoice.due_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                <p className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString("en-ZA", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="font-medium">{invoice.description}</p>
            </div>

            <Separator />

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Amount</h4>
                  <p className="text-2xl font-bold">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </p>
                </div>
                {invoice.paid_at && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Paid On</h4>
                    <p className="font-medium">
                      {new Date(invoice.paid_at).toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {invoice.paystack_reference && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Reference</h3>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {invoice.paystack_reference}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      "use client"
                      navigator.clipboard.writeText(invoice.paystack_reference!)
                    }}
                    title="Copy reference"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {invoice.payment_method && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h3>
                <p className="font-medium capitalize">{invoice.payment_method.replace('_', ' ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoiceExportButton 
              invoiceId={invoice.$id}
              invoiceNumber={invoice.invoice_number}
              fullWidth
            />
            
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/api/invoices/${invoice.$id}/download?format=pdf`}>
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Link>
            </Button>

            <Button variant="outline" className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>

            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Email Invoice
            </Button>

            {invoice.status === "pending" && (
              <Button className="w-full" asChild>
                <Link href={`/clinic/billing/pay/${invoice.$id}`}>
                  Pay Now
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}