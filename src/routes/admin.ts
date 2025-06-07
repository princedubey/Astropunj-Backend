import { Router, type IRouter } from "express"
import { AdminController } from "../controllers/adminController"
import { adminAuthMiddleware } from "../middlewares/auth"
import { validate, validateQuery } from "../middlewares/validation"
import { authLimiter } from "../middlewares/rateLimiter"
import Joi from "joi"

const router: IRouter = Router()

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const blockUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  reason: Joi.string().required(),
})

const unblockUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
})

const refundSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  amount: Joi.number().min(1).required(),
  reason: Joi.string().required(),
})

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  search: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})

const analyticsSchema = Joi.object({
  period: Joi.string().valid("24h", "7d", "30d", "90d").default("7d"),
})

// Authentication
router.post("/login", authLimiter, validate(loginSchema), AdminController.login)

// User Management
router.get("/users", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllUsers)
router.get("/users/:userId", adminAuthMiddleware, AdminController.getUserById)
router.post("/users/block", adminAuthMiddleware, validate(blockUserSchema), AdminController.blockUser)
router.post("/users/unblock", adminAuthMiddleware, validate(unblockUserSchema), AdminController.unblockUser)

// Astrologer Management
router.get("/astrologers", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllAstrologers)
router.get("/astrologers/:astrologerId", adminAuthMiddleware, AdminController.getAstrologerById)

// Financial Management
router.post("/refund", adminAuthMiddleware, validate(refundSchema), AdminController.processRefund)
router.get("/payments", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllPayments)
router.get(
  "/wallet-transactions",
  adminAuthMiddleware,
  validateQuery(paginationSchema),
  AdminController.getAllWalletTransactions,
)

// Analytics
router.get("/analytics/dashboard", adminAuthMiddleware, AdminController.getDashboardAnalytics)
router.get(
  "/analytics/revenue",
  adminAuthMiddleware,
  validateQuery(analyticsSchema),
  AdminController.getRevenueAnalytics,
)

// Chat & Call Management
router.get("/chats", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllChats)
router.get("/calls", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllCalls)

// Reviews Management
router.get("/reviews", adminAuthMiddleware, validateQuery(paginationSchema), AdminController.getAllReviews)
router.delete("/reviews/:reviewId", adminAuthMiddleware, AdminController.deleteReview)

export default router
