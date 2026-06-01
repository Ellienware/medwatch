// lib/actions/invoice-export-actions.ts
"use server"

import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { getCurrentUser } from "@/lib/auth/actions"
import { jsPDF } from "jspdf"
import { format } from "date-fns"

export async function exportInvoice(invoiceId: string, formatType: 'pdf' | 'csv' = 'pdf') {
  try {
    const user = await getCurrentUser()
    
    if (!user?.clinic_id) {
      throw new Error("Unauthorized")
    }

    const { databases } = createServerClient()
    
    // Get invoice details
    const invoice = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.INVOICES,
      invoiceId
    )

    // Security check
    if (invoice.clinic_id !== user.clinic_id) {
      throw new Error("Invoice not found or unauthorized")
    }

    if (formatType === 'csv') {
      return exportInvoiceToCSV(invoice)
    } else if (formatType === 'pdf') {
      return await exportInvoiceToPDF(invoice)
    }

    throw new Error("Unsupported export format")
  } catch (error: any) {
    console.error("Invoice export error:", error)
    throw error
  }
}

function exportInvoiceToCSV(invoice: any) {
  // CSV headers
  const headers = [
    "Invoice Number",
    "Date", 
    "Due Date",
    "Description",
    "Amount",
    "Currency",
    "Status",
    "Payment Reference",
    "Paid At",
    "Payment Method"
  ]

  // Convert data to CSV row
  const row = [
    `"${invoice.invoice_number}"`,
    `"${invoice.date || ''}"`,
    `"${invoice.due_date || ''}"`,
    `"${invoice.description || ''}"`,
    invoice.total || 0,
    `"${invoice.currency || 'ZAR'}"`,
    `"${invoice.status || ''}"`,
    `"${invoice.paystack_reference || ''}"`,
    `"${invoice.paid_at || ''}"`,
    `"${invoice.payment_method || ''}"`
  ]

  // Combine headers and row
  const csvContent = [
    headers.join(","),
    row.join(",")
  ].join("\n")

  return {
    filename: `${sanitizeFilename(invoice.invoice_number)}_invoice_${format(new Date(), 'yyyy-MM-dd')}.csv`,
    content: csvContent,
    contentType: "text/csv"
  }
}

async function exportInvoiceToPDF(invoice: any) {
  // Create PDF document
  const doc = new jsPDF()
  
  // Add header with clinic logo/name
  doc.setFontSize(24)
  doc.text("INVOICE", 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40)
  doc.text(`Date: ${invoice.date ? format(new Date(invoice.date), 'PPP') : 'N/A'}`, 20, 48)
  
  if (invoice.due_date) {
    doc.text(`Due Date: ${format(new Date(invoice.due_date), 'PPP')}`, 20, 56)
  }
  
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 140, 40)
  
  // Separator line
  doc.line(20, 65, 190, 65)
  
  // Invoice details
  doc.setFontSize(14)
  doc.text("Invoice Details", 20, 75)
  
  doc.setFontSize(11)
  doc.text(`Description: ${invoice.description}`, 20, 85)
  
  // Amount
  doc.setFontSize(16)
  doc.text(
    `Total: R${(invoice.total / 100).toFixed(2)} ${invoice.currency || 'ZAR'}`,
    20,
    100
  )
  
  // Payment information if available
  if (invoice.paystack_reference || invoice.paid_at) {
    doc.setFontSize(12)
    doc.text("Payment Information", 20, 120)
    
    doc.setFontSize(10)
    let yPos = 130
    
    if (invoice.paystack_reference) {
      doc.text(`Reference: ${invoice.paystack_reference}`, 20, yPos)
      yPos += 8
    }
    
    if (invoice.paid_at) {
      doc.text(`Paid: ${format(new Date(invoice.paid_at), 'PPP')}`, 20, yPos)
      yPos += 8
    }
    
    if (invoice.payment_method) {
      doc.text(`Method: ${invoice.payment_method}`, 20, yPos)
    }
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(
      `Page ${i} of ${pageCount} | Generated ${format(new Date(), 'PPPP')}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  // Convert to base64
  const pdfOutput = doc.output('datauristring')
  const pdfParts = pdfOutput.split(',')
  const pdfBase64 = pdfParts.length > 1 ? pdfParts[1] : ''
  
  if (!pdfBase64) {
    throw new Error("Failed to generate PDF")
  }
  
  return {
    filename: `${sanitizeFilename(invoice.invoice_number)}_invoice_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
    content: pdfBase64,
    contentType: "application/pdf"
  }
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}
