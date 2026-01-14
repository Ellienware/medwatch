// components/clinic/certificates/certificate-viewer.tsx - Fix the errors
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Printer, Mail, Building, Phone, Mail as MailIcon } from "lucide-react"
import type { Certificate, Patient, Clinic, Branch, TestResult } from "@/lib/types/database"

interface CertificateViewerProps {
  certificate: Certificate
  patient: Patient
  clinic: Clinic
  branch: Branch | null
  testResults: TestResult[]
}

export function CertificateViewer({
  certificate,
  patient,
  clinic,
  branch,
  testResults
}: CertificateViewerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (certificate.pdf_url) {
      window.open(certificate.pdf_url, '_blank')
    }
  }

  // Get company name from employer_id or employer_company_name
  const getCompanyName = () => {
    // Try to get company name from employer_company_name field
    if ((patient as any).employer_company_name) {
      return (patient as any).employer_company_name
    }
    // Fall back to employer_id
    return patient.employer_id || 'N/A'
  }

  return (
    <div className="print:bg-white">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Medical Certificate</h1>
          <p className="text-muted-foreground">
            #{certificate.certificate_number} • {formatDate(certificate.issue_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8">
          {/* Certificate Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {clinic.logo_url && (
                <img 
                  src={clinic.logo_url} 
                  alt="Clinic Logo" 
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{clinic.name}</h1>
                {clinic.registration_number && (
                  <p className="text-sm text-muted-foreground">
                    Registration: {clinic.registration_number}
                  </p>
                )}
              </div>
            </div>
            
            {/* Clinic Contact Information */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-6">
              {clinic.address && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{clinic.address}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{clinic.phone}</span>
                </div>
              )}
              {clinic.email && (
                <div className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4" />
                  <span>{clinic.email}</span>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            <h2 className="text-2xl font-bold text-primary">MEDICAL CERTIFICATE</h2>
            <p className="text-muted-foreground">Certificate #{certificate.certificate_number}</p>
          </div>

          {/* Patient Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="text-lg font-semibold">
                  {patient.first_name} {patient.last_name}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Date of Examination</p>
                <p className="font-medium">{formatDate(certificate.issue_date)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">ID Number</p>
                <p className="font-medium">{patient.id_number}</p>
              </div>
              
              {patient.employee_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Employee Number</p>
                  <p className="font-medium">{patient.employee_number}</p>
                </div>
              )}
              
              {patient.job_title && (
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{patient.job_title}</p>
                </div>
              )}
              
              {patient.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{patient.department}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{getCompanyName()}</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Medical Findings Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Medical Findings</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Certificate Type</p>
                <p className="font-medium capitalize">
                  {certificate.certificate_type.replace(/_/g, ' ')}
                </p>
              </div>
              
              {certificate.diagnosis && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Diagnosis</p>
                  <p className="font-medium">{certificate.diagnosis}</p>
                </div>
              )}
              
              {certificate.valid_from && certificate.valid_until && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valid From</p>
                    <p className="font-medium">{formatDate(certificate.valid_from)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Valid Until</p>
                    <p className="font-medium">{formatDate(certificate.valid_until)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Results Section */}
          {testResults.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                <div className="space-y-4">
                  {testResults.map((test, index) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">
                          {/* Use test_name if available, otherwise use a default */}
                          {(test as any).test_name || `Test ${index + 1}`}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.is_normal 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.is_normal ? 'NORMAL' : 'ABNORMAL'}
                        </span>
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
                </div>
              </div>
            </>
          )}

          {/* Restrictions and Recommendations */}
          {(certificate.restrictions || certificate.recommendations) && (
            <>
              <Separator className="my-6" />
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Medical Advice</h3>
                <div className="space-y-4">
                  {certificate.restrictions && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Work Restrictions</p>
                      <p className="font-medium">{certificate.restrictions}</p>
                    </div>
                  )}
                  
                  {certificate.recommendations && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Recommendations</p>
                      <p className="font-medium">{certificate.recommendations}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Doctor Signature Section */}
          <div className="mt-12">
            <Separator className="my-6" />
            <div className="flex justify-end">
              <div className="text-right">
                {certificate.doctor_signature_url && (
                  <img 
                    src={certificate.doctor_signature_url} 
                    alt="Doctor Signature" 
                    className="h-16 w-48 object-contain mb-2"
                  />
                )}
                <p className="font-semibold">{certificate.doctor_name}</p>
                <p className="text-sm text-muted-foreground">
                  {certificate.doctor_registration_number && 
                    `Registration: ${certificate.doctor_registration_number}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {clinic.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {formatDate(certificate.issue_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              This is an official medical certificate issued by {clinic.name}. 
              For verification purposes, please contact the clinic.
              {clinic.phone && ` Phone: ${clinic.phone}`}
              {clinic.email && ` Email: ${clinic.email}`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}