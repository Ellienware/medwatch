// components/clinic/certificates/update-certificate-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { updateCertificateStatus } from "@/lib/actions/certificate-actions"
import { updateCertificateAction } from "@/lib/actions/certificate-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, User, Building, TestTube } from "lucide-react"
import type { Certificate, Patient, Clinic, Branch, TestResult } from "@/lib/types/database"

const certificateFormSchema = z.object({
  certificate_type: z.enum(["fit_to_work", "unfit_to_work", "fit_with_restrictions"]),
  diagnosis: z.string().optional(),
  restrictions: z.string().optional(),
  recommendations: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

type CertificateFormValues = z.infer<typeof certificateFormSchema>

interface UpdateCertificateFormProps {
  certificate: Certificate
  patient: Patient
  clinic: Clinic
  branch: Branch | null
  testResults: TestResult[]
}

export function UpdateCertificateForm({
  certificate,
  patient,
  clinic,
  branch,
  testResults
}: UpdateCertificateFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testData, setTestData] = useState(testResults)

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: {
      certificate_type: certificate.certificate_type,
      diagnosis: certificate.diagnosis || "",
      restrictions: certificate.restrictions || "",
      recommendations: certificate.recommendations || "",
      valid_from: certificate.valid_from || "",
      valid_until: certificate.valid_until || "",
    },
  })

  async function onSubmit(data: CertificateFormValues) {
    setIsSubmitting(true)
    
    try {
      const result = await updateCertificateAction({
        id: certificate.id,
        ...data,
        test_results: testData
      })

      if (result.success) {
        toast({
          title: "Certificate updated",
          description: "The certificate has been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update certificate",
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
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Column - Patient & Clinic Info */}
      <div className="md:col-span-1 space-y-6">
        {/* Patient Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-lg font-semibold">
                {patient.first_name} {patient.last_name}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Examination</p>
                <p className="font-medium">{formatDate(certificate.issue_date)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Number</p>
                <p className="font-medium">{patient.id_number}</p>
              </div>
            </div>
            
            {patient.employee_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee Number</p>
                <p className="font-medium">{patient.employee_number}</p>
              </div>
            )}
            
            {patient.job_title && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupation</p>
                <p className="font-medium">{patient.job_title}</p>
              </div>
            )}
            
            {patient.department && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="font-medium">{patient.department}</p>
              </div>
            )}
            
            {patient.employer_company_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p className="font-medium">{patient.employer_company_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clinic/Branch Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Clinic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clinic Name</p>
              <p className="font-semibold">{clinic.name}</p>
            </div>
            
            {clinic.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="font-medium">{clinic.address}</p>
              </div>
            )}
            
            {branch?.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch Address</p>
                <p className="font-medium">{branch.address}</p>
              </div>
            )}
            
            {clinic.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="font-medium">{clinic.phone}</p>
              </div>
            )}
            
            {branch?.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch Phone</p>
                <p className="font-medium">{branch.phone}</p>
              </div>
            )}
            
            {clinic.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{clinic.email}</p>
              </div>
            )}
            
            {branch?.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch Email</p>
                <p className="font-medium">{branch.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Certificate Form & Test Results */}
      <div className="md:col-span-2 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Certificate #{certificate.certificate_number} • Issued on {formatDate(certificate.issue_date)}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="certificate_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select certificate type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fit_to_work">Fit to Work</SelectItem>
                          <SelectItem value="unfit_to_work">Unfit to Work</SelectItem>
                          <SelectItem value="fit_with_restrictions">Fit with Restrictions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnosis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter medical diagnosis"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Restrictions (if any)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter work restrictions"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter medical recommendations"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Test Results Section */}
            {testData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Test Results
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Clinical test results from examination
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testData.map((test, index) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {test.test_name || `Test ${index + 1}`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Performed on {formatDate(test.performed_at)}
                          </p>
                        </div>
                        <Badge variant={test.is_normal ? "default" : "destructive"}>
                          {test.is_normal ? "Normal" : "Abnormal"}
                        </Badge>
                      </div>
                      
                      {test.results && Object.keys(test.results).length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Results:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(test.results).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {test.findings && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Findings:</p>
                          <p className="text-sm">{test.findings}</p>
                        </div>
                      )}
                      
                      {test.recommendations && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Recommendations:</p>
                          <p className="text-sm">{test.recommendations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <a href={`/clinic/certificates/${certificate.id}/view`} target="_blank" rel="noopener noreferrer">
                  Preview Certificate
                </a>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Certificate
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
