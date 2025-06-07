import prisma from "../config/database"
import { supabase } from "../config/supabase"
import { createError } from "../middlewares/errorHandler"

export interface NotificationData {
  title: string
  message: string
  type: "chat" | "call" | "payment" | "review" | "system" | "promotion"
  data?: any
  imageUrl?: string
}

export class NotificationService {
  static async createNotification(userId: string, notificationData: NotificationData, sendPush = true) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data || {},
          imageUrl: notificationData.imageUrl,
        },
      })

      // Send real-time notification via Supabase
      await supabase.channel(`user_${userId}`).send({
        type: "broadcast",
        event: "new_notification",
        payload: notification,
      })

      // Send push notification if enabled
      if (sendPush) {
        await NotificationService.sendPushNotification(userId, notificationData)
      }

      return notification
    } catch (error) {
      console.error("Error creating notification:", error)
      throw createError("Failed to create notification", 500)
    }
  }

  static async sendBulkNotifications(userIds: string[], notificationData: NotificationData, sendPush = true) {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) => NotificationService.createNotification(userId, notificationData, sendPush)),
      )

      return notifications
    } catch (error) {
      console.error("Error sending bulk notifications:", error)
      throw createError("Failed to send bulk notifications", 500)
    }
  }

  static async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ])

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    }
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    })

    if (!notification) {
      throw createError("Notification not found", 404)
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    })
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
  }

  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    })

    if (!notification) {
      throw createError("Notification not found", 404)
    }

    return await prisma.notification.delete({
      where: { id: notificationId },
    })
  }

  static async getNotificationSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      // Create default settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          pushEnabled: true,
          emailEnabled: true,
          chatNotifications: true,
          callNotifications: true,
          paymentNotifications: true,
          promotionalNotifications: true,
        },
      })
    }

    return settings
  }

  static async updateNotificationSettings(userId: string, settings: any) {
    return await prisma.notificationSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings,
      },
    })
  }

  // Push notification implementation (you can integrate with FCM, OneSignal, etc.)
  private static async sendPushNotification(userId: string, notificationData: NotificationData) {
    try {
      // Get user's push tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true },
      })

      if (!user?.pushTokens || user.pushTokens.length === 0) {
        return
      }

      // Check notification settings
      const settings = await NotificationService.getNotificationSettings(userId)
      if (!settings.pushEnabled) {
        return
      }

      // Type-specific settings check
      const typeSettings = {
        chat: settings.chatNotifications,
        call: settings.callNotifications,
        payment: settings.paymentNotifications,
        promotion: settings.promotionalNotifications,
      }

      if (typeSettings[notificationData.type as keyof typeof typeSettings] === false) {
        return
      }

      // Here you would integrate with your push notification service
      // Example with FCM:
      /*
      const message = {
        notification: {
          title: notificationData.title,
          body: notificationData.message,
          image: notificationData.imageUrl,
        },
        data: notificationData.data,
        tokens: user.pushTokens,
      };
      
      await admin.messaging().sendMulticast(message);
      */

      console.log(`Push notification sent to user ${userId}:`, notificationData.title)
    } catch (error) {
      console.error("Error sending push notification:", error)
    }
  }

  // Predefined notification templates
  static async sendChatStartedNotification(astrologerId: string, userName: string, chatId: string) {
    return await NotificationService.createNotification(astrologerId, {
      title: "New Chat Request",
      message: `${userName} has started a chat with you`,
      type: "chat",
      data: { chatId, action: "chat_started" },
    })
  }

  static async sendCallIncomingNotification(astrologerId: string, userName: string, callId: string, callType: string) {
    return await NotificationService.createNotification(astrologerId, {
      title: `Incoming ${callType} Call`,
      message: `${userName} is calling you`,
      type: "call",
      data: { callId, callType, action: "incoming_call" },
    })
  }

  static async sendPaymentSuccessNotification(userId: string, amount: number) {
    return await NotificationService.createNotification(userId, {
      title: "Payment Successful",
      message: `₹${amount} has been added to your wallet`,
      type: "payment",
      data: { amount, action: "payment_success" },
    })
  }

  static async sendReviewReceivedNotification(astrologerId: string, userName: string, rating: number) {
    return await NotificationService.createNotification(astrologerId, {
      title: "New Review Received",
      message: `${userName} gave you ${rating} stars`,
      type: "review",
      data: { rating, action: "review_received" },
    })
  }

  static async sendSystemNotification(userId: string, title: string, message: string, data?: any) {
    return await NotificationService.createNotification(userId, {
      title,
      message,
      type: "system",
      data,
    })
  }

  static async sendPromotionalNotification(userIds: string[], title: string, message: string, imageUrl?: string) {
    return await NotificationService.sendBulkNotifications(userIds, {
      title,
      message,
      type: "promotion",
      imageUrl,
    })
  }
}
