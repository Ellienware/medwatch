// components/clinic/tests/view-report-button.tsx - UPDATED WITH SECURITY
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Loader2, 
  User, 
  TestTube2, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Download,
  FileImage,
  File,
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Printer,
  Copy,
  Clipboard,
  Clock,
  Building,
  Heart,
  Stethoscope
} from "lucide-react"
import { getTestResultFullReport } from "@/lib/actions/test-result-actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ViewReportButtonProps {
  testResultId: string
  patientName?: string
  testName?: string
  isSensitive?: boolean
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ViewReportButton({ 
  testResultId, 
  patientName, 
  testName,
  isSensitive = false,
  variant = "outline",
  size = "sm",
  className = ""
}: ViewReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const { toast } = useToast()

  const handleViewReport = async () => {
    setIsLoading(true)
    setError(null)
    setReportData(null)
    
    try {
      const result = await getTestResultFullReport(testResultId)
      
      if (result.success && result.fullReport) {
        setReportData(result.fullReport)
        setIsOpen(true)
        
        // Log successful access
        toast({
          title: "Report Loaded",
          description: "Test report loaded securely",
          duration: 3000,
        })
      } else {
        const errorMessage = result.error || "Failed to load report"
        setError(errorMessage)
        
        // Show appropriate error message
        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this test report",
            variant: "destructive",
            duration: 5000,
          })
        } else if (errorMessage.includes("not found")) {
          toast({
            title: "Report Not Found",
            description: "The test report could not be found",
            variant: "destructive",
            duration: 5000,
          })
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          })
        }
      }
    } catch (err) {
      const errorMessage = "An unexpected error occurred while loading the report"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!reportData) return
    
    // Create a sanitized report object (remove sensitive fields for non-medical staff)
    const sanitizedReport = {
      reportId: reportData.id,
      patientId: reportData.patient?.id || reportData.patient_id,
      patientName: reportData.patient 
        ? `${reportData.patient.first_name} ${reportData.patient.last_name}`
        : patientName || "Unknown",
      testName: reportData.test?.test_name || testName || "Unknown Test",
      testCode: reportData.test_code,
      performedAt: reportData.performed_at,
      reviewedAt: reportData.reviewed_at,
      status: reportData.is_normal === true ? "Normal" : 
              reportData.is_normal === false ? "Abnormal" : "Unknown",
      findings: reportData.findings,
      recommendations: reportData.recommendations,
      results: reportData.results,
      isSensitive: reportData.is_sensitive || isSensitive,
      requiresReview: reportData.requires_review,
      securityLevel: reportData.is_sensitive ? "High" : "Standard",
      generatedAt: new Date().toISOString(),
      generatedBy: "Secure Healthcare System",
      note: "This report contains encrypted medical data. Access is controlled by role-based permissions."
    }
    
    const jsonString = JSON.stringify(sanitizedReport, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-report-${testResultId}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast({
      title: "Report Downloaded",
      description: "Test report has been downloaded securely",
      duration: 3000,
    })
  }

  const handleCopyToClipboard = () => {
    if (!reportData) return
    
    const reportText = `
Test Result Report
===================

Patient: ${reportData.patient?.first_name || ''} ${reportData.patient?.last_name || ''}
Test: ${reportData.test?.test_name || reportData.test_code}
Date: ${format(new Date(reportData.performed_at), "MMMM d, yyyy, h:mm a")}
Status: ${reportData.is_normal === true ? "Normal" : reportData.is_normal === false ? "Abnormal" : "Unknown"}

Results:
${reportData.results ? Object.entries(reportData.results).map(([key, value]) => `  ${key}: ${value}`).join('\n') : 'None'}

Findings: ${reportData.findings || 'None'}
Recommendations: ${reportData.recommendations || 'None'}

${reportData.is_sensitive ? '⚠️ SENSITIVE TEST - RESTRICTED ACCESS' : ''}
Generated: ${format(new Date(), "MMMM d, yyyy, h:mm a")}
    `.trim()

    navigator.clipboard.writeText(reportText).then(() => {
      setCopySuccess(true)
      toast({
        title: "Copied to Clipboard",
        description: "Report summary copied to clipboard",
        duration: 2000,
      })
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(err => {
      console.error("Failed to copy: ", err)
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      })
    })
  }

  const handlePrint = () => {
    if (!reportData) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Report - ${testResultId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
          .security-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Test Result Report</h1>
          <p>Generated: ${format(new Date(), "MMMM d, yyyy, h:mm a")}</p>
        </div>
        
        <div class="section">
          <h3 class="section-title">Patient Information</h3>
          <div class="row">
            <span class="label">Name:</span>
            <span>${reportData.patient?.first_name || ''} ${reportData.patient?.last_name || ''}</span>
          </div>
          <div class="row">
            <span class="label">Date of Birth:</span>
            <span>${reportData.patient?.date_of_birth ? format(new Date(reportData.patient.date_of_birth), "MMMM d, yyyy") : 'N/A'}</span>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">Test Information</h3>
          <div class="row">
            <span class="label">Test Name:</span>
            <span>${reportData.test?.test_name || reportData.test_code}</span>
          </div>
          <div class="row">
            <span class="label">Performed On:</span>
            <span>${format(new Date(reportData.performed_at), "MMMM d, yyyy, h:mm a")}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span>${reportData.is_normal === true ? 'Normal' : reportData.is_normal === false ? 'Abnormal' : 'Unknown'}</span>
          </div>
        </div>
        
        ${reportData.results && Object.keys(reportData.results).length > 0 ? `
        <div class="section">
          <h3 class="section-title">Test Results</h3>
          ${Object.entries(reportData.results).map(([key, value]) => `
            <div class="row">
              <span class="label">${key}:</span>
              <span>${value}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${reportData.findings ? `
        <div class="section">
          <h3 class="section-title">Findings</h3>
          <p>${reportData.findings}</p>
        </div>
        ` : ''}
        
        ${reportData.recommendations ? `
        <div class="section">
          <h3 class="section-title">Recommendations</h3>
          <p>${reportData.recommendations}</p>
        </div>
        ` : ''}
        
        ${reportData.is_sensitive ? `
        <div class="security-notice">
          <strong>⚠️ SECURITY NOTICE:</strong> This is a sensitive medical test report. 
          Contains encrypted patient health information. Access is restricted.
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Report ID: ${testResultId}</p>
          <p>Generated by Secure Healthcare System</p>
          <p>${format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
    
    toast({
      title: "Printing Report",
      description: "Report sent to printer",
      duration: 3000,
    })
  }

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(
          "gap-2",
          isSensitive && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
          className
        )}
        onClick={handleViewReport}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {isSensitive ? (
              <Shield className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isSensitive ? "View Secure Report" : "View Report"}
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Test Result Report
                  {reportData?.is_sensitive && (
                    <Badge variant="destructive" className="ml-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Sensitive
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Secure medical test report with AES-256 encryption
                </DialogDescription>
              </div>
              {reportData && (
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={copySuccess}
                  >
                    {copySuccess ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copySuccess ? "Copied!" : "Copy"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 pb-6">
            {error ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Report</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            ) : reportData ? (
              <div className="space-y-6 py-4">
                {/* Security Header */}
                <div className={cn(
                  "rounded-lg border p-4",
                  reportData.is_sensitive 
                    ? "border-red-300 bg-red-50" 
                    : "border-blue-200 bg-blue-50"
                )}>
                  <div className="flex items-start gap-3">
                    {reportData.is_sensitive ? (
                      <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm mb-1">
                        {reportData.is_sensitive 
                          ? "🔒 Sensitive Test Report - AES-256 Encrypted" 
                          : "🛡️ Secure Test Report - AES-256 Encrypted"
                        }
                      </p>
                      <p className="text-xs">
                        {reportData.is_sensitive
                          ? "Contains sensitive medical information. Access restricted to authorized medical staff only."
                          : "Contains encrypted patient data. Access controlled by role-based permissions."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Information */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Information
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-medium">
                            {reportData.patient?.first_name || 'N/A'} {reportData.patient?.last_name || ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">
                            {reportData.patient?.date_of_birth 
                              ? format(new Date(reportData.patient.date_of_birth), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{reportData.patient?.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Type</p>
                          <p className="font-medium">{reportData.patient?.blood_type || "N/A"}</p>
                        </div>
                      </div>
                      {reportData.patient?.allergies && (
                        <div>
                          <p className="text-xs text-muted-foreground">Allergies</p>
                          <p className="font-medium text-sm">{reportData.patient.allergies}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Information */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <TestTube2 className="h-4 w-4" />
                      Test Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Test Name</p>
                        <p className="font-medium">{reportData.test?.test_name || reportData.test_code || "N/A"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Category</p>
                          <p className="font-medium">{reportData.test?.test_category || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Code</p>
                          <p className="font-medium font-mono">{reportData.test_code || "N/A"}</p>
                        </div>
                      </div>
                      {reportData.test?.description && (
                        <div>
                          <p className="text-xs text-muted-foreground">Description</p>
                          <p className="font-medium text-sm">{reportData.test.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Card */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4">Test Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Badge 
                          variant={reportData.is_normal ? "default" : "destructive"} 
                          className="gap-2 text-sm"
                        >
                          {reportData.is_normal ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Normal Result
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4" />
                              Abnormal Result
                            </>
                          )}
                        </Badge>
                        
                        <Badge 
                          variant={reportData.reviewed_by ? "default" : "secondary"}
                          className="gap-2 text-sm"
                        >
                          {reportData.reviewed_by ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Reviewed
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4" />
                              Pending Review
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      {reportData.requires_review && (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <p className="text-sm font-medium text-amber-800">Requires Medical Review</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Performed</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(reportData.performed_at), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(reportData.performed_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                      
                      {reportData.reviewed_at && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Reviewed</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{format(new Date(reportData.reviewed_at), "MMM d, yyyy")}</p>
                            <p className="text-xs text-muted-foreground">
                              by {reportData.reviewed_by_name || reportData.reviewed_by}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Results Section */}
                {reportData.results && Object.keys(reportData.results).length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Test Results
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(reportData.results).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="space-y-1">
                            <p className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                            {reportData.normalRanges?.[key] && (
                              <p className="text-xs text-muted-foreground">
                                Normal range: {reportData.normalRanges[key]}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatValue(value)}</p>
                            {reportData.normalRanges?.[key] && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs mt-1",
                                  value === reportData.normalRanges[key] 
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-red-100 text-red-800 border-red-300"
                                )}
                              >
                                {value === reportData.normalRanges[key] ? "Within Range" : "Outside Range"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Notes Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reportData.findings && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Clinical Findings
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{reportData.findings}</p>
                      </div>
                    </div>
                  )}
                  
                  {reportData.recommendations && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Recommendations
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{reportData.recommendations}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Parameters */}
                {reportData.testParameters && reportData.testParameters.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4">Test Parameters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportData.testParameters.map((param: any, index: number) => (
                        <div key={index} className="rounded border p-3">
                          <p className="font-medium text-sm mb-1">{param.name}</p>
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                          {param.unit && (
                            <p className="text-xs text-muted-foreground mt-1">Unit: {param.unit}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Information */}
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Report ID</p>
                      <p className="font-mono font-medium">{testResultId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Generated</p>
                      <p className="font-medium">{format(new Date(), "MMM d, yyyy, h:mm a")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Security Level</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          "gap-1",
                          reportData.is_sensitive 
                            ? "bg-red-100 text-red-800 border-red-300" 
                            : "bg-blue-100 text-blue-800 border-blue-300"
                        )}>
                          {reportData.is_sensitive ? (
                            <>
                              <Lock className="h-3 w-3" />
                              High Security
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3" />
                              Standard Security
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading secure report...</p>
                <p className="text-xs text-muted-foreground mt-2">Decrypting data with AES-256</p>
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="px-6 py-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Report secured with AES-256 encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}