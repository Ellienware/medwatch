// app/clinic/employers/page.tsx
import { EmployersList } from "@/components/clinic/employers/employers-list"
import { EmployersSearch } from "@/components/clinic/employers/employers-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { getCurrentUser } from "@/lib/auth/actions"

export default async function EmployersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ search?: string }>
}) {
  // Resolve the Promise in the server component
  const resolvedParams = await searchParams
  const searchTerm = resolvedParams.search || ""
  
  // Fetch data here in the server component
  const { databases } = createServerClient()
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) return null

  const queries = [Query.equal("clinic_id", user.clinic_id)]

  if (searchTerm) {
    queries.push(
      Query.or([
        Query.search("company_name", searchTerm),
        Query.search("email", searchTerm),
        Query.search("registration_number", searchTerm),
      ]),
    )
  }

  queries.push(Query.orderAsc("company_name"))
  queries.push(Query.limit(100))

  const employersResult = await databases.listDocuments(
    APPWRITE_DATABASE_ID, 
    COLLECTIONS.EMPLOYERS, 
    queries
  )

  const employers = employersResult.documents

  // Get employee count for each employer
  const employersWithCounts = await Promise.all(
    employers.map(async (employer: any) => {
      const patientsResult = await databases.listDocuments(
        APPWRITE_DATABASE_ID, 
        COLLECTIONS.PATIENTS, 
        [
          Query.equal("employer_id", employer.$id),
          Query.limit(1),
        ]
      )
      return { ...employer, employeeCount: patientsResult.total }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Employers</h1>
          <p className="text-muted-foreground">Manage company accounts and contracts</p>
        </div>
        <Button asChild>
          <Link href="/clinic/employers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Employer
          </Link>
        </Button>
      </div>

      <EmployersSearch initialSearch={searchTerm} />

      {/* Pass fetched data to client component */}
      <EmployersList employers={employersWithCounts} />
    </div>
  )
}
