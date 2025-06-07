import { Router, type IRouter } from "express"
import { AuthController } from "../controllers/authController"
import { validate } from "../middlewares/validation"
import { authMiddleware } from "../middlewares/auth"
import { authLimiter } from "../middlewares/rateLimiter"
import Joi from "joi"

const router: IRouter = Router()

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  dob: Joi.date().max("now").required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  language: Joi.string().required(),
  birthInfo: Joi.object({
    time: Joi.string().required(),
    place: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }).required(),
  }).required(),
})

const otpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
})

const verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  token: Joi.string().length(6).required(),
})

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  language: Joi.string().optional(),
  birthInfo: Joi.object({
    time: Joi.string().required(),
    place: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    }).required(),
  }).optional(),
})

// Routes
router.post("/register", authLimiter, validate(registerSchema), AuthController.register)
router.post("/send-otp", authLimiter, validate(otpSchema), AuthController.sendOTP)
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), AuthController.verifyOTP)
router.get("/profile", authMiddleware, AuthController.getProfile)
router.put("/profile", authMiddleware, validate(updateProfileSchema), AuthController.updateProfile)

export default router
