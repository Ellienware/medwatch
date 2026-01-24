// components/clinic/tests/view-report-button.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
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
  File
} from "lucide-react"
import { getTestResultFullReport } from "@/lib/actions/test-result-actions"

interface ViewReportButtonProps {
  testResultId: string
  patientName?: string
  testName?: string
}

export function ViewReportButton({ 
  testResultId, 
  patientName, 
  testName 
}: ViewReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleViewReport = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getTestResultFullReport(testResultId)
      
      if (result.success && result.fullReport) {
        setReportData(result.fullReport)
        setIsOpen(true)
      } else {
        setError(result.error || "Failed to load report")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!reportData) return
    
    const data = {
      title: "Test Result Report",
      date: new Date().toLocaleDateString(),
      report: reportData
    }
    
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-report-${testResultId}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full bg-transparent hover:bg-accent"
        onClick={handleViewReport}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            View Full Report
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Test Result Report</span>
              {reportData && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-100px)] pr-4">
            {error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-semibold">Failed to load report</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Header Information */}
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <TestTube2 className="h-4 w-4" />
                        Test Information
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Test Name:</span>
                          <span className="font-medium">{reportData.test?.test_name || "Unknown"}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium">{reportData.test?.test_category || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Patient Information
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Patient Name:</span>
                          <span className="font-medium">
                            {reportData.patient?.first_name} {reportData.patient?.last_name}
                          </span>
                        </div>
    
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date of Birth:</span>
                          <span className="font-medium">
                            {reportData.patient?.date_of_birth 
                              ? new Date(reportData.patient.date_of_birth).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant={reportData.is_normal ? "default" : "destructive"} 
                      className="flex items-center gap-1"
                    >
                      {reportData.is_normal ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Normal
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Abnormal
                        </>
                      )}
                    </Badge>
                    
                    <Badge 
                      variant={reportData.reviewed_by ? "default" : "secondary"}
                    >
                      {reportData.reviewed_by ? "Reviewed" : "Pending Review"}
                    </Badge>
                    
                    {reportData.test?.estimated_duration_minutes && (
                      <Badge variant="outline">
                        Duration: {reportData.test.estimated_duration_minutes} min
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Timeline
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Performed:</span>
                        <span className="font-medium">
                          {new Date(reportData.performed_at).toLocaleString()}
                        </span>
                      </div>
                      {reportData.reviewed_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reviewed:</span>
                          <span className="font-medium">
                            {new Date(reportData.reviewed_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Additional Info</h3>
                    <div className="space-y-2 text-sm">
                      {reportData.test?.price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">R{reportData.test.price}</span>
                        </div>
                      )}
                      {reportData.test?.requires_equipment && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equipment:</span>
                          <span className="font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {reportData.results && Object.keys(reportData.results).length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4">Test Results</h3>
                    <div className="space-y-4">
                      {Object.entries(reportData.results).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="md:col-span-1">
                            <span className="font-medium">{key}:</span>
                          </div>
                          <div className="md:col-span-2">
                            <div className="flex justify-between items-center">
                              <span>{String(value)}</span>
                              {reportData.normalRanges?.[key] && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  Normal: {reportData.normalRanges[key]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportData.findings && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-2">Findings</h3>
                      <p className="text-sm">{reportData.findings}</p>
                    </div>
                  )}
                  
                  {reportData.recommendations && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <p className="text-sm">{reportData.recommendations}</p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {reportData.attachments && reportData.attachments.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Attachments ({reportData.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reportData.attachments.map((attachment: any, index: number) => (
                        <div 
                          key={index} 
                          className="rounded border p-3 hover:bg-accent transition-colors cursor-pointer"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {attachment.name || `Attachment ${index + 1}`}
                            </span>
                          </div>
                          {attachment.type && (
                            <span className="text-xs text-muted-foreground">
                              {attachment.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Description */}
                {reportData.test?.description && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Test Description</h3>
                    <p className="text-sm">{reportData.test.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}