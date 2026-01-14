"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function AppointmentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleDateChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("date", value)
    } else {
      params.delete("date")
    }
    startTransition(() => {
      router.push(`/clinic/appointments?${params.toString()}`)
    })
  }

  const handleStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("status", value)
    } else {
      params.delete("status")
    }
    startTransition(() => {
      router.push(`/clinic/appointments?${params.toString()}`)
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              className="pl-9"
              defaultValue={searchParams.get("date") || new Date().toISOString().split("T")[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex gap-2 md:w-auto">
            <Select defaultValue={searchParams.get("status") || "all"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="with_nurse">With Nurse</SelectItem>
                <SelectItem value="with_doctor">With Doctor</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
