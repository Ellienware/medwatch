// app/clinic/employers/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { getEmployerRepository } from "@/lib/repositories"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EditEmployerForm } from "@/components/clinic/employers/edit-employer-form"


export default async function EditEmployerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return notFound()
  }

  const employerRepo = getEmployerRepository()
  const employer = await employerRepo.findById(id)

  if (!employer || employer.clinic_id !== user.clinic_id) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clinic/employers/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Edit Employer
          </h1>
          <p className="text-muted-foreground">
            Update details for {employer.company_name}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>
            Update company information and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditEmployerForm employer={employer} />
        </CardContent>
      </Card>
    </div>
  )
}
