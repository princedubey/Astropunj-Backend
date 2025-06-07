import prisma from "../config/database"
import { generateAgoraToken } from "../config/agora"
import { WalletService } from "./walletService"
import { createError } from "../middlewares/errorHandler"
import { NotificationService } from "./notificationService"

export class CallService {
  static async initiateCall(userId: string, astrologerId: string, type: "voice" | "video") {
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
    const minBalance = astrologer.pricePerMinuteCall * 5 // Minimum 5 minutes balance

    if (userBalance < minBalance) {
      throw createError("Insufficient wallet balance", 400)
    }

    // Generate Agora channel and token
    const channelName = `call_${Date.now()}_${userId}_${astrologerId}`
    const userUid = Number.parseInt(userId.slice(-8), 16) % 1000000 // Convert to number
    const astrologerUid = Number.parseInt(astrologerId.slice(-8), 16) % 1000000

    const userToken = generateAgoraToken(channelName, userUid, "publisher")
    const astrologerToken = generateAgoraToken(channelName, astrologerUid, "publisher")

    // Create call record
    const call = await prisma.call.create({
      data: {
        userId,
        astrologerId,
        type,
        startTime: new Date(),
        agoraChannel: channelName,
        agoraToken: userToken,
        status: "initiated",
      },
      include: {
        user: true,
        astrologer: {
          include: { user: true },
        },
      },
    })

    // Send notification to astrologer
    await NotificationService.sendCallIncomingNotification(astrologerId, call.user.name, call.id, type)

    return {
      call,
      userToken,
      astrologerToken,
      channelName,
      userUid,
      astrologerUid,
    }
  }

  static async acceptCall(callId: string, astrologerId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
    })

    if (!call || call.astrologerId !== astrologerId) {
      throw createError("Call not found", 404)
    }

    if (call.status !== "initiated") {
      throw createError("Call cannot be accepted", 400)
    }

    await prisma.call.update({
      where: { id: callId },
      data: {
        status: "ongoing",
        startTime: new Date(),
      },
    })

    return { success: true }
  }

  static async rejectCall(callId: string, astrologerId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
    })

    if (!call || call.astrologerId !== astrologerId) {
      throw createError("Call not found", 404)
    }

    if (call.status !== "initiated") {
      throw createError("Call cannot be rejected", 400)
    }

    await prisma.call.update({
      where: { id: callId },
      data: {
        status: "cancelled",
        endTime: new Date(),
      },
    })

    return { success: true }
  }

  static async endCall(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        astrologer: true,
      },
    })

    if (!call || (call.userId !== userId && call.astrologerId !== userId)) {
      throw createError("Call not found", 404)
    }

    if (call.status === "completed") {
      throw createError("Call already ended", 400)
    }

    const endTime = new Date()
    const duration = Math.ceil((endTime.getTime() - call.startTime.getTime()) / (1000 * 60)) // in minutes
    const chargedAmount = duration * call.astrologer.pricePerMinuteCall

    // Update call and debit wallet (only if user is ending the call)
    await prisma.$transaction(async (tx) => {
      await tx.call.update({
        where: { id: callId },
        data: {
          endTime,
          duration,
          chargedAmount,
          status: "completed",
        },
      })

      if (call.userId === userId && duration > 0) {
        // Debit from user wallet
        await WalletService.debitWallet(
          call.userId,
          chargedAmount,
          "call",
          `${call.type} call with astrologer - ${duration} minutes`,
        )
      }
    })

    return { duration, chargedAmount }
  }

  static async getCallHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where: { userId },
        include: {
          astrologer: {
            include: { user: true },
          },
        },
        orderBy: { startTime: "desc" },
        skip,
        take: limit,
      }),
      prisma.call.count({
        where: { userId },
      }),
    ])

    return {
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getCallById(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        user: true,
        astrologer: {
          include: { user: true },
        },
      },
    })

    if (!call || (call.userId !== userId && call.astrologerId !== userId)) {
      throw createError("Call not found", 404)
    }

    return call
  }

  static async generateAgoraToken(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
    })

    if (!call || (call.userId !== userId && call.astrologerId !== userId)) {
      throw createError("Call not found", 404)
    }

    const userUid = Number.parseInt(userId.slice(-8), 16) % 1000000
    const token = generateAgoraToken(call.agoraChannel, userUid, "publisher")

    return {
      token,
      channelName: call.agoraChannel,
      uid: userUid,
    }
  }

  static async updateCallStatus(callId: string, userId: string, status: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
    })

    if (!call || (call.userId !== userId && call.astrologerId !== userId)) {
      throw createError("Call not found", 404)
    }

    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: { status },
    })

    return updatedCall
  }
}
