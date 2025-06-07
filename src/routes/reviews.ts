import { Router } from "express"
import { ReviewController } from "../controllers/reviewController"
import { authMiddleware, adminAuthMiddleware } from "../middlewares/auth"
import { validate, validateQuery } from "../middlewares/validation"
import Joi from "joi"

const router = Router()

const createReviewSchema = Joi.object({
  astrologerId: Joi.string().uuid().required(),
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().min(10).max(500).required(),
  serviceType: Joi.string().valid("chat", "call").required(),
  serviceId: Joi.string().uuid().required(),
})

const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  review: Joi.string().min(10).max(500).optional(),
})

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  rating: Joi.number().min(1).max(5).optional(),
})

// User routes
router.post("/", authMiddleware, validate(createReviewSchema), ReviewController.createReview)
router.get("/my-reviews", authMiddleware, validateQuery(paginationSchema), ReviewController.getUserReviews)
router.put("/:reviewId", authMiddleware, validate(updateReviewSchema), ReviewController.updateReview)
router.delete("/:reviewId", authMiddleware, ReviewController.deleteReview)

// Public routes
router.get("/astrologer/:astrologerId", validateQuery(paginationSchema), ReviewController.getReviewsForAstrologer)
router.get("/astrologer/:astrologerId/stats", ReviewController.getReviewStats)

// Admin routes
router.delete("/admin/:reviewId", adminAuthMiddleware, ReviewController.deleteReview)

export default router
