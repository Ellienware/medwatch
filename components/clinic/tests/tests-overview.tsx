import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TestTube2, Stethoscope, Eye, Radio, Shield, Activity } from "lucide-react"

export function TestsOverview() {
  const testCategories = [
    {
      name: "Audiometry",
      icon: TestTube2,
      pending: 5,
      completed: 23,
      color: "bg-blue-500",
    },
    {
      name: "Spirometry",
      icon: Stethoscope,
      pending: 3,
      completed: 18,
      color: "bg-green-500",
    },
    {
      name: "Vision Screening",
      icon: Eye,
      pending: 7,
      completed: 31,
      color: "bg-purple-500",
    },
    {
      name: "Chest X-Ray",
      icon: Radio,
      pending: 2,
      completed: 15,
      color: "bg-orange-500",
    },
    // ADD HIV TEST CATEGORY
    {
      name: "HIV Testing",
      icon: Shield,
      pending: 1,
      completed: 8,
      color: "bg-red-500",
    },
    // ADD OTHER INFECTIOUS DISEASE TESTS
    {
      name: "Infectious Diseases",
      icon: Activity,
      pending: 4,
      completed: 12,
      color: "bg-yellow-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {testCategories.map((category) => (
        <Card key={category.name}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
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
  )
}