"use client"

import { useState } from "react"
import { toast } from "sonner"

interface UseSendEmailOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useSendEmail(options: UseSendEmailOptions = {}) {
  const [isSending, setIsSending] = useState(false)

  const sendCertificateEmail = async (certificateId: string) => {
    setIsSending(true)

    try {
      const response = await fetch("/api/emails/send-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast.success("Certificate email sent successfully")
      options.onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send email"
      toast.error(errorMsg)
      options.onError?.(error instanceof Error ? error : new Error(errorMsg))
    } finally {
      setIsSending(false)
    }
  }

  const sendAppointmentReminder = async (appointmentId: string) => {
    setIsSending(true)

    try {
      const response = await fetch("/api/emails/send-appointment-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reminder")
      }

      toast.success("Appointment reminder sent successfully")
      options.onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to send reminder"
      toast.error(errorMsg)
      options.onError?.(error instanceof Error ? error : new Error(errorMsg))
    } finally {
      setIsSending(false)
    }
  }

  return {
    isSending,
    sendCertificateEmail,
    sendAppointmentReminder,
  }
}
