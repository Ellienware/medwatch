"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, Calendar, User, ArrowLeft, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createCertificate, getCertificateById } from "@/lib/actions/certificate-actions"
import { getAssessmentWithDetails } from "@/lib/actions/assessment-actions"
import type { Certificate, CertificateType } from "@/lib/types/database"
import { DateFormatter } from "@/lib/utils/date-formatter"
import { fitnessDecisionOptions, fitnessDecisionToCertificateType } from "@/lib/utils/fitness-mapping"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function CertificateReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const assessmentId = searchParams.get('assessment')
  
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(!!assessmentId)
  const [certificate, setCertificate] = useState<Partial<Certificate> | null>(null)
  const [patient, setPatient] = useState<any>(null)
  const [clinic, setClinic] = useState<any>(null)

  // Form fields
  const [certificateType, setCertificateType] = useState<CertificateType>('fit_to_work')
  const [diagnosis, setDiagnosis] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [doctorOverrideReason, setDoctorOverrideReason] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    async function initFromAssessment() {
      if (!assessmentId) {
        setInitializing(false)
        return
      }

      try {
        const result = await getAssessmentWithDetails(assessmentId)
        if (!result.success || !result.data) {
          toast({
            title: 'Error',
            description: result.error || 'Could not load assessment',
            variant: 'destructive',
          })
          setInitializing(false)
          return
        }

        const { assessment, patient, appointment, testResults } = result.data

        // Auto-create certificate data using mapper (we'll call an API endpoint that uses the mapper)
        const response = await fetch('/api/certificates/preview-from-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessmentId }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate certificate preview')
        }

        const preview = await response.json()
        setCertificate(preview.certificate)
        setPatient(patient)
        setClinic(preview.clinic)
        
        // Populate form
        setCertificateType(preview.certificate.certificate_type)
        setDiagnosis(preview.certificate.diagnosis || '')
        setRestrictions(preview.certificate.restrictions || '')
        setRecommendations(preview.certificate.recommendations || '')
        setValidFrom(preview.certificate.valid_from || DateFormatter.formatForDatabase(new Date()))
        setValidUntil(preview.certificate.valid_until || DateFormatter.addDays(new Date(), 365))

        // Show warnings if any (from rules engine override)
        if (preview.warnings?.length) {
          setWarnings(preview.warnings)
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load assessment data',
          variant: 'destructive',
        })
      } finally {
        setInitializing(false)
      }
    }

    initFromAssessment()
  }, [assessmentId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createCertificate({
        ...certificate,
        certificate_type: certificateType,
        diagnosis: diagnosis || null,
        restrictions: restrictions || null,
        recommendations: recommendations || null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        override_reason: doctorOverrideReason || undefined,
        status: 'issued',
      })

      if (result.success) {
        toast({
          title: 'Certificate Issued',
          description: `Certificate ${result.certificate?.certificate_number} has been issued.`,
        })
        router.push('/clinic/certificates')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to issue certificate',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {assessmentId ? 'Review & Issue Certificate' : 'Issue Certificate'}
          </h1>
          <p className="text-muted-foreground">
            {assessmentId 
              ? 'Certificate has been auto-generated from the assessment. Review and make any changes.'
              : 'Create a certificate manually.'}
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Patient Info (read-only) */}
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">ID Number</Label>
                <p className="font-medium">{patient.id_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="font-medium">{DateFormatter.formatForDisplay(patient.date_of_birth)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Gender</Label>
                <p className="font-medium capitalize">{patient.gender || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Details */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Details</CardTitle>
          <CardDescription>
            Review and edit the certificate information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="certificate_type">Certificate Type *</Label>
              <Select
                value={certificateType}
                onValueChange={(v: CertificateType) => setCertificateType(v)}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fit_to_work">Fit to Work</SelectItem>
                  <SelectItem value="fit_with_restrictions">Fit with Restrictions</SelectItem>
                  <SelectItem value="unfit_to_work">Unfit to Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From *</Label>
              <Input
                id="valid_from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until *</Label>
              <Input
                id="valid_until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis / Findings</Label>
            <Textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              placeholder="Medical findings and diagnosis..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restrictions">Work Restrictions</Label>
            <Textarea
              id="restrictions"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              rows={2}
              placeholder="Any work limitations or restrictions..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations</Label>
            <Textarea
              id="recommendations"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={2}
              placeholder="Follow-up appointments, medications, etc."
            />
          </div>

          {/* Show doctor override reason if decision differs from engine suggestion */}
          {certificate?.suggested_fitness_decision && 
           certificate.suggested_fitness_decision !== certificateType && (
            <div className="space-y-2">
              <Label htmlFor="override_reason">
                Override Reason (required because your decision differs from clinical suggestion)
              </Label>
              <Textarea
                id="override_reason"
                value={doctorOverrideReason}
                onChange={(e) => setDoctorOverrideReason(e.target.value)}
                rows={2}
                placeholder="Explain why you are overriding the clinical suggestion..."
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Issuing...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Issue Certificate
            </>
          )}
        </Button>
      </div>
    </form>
  )
}