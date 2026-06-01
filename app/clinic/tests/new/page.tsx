// app/clinic/tests/new/page.tsx - UPDATED
import { RecordTestForm } from "@/components/clinic/tests/record-test-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, TestTube2 } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/actions"
import { redirect } from "next/navigation"

export default async function RecordTestPage() {
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    redirect("/login")
  }

  // Check if user has permission to record tests
  const canRecordTests = ['doctor', 'nurse', 'clinic_admin'].includes(user.role)
  if (!canRecordTests) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-4">
            <Shield className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              Only medical staff (doctors, nurses) and clinic administrators can record test results.
            </p>
          </div>
          <Button asChild>
            <Link href="/clinic/tests">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tests
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/clinic/tests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <TestTube2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Record Test Results</h1>
            <p className="text-muted-foreground">
              Enter test results with AES-256 encryption for patient data security
            </p>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Secure Test Recording</p>
            <p className="text-sm text-blue-700">
              All sensitive test data (findings, results, medical notes) will be encrypted using military-grade AES-256 encryption. 
              Access to encrypted data is controlled by role-based permissions.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                AES-256 Encryption
              </span>
              <span className="flex items-center gap-1">
                <TestTube2 className="h-3 w-3" />
                Role-Based Access
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                Audit Logged
              </span>
            </div>
          </div>
        </div>
      </div>

      <RecordTestForm />
    </div>
  )
}

