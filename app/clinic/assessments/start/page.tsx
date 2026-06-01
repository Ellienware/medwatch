// app/clinic/assessments/start/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { startAssessment } from "@/lib/actions/assessment-actions"

export default function StartAssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const appointmentId = searchParams.get("appointment")
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appointmentId) {
      setError("No appointment specified")
      return
    }

    // Auto-start assessment
    handleStartAssessment()
  }, [appointmentId])

  const handleStartAssessment = async () => {
    if (!appointmentId) return

    setIsStarting(true)
    setError(null)

    try {
      const result = await startAssessment({ appointment_id: appointmentId })

      if (result.success && result.assessment) {
        toast({
          title: "Assessment Started",
          description: "Clinical assessment has been initiated.",
        })
        // Redirect to assessment page
        router.push(`/clinic/assessments/${result.assessment.id}`)
      } else {
        setError(result.error || "Failed to start assessment")
        toast({
          title: "Error",
          description: result.error || "Failed to start assessment",
          variant: "destructive",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  if (!appointmentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/assessments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Start Assessment</h1>
            <p className="text-muted-foreground">Initialize a clinical assessment</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Missing Appointment</h3>
            <p className="text-muted-foreground text-center mb-4">
              No appointment ID was provided. Please select an appointment to assess.
            </p>
            <Button asChild>
              <Link href="/clinic/assessments">
                Back to Assessments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/assessments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Start Assessment</h1>
          <p className="text-muted-foreground">Initialize a clinical assessment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Starting Clinical Assessment</CardTitle>
          <CardDescription>
            Initializing assessment for appointment #{appointmentId.substring(0, 8).toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {isStarting ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Starting Assessment</h3>
              <p className="text-muted-foreground text-center">
                Please wait while we initialize the clinical assessment...
              </p>
            </>
          ) : error ? (
            <>
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to Start Assessment</h3>
              <p className="text-muted-foreground text-center mb-4">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/clinic/assessments">
                    Back to Assessments
                  </Link>
                </Button>
                <Button onClick={handleStartAssessment}>
                  Try Again
                </Button>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Assessment Ready</h3>
              <p className="text-muted-foreground text-center">
                Redirecting to assessment...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
