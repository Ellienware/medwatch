// components/export/employer-export-button.tsx
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
import { FileText, FileSpreadsheet, Activity } from "lucide-react"
import { exportEmployerEmployees, exportEmployerMedicalReport } from "@/lib/actions/export-actions"
import { useToast } from "@/hooks/use-toast"

interface EmployerExportButtonProps {
  employerId: string
  employerName: string
  employeeCount: number
}

export function EmployerExportButton({ 
  employerId, 
  employerName,
  employeeCount 
}: EmployerExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExport = async (type: 'csv' | 'pdf' | 'medical-report') => {
    if (employeeCount === 0) {
      toast({
        title: "No Data",
        description: "There are no employees to export.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let result
      
      switch (type) {
        case 'csv':
        case 'pdf':
          result = await exportEmployerEmployees(employerId, type)
          break
        case 'medical-report':
          result = await exportEmployerMedicalReport(employerId)
          break
        default:
          throw new Error("Unknown export type")
      }

      // Create download
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
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          {loading ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleExport('csv')} disabled={loading}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Employee List (Excel/CSV)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={loading}>
          <FileText className="mr-2 h-4 w-4" />
          Employee List (PDF)
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleExport('medical-report')} disabled={loading}>
          <Activity className="mr-2 h-4 w-4" />
          Medical Status Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}