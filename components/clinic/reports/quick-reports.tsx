"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Users, TrendingUp, Loader2, Table, File } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import jsPDF from "jspdf"

type QuickReport = {
  title: string
  description: string
  icon: any
  getDateRange: () => { startDate: string; endDate: string; fileName: string }
  defaultFormat: "pdf" | "csv" | "json"
}

export function QuickReports() {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const generateQuickReport = async (report: QuickReport, format: "pdf" | "csv" | "json" = "pdf") => {
    setGeneratingReport(report.title)
    try {
      const dateRange = report.getDateRange()
      const response = await fetch(`/api/analytics/clinic-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const data = await response.json()

      // Generate based on format
      switch (format) {
        case "pdf":
          generatePDF(data, dateRange.fileName, report.title)
          break
        case "csv":
          generateCSV(data, dateRange.fileName)
          break
        case "json":
          generateJSON(data, dateRange.fileName)
          break
      }

      toast.success(`${report.title} generated as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error("Failed to generate report")
      console.error(error)
    } finally {
      setGeneratingReport(null)
    }
  }

  const generatePDF = (report: any, fileName: string, title: string) => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text(title, 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40)
    
    // Add summary data
    let yPos = 60
    doc.setFontSize(16)
    doc.text("Summary", 20, yPos)
    yPos += 15
    
    doc.setFontSize(12)
    doc.text(`Appointments: ${report.appointments.total}`, 20, yPos)
    yPos += 8
    doc.text(`Certificates: ${report.certificates.total}`, 20, yPos)
    
    doc.save(`${fileName}.pdf`)
  }

  const generateCSV = (report: any, fileName: string) => {
    const csvRows = [
      ["Metric", "Value"],
      ["Appointments Total", report.appointments.total],
      ["Appointments Completed", report.appointments.completed],
      ["Certificates Total", report.certificates.total],
      ["Fit to Work", report.certificates.fitToWork],
    ]
    const csvString = csvRows.map(row => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateJSON = (report: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickReports: QuickReport[] = [
    {
      title: "Today's Activity",
      description: "View today's appointments and activity",
      icon: Calendar,
      getDateRange: () => {
        const today = new Date().toISOString().split("T")[0]
        return { startDate: today, endDate: today, fileName: `today-activity-${today}` }
      },
      defaultFormat: "pdf"
    },
    {
      title: "This Week",
      description: "Weekly performance summary",
      icon: TrendingUp,
      getDateRange: () => {
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6))
        return {
          startDate: startOfWeek.toISOString().split("T")[0],
          endDate: endOfWeek.toISOString().split("T")[0],
          fileName: `weekly-report-${startOfWeek.toISOString().split("T")[0]}`
        }
      },
      defaultFormat: "csv"
    },
    {
      title: "Monthly Summary",
      description: "Comprehensive monthly overview",
      icon: FileText,
      getDateRange: () => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
        return {
          startDate: startOfMonth,
          endDate: endOfMonth,
          fileName: `monthly-report-${startOfMonth}`
        }
      },
      defaultFormat: "pdf"
    },
    {
      title: "Patient Statistics",
      description: "Patient demographics and trends",
      icon: Users,
      getDateRange: () => {
        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
        const today = new Date().toISOString().split("T")[0]
        return {
          startDate: startOfYear,
          endDate: today,
          fileName: `patient-stats-${today}`
        }
      },
      defaultFormat: "json"
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Reports</CardTitle>
        <CardDescription>One-click reports in multiple formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {["pdf", "csv", "json"].map((format) => (
            <Button
              key={format}
              variant="outline"
              size="sm"
              className="h-auto py-2"
              onClick={() => {
                // Apply format to all quick reports
                quickReports.forEach(report => {
                  generateQuickReport(report, format as any)
                })
              }}
              disabled={generatingReport !== null}
            >
              <div className="flex flex-col items-center">
                {format === "pdf" && <FileText className="h-4 w-4 mb-1" />}
                {format === "csv" && <Table className="h-4 w-4 mb-1" />}
                {format === "json" && <File className="h-4 w-4 mb-1" />}
                <span className="text-xs">{format.toUpperCase()}</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {quickReports.map((report) => (
            <div key={report.title} className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="flex-1 justify-start bg-transparent"
                onClick={() => generateQuickReport(report, report.defaultFormat)}
                disabled={generatingReport !== null}
              >
                {generatingReport === report.title ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <report.icon className="mr-2 h-4 w-4" />
                )}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{report.title}</span>
                  <span className="text-xs text-muted-foreground">{report.description}</span>
                </div>
              </Button>
              
              <div className="flex gap-1">
                {["pdf", "csv", "json"].map((format) => (
                  <Button
                    key={format}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => generateQuickReport(report, format as any)}
                    disabled={generatingReport !== null}
                    title={`Generate as ${format.toUpperCase()}`}
                  >
                    {format === "pdf" && <FileText className="h-3 w-3" />}
                    {format === "csv" && <Table className="h-3 w-3" />}
                    {format === "json" && <File className="h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}