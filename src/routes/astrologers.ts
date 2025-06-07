import { Router, type IRouter } from "express"
import { AstrologerController } from "../controllers/astrologerController"
import { validate, validateQuery } from "../middlewares/validation"
import { authMiddleware } from "../middlewares/auth"
import Joi from "joi"

const router: IRouter = Router()

// Validation schemas
const onboardSchema = Joi.object({
  bio: Joi.string().min(50).max(500).required(),
  experience: Joi.number().min(0).max(50).required(),
  expertise: Joi.array().items(Joi.string()).min(1).required(),
  languages: Joi.array().items(Joi.string()).min(1).required(),
  pricePerMinuteChat: Joi.number().min(1).max(1000).required(),
  pricePerMinuteCall: Joi.number().min(1).max(1000).required(),
})

const updateProfileSchema = Joi.object({
  bio: Joi.string().min(50).max(500).optional(),
  expertise: Joi.array().items(Joi.string()).min(1).optional(),
  languages: Joi.array().items(Joi.string()).min(1).optional(),
  pricePerMinuteChat: Joi.number().min(1).max(1000).optional(),
  pricePerMinuteCall: Joi.number().min(1).max(1000).optional(),
})

const availabilitySchema = Joi.object({
  available: Joi.boolean().required(),
})

const querySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  search: Joi.string().optional(),
  expertise: Joi.string().optional(),
  language: Joi.string().optional(),
  available: Joi.string().valid("true", "false").optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sortBy: Joi.string().valid("rating", "price", "experience").default("rating"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
})

// Routes
router.post("/onboard", authMiddleware, validate(onboardSchema), AstrologerController.onboard)
router.get("/", validateQuery(querySchema), AstrologerController.getAstrologers)
router.get("/:id", AstrologerController.getAstrologerById)
router.put("/availability", authMiddleware, validate(availabilitySchema), AstrologerController.updateAvailability)
router.put("/profile", authMiddleware, validate(updateProfileSchema), AstrologerController.updateProfile)

export default router
