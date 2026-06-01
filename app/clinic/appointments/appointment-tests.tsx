// components/clinic/appointments/appointment-tests.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Eye, Activity, Droplets, Heart, Microscope } from "lucide-react"
import Link from "next/link"
import { getTestResultsByAppointment } from "@/lib/actions/test-result-actions"

interface AppointmentTestsProps {
  appointmentId: string
  patientId: string
}

// Define the test result type
interface TestResult {
  id: string
  test_id: string
  test_name?: string
  performed_by?: string
  performed_at: string
  is_normal: boolean | null
  // Add other properties that might be returned
  test_code?: string
  appointment_id?: string
  patient_id?: string
  results?: any
  findings?: string
  recommendations?: string
  reviewed_by?: string
  reviewed_at?: string | null
  is_sensitive?: boolean
  requires_review?: boolean
  clinic_id?: string
  created_at?: string
  updated_at?: string
}

// Test type icons
const testIcons: Record<string, React.ReactNode> = {
  audiometry: <Activity className="h-4 w-4" />,
  spirometry: <Activity className="h-4 w-4" />,
  vision: <Eye className="h-4 w-4" />,
  xray: <Activity className="h-4 w-4" />,
  bp: <Heart className="h-4 w-4" />,
  drug: <Activity className="h-4 w-4" />,
  hiv: <Microscope className="h-4 w-4" />,
  malaria: <Droplets className="h-4 w-4" />,
  hepatitis_b: <Microscope className="h-4 w-4" />,
  hepatitis_c: <Microscope className="h-4 w-4" />,
  syphilis: <Microscope className="h-4 w-4" />,
  urinalysis: <Droplets className="h-4 w-4" />,
  blood_glucose: <Activity className="h-4 w-4" />,
  cholesterol: <Activity className="h-4 w-4" />,
  ecg: <Heart className="h-4 w-4" />,
}

export async function AppointmentTests({ appointmentId, patientId }: AppointmentTestsProps) {
  const result = await getTestResultsByAppointment(appointmentId)
  const tests: TestResult[] = result.success ? (result.testResults as TestResult[]) : []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tests & Procedures
          </CardTitle>
          <Button size="sm" asChild>
            <Link href={`/clinic/tests/record?appointment=${appointmentId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Record Test
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tests.length > 0 ? (
          <div className="space-y-3">
            {tests.map((test: TestResult) => (
              <div key={test.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {testIcons[test.test_id] || <FileText className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{
                      test.test_name || 
                      (test.test_code ? test.test_code.replace('_', ' ') : 
                      test.test_id ? test.test_id.replace('_', ' ') : 'Test')
                    }</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Performed by: {test.performed_by?.substring(0, 8) || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(test.performed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.is_normal !== null && (
                    <Badge variant={test.is_normal ? "default" : "destructive"}>
                      {test.is_normal ? "Normal" : "Abnormal"}
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/clinic/tests/${test.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No Tests Recorded</h3>
            <p className="text-muted-foreground mb-4">No test results have been recorded for this appointment</p>
            <Button asChild>
              <Link href={`/clinic/tests/record?appointment=${appointmentId}`}>
                <Plus className="mr-2 h-4 w-4" />
                Record First Test
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}