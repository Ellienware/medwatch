// app/clinic/patients/page.tsx
import { PatientsTable } from "@/components/clinic/patients/patients-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import PatientsSearch from "@/components/clinic/patients/patients-search"
import { Suspense } from "react"

interface SearchParams {
  search?: string
  status?: string
}

interface PageProps {
  searchParams: Promise<SearchParams> // Note: searchParams is a Promise
}

export default async function PatientsPage({ searchParams }: PageProps) {
  // Await the searchParams promise
  const resolvedSearchParams = await searchParams

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Patients</h1>
          <p className="text-muted-foreground">Manage patient records and medical history</p>
        </div>
        <Button asChild>
          <Link href="/clinic/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Link>
        </Button>
      </div>

      <PatientsSearch />

      <Suspense fallback={<div>Loading patients...</div>}>
        <PatientsTable searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  )
}
