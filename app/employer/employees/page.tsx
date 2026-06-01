import { EmployeesTable } from "@/components/employer/employees-table"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository } from "@/lib/repositories"
export const dynamic = 'force-dynamic'
export default async function EmployeesPage() {
  // Get current user
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Not authenticated</div>
  }

  // Get employer for this user
  const employerRepo = getEmployerRepository()
  const employer = user.role === "employer" && user.id ? 
    await employerRepo.findByPortalUserId(user.id) : null

  if (!employer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Employees</h1>
          <p className="text-muted-foreground">View your workforce medical status</p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No employer data found. Please contact your clinic.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Employees</h1>
        <p className="text-muted-foreground">
          View your workforce medical status - {employer.company_name}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-9" />
        </div>
      </div>

      <EmployeesTable employerId={employer.id} />
    </div>
  )
}
