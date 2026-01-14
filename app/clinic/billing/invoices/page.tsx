import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { formatCurrency } from "@/lib/paystack/config"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { getCurrentUser } from "@/lib/auth/actions"
import { Query } from "appwrite"
import Link from "next/link"

async function getInvoices() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.clinic_id) {
      return []
    }

    const appwrite = await createServerClient()

    const response = await appwrite.databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.INVOICES, [
      Query.equal("clinic_id", currentUser.clinic_id),
      Query.orderDesc("date"),
      Query.limit(100),
    ])

    return response.documents
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    // Return empty array on error to avoid breaking the page
    return []
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Invoices</h1>
        <p className="text-muted-foreground">View and download your billing invoices</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left text-sm font-semibold">Invoice</th>
                <th className="p-4 text-left text-sm font-semibold">Date</th>
                <th className="p-4 text-left text-sm font-semibold">Description</th>
                <th className="p-4 text-right text-sm font-semibold">Amount</th>
                <th className="p-4 text-center text-sm font-semibold">Status</th>
                <th className="p-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice: any) => (
                  <tr key={invoice.$id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Link 
                          href={`/clinic/billing/invoices/${invoice.$id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString("en-ZA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 text-sm">{invoice.description}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(invoice.total)}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : invoice.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
