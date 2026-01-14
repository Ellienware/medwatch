"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, FileText } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "New Appointment",
      description: "Schedule a patient visit",
      icon: Calendar,
      href: "/clinic/appointments/new",
      color: "bg-blue-500",
    },
    {
      title: "Register Patient",
      description: "Add new patient record",
      icon: Users,
      href: "/clinic/patients/new",
      color: "bg-green-500",
    },
    {
      title: "Issue Certificate",
      description: "Generate fit-to-work certificate",
      icon: FileText,
      href: "/clinic/certificates/new",
      color: "bg-purple-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions for faster workflow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              asChild
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
            >
              <Link href={action.href}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
