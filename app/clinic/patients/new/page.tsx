import { NewPatientForm } from "@/components/clinic/patients/new-patient-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Register New Patient</h1>
          <p className="text-muted-foreground">Add a new patient to your clinic records</p>
        </div>
      </div>

      <NewPatientForm />
    </div>
  )
}
