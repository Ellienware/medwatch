// app/clinic/tests/[id]/page.tsx - UPDATED WITH ENCRYPTION
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle,
  Shield,
  Lock,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react"
import Link from "next/link"
import { getTestResultById } from "@/lib/actions/test-result-actions"
import { getCurrentUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { hasPermission } from "@/lib/security/access-control"

interface TestResultDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TestResultDetailPage({ params }: TestResultDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    redirect("/login")
  }

  const result = await getTestResultById(id)
  
  if (!result.success || !result.testResult) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/tests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Test Result Not Found</h1>
            <p className="text-muted-foreground">
              {result.error?.includes("permission") 
                ? "You don't have permission to view this test result." 
                : "The test result could not be found."}
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <Shield className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-destructive font-medium">
                {result.error || "Access Denied"}
              </p>
              <Button asChild>
                <Link href="/clinic/tests">
                  Back to Tests
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const test = result.testResult
  const formattedDate = format(new Date(test.performed_at), "EEEE, MMMM d, yyyy, h:mm a")
  
  // Check user permissions
  const canViewSensitiveDetails = ['doctor', 'clinic_admin', 'super_admin'].includes(user.role)
  const canViewMedicalDetails = hasPermission(user.role, 'test_result', 'read')
  const isSensitiveTest = test.is_sensitive
  
  // Determine what the user can see
  const canViewResults = canViewMedicalDetails && (!isSensitiveTest || canViewSensitiveDetails)
  const canViewFindings = canViewMedicalDetails
  const canViewRecommendations = canViewMedicalDetails

  // Safe value rendering function
  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "N/A"
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    // For objects or arrays, stringify them
    try {
      return JSON.stringify(value)
    } catch {
      return "Invalid value"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/clinic/tests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {test.test_name || test.test_code || "Test Results"}
              </h1>
              {isSensitiveTest && (
                <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700">
                  <Lock className="mr-1 h-3 w-3" />
                  Sensitive Test
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Test performed on {formattedDate}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {test.is_normal !== null && (
            <Badge variant={test.is_normal ? "default" : "destructive"} className="text-sm">
              {test.is_normal ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {test.is_normal ? "Normal" : "Abnormal"}
            </Badge>
          )}
          {test.appointment_id && (
            <Button variant="outline" asChild>
              <Link href={`/clinic/appointments/${test.appointment_id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View Appointment
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Security Notice */}
      {isSensitiveTest && !canViewSensitiveDetails && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Restricted Access</p>
              <p className="text-sm text-red-700">
                This is a sensitive medical test. Only doctors and clinic administrators can view the complete details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Test Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Test Results
                {isSensitiveTest && (
                <Shield className="h-4 w-4 text-green-600" aria-label="Decrypted for authorized staff" />
              )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canViewResults && test.results && Object.keys(test.results).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(test.results).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">Test parameter</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{renderValue(value)}</p>
                        <p className="text-sm text-muted-foreground">Value</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : canViewResults ? (
                <p className="text-muted-foreground text-center py-4">No test parameters recorded</p>
              ) : (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Test results are restricted</p>
                  <p className="text-sm text-muted-foreground">
                    Only authorized medical staff can view this test data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Findings Card */}
          {canViewFindings && test.findings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Clinical Findings
                  {isSensitiveTest && (
                    <Shield className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4">
                  <p className="whitespace-pre-wrap">{test.findings}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Card */}
          {canViewRecommendations && test.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Recommendations
                  {isSensitiveTest && (
                    <Shield className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="whitespace-pre-wrap text-blue-700">{test.recommendations}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Restricted Access Placeholder */}
          {!canViewResults && (isSensitiveTest || !canViewMedicalDetails) && (
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Restricted Access</h3>
                    <p className="text-sm text-muted-foreground">
                      {isSensitiveTest
                        ? "This sensitive test can only be viewed by doctors and clinic administrators."
                        : "Test details are only available to medical staff."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          {/* Test Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Test Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Test Type</p>
                  <p className="font-medium capitalize">{test.test_code?.replace('_', ' ') || "Test"}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                  <p className="font-medium">{test.performed_by_name || test.performed_by || "Not specified"}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Performed At</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{format(new Date(test.performed_at), "MMM d, yyyy")}</p>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{format(new Date(test.performed_at), "h:mm a")}</p>
                  </div>
                </div>
                
                {test.reviewed_by && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="font-medium">{test.reviewed_by_name || test.reviewed_by}</p>
                        <p className="text-sm text-muted-foreground">
                          on {format(new Date(test.reviewed_at!), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {test.appointment_id && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/clinic/appointments/${test.appointment_id}`}>
                    <User className="mr-2 h-4 w-4" />
                    View Appointment
                  </Link>
                </Button>
              )}
              
              {test.patient_id && canViewMedicalDetails && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/clinic/patients/${test.patient_id}`}>
                    <User className="mr-2 h-4 w-4" />
                    View Patient Profile
                  </Link>
                </Button>
              )}
              
              {canViewMedicalDetails && !test.reviewed_by && (
                <Button className="w-full justify-start" variant="default" asChild>
                  <Link href={`/clinic/tests/${test.id}/review`}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Reviewed
                  </Link>
                </Button>
              )}
              
              {canViewMedicalDetails && (
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link href={`/api/clinic/tests/${test.id}/report`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Encryption:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    AES-256
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Access Level:</span>
                  <Badge variant="outline">
                    {user.role}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sensitive:</span>
                  <Badge 
                    variant="outline" 
                    className={isSensitiveTest ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                  >
                    {isSensitiveTest ? "Yes" : "No"}
                  </Badge>
                </div>
                
                {test.performed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Audit Log:</span>
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/clinic/audit?entityType=test_result&entityId=${test.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}