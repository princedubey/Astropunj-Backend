import type { Response, NextFunction } from "express"
import { ChatService } from "../services/chatService"
import type { AuthenticatedRequest } from "../middlewares/auth"

export class ChatController {
  static async startChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { astrologerId } = req.body

      const chat = await ChatService.startChat(userId, astrologerId)

      res.status(201).json({
        success: true,
        data: { chat },
        message: "Chat started successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async endChat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { chatId } = req.params

      const result = await ChatService.endChat(chatId, userId)

      res.json({
        success: true,
        data: result,
        message: "Chat ended successfully",
      })
    } catch (error) {
      next(error)
    }
  }

  static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { chatId } = req.params
      const { message, type } = req.body

      const newMessage = await ChatService.sendMessage(chatId, userId, message, type)

      res.json({
        success: true,
        data: { message: newMessage },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getChatHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { page = 1, limit = 10 } = req.query

      const result = await ChatService.getChatHistory(userId, Number(page), Number(limit))

      res.json({
        success: true,
        data: result.chats,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  static async getChatById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!
      const { chatId } = req.params

      const chat = await ChatService.getChatById(chatId, userId)

      res.json({
        success: true,
        data: { chat },
      })
    } catch (error) {
      next(error)
    }
  }

  static async getActiveChats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!

      const chats = await ChatService.getActiveChats(userId)

      res.json({
        success: true,
        data: { chats },
      })
    } catch (error) {
      next(error)
    }
  }
}
