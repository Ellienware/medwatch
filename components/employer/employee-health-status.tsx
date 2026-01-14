import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function EmployeeHealthStatus() {
  const healthMetrics = [
    { category: "Audiometry Compliant", value: 96, count: "237/247" },
    { category: "Spirometry Compliant", value: 94, count: "232/247" },
    { category: "Vision Tests Current", value: 98, count: "242/247" },
    { category: "Chest X-Ray Up-to-Date", value: 91, count: "225/247" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Compliance</CardTitle>
        <CardDescription>Workforce medical testing compliance rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthMetrics.map((metric) => (
            <div key={metric.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.category}</span>
                <span className="text-sm text-muted-foreground">{metric.count}</span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
