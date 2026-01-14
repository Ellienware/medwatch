import { createBrowserClient } from "@/lib/appwrite/browser-client" // Updated import
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config"
import logger from "@/lib/logging/logger"

type RealtimeCallback = (payload: any) => void

export class RealtimeService {
  private static subscriptions: Map<string, () => void> = new Map()
  private static browserClient: any = null

  private static getClient() {
    if (!this.browserClient) {
      this.browserClient = createBrowserClient()
    }
    return this.browserClient.client
  }

  static subscribeToCollection(collectionId: string, callback: RealtimeCallback): () => void {
    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`
    const client = this.getClient()

    const unsubscribe = client.subscribe(channel, (response: any) => {
      logger.info("Realtime update received", { collectionId, eventType: response.events })
      callback(response)
    })

    const subscriptionId = `${collectionId}-${Date.now()}`
    this.subscriptions.set(subscriptionId, unsubscribe)

    return () => {
      unsubscribe()
      this.subscriptions.delete(subscriptionId)
    }
  }

  static subscribeToAppointments(callback: RealtimeCallback): () => void {
    return this.subscribeToCollection(COLLECTIONS.APPOINTMENTS, callback)
  }

  static subscribeToPatients(callback: RealtimeCallback): () => void {
    return this.subscribeToCollection(COLLECTIONS.PATIENTS, callback)
  }

  static subscribeToCertificates(callback: RealtimeCallback): () => void {
    return this.subscribeToCollection(COLLECTIONS.CERTIFICATES, callback)
  }

  static subscribeToNotifications(callback: RealtimeCallback): () => void {
    return this.subscribeToCollection(COLLECTIONS.NOTIFICATIONS, callback)
  }

  static subscribeToTestResults(callback: RealtimeCallback): () => void {
    return this.subscribeToCollection(COLLECTIONS.TEST_RESULTS, callback)
  }

  static unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions.clear()
    this.browserClient = null
  }
}