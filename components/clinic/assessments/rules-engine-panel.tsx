// components/clinic/assessments/rules-engine-panel.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { useState } from "react"
import type { RulesEngineSummary, FitnessDecision } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface RulesEnginePanelProps {
  summary: RulesEngineSummary | null
  onRefresh?: () => Promise<void>
  isRefreshing?: boolean
}

const decisionLabels: Record<FitnessDecision, string> = {
  fit: "Fit",
  fit_with_conditions: "Fit with Conditions",
  fit_with_restrictions: "Fit with Restrictions",
  temporarily_unfit: "Temporarily Unfit",
  permanently_unfit: "Permanently Unfit",
}

const decisionColors: Record<FitnessDecision, string> = {
  fit: "bg-green-500/10 text-green-700 border-green-200",
  fit_with_conditions: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  fit_with_restrictions: "bg-orange-500/10 text-orange-700 border-orange-200",
  temporarily_unfit: "bg-red-500/10 text-red-700 border-red-200",
  permanently_unfit: "bg-red-600/10 text-red-800 border-red-300",
}

const statusIcons = {
  normal: <CheckCircle className="h-4 w-4 text-green-600" />,
  abnormal: <AlertCircle className="h-4 w-4 text-yellow-600" />,
  critical: <AlertTriangle className="h-4 w-4 text-red-600" />,
}

export function RulesEnginePanel({ 
  summary, 
  onRefresh, 
  isRefreshing = false 
}: RulesEnginePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllTests, setShowAllTests] = useState(false)

  if (!summary) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No test results available for analysis.
            <br />
            <span className="text-sm">Test results will be automatically analyzed once available.</span>
          </p>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 bg-transparent"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Check for Results
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const visibleTests = showAllTests 
    ? summary.testResults 
    : summary.testResults.slice(0, 4)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Clinical Rules Engine</CardTitle>
              <CardDescription>
                AI-assisted analysis based on occupational health standards
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Overall Suggestion */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Suggested Decision</span>
              <Badge 
                variant="outline" 
                className={decisionColors[summary.overallSuggestedDecision]}
              >
                {decisionLabels[summary.overallSuggestedDecision]}
              </Badge>
            </div>
            <p className="text-sm">{summary.reasoning}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    summary.overallConfidence >= 80 ? "bg-green-500" :
                    summary.overallConfidence >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${summary.overallConfidence}%` }}
                />
              </div>
              <span className="text-xs font-medium">{summary.overallConfidence}%</span>
            </div>
          </div>

          {/* Critical Findings */}
          {summary.criticalFindings.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Critical Findings</span>
              </div>
              <ul className="space-y-1">
                {summary.criticalFindings.map((finding, index) => (
                  <li key={index} className="text-sm text-red-700">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Abnormal Findings */}
          {summary.abnormalFindings.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Abnormal Findings</span>
              </div>
              <ul className="space-y-1">
                {summary.abnormalFindings.map((finding, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Referrals */}
          {summary.referralsRecommended.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Recommended Referrals</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.referralsRecommended.map((referral, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100">
                    {referral}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Individual Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Test Results Analysis</span>
              <span className="text-xs text-muted-foreground">
                {summary.testResults.length} test(s) evaluated
              </span>
            </div>
            
            <div className="space-y-2">
              {visibleTests.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {statusIcons[result.status]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">
                        {result.testName}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "shrink-0 text-xs",
                          result.status === "normal" && "border-green-200 text-green-700",
                          result.status === "abnormal" && "border-yellow-200 text-yellow-700",
                          result.status === "critical" && "border-red-200 text-red-700"
                        )}
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {result.reasoning}
                    </p>
                    {result.referralSuggested && result.referralType && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Refer to: {result.referralType}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {summary.testResults.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAllTests(!showAllTests)}
              >
                {showAllTests 
                  ? "Show Less" 
                  : `Show ${summary.testResults.length - 4} More Tests`
                }
              </Button>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground border-t pt-3">
            This analysis is provided as a decision support tool. 
            The final fitness determination must be made by the examining physician based on their clinical judgment.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
