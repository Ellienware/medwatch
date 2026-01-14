import { TestResultsList } from "@/components/clinic/tests/test-results-list"
import { ClinicalTestsList } from "@/components/clinic/tests/clinical-tests-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Tests & Results</h1>
          <p className="text-muted-foreground">Manage clinical tests and patient results</p>
        </div>
        <Button asChild>
          <Link href="/clinic/tests/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Test
          </Link>
        </Button>
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
          <ClinicalTestsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
