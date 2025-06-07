import { Router, type IRouter } from "express"
import { CallController } from "../controllers/callController"
import { validate, validateQuery } from "../middlewares/validation"
import { authMiddleware } from "../middlewares/auth"
import { agoraTokenLimiter } from "../middlewares/rateLimiter"
import Joi from "joi"

const router: IRouter = Router()

const initiateCallSchema = Joi.object({
  astrologerId: Joi.string().uuid().required(),
  type: Joi.string().valid("voice", "video").required(),
})

const updateCallStatusSchema = Joi.object({
  status: Joi.string().valid("ongoing", "completed", "missed", "cancelled").required(),
})

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
})

// Routes
router.post("/initiate", authMiddleware, agoraTokenLimiter, validate(initiateCallSchema), CallController.initiateCall)
router.post("/:callId/accept", authMiddleware, CallController.acceptCall)
router.post("/:callId/reject", authMiddleware, CallController.rejectCall)
router.post("/:callId/end", authMiddleware, CallController.endCall)
router.post("/:callId/status", authMiddleware, validate(updateCallStatusSchema), CallController.updateCallStatus)
router.get("/history", authMiddleware, validateQuery(paginationSchema), CallController.getCallHistory)
router.get("/:callId", authMiddleware, CallController.getCallById)
router.get("/:callId/token", authMiddleware, agoraTokenLimiter, CallController.generateAgoraToken)

export default router
