// components/clinic/tests/test-results-list.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { TestTube2, AlertCircle, CheckCircle } from "lucide-react"
import { getTestResultRepository } from "@/lib/repositories"
import { getPatientRepository } from "@/lib/repositories"
import { getClinicalTestRepository } from "@/lib/repositories"

export async function TestResultsList() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  const testResultRepo = getTestResultRepository()
  const patientRepo = getPatientRepository()
  const clinicalTestRepo = getClinicalTestRepository()
  
  // Get test results using repository
  const testResults = await testResultRepo.find([
    `{"method":"equal","attribute":"clinic_id","values":["${user.clinic_id}"]}`,
    `{"method":"orderDesc","attribute":"performed_at"}`,
    `{"method":"limit","values":[20]}`
  ])

  // Fetch patient and test details for each result
  const resultsWithDetails = await Promise.all(
    testResults.map(async (result) => {
      const [patient, test] = await Promise.all([
        result.patient_id
          ? patientRepo.findById(result.patient_id).catch(() => null)
          : null,
        result.test_id
          ? clinicalTestRepo.findById(result.test_id).catch(() => null)
          : null,
      ])
      return { ...result, patient, test }
    })
  )

  if (resultsWithDetails.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TestTube2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No test results found</h3>
          <p className="text-sm text-muted-foreground">Test results will appear here once tests are performed</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {resultsWithDetails.map((result) => (
        <Card key={result.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TestTube2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{result.test?.test_name || "Unknown Test"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {result.patient?.first_name} {result.patient?.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {result.is_normal === true && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Normal
                  </Badge>
                )}
                {result.is_normal === false && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Abnormal
                  </Badge>
                )}
                {result.reviewed_by ? (
                  <Badge variant="default">Reviewed</Badge>
                ) : (
                  <Badge variant="secondary">Pending Review</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Performed:</span>
                  <p className="font-medium">{new Date(result.performed_at).toLocaleDateString()}</p>
                </div>
                {result.reviewed_at && (
                  <div>
                    <span className="text-muted-foreground">Reviewed:</span>
                    <p className="font-medium">{new Date(result.reviewed_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              {result.findings && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="font-medium text-muted-foreground">Findings:</p>
                  <p>{result.findings}</p>
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}