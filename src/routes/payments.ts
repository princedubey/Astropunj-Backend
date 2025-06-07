import { Router, type IRouter } from "express"
import { PaymentController } from "../controllers/paymentController"
import { validate, validateQuery } from "../middlewares/validation"
import { authMiddleware, adminAuthMiddleware } from "../middlewares/auth"
import { paymentLimiter } from "../middlewares/rateLimiter"
import Joi from "joi"

const router: IRouter = Router()

// Validation schemas
const createOrderSchema = Joi.object({
  amount: Joi.number().min(1).max(50000).required(),
})

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
})

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  amount: Joi.number().min(1).required(),
  reason: Joi.string().required(),
})

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
})

// Routes
router.post("/create-order", authMiddleware, paymentLimiter, validate(createOrderSchema), PaymentController.createOrder)
router.post("/verify", authMiddleware, paymentLimiter, validate(verifyPaymentSchema), PaymentController.verifyPayment)
router.get("/history", authMiddleware, validateQuery(paginationSchema), PaymentController.getPaymentHistory)
router.post("/refund", adminAuthMiddleware, validate(refundSchema), PaymentController.refundPayment)

export default router
