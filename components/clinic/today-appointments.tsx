"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Clock, User, AlertCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { Appointment, Patient } from "@/lib/types/database"

// ---------------- helpers ----------------

function formatTime(time: string): string {
  if (!time) return "N/A"
  const [h, m] = time.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  return `${hour % 12 || 12}:${m} ${ampm}`
}

function getStatusVariant(status: string) {
  switch (status) {
    case "checked_in":
      return "default"
    case "with_nurse":
    case "with_doctor":
      return "secondary"
    case "cancelled":
    case "no_show":
      return "destructive"
    default:
      return "outline"
  }
}

function getStatusDisplay(status: string) {
  return status.replace("_", " ")
}

// ---------------- types ----------------

interface AppointmentWithPatient extends Appointment {
  patient?: Patient | null
}

interface TodayAppointmentsProps {
  initialData?: AppointmentWithPatient[]
}

// ---------------- component ----------------

export function TodayAppointments({ initialData }: TodayAppointmentsProps) {
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>(initialData ?? [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/appointments/today", {
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error("Failed to load appointments")
      }

      const data: AppointmentWithPatient[] = await res.json()
      setAppointments(data)
      setRetryCount(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setRetryCount(c => c + 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) fetchAppointments()
  }, [initialData, retryCount])

  const sorted = [...appointments].sort((a, b) =>
    (a.appointment_time || "").localeCompare(b.appointment_time || "")
  )

  // ---------------- UI ----------------

  if (loading) {
    return <Card><CardContent className="p-6">Loading…</CardContent></Card>
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Today’s Appointments
          </CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/clinic/appointments">View all</Link>
          </Button>
          {retryCount < 3 && (
            <Button variant="ghost" onClick={() => setRetryCount(c => c + 1)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today’s Appointments
          </CardTitle>
          <CardDescription>Upcoming and ongoing consultations</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clinic/appointments">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No appointments today
          </p>
        )}

        {sorted.map(apt => (
          <div
            key={apt.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium truncate">
                  {apt.patient
                    ? `${apt.patient.first_name} ${apt.patient.last_name}`
                    : "Unknown patient"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatTime(apt.appointment_time)}
              </div>
            </div>

            <Badge variant={getStatusVariant(apt.status)}>
              {getStatusDisplay(apt.status)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
