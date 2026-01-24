import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { Edit, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export async function ClinicsTable() {
  const { databases } = createServerClient()

  const clinicsResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CLINICS, [
    Query.orderDesc("$createdAt"),
  ])

  const clinics = clinicsResult.documents

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-medium">Clinic Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Plan</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Patients</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics?.map((clinic: any) => (
                <tr key={clinic.$id} className="border-b last:border-0">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{clinic.name}</p>
                      <p className="text-sm text-muted-foreground">{clinic.registration_number || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{clinic.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="capitalize">
                      {clinic.subscription_plan}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={clinic.subscription_status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {clinic.subscription_status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {clinic.current_month_patients} / {clinic.monthly_patient_limit}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
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
