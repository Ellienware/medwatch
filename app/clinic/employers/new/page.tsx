
import { CreateEmployerForm } from "@/components/employer/create-employer-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateEmployerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/employers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Add New Employer</h1>
          <p className="text-muted-foreground">Register a new company account</p>
        </div>
      </div>

      <CreateEmployerForm />
    </div>
  )
}