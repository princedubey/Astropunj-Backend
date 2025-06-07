import { Router } from "express"
import { ChatController } from "../controllers/chatController"
import { validate, validateQuery } from "../middlewares/validation"
import { authMiddleware } from "../middlewares/auth"
import Joi from "joi"

const router = Router()

const startChatSchema = Joi.object({
  astrologerId: Joi.string().uuid().required(),
})

const sendMessageSchema = Joi.object({
  message: Joi.string().required(),
  type: Joi.string().valid("text", "image", "file").default("text"),
})

const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
})

// Routes
router.post("/start", authMiddleware, validate(startChatSchema), ChatController.startChat)
router.post("/:chatId/end", authMiddleware, ChatController.endChat)
router.post("/:chatId/message", authMiddleware, validate(sendMessageSchema), ChatController.sendMessage)
router.get("/history", authMiddleware, validateQuery(paginationSchema), ChatController.getChatHistory)
router.get("/active", authMiddleware, ChatController.getActiveChats)
router.get("/:chatId", authMiddleware, ChatController.getChatById)

export default router
