import { RecordTestForm } from "@/components/clinic/tests/record-test-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function RecordTestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/tests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Record Test Results</h1>
          <p className="text-muted-foreground">Enter patient test results</p>
        </div>
      </div>

      <RecordTestForm />
    </div>
  )
}
