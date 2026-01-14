// app/clinic/appointments/page.tsx
import { AppointmentsTable } from "@/components/clinic/appointments/appointments-table"
import { AppointmentFilters } from "@/components/clinic/appointments/appointment-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

interface SearchParams {
  date?: string
  status?: string
}

interface PageProps {
  searchParams: Promise<SearchParams> // Note: searchParams is a Promise
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  // Await the searchParams promise
  const resolvedSearchParams = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Appointments</h1>
          <p className="text-muted-foreground">Manage and track patient appointments</p>
        </div>
        <Button asChild>
          <Link href="/clinic/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      <AppointmentFilters />

      <Suspense fallback={<div>Loading appointments...</div>}>
        <AppointmentsTable searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}
