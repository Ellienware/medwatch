import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/appwrite/server-client"
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import { Query } from "appwrite"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export async function RecentClinics() {
  const { databases } = createServerClient()

  const clinicsResult = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.CLINICS, [
    Query.orderDesc("$createdAt"),
    Query.limit(5),
  ])

  const clinics = clinicsResult.documents

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Clinics</CardTitle>
          <CardDescription>Newly registered clinics</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/super-admin/clinics">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clinics?.map((clinic: any) => (
            <div key={clinic.$id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <p className="font-medium">{clinic.name}</p>
                <p className="text-sm text-muted-foreground">{clinic.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={clinic.subscription_status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {clinic.subscription_status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
