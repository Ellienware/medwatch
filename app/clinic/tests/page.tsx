import { TestResultsList } from "@/components/clinic/tests/test-results-list"
import { ClinicalTestsList } from "@/components/clinic/tests/clinical-tests-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, TestTube2, Shield } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/actions"
import { getClinicalTestRepository } from "@/lib/repositories"
import { redirect } from "next/navigation"

export default async function TestsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/sign-in")
  }
  
  if (!user.clinic_id) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">No Clinic Assigned</h3>
          <p className="text-yellow-600">You need to be assigned to a clinic to manage tests.</p>
        </div>
      </div>
    )
  }

  // Fetch clinical tests directly from repository
  const testRepo = getClinicalTestRepository()
  const clinicalTests = await testRepo.findByClinicId(user.clinic_id, { isActive: true })

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <TestTube2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Tests & Results</h1>
              <p className="text-muted-foreground">Manage clinical tests and patient results with AES-256 encryption</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1">
            <div className="flex items-center gap-1 text-sm text-blue-700">
              <Shield className="h-3 w-3" />
              <span>Secure Test Data</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/clinic/tests/seed">
                <Plus className="mr-2 h-4 w-4" />
                Add Default Tests
              </Link>
            </Button>
            <Button asChild>
              <Link href="/clinic/tests/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Test
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">AES-256 Encrypted Test Results</p>
            <p className="text-sm text-blue-700">
              All sensitive test data (findings, results, notes) are encrypted using military-grade AES-256 encryption. 
              Access to encrypted data is controlled by role-based permissions. Sensitive tests are marked with 🔒 icon.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="manage">Manage Clinical Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <TestResultsList />
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <ClinicalTestsList 
            initialTests={clinicalTests} 
            clinicId={user.clinic_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
