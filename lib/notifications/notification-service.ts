import { getNotificationRepository } from "@/lib/repositories"
import type { NotificationType, NotificationPriority } from "@/lib/types/notifications"
import logger from "@/lib/logging/logger"

/**
 * Notification service for creating and managing notifications
 */
export class NotificationService {
  private notificationRepo = getNotificationRepository()

  async createNotification(
    userId: string,
    clinicId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority
      link?: string
      data?: Record<string, any>
      expiresAt?: string
    },
  ) {
    try {
      const notification = await this.notificationRepo.createNotification(
        userId,
        clinicId,
        type,
        title,
        message,
        options,
      )

      logger.info("Notification created", {
        notificationId: notification.id,
        userId,
        type,
      })

      return notification
    } catch (error) {
      logger.error("Failed to create notification", error, { userId, type })
      throw error
    }
  }

  async notifyAppointmentReminder(userId: string, clinicId: string, appointmentDetails: any) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_reminder",
      "Appointment Reminder",
      `You have an appointment tomorrow at ${appointmentDetails.time}`,
      {
        priority: "high",
        link: `/clinic/appointments/${appointmentDetails.id}`,
        data: appointmentDetails,
      },
    )
  }


  async createAppointmentScheduled(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_confirmed", // Changed from "appointment_scheduled" to match your type
      "Appointment Scheduled",
      "Your appointment has been scheduled successfully",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentCompleted(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_confirmed", // Using existing type since you don't have "appointment_completed"
      "Appointment Completed",
      "Your appointment has been completed",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async notifyTestResultReady(userId: string, clinicId: string, patientName: string, testResultId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "test_result_ready",
      "Test Result Ready",
      `Test results for ${patientName} are ready for review`,
      {
        priority: "high",
        link: `/clinic/tests/${testResultId}`,
      },
    )
  }

  async notifyCertificateIssued(
    userId: string,
    clinicId: string,
    patientName: string,
    certificateNumber: string,
    certificateId: string,
  ) {
    return this.createNotification(
      userId,
      clinicId,
      "certificate_issued",
      "Certificate Issued",
      `Certificate ${certificateNumber} has been issued for ${patientName}`,
      {
        priority: "medium",
        link: `/clinic/certificates/${certificateId}`,
      },
    )
  }

  async notifyPaymentDue(userId: string, clinicId: string, amount: number, dueDate: string) {
    return this.createNotification(
      userId,
      clinicId,
      "payment_due",
      "Payment Due",
      `Payment of $${amount.toFixed(2)} is due on ${dueDate}`,
      {
        priority: "urgent",
        link: `/clinic/billing`,
      },
    )
  }

  async notifySystemAlert(userId: string, clinicId: string, title: string, message: string) {
    return this.createNotification(userId, clinicId, "system_alert", title, message, {
      priority: "urgent",
    })
  }

  async markAsRead(notificationId: string) {
    return this.notificationRepo.markAsRead(notificationId)
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId)
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    return this.notificationRepo.findByUserId(userId, { unreadOnly, limit: 50 })
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.countUnread(userId)
  }

  async cleanupOldNotifications() {
    return this.notificationRepo.deleteOldNotifications(30)
  }
}

export const notificationService = new NotificationService()