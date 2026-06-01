/// components/clinic/tests/test-results-list.tsx - UPDATED
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { 
  TestTube2, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Shield, 
  Lock, 
  Eye,
  FileText,
  Calendar
} from "lucide-react"
import { ViewReportButton } from "./view-report-button"
import { hasPermission } from "@/lib/security/access-control"
import { secureTestResultService } from "@/lib/services/secure-test-result-service"
import { securePatientService } from "@/lib/services/secure-patient-service"

// Define type for test result from secure service
interface SecureTestResult {
  id: string
  test_name?: string
  test_code?: string
  patient_name?: string
  patient_id?: string
  is_sensitive?: boolean
  is_normal?: boolean | null
  requires_review?: boolean
  performed_at: string
  reviewed_at?: string
  findings?: string
  performed_by_name?: string
  reviewed_by_name?: string
  reviewed_by?: string
  appointment_id?: string
  clinic_id?: string
  results?: any
  recommendations?: string
  created_at?: string
  updated_at?: string
}

export async function TestResultsList() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No clinic found. Please contact your administrator.</p>
        </CardContent>
      </Card>
    )
  }

  try {
    // USE: Secure service to get test results
    const result = await secureTestResultService.list({
      limit: 20,
      sort: 'performed_at:desc'
    })
    
    const testResults: SecureTestResult[] = (result.documents || []) as SecureTestResult[]

    // Check user permissions
    const canViewSensitiveResults = ['doctor', 'nurse', 'clinic_admin', 'super_admin'].includes(user.role)
    const canViewMedicalDetails = hasPermission(user.role, 'test_result', 'read')

    if (testResults.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TestTube2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No test results found</h3>
            <p className="text-sm text-muted-foreground">
              Test results will appear here once tests are performed
            </p>
            {user.role === 'receptionist' && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                  As a receptionist, you can only view basic test information. 
                  Medical details are restricted to medical staff.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {/* Security Info Banner */}
        {user.role === 'receptionist' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Limited Access View</p>
                <p className="text-sm text-blue-700">
                  As a receptionist, you can view basic test information only. 
                  Medical details, findings, and results are restricted to medical staff.
                </p>
              </div>
            </div>
          </div>
        )}

        {testResults.map((result: SecureTestResult) => {
          const isSensitive = result.is_sensitive
          const canViewThisResult = canViewMedicalDetails && (!isSensitive || canViewSensitiveResults)
          
          return (
            <Card key={result.id} className={isSensitive ? "border-red-200 bg-red-50/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isSensitive ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <TestTube2 className={`h-5 w-5 ${isSensitive ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {result.test_name || result.test_code || "Unknown Test"}
                        </CardTitle>
                        {isSensitive && (
                          <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700">
                            <Lock className="mr-1 h-3 w-3" />
                            Sensitive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {result.patient_name || "Patient"} • 
                          {result.patient_id && canViewThisResult ? (
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-sm"
                              asChild
                            >
                              <a href={`/clinic/patients/${result.patient_id}`}>
                                View Patient
                              </a>
                            </Button>
                          ) : " Patient"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {result.is_normal === true && (
                        <Badge 
                          variant="outline" 
                          className="bg-green-500/10 text-green-700 border-green-300"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Normal
                        </Badge>
                      )}
                      {result.is_normal === false && (
                        <Badge 
                          variant="outline" 
                          className="bg-red-500/10 text-red-700 border-red-300"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Abnormal
                        </Badge>
                      )}
                      {result.requires_review && (
                        <Badge 
                          variant="default" 
                          className="bg-amber-500 text-amber-950"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Review Needed
                        </Badge>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {result.reviewed_by ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Test Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Performed:</span>
                      </div>
                      <p className="font-medium">
                        {new Date(result.performed_at).toLocaleDateString()} at{' '}
                        {new Date(result.performed_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {result.reviewed_at && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Reviewed:</span>
                        </div>
                        <p className="font-medium">
                          {new Date(result.reviewed_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Findings - Conditionally shown */}
                  {canViewThisResult && result.findings && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Findings:
                      </p>
                      <p className="text-sm">{result.findings}</p>
                    </div>
                  )}

                  {/* Restricted Access Notice */}
                  {!canViewThisResult && (
                    <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 p-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Restricted Access</p>
                          <p className="text-xs text-amber-700">
                            {isSensitive 
                              ? "This is a sensitive test. Only doctors and medical staff can view the details."
                              : "Medical details are restricted to medical staff."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {result.performed_by_name && (
                        <span className="text-xs text-muted-foreground">
                          Performed by: {result.performed_by_name}
                        </span>
                      )}
                      {result.reviewed_by_name && (
                        <span className="text-xs text-muted-foreground">
                          • Reviewed by: {result.reviewed_by_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {canViewThisResult ? (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/clinic/tests/${result.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              View Details
                            </a>
                          </Button>
                          <ViewReportButton 
                            testResultId={result.id}
                            patientName={result.patient_name || "Patient"}
                            testName={result.test_name || "Test"}
                            isSensitive={isSensitive}
                          />
                        </>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          <Lock className="mr-1 h-3 w-3" />
                          Access Restricted
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Security Footer */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Security Summary</p>
                <p className="text-xs text-blue-700">
                  Showing {testResults.length} test results with role-based encryption.
                  Sensitive tests are marked with 🔒 icon.
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="bg-white">
                {testResults.filter((r: SecureTestResult) => r.is_sensitive).length} sensitive tests
              </Badge>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error("Error loading test results:", error)
    
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Shield className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-destructive font-medium">
              {error.message?.includes("permission") 
                ? "Access Denied: You don't have permission to view test results." 
                : "Error loading test results. Please try again."}
            </p>
            <Button variant="outline" asChild>
              <a href="/clinic/tests">Try Again</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
}