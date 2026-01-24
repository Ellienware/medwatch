"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { XCircle } from "lucide-react"
import { testIcons } from "./test-categories"
import type { TestFormProps } from "./types"
import { AudiometryForm, SpirometryForm, VisionForm, BloodPressureForm, DrugScreenForm, HIVTestForm, MalariaTestForm, HepatitisBTestForm, HepatitisCTestForm, SyphilisTestForm, UrinalysisForm, BloodGlucoseForm, CholesterolForm, ECGForm, XRayForm, UltrasoundForm, CBCForm, LiverFunctionForm, KidneyFunctionForm, PregnancyTestForm, TuberculosisTestForm, TyphoidTestForm } from "./test-forms"



interface TestFormWrapperProps {
  selectedTests: string[]
  activeTestTab: string
  testFormData: Record<string, any>
  patientName?: string
  onTestRemove: (testCode: string) => void
  onTabChange: (testCode: string) => void
  onTestDataChange: (testCode: string, data: Record<string, any>) => void
}

export function TestFormWrapper({
  selectedTests,
  activeTestTab,
  testFormData,
  patientName,
  onTestRemove,
  onTabChange,
  onTestDataChange
}: TestFormWrapperProps) {
  if (selectedTests.length === 0) return null

  const renderTestForm = (testCode: string) => {
    const formProps: TestFormProps = {
      onChange: (data) => onTestDataChange(testCode, data),
      value: testFormData[testCode] || {}
    }

    switch (testCode) {
      case "audiometry": return <AudiometryForm {...formProps} />
      case "spirometry": return <SpirometryForm {...formProps} />
      case "vision": return <VisionForm {...formProps} />
      case "bp": return <BloodPressureForm {...formProps} />
      case "drug": return <DrugScreenForm {...formProps} />
      case "hiv": return <HIVTestForm {...formProps} />
      case "malaria": return <MalariaTestForm {...formProps} />
      case "hepatitis_b": return <HepatitisBTestForm {...formProps} />
      case "hepatitis_c": return <HepatitisCTestForm {...formProps} />
      case "syphilis": return <SyphilisTestForm {...formProps} />
      case "urinalysis": return <UrinalysisForm {...formProps} />
      case "blood_glucose": return <BloodGlucoseForm {...formProps} />
      case "cholesterol": return <CholesterolForm {...formProps} />
      case "ecg": return <ECGForm {...formProps} />
      case "xray": return <XRayForm {...formProps} />
      case "ultrasound": return <UltrasoundForm {...formProps} />
      case "cbc": return <CBCForm {...formProps} />
      case "liver_function": return <LiverFunctionForm {...formProps} />
      case "kidney_function": return <KidneyFunctionForm {...formProps} />
      case "pregnancy": return <PregnancyTestForm {...formProps} />
      case "tuberculosis": return <TuberculosisTestForm {...formProps} />
      case "typhoid": return <TyphoidTestForm {...formProps} />
      default: return <div>Test form not implemented</div>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Enter Test Results</CardTitle>
          <div className="text-sm text-muted-foreground">
            {selectedTests.length} test(s) for {patientName}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTestTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-5 overflow-x-auto">
            {selectedTests.map(test => (
              <TabsTrigger 
                key={test} 
                value={test}
                className="flex items-center gap-2 min-w-0"
              >
                {testIcons[test]}
                <span className="truncate capitalize">
                  {test.split('_')[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {selectedTests.map(test => (
            <TabsContent key={test} value={test} className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  {testIcons[test]}
                  {test.replace('_', ' ')} Results
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onTestRemove(test)}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
              
              {/* Test-specific form */}
              {renderTestForm(test)}
              
              {/* Common fields for each test */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor={`${test}_findings`}>
                    Findings & Observations
                  </Label>
                  <Textarea 
                    id={`${test}_findings`}
                    value={testFormData[test]?.findings || ''}
                    onChange={(e) => onTestDataChange(test, {
                      ...testFormData[test],
                      findings: e.target.value
                    })}
                    rows={3}
                    placeholder="Enter findings for this test..."
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor={`${test}_recommendations`}>
                    Recommendations
                  </Label>
                  <Textarea 
                    id={`${test}_recommendations`}
                    value={testFormData[test]?.recommendations || ''}
                    onChange={(e) => onTestDataChange(test, {
                      ...testFormData[test],
                      recommendations: e.target.value
                    })}
                    rows={2}
                    placeholder="Enter recommendations for this test..."
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}