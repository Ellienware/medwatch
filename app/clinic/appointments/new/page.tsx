import { NewAppointmentForm } from "@/components/clinic/appointments/new-appointment-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clinic/appointments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Schedule Appointment</h1>
          <p className="text-muted-foreground">Book a new patient appointment</p>
        </div>
      </div>

      <NewAppointmentForm />
    </div>
  )
}
