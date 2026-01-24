// app/clinic/tests/[id]/page.tsx
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, User, Calendar, Clock, Activity, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { getTestResultById } from "@/lib/actions/test-result-actions"
import { getCurrentUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator" // Add this import
import { format } from "date-fns"

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/tests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Test Result Not Found</h1>
            <p className="text-muted-foreground">The test result could not be found or you don't have permission to view it.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              {result.error || "Test result not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const test = result.testResult
  const formattedDate = format(new Date(test.performed_at), "EEEE, MMMM d, yyyy, h:mm a")

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/clinic/tests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                <span className="capitalize">{test.test_code.replace('_', ' ')}</span> Results
              </h1>
              {test.is_normal !== null && (
                <Badge variant={test.is_normal ? "default" : "destructive"} className="text-sm">
                  {test.is_normal ? "Normal" : "Abnormal"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Test performed on {formattedDate}
            </p>
          </div>
        </div>
        
        <Button variant="outline" asChild>
          <Link href={`/clinic/appointments/${test.appointment_id}`}>
            <Calendar className="mr-2 h-4 w-4" />
            View Appointment
          </Link>
        </Button>
      </div>

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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {test.results && Object.keys(test.results).length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-center py-4">No test parameters recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Findings Card */}
          {test.findings && (
            <Card>
              <CardHeader>
                <CardTitle>Clinical Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4">
                  <p className="whitespace-pre-wrap">{test.findings}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations Card */}
          {test.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="whitespace-pre-wrap text-blue-700">{test.recommendations}</p>
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
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Test Type</p>
                  <p className="font-medium capitalize">{test.test_code.replace('_', ' ')}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Performed By</p>
                  <p className="font-medium">{test.performed_by || "Not specified"}</p>
                </div>
                
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
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="font-medium">{test.reviewed_by}</p>
                      <p className="text-sm text-muted-foreground">
                        on {format(new Date(test.reviewed_at!), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
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
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/clinic/appointments/${test.appointment_id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View Patient Appointment
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href={`/clinic/patients/${test.patient_id}`}>
                  <User className="mr-2 h-4 w-4" />
                  View Patient Profile
                </Link>
              </Button>
              {!test.reviewed_by && (
                <Button className="w-full justify-start" variant="default">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Reviewed
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}