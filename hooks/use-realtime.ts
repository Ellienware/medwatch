"use client"

import { useEffect, useState } from "react"
import { RealtimeService } from "@/lib/realtime/realtime-service"

export function useRealtimeCollection(
  collectionType: "appointments" | "patients" | "certificates" | "notifications" | "testResults",
) {
  const [data, setData] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    setIsConnected(true)

    const handleUpdate = (response: any) => {
      setData(response)
    }

    let unsubscribe: (() => void) | undefined

    switch (collectionType) {
      case "appointments":
        unsubscribe = RealtimeService.subscribeToAppointments(handleUpdate)
        break
      case "patients":
        unsubscribe = RealtimeService.subscribeToPatients(handleUpdate)
        break
      case "certificates":
        unsubscribe = RealtimeService.subscribeToCertificates(handleUpdate)
        break
      case "notifications":
        unsubscribe = RealtimeService.subscribeToNotifications(handleUpdate)
        break
      case "testResults":
        unsubscribe = RealtimeService.subscribeToTestResults(handleUpdate)
        break
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      setIsConnected(false)
    }
  }, [collectionType])

  return { data, isConnected }
}
