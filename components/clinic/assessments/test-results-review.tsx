// components/clinic/assessments/test-results-review.tsx
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TestTube2, 
  AlertCircle, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import type { TestResult } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TestResultsReviewProps {
  testResults: TestResult[]
}

export function TestResultsReview({ testResults }: TestResultsReviewProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (testResults.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <TestTube2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No test results recorded for this appointment.
          </p>
        </CardContent>
      </Card>
    )
  }

  const normalCount = testResults.filter(t => t.is_normal === true).length
  const abnormalCount = testResults.filter(t => t.is_normal === false).length
  const pendingCount = testResults.filter(t => t.is_normal === null).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TestTube2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Test Results</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                  {normalCount} Normal
                </Badge>
                {abnormalCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700">
                    {abnormalCount} Abnormal
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {pendingCount} Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {testResults.map((result) => (
            <TestResultCard key={result.id} result={result} />
          ))}
        </CardContent>
      )}
    </Card>
  )
}

function TestResultCard({ result }: { result: TestResult }) {
  const [showDetails, setShowDetails] = useState(false)
  const [formattedDate, setFormattedDate] = useState("")
  const [formattedTime, setFormattedTime] = useState("")

  // Use useEffect to format dates on the client only
  useEffect(() => {
    const date = new Date(result.performed_at)
    
    // Format date as YYYY-MM-DD (consistent format)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    setFormattedDate(`${year}/${month}/${day}`)
    
    // Format time in 24-hour format
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    setFormattedTime(`${hours}:${minutes}`)
  }, [result.performed_at])

  // Parse results if string
  let parsedResults: Record<string, any> = {}
  if (typeof result.results === "string") {
    try {
      parsedResults = JSON.parse(result.results)
    } catch {
      parsedResults = {}
    }
  } else {
    parsedResults = result.results || {}
  }

  const hasDetailedResults = Object.keys(parsedResults).length > 0

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {result.is_normal === true ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : result.is_normal === false ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <TestTube2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{result.test_name || result.test_code || "Unknown Test"}</p>
            <p className="text-xs text-muted-foreground">
              {formattedDate || "Loading..."} at {formattedTime || "..."}
            </p>
            {result.findings && (
              <p className="text-sm mt-1 text-muted-foreground">{result.findings}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              result.is_normal === true && "bg-green-500/10 text-green-700 border-green-200",
              result.is_normal === false && "bg-red-500/10 text-red-700 border-red-200",
              result.is_normal === null && "bg-muted"
            )}
          >
            {result.is_normal === true ? "Normal" : result.is_normal === false ? "Abnormal" : "Review"}
          </Badge>
          
          {hasDetailedResults && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{result.test_name || result.test_code || "Test Results"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <TestResultDetails results={parsedResults} />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}

// Alternative solution with consistent date formatting
function TestResultCardAlternative({ result }: { result: TestResult }) {
  const [showDetails, setShowDetails] = useState(false)
  
  // Format date consistently without locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return {
      date: `${year}/${month}/${day}`, // Consistent format
      time: `${hours}:${minutes}`
    }
  }
  
  const { date, time } = formatDate(result.performed_at)

  // Parse results if string
  let parsedResults: Record<string, any> = {}
  if (typeof result.results === "string") {
    try {
      parsedResults = JSON.parse(result.results)
    } catch {
      parsedResults = {}
    }
  } else {
    parsedResults = result.results || {}
  }

  const hasDetailedResults = Object.keys(parsedResults).length > 0

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {result.is_normal === true ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : result.is_normal === false ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <TestTube2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{result.test_name || result.test_code || "Unknown Test"}</p>
            <p className="text-xs text-muted-foreground">
              {date} at {time}
            </p>
            {result.findings && (
              <p className="text-sm mt-1 text-muted-foreground">{result.findings}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              result.is_normal === true && "bg-green-500/10 text-green-700 border-green-200",
              result.is_normal === false && "bg-red-500/10 text-red-700 border-red-200",
              result.is_normal === null && "bg-muted"
            )}
          >
            {result.is_normal === true ? "Normal" : result.is_normal === false ? "Abnormal" : "Review"}
          </Badge>
          
          {hasDetailedResults && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{result.test_name || result.test_code || "Test Results"}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <TestResultDetails results={parsedResults} />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}

function TestResultDetails({ results }: { results: Record<string, any> }) {
  // Render results based on structure
  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">N/A</span>
    }
    
    if (typeof value === "boolean") {
      return value ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-700">Yes</Badge>
      ) : (
        <Badge variant="outline" className="bg-red-500/10 text-red-700">No</Badge>
      )
    }
    
    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="ml-4 mt-2 space-y-2 border-l-2 pl-4">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="flex items-start justify-between gap-4">
              <span className="text-sm text-muted-foreground capitalize">
                {nestedKey.replace(/_/g, " ")}
              </span>
              <span className="text-sm font-medium text-right">
                {renderValue(nestedKey, nestedValue)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      )
    }
    
    return <span>{String(value)}</span>
  }

  return (
    <div className="space-y-4 py-4">
      {Object.entries(results).map(([key, value]) => (
        <div key={key} className="border-b pb-3 last:border-0">
          <div className="flex items-start justify-between gap-4">
            <span className="text-sm font-medium capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <div className="text-sm text-right">
              {renderValue(key, value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
