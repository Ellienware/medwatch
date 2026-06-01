// components/clinic/tests/tests-overview.tsx - UPDATED
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TestTube2, Stethoscope, Eye, Radio, Shield, Activity, Lock } from "lucide-react"
import { getCurrentUser } from "@/lib/auth/actions"
import { secureTestResultService } from "@/lib/services/secure-test-result-service"

export async function TestsOverview() {
  const user = await getCurrentUser()
  
  if (!user?.clinic_id) {
    return null
  }

  try {
    // Get test statistics using secure service
    const result = await secureTestResultService.list({
      limit: 100,
      includeStats: true
    })
    
    // Process statistics from the secure service response
    const testCategories = [
      {
        name: "Audiometry",
        icon: TestTube2,
        pending: result.stats?.audiometry?.pending || 0,
        completed: result.stats?.audiometry?.completed || 0,
        color: "bg-blue-500",
        sensitive: false,
      },
      {
        name: "Spirometry",
        icon: Stethoscope,
        pending: result.stats?.spirometry?.pending || 0,
        completed: result.stats?.spirometry?.completed || 0,
        color: "bg-green-500",
        sensitive: false,
      },
      {
        name: "Vision Screening",
        icon: Eye,
        pending: result.stats?.vision?.pending || 0,
        completed: result.stats?.vision?.completed || 0,
        color: "bg-purple-500",
        sensitive: false,
      },
      {
        name: "Chest X-Ray",
        icon: Radio,
        pending: result.stats?.xray?.pending || 0,
        completed: result.stats?.xray?.completed || 0,
        color: "bg-orange-500",
        sensitive: false,
      },
      {
        name: "HIV Testing",
        icon: Shield,
        pending: result.stats?.hiv?.pending || 0,
        completed: result.stats?.hiv?.completed || 0,
        color: "bg-red-500",
        sensitive: true,
      },
      {
        name: "Infectious Diseases",
        icon: Activity,
        pending: result.stats?.infectious?.pending || 0,
        completed: result.stats?.infectious?.completed || 0,
        color: "bg-yellow-500",
        sensitive: true,
      },
    ]

    // Filter sensitive tests based on user role
    const canViewSensitiveTests = ['doctor', 'nurse', 'clinic_admin', 'super_admin'].includes(user.role)
    const filteredCategories = testCategories.filter(category => 
      !category.sensitive || canViewSensitiveTests
    )

    return (
      <div className="space-y-4">
        {/* Security Notice for Non-Medical Staff */}
        {user.role === 'receptionist' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                As a receptionist, you can view basic test statistics only. 
                Sensitive tests (HIV, Infectious Diseases) are hidden.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filteredCategories.map((category) => (
            <Card key={category.name} className={category.sensitive ? "border-red-200" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                  {category.sensitive && (
                    <Lock className="h-3 w-3 text-red-500" aria-label="Sensitive test category" />
                  )}
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.color}`}>
                  <category.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-medium">{category.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">{category.completed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            <span>Total tests: {result.total || 0}</span>
          </div>
          {result.stats?.sensitiveCount && result.stats.sensitiveCount > 0 && (
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-red-500" />
              <span className="text-red-600">{result.stats.sensitiveCount} sensitive tests</span>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading test statistics:", error)
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error loading test statistics. Please try again.
          </p>
        </div>
      </div>
    )
  }
}