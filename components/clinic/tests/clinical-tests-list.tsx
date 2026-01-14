// components/clinic/tests/clinical-tests-list.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/actions"
import { TestTube2, Clock, DollarSign } from "lucide-react"
import { getClinicalTestRepository } from "@/lib/repositories"

export async function ClinicalTestsList() {
  const user = await getCurrentUser()

  if (!user?.clinic_id) return null

  const clinicalTestsRepo = getClinicalTestRepository()
  
  // Get clinical tests using repository
  const tests = await clinicalTestsRepo.find([
    `{"method":"equal","attribute":"clinic_id","values":["${user.clinic_id}"]}`,
    `{"method":"equal","attribute":"is_active","values":[true]}`,
    `{"method":"orderAsc","attribute":"test_name"}`,
    `{"method":"limit","values":[100]}`
  ])

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No clinical tests found. Add tests to get started.</p>
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
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Test Name</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Code</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Category</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium lg:px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b last:border-0">
                  <td className="px-4 py-4 lg:px-6">
                    <div className="flex items-center gap-2">
                      <TestTube2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{test.test_name}</p>
                        {test.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{test.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-sm sm:table-cell">
                    <Badge variant="outline">{test.test_code}</Badge>
                  </td>
                  <td className="hidden px-4 py-4 text-sm capitalize md:table-cell">
                    {test.test_category || "General"}
                  </td>
                  <td className="hidden px-4 py-4 text-sm sm:table-cell">
                    {test.estimated_duration_minutes ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {test.estimated_duration_minutes}min
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-3 w-3" />
                      {test.price?.toFixed(2) || "0.00"}
                    </div>
                  </td>
                  <td className="px-4 py-4 lg:px-6">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
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