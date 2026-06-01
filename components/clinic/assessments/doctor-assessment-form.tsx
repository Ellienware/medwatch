"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  X,
  User,
  Calendar,
  FileText,
  Stethoscope,
  ClipboardList,
} from "lucide-react"
import { format } from "date-fns"
import type { 
  ClinicalAssessment, 
  FitnessDecision, 
  ClinicalFinding,
  Patient,
  Appointment,
  TestResult,
  RulesEngineSummary,
} from "@/lib/types/database"
import { RulesEnginePanel } from "./rules-engine-panel"
import { TestResultsReview } from "./test-results-review"
import { completeAssessmentAction, refreshRulesEngineAnalysis, updateAssessment } from "@/lib/actions/assessment-actions"
import { cn } from "@/lib/utils"

interface DoctorAssessmentFormProps {
  assessment: ClinicalAssessment
  patient: Patient | null
  appointment: Appointment | null
  testResults: TestResult[]
}

const fitnessDecisions: { value: FitnessDecision; label: string; description: string }[] = [
  { 
    value: "fit", 
    label: "Fit", 
    description: "Patient is fully fit for work without any restrictions" 
  },
  { 
    value: "fit_with_conditions", 
    label: "Fit with Conditions", 
    description: "Fit for work with specific conditions to be monitored" 
  },
  { 
    value: "fit_with_restrictions", 
    label: "Fit with Restrictions", 
    description: "Fit for work but with specific job restrictions" 
  },
  { 
    value: "temporarily_unfit", 
    label: "Temporarily Unfit", 
    description: "Currently unfit, expected to recover" 
  },
  { 
    value: "permanently_unfit", 
    label: "Permanently Unfit", 
    description: "Permanently unfit for the specified work" 
  },
]

const examinationCategories = [
  { key: "general_appearance", label: "General Appearance" },
  { key: "cardiovascular", label: "Cardiovascular" },
  { key: "respiratory", label: "Respiratory" },
  { key: "neurological", label: "Neurological" },
  { key: "musculoskeletal", label: "Musculoskeletal" },
  { key: "skin", label: "Skin" },
  { key: "vision", label: "Vision" },
  { key: "hearing", label: "Hearing" },
  { key: "other", label: "Other" },
]

const referralTypes = [
  "General Practitioner",
  "Cardiologist",
  "Pulmonologist",
  "Audiologist",
  "Optometrist",
  "Neurologist",
  "Orthopedic Specialist",
  "Occupational Therapist",
  "Physiotherapist",
  "Psychologist",
  "Other Specialist",
]

export function DoctorAssessmentForm({
  assessment,
  patient,
  appointment,
  testResults,
}: DoctorAssessmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [overrideWarnings, setOverrideWarnings] = useState<string[]>([])
  
  // Form state
  const [physicalExamination, setPhysicalExamination] = useState<Record<string, string>>(
    assessment.physical_examination || {}
  )
  const [clinicalFindings, setClinicalFindings] = useState<ClinicalFinding[]>(
    assessment.clinical_findings || []
  )
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState(
    assessment.medical_history_notes || ""
  )
  const [currentMedications, setCurrentMedications] = useState(
    assessment.current_medications || ""
  )
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(
    assessment.allergies_confirmed || ""
  )
  const [additionalNotes, setAdditionalNotes] = useState(
    assessment.additional_notes || ""
  )
  
  // Decision state
  const [doctorDecision, setDoctorDecision] = useState<FitnessDecision | "">(
    assessment.doctor_decision || ""
  )
  const [doctorReasoning, setDoctorReasoning] = useState(
    assessment.doctor_reasoning || ""
  )
  const [restrictions, setRestrictions] = useState<string[]>(
    assessment.restrictions || []
  )
  const [newRestriction, setNewRestriction] = useState("")
  const [restrictionDuration, setRestrictionDuration] = useState(
    assessment.restriction_duration || ""
  )
  
  // Referrals state
  const [referrals, setReferrals] = useState<Array<{
    type: string
    reason: string
    priority: "routine" | "urgent" | "emergency"
  }>>(assessment.referrals || [])
  
  // Follow-up state
  const [followUpRequired, setFollowUpRequired] = useState(
    assessment.follow_up_required || false
  )
  const [followUpDate, setFollowUpDate] = useState(
    assessment.follow_up_date || ""
  )
  const [followUpNotes, setFollowUpNotes] = useState(
    assessment.follow_up_notes || ""
  )
  
  // Override state
  const [overrideRulesEngine, setOverrideRulesEngine] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")

  // Rules engine summary state (for refresh)
  const [rulesEngineSummary, setRulesEngineSummary] = useState<RulesEngineSummary | null>(
    assessment.rules_engine_summary ?? null
  )

  // Save progress
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateAssessment({
        id: assessment.id, // Use $id instead of id
        clinical_findings: clinicalFindings,
        physical_examination: physicalExamination,
        medical_history_notes: medicalHistoryNotes,
        current_medications: currentMedications,
        allergies_confirmed: allergiesConfirmed,
        additional_notes: additionalNotes,
      })

      if (result.success) {
        toast({
          title: "Progress Saved",
          description: "Assessment progress has been saved.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save progress",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Refresh rules engine
  const handleRefreshRulesEngine = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshRulesEngineAnalysis(assessment.id) // Use $id
      if (result.success && result.rulesEngineSummary) {
        setRulesEngineSummary(result.rulesEngineSummary)
        toast({
          title: "Analysis Updated",
          description: "Rules engine analysis has been refreshed.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh analysis",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Complete assessment
  const handleComplete = async (forceOverride = false) => {
    if (!doctorDecision) {
      toast({
        title: "Missing Decision",
        description: "Please select a fitness decision",
        variant: "destructive",
      })
      return
    }

    if (!doctorReasoning.trim()) {
      toast({
        title: "Missing Reasoning",
        description: "Please provide reasoning for your decision",
        variant: "destructive",
      })
      return
    }

    setIsCompleting(true)
    try {
      const result = await completeAssessmentAction({
        id: assessment.id, // Use $id
        doctor_decision: doctorDecision as FitnessDecision,
        doctor_reasoning: doctorReasoning,
        restrictions: restrictions.length > 0 ? restrictions : undefined,
        restriction_duration: restrictionDuration || undefined,
        referrals: referrals.length > 0 ? referrals : undefined,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || undefined,
        follow_up_notes: followUpNotes || undefined,
        additional_notes: additionalNotes || undefined,
        override_rules_engine: forceOverride ? true : overrideRulesEngine,
        override_reason: forceOverride ? overrideReason : undefined,
      })

      if (result.success) {
        toast({
          title: "Assessment Completed",
          description: "The clinical assessment has been completed. You can now generate the certificate.",
        })
        router.push(`/clinic/certificates/new?assessment=${assessment.id}`) // Use $id
      } else if ((result as any).requiresOverride) {
        // Show override dialog
        setOverrideWarnings((result as any).warnings || [])
        setShowOverrideDialog(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to complete assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  // Add restriction
  const addRestriction = () => {
    if (newRestriction.trim()) {
      setRestrictions([...restrictions, newRestriction.trim()])
      setNewRestriction("")
    }
  }

  // Remove restriction
  const removeRestriction = (index: number) => {
    setRestrictions(restrictions.filter((_, i) => i !== index))
  }

  // Add referral
  const addReferral = () => {
    setReferrals([
      ...referrals,
      { type: "", reason: "", priority: "routine" }
    ])
  }

  // Update referral
  const updateReferral = (index: number, field: string, value: string) => {
    const updated = [...referrals]
    updated[index] = { ...updated[index], [field]: value }
    setReferrals(updated)
  }

  // Remove referral
  const removeReferral = (index: number) => {
    setReferrals(referrals.filter((_, i) => i !== index))
  }

  // Add clinical finding
  const addClinicalFinding = () => {
    setClinicalFindings([
      ...clinicalFindings,
      { category: "", finding: "", severity: "normal", notes: "" }
    ])
  }

  // Update clinical finding
  const updateClinicalFinding = (index: number, field: string, value: any) => {
    const updated = [...clinicalFindings]
    updated[index] = { ...updated[index], [field]: value }
    setClinicalFindings(updated)
  }

  // Remove clinical finding
  const removeClinicalFinding = (index: number) => {
    setClinicalFindings(clinicalFindings.filter((_, i) => i !== index))
  }

  const patientAge = patient?.date_of_birth 
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="space-y-6">
      {/* Patient Info Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {patient?.first_name} {patient?.last_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {patient?.id_number}</span>
                  {patientAge && (
                    <>
                      <span>|</span>
                      <span>{patientAge} years old</span>
                    </>
                  )}
                  {patient?.gender && (
                    <>
                      <span>|</span>
                      <span className="capitalize">{patient.gender}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {appointment?.appointment_date 
                  ? format(new Date(appointment.appointment_date), "MMM d, yyyy")
                  : "N/A"
                }
              </Badge>
              <Badge variant="outline" className="capitalize">
                {appointment?.appointment_type?.replace(/_/g, " ") || "General"}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  assessment.status === "in_progress" && "bg-yellow-500/10 text-yellow-700 border-yellow-200",
                  assessment.status === "completed" && "bg-green-500/10 text-green-700 border-green-200"
                )}
              >
                {assessment.status === "in_progress" ? "In Progress" : "Completed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Rules Engine & Test Results */}
        <div className="lg:col-span-1 space-y-6">
          <RulesEnginePanel 
            summary={rulesEngineSummary}
            onRefresh={handleRefreshRulesEngine}
            isRefreshing={isRefreshing}
          />
          <TestResultsReview testResults={testResults} />
        </div>

        {/* Right Column - Assessment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Physical Examination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Physical Examination
              </CardTitle>
              <CardDescription>
                Record findings from the physical examination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {examinationCategories.map((category) => (
                  <div key={category.key} className="space-y-2">
                    <Label htmlFor={category.key}>{category.label}</Label>
                    <Textarea
                      id={category.key}
                      placeholder={`${category.label} findings...`}
                      value={physicalExamination[category.key] || ""}
                      onChange={(e) => setPhysicalExamination({
                        ...physicalExamination,
                        [category.key]: e.target.value
                      })}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Findings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Clinical Findings
                  </CardTitle>
                  <CardDescription>
                    Document specific clinical findings
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addClinicalFinding}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Finding
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinicalFindings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No clinical findings added. Click "Add Finding" to document findings.
                </p>
              ) : (
                clinicalFindings.map((finding, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">Finding #{index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeClinicalFinding(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={finding.category}
                          onValueChange={(v) => updateClinicalFinding(index, "category", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {examinationCategories.map((cat) => (
                              <SelectItem key={cat.key} value={cat.key}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select
                          value={finding.severity}
                          onValueChange={(v) => updateClinicalFinding(index, "severity", v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Finding</Label>
                      <Textarea
                        placeholder="Describe the finding..."
                        value={finding.finding}
                        onChange={(e) => updateClinicalFinding(index, "finding", e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Input
                        placeholder="Additional notes..."
                        value={finding.notes || ""}
                        onChange={(e) => updateClinicalFinding(index, "notes", e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardHeader>
              <CardTitle>Medical History Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_history">Medical History Notes</Label>
                <Textarea
                  id="medical_history"
                  placeholder="Relevant medical history..."
                  value={medicalHistoryNotes}
                  onChange={(e) => setMedicalHistoryNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    placeholder="List current medications..."
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies Confirmed</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Confirmed allergies..."
                    value={allergiesConfirmed}
                    onChange={(e) => setAllergiesConfirmed(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Fitness Decision */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fitness Decision
              </CardTitle>
              <CardDescription>
                Make your final fitness determination based on your assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Decision Selection */}
              <div className="space-y-3">
                <Label>Fitness Status <span className="text-destructive">*</span></Label>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {fitnessDecisions.map((decision) => (
                    <div
                      key={decision.value}
                      className={cn(
                        "cursor-pointer rounded-lg border p-4 transition-colors",
                        doctorDecision === decision.value
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/50"
                      )}
                      onClick={() => setDoctorDecision(decision.value)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-4 w-4 rounded-full border-2",
                          doctorDecision === decision.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/50"
                        )} />
                        <span className="font-medium text-sm">{decision.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {decision.description}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Rules engine comparison */}
                {rulesEngineSummary && doctorDecision && doctorDecision !== rulesEngineSummary.overallSuggestedDecision && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">
                        Decision differs from rules engine suggestion
                      </p>
                      <p className="text-yellow-700">
                        The rules engine suggested "{fitnessDecisions.find(d => d.value === rulesEngineSummary.overallSuggestedDecision)?.label}". 
                        You may need to provide additional justification.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              <div className="space-y-2">
                <Label htmlFor="reasoning">
                  Clinical Reasoning <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reasoning"
                  placeholder="Provide detailed reasoning for your fitness decision..."
                  value={doctorReasoning}
                  onChange={(e) => setDoctorReasoning(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Restrictions */}
              {(doctorDecision === "fit_with_restrictions" || doctorDecision === "fit_with_conditions") && (
                <div className="space-y-3">
                  <Label>Restrictions / Conditions</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a restriction..."
                      value={newRestriction}
                      onChange={(e) => setNewRestriction(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRestriction())}
                    />
                    <Button type="button" variant="outline" onClick={addRestriction}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {restrictions.map((restriction, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {restriction}
                          <button
                            type="button"
                            onClick={() => removeRestriction(index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="restriction_duration">Restriction Duration</Label>
                    <Select
                      value={restrictionDuration}
                      onValueChange={setRestrictionDuration}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_month">1 Month</SelectItem>
                        <SelectItem value="3_months">3 Months</SelectItem>
                        <SelectItem value="6_months">6 Months</SelectItem>
                        <SelectItem value="12_months">12 Months</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="until_review">Until Next Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Referrals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Referrals</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addReferral}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Referral
                  </Button>
                </div>
                {referrals.map((referral, index) => (
                  <div key={index} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Referral #{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeReferral(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Specialist</Label>
                        <Select
                          value={referral.type}
                          onValueChange={(v) => updateReferral(index, "type", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {referralTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                          value={referral.priority}
                          onValueChange={(v) => updateReferral(index, "priority", v as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                          placeholder="Reason for referral"
                          value={referral.reason}
                          onChange={(e) => updateReferral(index, "reason", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Follow-up */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="follow_up"
                    checked={followUpRequired}
                    onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
                  />
                  <Label htmlFor="follow_up">Follow-up Required</Label>
                </div>
                {followUpRequired && (
                  <div className="grid gap-4 md:grid-cols-2 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="follow_up_date">Follow-up Date</Label>
                      <Input
                        id="follow_up_date"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                      <Input
                        id="follow_up_notes"
                        placeholder="Notes for follow-up..."
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  placeholder="Any additional notes or observations..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || isCompleting}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Progress
            </Button>
            <Button
              type="button"
              onClick={() => handleComplete()}
              disabled={isSaving || isCompleting || !doctorDecision || !doctorReasoning.trim()}
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Complete Assessment & Generate Certificate
            </Button>
          </div>
        </div>
      </div>

      {/* Override Dialog */}
      <AlertDialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Override Required
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Your decision differs from the rules engine suggestion. Please review the following warnings:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {overrideWarnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="override_reason">Override Reason (Required)</Label>
                  <Textarea
                    id="override_reason"
                    placeholder="Provide justification for overriding the rules engine..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (overrideReason.trim()) {
                  setShowOverrideDialog(false)
                  handleComplete(true)
                }
              }}
              disabled={!overrideReason.trim()}
            >
              Confirm Override & Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}