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
      "appointment_scheduled",
      "Appointment Scheduled",
      "Your appointment has been scheduled successfully",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentConfirmed(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_confirmed",
      "Appointment Confirmed",
      "Your appointment has been confirmed",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentUpdated(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_updated",
      "Appointment Updated",
      "Your appointment has been updated",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentCancelled(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_cancelled",
      "Appointment Cancelled",
      "Your appointment has been cancelled",
      {
        priority: "high",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentRescheduled(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_rescheduled",
      "Appointment Rescheduled",
      "Your appointment has been rescheduled",
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentNoShow(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_no_show",
      "Appointment No Show",
      "Patient did not show up for appointment",
      {
        priority: "high",
        link: `/clinic/appointments/${appointmentId}`,
        data: { appointmentId }
      }
    )
  }

  async createAppointmentDeleted(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_deleted",
      "Appointment Deleted",
      "An appointment has been deleted",
      {
        priority: "high",
        link: `/clinic/appointments`,
        data: { appointmentId }
      }
    )
  }

  async createPatientCheckedIn(userId: string, clinicId: string, patientName: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "patient_checked_in",
      "Patient Checked In",
      `${patientName} has checked in for their appointment`,
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { patientName, appointmentId }
      }
    )
  }

  async createStaffAssigned(userId: string, clinicId: string, staffName: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "staff_assigned",
      "Staff Assigned",
      `${staffName} has been assigned to an appointment`,
      {
        priority: "medium",
        link: `/clinic/appointments/${appointmentId}`,
        data: { staffName, appointmentId }
      }
    )
  }

  async createAppointmentCompleted(userId: string, clinicId: string, appointmentId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "appointment_confirmed",
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

  async notifyPaymentReceived(userId: string, clinicId: string, amount: number, invoiceNumber: string) {
    return this.createNotification(
      userId,
      clinicId,
      "payment_received",
      "Payment Received",
      `Payment of $${amount.toFixed(2)} received for invoice ${invoiceNumber}`,
      {
        priority: "medium",
        link: `/clinic/billing`,
      },
    )
  }

  async notifySystemAlert(userId: string, clinicId: string, title: string, message: string) {
    return this.createNotification(userId, clinicId, "system_alert", title, message, {
      priority: "urgent",
    })
  }

  async createStaffInvitation(userId: string, clinicId: string, clinicName: string) {
    return this.createNotification(
      userId,
      clinicId,
      "staff_invitation",
      "Staff Invitation",
      `You've been invited to join ${clinicName}`,
      {
        priority: "high",
        link: `/clinic/invitations`,
      }
    )
  }

  async createEmployerInvitation(userId: string, clinicId: string, companyName: string) {
    return this.createNotification(
      userId,
      clinicId,
      "employer_invitation",
      "Employer Invitation",
      `You've been invited to register your company ${companyName}`,
      {
        priority: "high",
        link: `/employer/invitations`,
      }
    )
  }

  async createPasswordReset(userId: string, clinicId: string) {
    return this.createNotification(
      userId,
      clinicId,
      "password_reset",
      "Password Reset Request",
      "A password reset has been requested for your account",
      {
        priority: "high",
        link: `/auth/reset-password`,
      }
    )
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