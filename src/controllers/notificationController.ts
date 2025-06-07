import type { Request, Response, NextFunction } from "express"
import { NotificationService } from "../services/notificationService"
import type { AuthenticatedRequest } from "../middlewares/auth"
import prisma from "../config/database"

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 20, unreadOnly = false } = req.query

      const result = await NotificationService.getUserNotifications(
        userId,
        Number(page),
        Number(limit),
        unreadOnly === "true",
      )

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      })
    } catch (error) {
      next(error)
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { notificationId } = req.params

      await NotificationService.markAsRead(notificationId, userId)

      res.json({
        success: true,
        message: "Notification marked as read",
      })
    } catch (error) {
      next(error)
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      await NotificationService.markAllAsRead(userId)

      res.json({
        success: true,
        message: "All notifications marked as read",
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { notificationId } = req.params

      await NotificationService.deleteNotification(notificationId, userId)

      res.json({
        success: true,
        message: "Notification deleted",
      })
    } catch (error) {
      next(error)
    }
  }

  static async getSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      const settings = await NotificationService.getNotificationSettings(userId)

      res.json({
        success: true,
        data: { settings },
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const settings = req.body

      const updatedSettings = await NotificationService.updateNotificationSettings(userId, settings)

      res.json({
        success: true,
        data: { settings: updatedSettings },
        message: "Notification settings updated",
      })
    } catch (error) {
      next(error)
    }
  }

  static async updatePushToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { token, platform } = req.body

      // Update user's push tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true },
      })

      const pushTokens = (user?.pushTokens || []) as Array<{ token: string; platform: string; updatedAt: string }>
      const filteredTokens = pushTokens.filter((t) => t.platform !== platform)
      filteredTokens.push({ token, platform, updatedAt: new Date().toISOString() })

      await prisma.user.update({
        where: { id: userId },
        data: { pushTokens: filteredTokens as any },
      })

      res.json({
        success: true,
        message: "Push token updated",
      })
    } catch (error) {
      next(error)
    }
  }

  // Admin endpoints
  static async sendBulkNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds, title, message, type = "system", imageUrl } = req.body

      await NotificationService.sendBulkNotifications(userIds, {
        title,
        message,
        type,
        imageUrl,
      })

      res.json({
        success: true,
        message: "Bulk notifications sent",
      })
    } catch (error) {
      next(error)
    }
  }

  static async sendPromotionalNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { userIds, title, message, imageUrl } = req.body

      await NotificationService.sendPromotionalNotification(userIds, title, message, imageUrl)

      res.json({
        success: true,
        message: "Promotional notifications sent",
      })
    } catch (error) {
      next(error)
    }
  }
}
