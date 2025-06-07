import { Router, type IRouter } from "express"
import { NotificationController } from "../controllers/notificationController"
import { authMiddleware, adminAuthMiddleware } from "../middlewares/auth"
import { validate, validateQuery } from "../middlewares/validation"
import Joi from "joi"

const router: IRouter = Router()

// Validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
  unreadOnly: Joi.boolean().default(false),
})

const updateSettingsSchema = Joi.object({
  pushEnabled: Joi.boolean().optional(),
  emailEnabled: Joi.boolean().optional(),
  chatNotifications: Joi.boolean().optional(),
  callNotifications: Joi.boolean().optional(),
  paymentNotifications: Joi.boolean().optional(),
  promotionalNotifications: Joi.boolean().optional(),
})

const updatePushTokenSchema = Joi.object({
  token: Joi.string().required(),
  platform: Joi.string().valid("ios", "android", "web").required(),
})

const bulkNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  type: Joi.string().valid("chat", "call", "payment", "review", "system", "promotion").default("system"),
  imageUrl: Joi.string().uri().optional(),
})

const promotionalNotificationSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).required(),
  title: Joi.string().required(),
  message: Joi.string().required(),
  imageUrl: Joi.string().uri().optional(),
})

// User routes
router.get("/", authMiddleware, validateQuery(paginationSchema), NotificationController.getNotifications)
router.post("/:notificationId/read", authMiddleware, NotificationController.markAsRead)
router.post("/mark-all-read", authMiddleware, NotificationController.markAllAsRead)
router.delete("/:notificationId", authMiddleware, NotificationController.deleteNotification)

// Settings routes
router.get("/settings", authMiddleware, NotificationController.getSettings)
router.put("/settings", authMiddleware, validate(updateSettingsSchema), NotificationController.updateSettings)
router.post("/push-token", authMiddleware, validate(updatePushTokenSchema), NotificationController.updatePushToken)

// Admin routes
router.post("/bulk", adminAuthMiddleware, validate(bulkNotificationSchema), NotificationController.sendBulkNotification)
router.post(
  "/promotional",
  adminAuthMiddleware,
  validate(promotionalNotificationSchema),
  NotificationController.sendPromotionalNotification,
)

export default router
