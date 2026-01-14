"use client"

/**
 * React hooks for secure data operations
 * Use these instead of direct database access
 */

import useSWR from "swr"
import { useState } from "react"

/**
 * Fetch data securely via API
 */
async function secureFetcher(url: string) {
  const response = await fetch(url, {
    credentials: "include",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch data")
  }

  return response.json()
}

/**
 * Hook for secure patient data access
 */
export function useSecurePatient(patientId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    patientId ? `/api/secure/patients/${patientId}` : null,
    secureFetcher,
  )

  return {
    patient: data?.data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook for secure patient list
 */
export function useSecurePatients(filters?: any) {
  const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : ""

  const { data, error, mutate, isLoading } = useSWR(`/api/secure/patients${queryString}`, secureFetcher)

  return {
    patients: data?.data?.documents || [],
    total: data?.data?.total || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook for secure appointment data
 */
export function useSecureAppointment(appointmentId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    appointmentId ? `/api/secure/appointments/${appointmentId}` : null,
    secureFetcher,
  )

  return {
    appointment: data?.data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook for secure certificate data
 */
export function useSecureCertificate(certificateId: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    certificateId ? `/api/secure/certificates/${certificateId}` : null,
    secureFetcher,
  )

  return {
    certificate: data?.data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook for secure data mutations
 */
export function useSecureMutation<T = any>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (url: string, method: string, data?: any): Promise<T> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Operation failed")
      }

      const result = await response.json()
      return result.data
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutate,
    isLoading,
    error,
  }
}

/**
 * Hook for audit logs
 */
export function useAuditLogs(entityType: string, entityId: string) {
  const { data, error, isLoading } = useSWR(
    entityType && entityId ? `/api/audit-logs?entityType=${entityType}&entityId=${entityId}` : null,
    secureFetcher,
  )

  return {
    auditLogs: data?.data || [],
    isLoading,
    isError: error,
  }
}
