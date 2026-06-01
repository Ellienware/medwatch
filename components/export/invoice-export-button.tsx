// components/export/invoice-export-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, FileSpreadsheet, Printer, Mail } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { exportInvoice } from "@/lib/actions/invoice-export-actions"

interface InvoiceExportButtonProps {
  invoiceId: string
  invoiceNumber: string
  fullWidth?: boolean
}

export function InvoiceExportButton({ 
  invoiceId, 
  invoiceNumber,
  fullWidth = false
}: InvoiceExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async (type: 'pdf' | 'csv' | 'print' | 'email') => {
    setLoading(true)
    try {
      switch (type) {
        case 'pdf':
          await handlePdfExport()
          break
        case 'csv':
          await handleCsvExport()
          break
        case 'print':
          window.print()
          break
        case 'email':
          await handleEmailExport()
          break
        default:
          throw new Error("Unknown export type")
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export invoice.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePdfExport = async () => {
    try {
      const result = await exportInvoice(invoiceId, 'pdf')
      
      const byteCharacters = atob(result.content)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.contentType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: `Downloaded ${result.filename}`,
      })
    } catch (error: any) {
      throw error
    }
  }

  const handleCsvExport = async () => {
    try {
      const result = await exportInvoice(invoiceId, 'csv')
      
      const byteCharacters = atob(result.content)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: result.contentType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: `Downloaded ${result.filename}`,
      })
    } catch (error: any) {
      throw error
    }
  }

  const handleEmailExport = async () => {
    // This would typically open the user's email client
    const subject = `Invoice #${invoiceNumber}`
    const body = `Please find attached Invoice #${invoiceNumber}.`
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    window.open(mailtoLink, '_blank')
    
    toast({
      title: "Email Ready",
      description: "Your email client will open. Please attach the invoice PDF.",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={fullWidth ? "default" : "sm"}
          className={fullWidth ? "w-full" : ""}
          disabled={loading}
        >
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Exporting..." : "Export Invoice"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={loading}>
          <FileText className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download CSV
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('print')} disabled={loading}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('email')} disabled={loading}>
          <Mail className="mr-2 h-4 w-4" />
          Email Invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
