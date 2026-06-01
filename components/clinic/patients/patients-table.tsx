import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { Eye, Edit, MoreHorizontal, Shield, Phone, Mail, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { listPatients } from "@/lib/actions/patient-actions"

interface PatientsTableProps {
  searchParams?: { search?: string; status?: string }
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

  let patients: any[] = []
  
  try {
    const result = await listPatients({
      search: searchParams?.search?.trim(),
      status: searchParams?.status || 'active',
    })
    
    patients = result.patients || []
    
  } catch (error: any) {
    console.error("Error fetching patients:", error)
    
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <Shield className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-destructive font-medium">
              {error.message?.includes("permission") 
                ? "Access Denied: You don't have permission to view patients." 
                : "Error loading patients. Please try again."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/clinic/patients">Reload Page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No patients found.</p>
            <Button asChild className="mt-4">
              <Link href="/clinic/patients/new">
                <Shield className="mr-2 h-4 w-4" />
                Register First Patient
              </Link>
            </Button>
          </div>
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
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Patient</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">
                  <div className="flex items-center gap-1">
                    ID Number
                    <Shield className="h-3 w-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Employer</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Contact</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.$id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 lg:px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          DOB: {patient.date_of_birth || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm sm:table-cell">
                    <div className="flex items-center gap-1">
                      {patient.id_number ? (
                        <>
                          <span className="font-mono">{patient.id_number}</span>
                          <Shield className="h-3 w-3 text-green-600" aria-label="Encrypted field" />
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm md:table-cell">
                    {patient.employer_id ? (
                      <Badge variant="outline" className="bg-blue-50">Company</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50">Individual</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm lg:px-6">
                    <div className="space-y-1">
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{patient.email}</span>
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {!patient.email && !patient.phone && (
                        <span className="text-muted-foreground text-xs">No contact info</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <Badge 
                      variant={patient.is_active ? "default" : "secondary"}
                      className={patient.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                    >
                      {patient.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 lg:px-6">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/clinic/patients/${patient.$id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {['clinic_admin', 'doctor', 'nurse', 'receptionist'].includes(user.role) && (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/clinic/patients/${patient.$id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clinic/patients/${patient.$id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {['clinic_admin', 'doctor', 'nurse', 'receptionist'].includes(user.role) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/clinic/patients/${patient.$id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Patient
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/clinic/appointments/new?patientId=${patient.$id}`}>
                              Book Appointment
                            </Link>
                          </DropdownMenuItem>
                          {user.role === 'clinic_admin' && (
                            <DropdownMenuItem asChild className="text-destructive">
                              <Link href={`/clinic/patients/${patient.$id}/deactivate`}>
                                Deactivate Patient
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Security Footer */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              <span>
                Showing {patients.length} patients • Sensitive fields are encrypted
              </span>
            </div>
            <div>
              <span className="text-xs">
                Access level: <Badge variant="outline" className="ml-1">{user.role}</Badge>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}