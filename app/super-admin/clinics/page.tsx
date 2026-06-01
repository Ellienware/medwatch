import { ClinicsTable } from "@/components/super-admin/clinics-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
export const dynamic = 'force-dynamic'
export default function ClinicsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinics</h1>
          <p className="text-muted-foreground">Manage all registered clinics</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/clinics/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Clinic
          </Link>
        </Button>
      </div>

      <ClinicsTable />
    </div>
  )
}
