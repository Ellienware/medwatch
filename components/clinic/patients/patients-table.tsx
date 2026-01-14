// components/clinic/patients/patients-table.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { Eye, Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { getPatientRepository } from "@/lib/repositories"
import type { Patient } from "@/lib/types/database"
import { Query } from "appwrite"

interface PatientsTableProps {
  searchParams?: { search?: string }
}

export async function PatientsTable({ searchParams }: PatientsTableProps) {
  const user = await getCurrentUser()

  if (!user?.clinic_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No clinic found. Please contact your administrator.</p>
        </CardContent>
      </Card>
    )
  }

  const patientRepo = getPatientRepository()
  
  let patients: Patient[] = []
  
  try {
    // SIMPLEST SOLUTION: Use the repository's built-in methods
    if (searchParams?.search && searchParams.search.trim()) {
      // Use the repository's search method which already handles OR queries correctly
      patients = await patientRepo.search(user.clinic_id, searchParams.search.trim())
    } else {
      // Use the repository's findByClinicId method for non-search queries
      patients = await patientRepo.findByClinicId(user.clinic_id, { isActive: true })
    }
  } catch (error) {
    console.error("Error fetching patients:", error)
    
    // Fallback: Try a basic query without search
    try {
      patients = await patientRepo.findByClinicId(user.clinic_id)
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Error loading patients. Please try again.</p>
            <Button asChild className="mt-4">
              <Link href="/clinic/patients">Reload</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>No patients found.</p>
          <Button asChild className="mt-4">
            <Link href="/clinic/patients/new">Add First Patient</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Patient Name</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">ID Number</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Employer</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Contact</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient: Patient) => (
                <tr key={patient.id} className="border-b last:border-0">
                  <td className="px-4 py-4 lg:px-6">
                    <div>
                      <p className="font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground sm:hidden">{patient.id_number}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm sm:table-cell">{patient.id_number}</td>
                  <td className="hidden px-4 py-4 text-sm md:table-cell">
                    {patient.employer_id ? "Company" : "Individual"}
                  </td>
                  <td className="px-4 py-4 text-sm lg:px-6">
                    <div>
                      <p className="hidden sm:block">{patient.email || "N/A"}</p>
                      <p className="text-muted-foreground">{patient.phone || "N/A"}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <Badge variant={patient.is_active ? "default" : "secondary"}>
                      {patient.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 lg:px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/clinic/patients/${patient.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clinic/patients/${patient.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clinic/appointments/new?patientId=${patient.id}`}>
                            Book Appointment
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}