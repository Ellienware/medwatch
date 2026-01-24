// app/clinic/tests/page.tsx (simplified version)
import { TestResultsList } from "@/components/clinic/tests/test-results-list"
import { ClinicalTestsList } from "@/components/clinic/tests/clinical-tests-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Tests & Results</h1>
          <p className="text-muted-foreground">Manage clinical tests and patient results</p>
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

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="manage">Manage Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <TestResultsList />
        </TabsContent>

        <TabsContent value="manage">
          <ClinicalTestsList 
            initialTests={clinicalTests} 
            clinicId={user.clinic_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
