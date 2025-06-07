import prisma from "../config/database"
import { supabase } from "../config/supabase"
import { WalletService } from "./walletService"
import { createError } from "../middlewares/errorHandler"
import { NotificationService } from "./notificationService"

export class ChatService {
  static async startChat(userId: string, astrologerId: string) {
    // Check if astrologer is available
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      include: { user: true },
    })

    if (!astrologer || !astrologer.available) {
      throw createError("Astrologer is not available", 400)
    }

    // Check user wallet balance
    const userBalance = await WalletService.getBalance(userId)
    const minBalance = astrologer.pricePerMinuteChat * 5 // Minimum 5 minutes balance

    if (userBalance < minBalance) {
      throw createError("Insufficient wallet balance", 400)
    }

    // Create chat session
    const chat = await prisma.chat.create({
      data: {
        userId,
        astrologerId,
        startedAt: new Date(),
        messages: [],
      },
      include: {
        user: true,
        astrologer: {
          include: { user: true },
        },
      },
    })

    // Send notification to astrologer
    await NotificationService.sendChatStartedNotification(astrologerId, chat.user.name, chat.id)

    return chat
  }

  static async endChat(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        astrologer: true,
      },
    })

    if (!chat || chat.userId !== userId) {
      throw createError("Chat not found", 404)
    }

    if (chat.endedAt) {
      throw createError("Chat already ended", 400)
    }

    const endTime = new Date()
    const duration = Math.ceil((endTime.getTime() - chat.startedAt.getTime()) / (1000 * 60)) // in minutes
    const chargedAmount = duration * chat.astrologer.pricePerMinuteChat

    // Update chat and debit wallet
    await prisma.$transaction(async (tx) => {
      await tx.chat.update({
        where: { id: chatId },
        data: {
          endedAt: endTime,
          duration,
          chargedAmount,
          status: "completed",
        },
      })

      // Debit from user wallet
      await WalletService.debitWallet(
        userId,
        chargedAmount,
        "chat",
        `Chat session with astrologer - ${duration} minutes`,
      )
    })

    return { duration, chargedAmount }
  }

  static async sendMessage(chatId: string, senderId: string, message: string, type = "text") {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    })

    if (!chat || chat.endedAt) {
      throw createError("Chat session not active", 400)
    }

    const newMessage = {
      id: Date.now().toString(),
      senderId,
      message,
      type,
      timestamp: new Date(),
    }

    // Update chat messages
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        messages: {
          push: newMessage,
        },
      },
    })

    // Send notification to the other participant
    const recipientId = senderId === chat.userId ? chat.astrologerId : chat.userId
    await NotificationService.createNotification(recipientId, {
      title: "New Message",
      message: type === "text" ? message : `Sent a ${type}`,
      type: "chat",
      data: { chatId, senderId, messageId: newMessage.id },
    })

    // Send real-time message via Supabase
    await supabase.channel(`chat_${chatId}`).send({
      type: "broadcast",
      event: "new_message",
      payload: newMessage,
    })

    return newMessage
  }

  static async getChatHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where: { userId },
        include: {
          astrologer: {
            include: { user: true },
          },
        },
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.chat.count({
        where: { userId },
      }),
    ])

    return {
      chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getChatById(chatId: string, userId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: true,
        astrologer: {
          include: { user: true },
        },
      },
    })

    if (!chat || (chat.userId !== userId && chat.astrologerId !== userId)) {
      throw createError("Chat not found", 404)
    }

    return chat
  }

  static async getActiveChats(userId: string) {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { userId, status: "active" },
          { astrologerId: userId, status: "active" },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        astrologer: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    })

    return chats
  }
}
